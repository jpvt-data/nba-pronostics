import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { CHANGELOG, VERSION_COURANTE } from '../data/changelog'

const TitreSection = ({ label, couleur = 'var(--accent)' }) => (
  <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 500 46">
      <polygon points="0,0 260,0 240,46 0,46" fill={couleur} />
      <polygon points="248,0 274,0 254,46 228,46" fill={couleur} />
      <polygon points="282,0 304,0 284,46 262,46" fill={couleur} />
      <polygon points="312,0 330,0 310,46 292,46" fill={couleur} />
      <polygon points="338,0 353,0 333,46 318,46" fill={couleur} />
      <polygon points="361,0 374,0 354,46 341,46" fill={couleur} />
      <polygon points="382,0 393,0 373,46 362,46" fill={couleur} />
      <polygon points="401,0 410,0 390,46 381,46" fill={couleur} />
      <polygon points="418,0 426,0 406,46 398,46" fill={couleur} />
    </svg>
    <span style={{
      position: 'absolute', top: '50%', left: 16, transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
  </div>
)

function QuoiDeNeuf() {
  const navigate = useNavigate()

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, paddingBottom: 40 }}>

        <div style={{ marginTop: 20 }}>
          <TitreSection label="NOUVEAUTÉS" couleur="var(--accent)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 16px 20px' }}>
          <span style={{
            fontSize: 11, padding: '2px 10px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)', fontWeight: 700, borderRadius: 3,
          }}>{VERSION_COURANTE}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Toutes les mises à jour de Swish League</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {CHANGELOG.map((entree, i) => (
            <div key={i} style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${entree.couleur}`,
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                {/* Icône */}
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  background: entree.couleur + '18',
                  border: `1px solid ${entree.couleur}33`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {entree.icone}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 17, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1.1 }}>
                      {entree.titre}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px',
                      background: i === 0 ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border-2)'}`,
                      color: i === 0 ? 'var(--accent)' : 'var(--text-3)',
                      borderRadius: 3,
                    }}>{entree.version}</span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 10px', lineHeight: 1.6 }}>
                    {entree.desc}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                      {new Date(entree.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {entree.lien && (
                      <button
                        onClick={() => navigate(entree.lien)}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          color: entree.couleur,
                          background: entree.couleur + '18',
                          border: `1px solid ${entree.couleur}44`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 10px', cursor: 'pointer',
                        }}
                      >
                        {entree.labelLien} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </>
  )
}

export default QuoiDeNeuf
