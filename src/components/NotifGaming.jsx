// src/components/NotifGaming.jsx
import { useEffect, useRef } from 'react'
import { useNotif } from '../context/NotifContext'
import { X, ChevronRight } from 'lucide-react'

// Couleur et icône selon le type de notif
const STYLES_TYPE = {
  xp:      { couleur: 'var(--accent)',  bordure: 'var(--accent-border)', fond: 'var(--accent-dim)' },
  niveau:  { couleur: 'var(--gold)',    bordure: 'rgba(245,158,11,0.4)', fond: 'var(--gold-dim)'   },
  titre:   { couleur: 'var(--gold)',    bordure: 'rgba(245,158,11,0.4)', fond: 'var(--gold-dim)'   },
  mission: { couleur: 'var(--gold)',    bordure: 'rgba(245,158,11,0.4)', fond: 'var(--gold-dim)'   },
  badge:   { couleur: 'var(--orange)',  bordure: 'rgba(249,115,22,0.4)', fond: 'rgba(249,115,22,0.1)' },
  roue:    { couleur: 'var(--accent)',  bordure: 'var(--accent-border)', fond: 'var(--accent-dim)' },
  matchs:  { couleur: 'var(--success)', bordure: 'rgba(34,197,94,0.4)',  fond: 'var(--success-dim)' },
}

const ICONE_TYPE = {
  xp:      '+XP',
  niveau:  'NIV',
  titre:   'RPG',
  mission: 'OBJ',
  badge:   'HDR',
  roue:    'RUE',
  matchs:  'RES',
}

// Durée affichage auto (ms)
const DUREE = 8000

export default function NotifGaming() {
  const { queue, depilerNotif } = useNotif()
  const timerRef = useRef(null)
  const barreRef = useRef(null)

  const notif = queue[0] || null
  const restants = queue.length - 1

  // Timer auto + barre de progression
  useEffect(() => {
    if (!notif) return

    // Reset barre
    if (barreRef.current) {
      barreRef.current.style.transition = 'none'
      barreRef.current.style.width = '100%'
      // Force reflow
      void barreRef.current.offsetWidth
      barreRef.current.style.transition = `width ${DUREE}ms linear`
      barreRef.current.style.width = '0%'
    }

    timerRef.current = setTimeout(() => {
      depilerNotif()
    }, DUREE)

    return () => clearTimeout(timerRef.current)
  }, [notif?.id])

  if (!notif) return null

  const style = STYLES_TYPE[notif.type] || STYLES_TYPE.xp

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 70, // au-dessus de la nav mobile (52px) + marge
        left: 0, right: 0,
        zIndex: 3000,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 12px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-1)',
          borderLeft: `3px solid ${style.couleur}`,
          borderRadius: 'var(--radius-sm)',
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${style.bordure}`,
          overflow: 'hidden',
          pointerEvents: 'all',
          animation: 'notifSlide 0.25s ease',
        }}
      >
        {/* Barre de progression */}
        <div style={{ height: 2, background: 'var(--bg-2)', position: 'relative' }}>
          <div
            ref={barreRef}
            style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: '100%',
              background: style.couleur,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Contenu */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
        }}>
          {/* Badge type */}
          <div style={{
            flexShrink: 0,
            width: 36, height: 36,
            background: style.fond,
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 10, color: style.couleur,
            letterSpacing: '0.05em',
          }}>
            {ICONE_TYPE[notif.type] || '+XP'}
          </div>

          {/* Textes */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: style.couleur,
              fontFamily: 'var(--font-title)',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}>
              {notif.titre}
            </div>
            {notif.message && (
              <div style={{
                fontSize: 11, color: 'var(--text-3)',
                marginTop: 2, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {notif.message}
              </div>
            )}
          </div>

          {/* Compteur si plusieurs notifs */}
          {restants > 0 && (
            <div
              onClick={depilerNotif}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 2,
                fontSize: 11, color: 'var(--text-3)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700,
              }}
            >
              +{restants}
              <ChevronRight size={12} />
            </div>
          )}

          {/* Bouton fermer */}
          <button
            onClick={depilerNotif}
            style={{
              flexShrink: 0,
              background: 'none', borderWidth: 0, cursor: 'pointer',
              color: 'var(--text-3)', padding: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Animation keyframes injectée une seule fois */}
      <style>{`
        @keyframes notifSlide {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
