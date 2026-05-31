import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNoSpoil } from '../context/NoSpoilContext'

const formaterHeure = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formaterJour = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function BandeMatchs({ matchs, userId, onProno, onBadge }) {
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

      // Matchs pronosticables = pas terminé, pas en cours, pas encore pronostiqué
      const nbAttente = matchs.filter(m =>
        m.statut !== 'STATUS_FINAL' &&
        m.statut !== 'STATUS_IN_PROGRESS' &&
        !idx[m.espn_id]
      ).length
      if (onBadge) onBadge(nbAttente)
    }
    charger()
  }, [userId, matchs])

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

          const equipeProno = pronoActuel
            ? [match.domicile, match.exterieur].find(e => e.trigramme === pronoActuel)
            : null

          const estTropSombre = (hex) => {
            if (!hex) return true
            const h = hex.replace('#', '')
            const r = parseInt(h.slice(0,2), 16)
            const g = parseInt(h.slice(2,4), 16)
            const b = parseInt(h.slice(4,6), 16)
            return (0.299*r + 0.587*g + 0.114*b) < 40
          }

          const couleurBrute = equipeProno?.color         ? `#${equipeProno.color}`         : null
          const couleurAlt   = equipeProno?.alternateColor ? `#${equipeProno.alternateColor}` : null
          const couleur = !estTropSombre(couleurBrute)
            ? couleurBrute
            : !estTropSombre(couleurAlt)
              ? couleurAlt
              : 'var(--accent)'

          const borderColor = pronoActuel
            ? (couleur === 'var(--accent)' ? 'rgba(99,102,241,0.4)' : `${couleur}66`)
            : 'var(--border)'

          return (
            <div
              key={match.espn_id}
              onClick={() => navigate(`/match/${match.espn_id}`)}
              style={{
                background: pronoActuel
                  ? (couleur === 'var(--accent)'
                      ? 'linear-gradient(160deg, rgba(99,102,241,0.1) 0%, var(--bg-1) 65%)'
                      : `linear-gradient(160deg, ${couleur}18 0%, var(--bg-1) 65%)`)
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
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginBottom: 10 }}>
                {formaterJour(match.date)} · {formaterHeure(match.date)}
              </div>

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

              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: enCours ? 'var(--success)' : 'var(--text-3)' }}>
                  {enCours ? '● Live' : termine ? (noSpoil ? '🙈' : 'Terminé') : ''}
                </span>
                {pronoActuel && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: couleur === 'var(--accent)' ? 'var(--accent)' : couleur,
                    background: couleur === 'var(--accent)' ? 'rgba(99,102,241,0.12)' : `${couleur}22`,
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