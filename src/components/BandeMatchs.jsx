import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL' || statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

const formaterHeure = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formaterJour = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const statutLabel = (statut) => {
  if (statut === 'STATUS_FINAL')       return { texte: 'Terminé',  couleur: 'var(--text-3)' }
  if (statut === 'STATUS_IN_PROGRESS') return { texte: '● Live',   couleur: 'var(--success)' }
  return null
}

function BandeMatchs({ matchs, userId }) {
  const [pronos, setPronos] = useState({})

  useEffect(() => {
    const charger = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, matchs(espn_id)')
        .eq('user_id', userId)
      const idx = {}
      data?.forEach(p => { if (p.matchs) idx[p.matchs.espn_id] = p.equipe_choisie })
      setPronos(idx)
    }
    charger()
  }, [userId])

  const faireProno = async (match, equipe) => {
    if (estVerrouille(match.date, match.statut)) return
    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id: match.espn_id, date_match: match.date,
        equipe_domicile: match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut: match.statut,
      }, { onConflict: 'espn_id' })
      .select().single()
    if (!matchDB) return
    await supabase.from('pronos').upsert({
      user_id: userId, match_id: matchDB.id,
      equipe_choisie: equipe, resultat: 'en_attente',
    }, { onConflict: 'user_id,match_id' })
    setPronos(prev => ({ ...prev, [match.espn_id]: equipe }))
  }

  const btnEquipe = (match, equipe, logo, score) => {
    const verrou  = estVerrouille(match.date, match.statut)
    const selec   = pronos[match.espn_id] === equipe
    return (
      <button
        onClick={() => faireProno(match, equipe)}
        disabled={verrou}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          background: selec ? 'var(--accent-dim)' : 'transparent',
          border: `1px solid ${selec ? 'var(--accent-border)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '7px 8px',
          cursor: verrou ? 'default' : 'pointer',
          marginBottom: 4, transition: 'all 0.15s',
        }}
      >
        <img src={logo} alt={equipe} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          color: selec ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '0.04em', flex: 1, textAlign: 'left',
        }}>{equipe}</span>
        {score !== null && score !== undefined && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-2)' }}>{score}</span>
        )}
      </button>
    )
  }

  return (
    /* ⚠️ overflow-x sur le WRAPPER, pas sur l'enfant */
    <div style={{
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      borderBottom: '1px solid var(--border)',
      padding: '12px 0',
    }}>
      <div style={{
        display: 'flex', gap: 10,
        padding: '0 16px',
        width: 'max-content', /* force le débordement horizontal */
      }}>
        {matchs.map(match => {
          const st = statutLabel(match.statut)
          return (
            <div key={match.espn_id} style={{
              background: 'var(--bg-1)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '10px 10px 8px',
              width: 156, flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>
                {formaterJour(match.date)} · {formaterHeure(match.date)}
              </div>
              {btnEquipe(match, match.exterieur.trigramme, match.exterieur.logo, match.exterieur.score)}
              {btnEquipe(match, match.domicile.trigramme,  match.domicile.logo,  match.domicile.score)}
              {st && (
                <div style={{ fontSize: 10, fontWeight: 600, color: st.couleur, textAlign: 'center', marginTop: 4 }}>
                  {st.texte}
                </div>
              )}
              {pronos[match.espn_id] && !estVerrouille(match.date, match.statut) && (
                <div style={{ fontSize: 10, color: 'var(--accent)', textAlign: 'center', marginTop: 4 }}>✓ Prono ok</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BandeMatchs