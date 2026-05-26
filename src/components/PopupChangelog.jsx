import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Zap } from 'lucide-react'
import { CHANGELOG, VERSION_COURANTE } from '../data/changelog'

const DEV = import.meta.env.MODE !== 'production'
const CLE_STORAGE = `popup_vu_${VERSION_COURANTE}`

function PopupChangelog({ forceOuvert = false, onFermer }) {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (forceOuvert) {
      setVisible(true)
      return
    }
    // Affiche une seule fois par version
    if (DEV || !localStorage.getItem(CLE_STORAGE)) {
      setVisible(true)
    }
  }, [forceOuvert])

  const fermer = () => {
    localStorage.setItem(CLE_STORAGE, '1')
    setVisible(false)
    onFermer?.()
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={fermer}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 300,
        }}
      />

      {/* Popup */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(480px, 92vw)',
        maxHeight: '80vh',
        background: '#12121c',
        border: '1px solid #2a2a3e',
        borderRadius: 14,
        zIndex: 301,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header fixe */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #1e1e2e',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="#6366f1" strokeWidth={2} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>Quoi de neuf ?</span>
            <span style={{
              fontSize: 11, padding: '2px 8px',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: 99, color: '#6366f1', fontWeight: 600,
            }}>{VERSION_COURANTE}</span>
          </div>
          <button
            onClick={fermer}
            style={{ background: 'none', border: 'none', color: '#4a4a6a', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {CHANGELOG.map((entree, i) => (
            <div key={i} style={{
              background: '#1a1a2e',
              border: '1px solid #1e1e2e',
              borderRadius: 10,
              padding: '0.75rem 1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, padding: '1px 7px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 99, color: '#6366f1', fontWeight: 600,
                }}>{entree.version}</span>
                <span style={{ fontSize: 11, color: '#4a4a6a' }}>{entree.date}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', marginBottom: 4 }}>
                {entree.titre}
              </div>
              <div style={{ fontSize: 12, color: '#9090b0', lineHeight: 1.5 }}>
                {entree.desc}
              </div>
              {entree.lien && (
                <button
                  onClick={() => { fermer(); navigate(entree.lien) }}
                  style={{
                    marginTop: 8,
                    fontSize: 12, color: '#6366f1',
                    background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {entree.labelLien} →
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer fixe */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid #1e1e2e',
          flexShrink: 0,
        }}>
          <button
            onClick={fermer}
            style={{
              width: '100%', padding: '0.6rem',
              background: '#6366f1', border: 'none',
              borderRadius: 8, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            C'est parti 🏀
          </button>
        </div>
      </div>
    </>
  )
}

export default PopupChangelog