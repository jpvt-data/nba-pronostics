import Navigation from '../components/Navigation'
import { Zap } from 'lucide-react'
import { CHANGELOG, VERSION_COURANTE } from '../data/changelog'
import { LabelSection } from '../components/UI'

function QuoiDeNeuf() {
  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* Header */}
        <div style={{
          padding: '20px 16px 0',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={16} color="var(--accent)" strokeWidth={2} />
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-1)' }}>
              Quoi de neuf ?
            </h1>
            <span style={{
              fontSize: 11, padding: '2px 8px',
              background: 'rgba(99,102,241,0.15)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.4)',
              borderRadius: 99, color: 'var(--accent)', fontWeight: 600,
            }}>{VERSION_COURANTE}</span>
          </div>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--text-3)' }}>
            Toutes les mises à jour de Swish League
          </p>
        </div>

        {/* Liste changelog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px 24px' }}>
          {CHANGELOG.map((entree, i) => (
            <div key={i} style={{
              background: 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, transparent 60%)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 10, padding: '1px 7px',
                  background: 'rgba(99,102,241,0.12)',
                  borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.3)',
                  borderRadius: 99, color: 'var(--accent)', fontWeight: 600,
                }}>{entree.version}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{entree.date}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
                {entree.titre}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
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