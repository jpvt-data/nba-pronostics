import Navigation from '../components/Navigation'
import { CHANGELOG, VERSION_COURANTE } from '../data/changelog'

function QuoiDeNeuf() {
  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>QUOI DE</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>NEUF</span>
            <span style={{
              fontSize: 11, padding: '2px 8px', marginLeft: 4,
              background: 'var(--accent-dim)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)',
              color: 'var(--accent)', fontWeight: 600,
            }}>{VERSION_COURANTE}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>
            Toutes les mises à jour de Swish League
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 32 }}>
          {CHANGELOG.map((entree, i) => (
            <div key={i} style={{
              background: i % 2 === 0 ? 'var(--bg-1)' : 'var(--bg-0)',
              padding: '16px 16px 18px',
              borderLeft: i === 0 ? '3px solid var(--accent)' : '3px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 10, padding: '2px 8px',
                  background: i === 0 ? 'var(--accent-dim)' : 'transparent',
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: i === 0 ? 'var(--accent-border)' : 'var(--border)',
                  color: i === 0 ? 'var(--accent)' : 'var(--text-3)', fontWeight: 600,
                }}>{entree.version}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{entree.date}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
                {entree.titre}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                {entree.desc}
              </div>
            </div>
          ))}
        </div>

      </main>
    </>
  )
}

export default QuoiDeNeuf