import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererTimeline } from '../services/espn'
import { recupererLiguesCibles } from '../services/ligues'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import Focus from '../components/Focus'
import LeVestiaire from '../components/LeVestiaire'
import StandingsNBA from '../components/StandingsNBA'
import BracketPlayoffs from '../components/BracketPlayoffs'
import NewsNBA from '../components/NewsNBA'
import { BanniereImage } from '../components/UI'
import { useNavigate } from 'react-router-dom'
import { Calendar, EyeOff, Eye } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'
import { SAISON_ESPN } from '../config'

const GUTTER = '20px 16px'

function Accueil() {
  const [matchs, setMatchs]               = useState([])
  const [user, setUser]                   = useState(null)
  const [pseudo, setPseudo]               = useState(null)
  const [chargement, setCharg]            = useState(true)
  const [nbPronosAttente, setNbPronosAttente] = useState(0)
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
      const m = await recupererTimeline(15, 15)
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
  const saisonActuelle   = matchs[0]?.saisonNum ?? SAISON_ESPN

  return (
    <>
      <Navigation nbPronosAttente={nbPronosAttente} />
      <main style={{ flex: 1 }}>

        {/* ── Header asymétrique ── */}
        <div style={{
          padding: '20px 16px 0 16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Ligne accent verticale gauche — décalage visuel */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'var(--accent)',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Titre Teko — décalé vers le bas */}
            <div style={{ paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>
                  Bonjour{' '}
                </span>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>
                  {pseudo || ''}
                </span>
              </div>
            </div>

            {/* Toggle No Spoil — aligné haut droite, décalé */}
            <button
              onClick={toggleNoSpoil}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', flexShrink: 0, marginTop: 8,
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
        </div>

        {/* ── 1. Focus — spotlight perso ── */}
        {!chargement && user && (
          <Focus userId={user.id} nbPronosAttente={nbPronosAttente} />
        )}

        {/* ── 2. Le Fil ── */}
        <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>TIME</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>LINE</span>
          </div>
          <button
            onClick={() => navigate('/calendrier')}
            style={{
              fontSize: 11, color: 'var(--text-3)', background: 'none',
              borderWidth: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Calendar size={12} strokeWidth={1.5} /> Calendrier complet
          </button>
        </div>

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Chargement…</p>
        )}

        {!chargement && (
          <div style={{ marginTop: 8 }}>
            {matchs.length === 0 ? (
              <div style={{
                margin: '8px 16px',
                padding: '14px 16px',
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  Pas de match NBA sur cette période. Consulte le calendrier complet 👀
                </span>
                <button
                  onClick={() => navigate('/calendrier')}
                  style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 600,
                    color: 'var(--accent)', background: 'var(--accent-dim)',
                    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)',
                    borderRadius: 'var(--radius-sm)',
                    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
                    cursor: 'pointer',
                  }}
                >
                  Calendrier
                </button>
              </div>
            ) : (
              <BandeMatchs
                matchs={matchs}
                userId={user?.id}
                onProno={faireProno}
                onBadge={setNbPronosAttente}
              />
            )}
          </div>
        )}

        {!chargement && user && (
          <LeVestiaire userId={user.id} />
        )}

        {/* ── 3. Blocs communautaires — sans card arrondie ── */}
        {!chargement && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '16px 0 0' }}>

            {/* Ligue en cours — bord gauche accent, pas de card */}
            <div style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px 16px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>LIGUE</span>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>EN COURS</span>
              </div>
              <ClassementRapide userId={user.id} />
            </div>
          </div>
        )}

        {/* ── Bannière séparatrice ── */}
        {!chargement && (
          <div style={{ margin: '16px 16px' }}>
            <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" hauteur={90} />
          </div>
        )}

        {/* ── NBA data ── */}
        {!chargement && <StandingsNBA typeSaison={typeSaisonActuel} />}
        {!chargement && typeSaisonActuel === 3 && <BracketPlayoffs saison={saisonActuelle} />}

        {!chargement && user && (
          <div style={{ padding: '16px 0 20px', borderLeft: '3px solid var(--orange)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 16 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>ACTU</span>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--orange)', letterSpacing: '0.02em', lineHeight: 1 }}>NBA</span>
            </div>
            <div style={{ paddingLeft: 16, paddingRight: 16 }}><NewsNBA /></div>
          </div>
        )}

      </main>
    </>
  )
}

export default Accueil