import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LIENS = [
  { chemin: '/accueil', label: 'Accueil' },
  { chemin: '/classement', label: 'Classement' },
  { chemin: '/groupes', label: 'Groupes' },
]

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const gererDeconnexion = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Desktop — top navbar */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        background: '#111',
        borderBottom: '1px solid #222',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 100,
      }} className="nav-desktop">
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }}>NBA PRONOS</span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {LIENS.map(lien => (
            <button
              key={lien.chemin}
              onClick={() => navigate(lien.chemin)}
              style={{
                background: 'none',
                border: 'none',
                color: location.pathname === lien.chemin ? '#fff' : '#888',
                fontWeight: location.pathname === lien.chemin ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                borderBottom: location.pathname === lien.chemin ? '2px solid #fff' : '2px solid transparent',
                paddingBottom: 2,
              }}
            >
              {lien.label}
            </button>
          ))}
        </div>
        <button
          onClick={gererDeconnexion}
          style={{ background: 'none', border: '1px solid #333', color: '#888', fontSize: 13, padding: '4px 12px', borderRadius: 6, cursor: 'pointer' }}
        >
          Déconnexion
        </button>
      </nav>

      {/* Mobile — bottom nav */}
      <nav style={{
        display: 'flex',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: '#111',
        borderTop: '1px solid #222',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }} className="nav-mobile">
        {LIENS.map(lien => (
          <button
            key={lien.chemin}
            onClick={() => navigate(lien.chemin)}
            style={{
              background: 'none',
              border: 'none',
              color: location.pathname === lien.chemin ? '#fff' : '#666',
              fontWeight: location.pathname === lien.chemin ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              flex: 1,
              height: '100%',
              borderTop: location.pathname === lien.chemin ? '2px solid #fff' : '2px solid transparent',
            }}
          >
            {lien.label}
          </button>
        ))}
      </nav>
    </>
  )
}

export default Navigation