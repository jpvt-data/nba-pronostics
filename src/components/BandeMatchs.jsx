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
      const espnIds = matchs.map(m => m.espn_id)
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, matchs(espn_id)')
        .eq('user_id', userId)
      const idx = {}
      data?.forEach(p => {
        if (p.matchs && espnIds.includes(p.matchs.espn_id))
          idx[p.matchs.espn_id] = p.equipe_choisie
      })
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

          // Couleur de l'équipe pronostiquée (ESPN hex sans #)
          const equipeProno = pronoActuel
            ? [match.domicile, match.exterieur].find(e => e.trigramme === pronoActuel)
            : null
          const couleurBrute = equipeProno?.color || null
          const couleur      = couleurBrute ? `#${couleurBrute}` : null

          const borderColor = couleur
            ? `${couleur}66`  // 40% opacité
            : 'var(--border)'

          return (
            <div
              key={match.espn_id}
              onClick={() => navigate(`/match/${match.espn_id}`)}
              style={{
                background: couleur
                  ? `linear-gradient(160deg, ${couleur}18 0%, var(--bg-1) 65%)`
                  : 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor,
                borderRadius: 'var(--radius-md)',
                padding: '12px 12px 10px',
                width: 165, flexShrink: 0,
                cursor: 'pointer',
                opacity: noSpoil && termine ? 0.5 : 1,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {/* Date / heure */}
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginBottom: 10 }}>
                {formaterJour(match.date)} · {formaterHeure(match.date)}
              </div>

              {/* Équipes */}
              {[match.exterieur, match.domicile].map((eq, i) => {
                const estProno = pronoActuel === eq.trigramme
                return (
                  <div key={eq.trigramme} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    paddingTop: 6, paddingBottom: 6,
                    borderTopWidth: i === 1 ? 1 : 0, borderTopStyle: 'solid', borderTopColor: 'var(--border)',
                  }}>
                    <img src={eq.logo} alt={eq.trigramme} style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                      color: estProno ? 'var(--text-1)' : 'var(--text-2)',
                      letterSpacing: '0.04em', flex: 1,
                    }}>{eq.trigramme}</span>
                    {(termine || enCours) && eq.score != null && (
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                        color: estProno ? 'var(--text-1)' : 'var(--text-3)',
                      }}>
                        {noSpoil && termine ? '—' : eq.score}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Statut + prono */}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: enCours ? 'var(--success)' : 'var(--text-3)' }}>
                  {enCours ? '● Live' : termine ? (noSpoil ? '🙈' : 'Terminé') : ''}
                </span>
                {pronoActuel && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: couleur || 'var(--accent)',
                    background: couleur ? `${couleur}22` : 'rgba(99,102,241,0.12)',
                    borderRadius: 4,
                    paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                  }}>
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
