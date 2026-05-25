import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'

const formaterJour = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL' || statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

function Accueil() {
  const [matchs, setMatchs]     = useState([])
  const [user, setUser]         = useState(null)
  const [chargement, setCharg]  = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await calculerPoints(user.id)
      const m = await recupererMatchs3Jours()
      setMatchs(m)
      setCharg(false)
    }
    init()
  }, [])

  /* groupe par jour */
  const parJour = matchs.reduce((acc, m) => {
    const j = formaterJour(m.date)
    if (!acc[j]) acc[j] = []
    acc[j].push(m)
    return acc
  }, {})

  /* matchs du jour uniquement pour la bande */
  const aujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const matchsAujourdhui = parJour[aujourdhui] || matchs.slice(0, 8)

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Bande scrollable ── */}
        {!chargement && matchsAujourdhui.length > 0 && (
          <BandeMatchs matchs={matchsAujourdhui} userId={user?.id} />
        )}

        {/* ── Matchs par jour (liste complète) ── */}
        <div style={{ padding: '16px 16px 0' }}>
          {chargement && (
            <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
              Chargement des matchs…
            </p>
          )}

          {Object.entries(parJour).map(([jour, matchsDuJour]) => (
            <div key={jour} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: 10 }}>{jour}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matchsDuJour.map(match => (
                  <CarteMatch key={match.espn_id} match={match} userId={user?.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

/* ── Carte match inline (liste principale) ── */
function CarteMatch({ match, userId }) {
  const [prono, setProno] = useState(null)
  const verrou = estVerrouille(match.date, match.statut)

  useEffect(() => {
    const charger = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('pronos').select('equipe_choisie, matchs(espn_id)').eq('user_id', userId)
      const found = data?.find(p => p.matchs?.espn_id === match.espn_id)
      if (found) setProno(found.equipe_choisie)
    }
    charger()
  }, [userId, match.espn_id])

  const faireProno = async (equipe) => {
    if (verrou) return
    const { data: matchDB } = await supabase.from('matchs').upsert({
      espn_id: match.espn_id, date_match: match.date,
      equipe_domicile: match.domicile.trigramme,
      equipe_exterieur: match.exterieur.trigramme,
      statut: match.statut,
    }, { onConflict: 'espn_id' }).select().single()
    if (!matchDB) return
    await supabase.from('pronos').upsert({
      user_id: userId, match_id: matchDB.id,
      equipe_choisie: equipe, resultat: 'en_attente',
    }, { onConflict: 'user_id,match_id' })
    setProno(equipe)
  }

  const heure = new Date(match.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const btnTeam = (tri, logo, score) => {
    const selec = prono === tri
    return (
      <button onClick={() => faireProno(tri)} disabled={verrou} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '12px 8px',
        background: selec ? 'var(--accent-dim)' : 'transparent',
        border: `1px solid ${selec ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)', cursor: verrou ? 'default' : 'pointer',
        transition: 'all 0.15s', minWidth: 0,
      }}>
        <img src={logo} alt={tri} style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
          color: selec ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '0.04em',
        }}>{tri}</span>
        {score !== null && score !== undefined && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>{score}</span>
        )}
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '12px',
      opacity: match.statut === 'STATUS_FINAL' ? 0.65 : 1,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginBottom: 10, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
        <span>{heure}</span>
        {match.statut === 'STATUS_IN_PROGRESS' && <span style={{ color: 'var(--success)', fontWeight: 600 }}>● Live</span>}
        {match.statut === 'STATUS_FINAL'       && <span>Terminé</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {btnTeam(match.exterieur.trigramme, match.exterieur.logo, match.exterieur.score)}
        <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>@</span>
        {btnTeam(match.domicile.trigramme,  match.domicile.logo,  match.domicile.score)}
      </div>

      {prono && !verrou && (
        <div style={{ fontSize: 11, color: 'var(--accent)', textAlign: 'center', marginTop: 8 }}>
          ✓ {prono} sélectionné
        </div>
      )}
    </div>
  )
}

export default Accueil