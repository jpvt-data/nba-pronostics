import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { recupererLiguesCibles } from '../services/ligues'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'
import StandingsNBA from '../components/StandingsNBA'
import BracketPlayoffs from '../components/BracketPlayoffs'
import NewsNBA from '../components/NewsNBA'
import { LabelSection, BanniereImage, Bloc } from '../components/UI'
import { useNavigate } from 'react-router-dom'
import { Zap, Calendar, EyeOff, Eye } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'
import { SAISON_ESPN } from '../config'

const GUTTER = '20px 16px'

function Accueil() {
  const [matchs, setMatchs]    = useState([])
  const [user, setUser]        = useState(null)
  const [pseudo, setPseudo]    = useState(null)
  const [chargement, setCharg] = useState(true)
  const navigate = useNavigate()
  const { noSpoil, toggleNoSpoil } = useNoSpoil()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data: profil } = await supabase
        .from('profils').select('pseudo').eq('id', user.id).single()
      setPseudo(profil?.pseudo || null)
      calculerPoints(user.id).catch(() => {})
      const m = await recupererMatchs3Jours()
      setMatchs(m)
      setCharg(false)
    }
    init()
  }, [])

  const faireProno = async (match, equipeChoisie) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id:          match.espn_id,
        date_match:       match.date,
        equipe_domicile:  match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut:           match.statut,
        type_saison:      match.typeSaisonNum ?? null,
        saison:           match.saisonNum ?? null,
      }, { onConflict: 'espn_id' })
      .select().single()
    if (!matchDB) return

    const liguesCibles = await recupererLiguesCibles(user.id, match.typeSaisonNum ?? null)

    if (liguesCibles.length > 0) {
      await Promise.all(liguesCibles.map(m =>
        supabase.from('pronos').upsert({
          user_id:        user.id,
          match_id:       matchDB.id,
          equipe_choisie: equipeChoisie,
          resultat:       'en_attente',
          groupe_id:      m.groupe_id,
        }, { onConflict: 'user_id,match_id,groupe_id' })
      ))
    } else {
      await supabase.from('pronos').upsert({
        user_id:        user.id,
        match_id:       matchDB.id,
        equipe_choisie: equipeChoisie,
        resultat:       'en_attente',
        groupe_id:      null,
      }, { onConflict: 'user_id,match_id,groupe_id' })
    }
  }

  const typeSaisonActuel = matchs[0]?.typeSaisonNum ?? null
  // Saison ESPN du premier match — fallback sur la constante globale si matchs vides
  const saisonActuelle   = matchs[0]?.saisonNum ?? SAISON_ESPN

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ──  Header  ── */}
        <div style={{
          padding: GUTTER,
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Bonjour {pseudo || ''}</h2>
            <Zap size={20} color="var(--accent)" strokeWidth={2} fill="var(--accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <p style={{
              fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.4,
              background: 'linear-gradient(90deg, var(--text-1), var(--text-2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Pronostique. Clashe. Règne.
            </p>
            <button
              onClick={toggleNoSpoil}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', flexShrink: 0,
                background: noSpoil ? 'rgba(99,102,241,0.15)' : 'transparent',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: noSpoil ? 'rgba(99,102,241,0.4)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                color: noSpoil ? 'var(--accent)' : 'var(--text-3)',
              }}
            >
              {noSpoil ? <Eye size={12} /> : <EyeOff size={12} />}
              No Spoil
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '16px 0 0', lineHeight: 1.6 }}>
            Suis la saison NBA, pronostique chaque match avant le tip-off et compare tes résultats avec tes potes.
            <br /><br />
            Classements, stats perso, fiches match détaillées — tout ce qu'il faut pour savoir qui prédit le mieux… et qui la ramène pour rien.
          </p>
        </div>

        <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" hauteur={110} />

        <Bloc style={{ margin: '20px 16px 0', padding: '16px 16px 8px' }}>
          <LabelSection>Prochains matchs</LabelSection>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            Clique sur une affiche pour pronostiquer et voir le détail
          </p>
        </Bloc>

        {!chargement && (
          <div style={{ marginTop: 10 }}>
            <BandeMatchs matchs={matchs} userId={user?.id} onProno={faireProno} />
          </div>
        )}

        {!chargement && (
          <div style={{ padding: '10px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/calendrier')}
              style={{
                fontSize: 12, color: 'var(--text-3)', background: 'none',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                paddingTop: 5, paddingBottom: 5, paddingLeft: 12, paddingRight: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
            >
              <Calendar size={13} strokeWidth={1.5} /> Calendrier complet
            </button>
          </div>
        )}

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Chargement…</p>
        )}

        {!chargement && <StandingsNBA typeSaison={typeSaisonActuel} />}
        {!chargement && typeSaisonActuel === 3 && <BracketPlayoffs saison={saisonActuelle} />}
        {!chargement && (
          <BanniereImage url="https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=60" hauteur={110} />
        )}

        {!chargement && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '12px 16px 20px' }}>
            <Bloc>
              <LabelSection>Actu NBA</LabelSection>
              <div style={{ marginTop: 8 }}><NewsNBA typeSaison={typeSaisonActuel} /></div>
            </Bloc>
            <Bloc>
              <LabelSection>Ligue en cours</LabelSection>
              <div style={{ marginTop: 8 }}><ClassementRapide userId={user.id} /></div>
            </Bloc>
            <Bloc>
              <LabelSection>Pronos en attente</LabelSection>
              <div style={{ marginTop: 8 }}><PronosAttente userId={user.id} /></div>
            </Bloc>
            <Bloc>
              <LabelSection>Runs des potes</LabelSection>
              <div style={{ marginTop: 8 }}><RunsPotes userId={user.id} /></div>
            </Bloc>
          </div>
        )}

      </main>
    </>
  )
}

export default Accueil
