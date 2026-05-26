import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNoSpoil } from '../context/NoSpoilContext'

const formaterHeure = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formaterJour = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function BandeMatchs({ matchs, userId }) {
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()
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

  if (!matchs.length) return null

  return (
    <div style={{
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      paddingTop: 12, paddingBottom: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, paddingLeft: 16, paddingRight: 16, width: 'max-content' }}>
        {matchs.map(match => {
          const pronoActuel = pronos[match.espn_id]
          const termine     = match.statut === 'STATUS_FINAL'
          const enCours     = match.statut === 'STATUS_IN_PROGRESS'

          return (
            <div
              key={match.espn_id}
              onClick={() => navigate(`/match/${match.espn_id}`)}
              style={{
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 10px 8px',
                width: 150, flexShrink: 0,
                cursor: 'pointer',
                opacity: noSpoil && termine ? 0.5 : 1,
              }}
            >
              {/* Date / heure */}
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>
                {formaterJour(match.date)} · {formaterHeure(match.date)}
              </div>

              {/* Équipes */}
              {[match.exterieur, match.domicile].map((eq, i) => (
                <div key={eq.trigramme} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  paddingTop: 5, paddingBottom: 5,
                  borderTopWidth: i === 1 ? 1 : 0, borderTopStyle: 'solid', borderTopColor: 'var(--border)',
                }}>
                  <img src={eq.logo} alt={eq.trigramme} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                    color: 'var(--text-1)', letterSpacing: '0.04em', flex: 1,
                  }}>{eq.trigramme}</span>
                  {(termine || enCours) && eq.score != null && (
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-2)' }}>
                      {noSpoil && termine ? '—' : eq.score}
                    </span>
                  )}
                </div>
              ))}

              {/* Statut + prono */}
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: enCours ? 'var(--success)' : 'var(--text-3)' }}>
                  {enCours ? '● Live' : termine ? (noSpoil ? '🙈' : 'Terminé') : ''}
                </span>
                {pronoActuel && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                    ✓ {pronoActuel}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BandeMatchs