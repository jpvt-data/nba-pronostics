import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'
import { useNavigate } from 'react-router-dom'
import { Zap, Calendar, EyeOff, Eye } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'

const GUTTER = '20px 16px'

/* ── Label de section avec dégradé accent → orange ── */
const LabelSection = ({ children }) => (
  <h3 style={{
    display: 'inline-block',
    background: 'linear-gradient(90deg, var(--accent), var(--orange))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.1em',
    fontSize: 13,
    fontWeight: 700,
  }}>
    {children}
  </h3>
)

/* ── Bannière image subtile ── */
const BanniereImage = ({ url, hauteur = 70 }) => (
  <div style={{
    margin: '20px 0 0',
    height: hauteur,
    backgroundImage: `linear-gradient(to right, rgba(13,13,18,0.75), rgba(13,13,18,0.35), rgba(13,13,18,0.75)), url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(99,102,241,0.2)',
    borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(99,102,241,0.2)',
  }} />
)

/* ── Séparateur simple ── */
const Sep = () => (
  <div style={{
    margin: '20px 16px 0',
    height: 1,
    background: 'linear-gradient(90deg, var(--accent-border), transparent)',
  }} />
)

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
    await supabase.from('pronos').upsert({
      user_id:        user.id,
      match_id:       matchDB.id,
      equipe_choisie: equipeChoisie,
      resultat:       'en_attente',
    }, { onConflict: 'user_id,match_id' })
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
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

        {/* ── Bannière tribune 1 ── */}
        <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" hauteur={110} />

        {/* ── Bande matchs ── */}
        <div style={{ padding: '20px 16px 8px' }}>
          <LabelSection>Prochains matchs</LabelSection>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            Clique sur une affiche pour pronostiquer et voir le détail
          </p>
        </div>

        {!chargement && <BandeMatchs matchs={matchs} userId={user?.id} onProno={faireProno} />}

        {!chargement && (
          <div style={{ padding: '10px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/calendrier')}
              style={{
                fontSize: 12, color: 'var(--text-3)',
                background: 'none',
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
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Chargement…
          </p>
        )}

        {/* ── Bannière ballons ── */}
        {!chargement && (
        <BanniereImage url="https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=60" hauteur={110} />
        )}

        {!chargement && user && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '20px 16px 0' }}>
              <LabelSection>Ligue en cours</LabelSection>
            </div>
            <div style={{ padding: '8px 16px 0' }}>
              <ClassementRapide userId={user.id} />
            </div>

            <Sep />

            <div style={{ padding: '20px 16px 0' }}>
              <LabelSection>Pronos en attente</LabelSection>
            </div>
            <div style={{ padding: '8px 16px 0' }}>
              <PronosAttente userId={user.id} />
            </div>

            <Sep />

            <div style={{ padding: '20px 16px 0' }}>
              <LabelSection>Runs des potes</LabelSection>
            </div>
            <div style={{ padding: '8px 16px 20px' }}>
              <RunsPotes userId={user.id} />
            </div>

          </div>
        )}

      </main>
    </>
  )
}

export default Accueil
