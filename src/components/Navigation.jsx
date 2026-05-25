import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Trophy, BarChart2, Menu, X, Users, LogOut } from 'lucide-react'

const LIENS_PRINCIPAUX = [
  { chemin: '/accueil', label: 'Pronos', icone: Home },
  { chemin: '/classement', label: 'Classement', icone: Trophy },
  { chemin: '/mes-pronos', label: 'Mes stats', icone: BarChart2 },
]

const LIENS_HAMBURGER = [
  { chemin: '/groupes', label: 'Groupes', icone: Users },
]

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  const gererDeconnexion = async () => {
    await supabase.auth.signOut()
    setMenuOuvert(false)
  }

  const naviguer = (chemin) => {
    navigate(chemin)
    setMenuOuvert(false)
  }

  return (
    <>
      {/* Overlay */}
      {menuOuvert && (
        <div
          onClick={() => setMenuOuvert(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }}
        />
      )}

      {/* Panneau hamburger */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: menuOuvert ? 0 : '-300px',
        width: 260,
        height: '100%',
        background: '#0f0f0f',
        borderLeft: '1px solid #1f1f1f',
        zIndex: 200,
        transition: 'right 0.25s ease',
        padding: '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menu</span>
          <button onClick={() => setMenuOuvert(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {LIENS_HAMBURGER.map(({ chemin, label, icone: Icone }) => (
          <button
            key={chemin}
            onClick={() => naviguer(chemin)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'none', border: 'none', color: '#aaa',
              fontSize: 14, cursor: 'pointer', textAlign: 'left',
              padding: '0.75rem 0.5rem', borderRadius: 8,
            }}
          >
            <Icone size={18} strokeWidth={1.5} />
            {label}
          </button>
        ))}

        <div style={{ marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: '1rem' }}>
          <button
            onClick={gererDeconnexion}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'none', border: 'none', color: '#555',
              fontSize: 14, cursor: 'pointer', padding: '0.75rem 0.5rem',
            }}
          >
            <LogOut size={18} strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Desktop — top navbar */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 52,
        background: '#0f0f0f',
        borderBottom: '1px solid #1f1f1f',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 100,
      }} className="nav-desktop">
        <span
          onClick={() => navigate('/accueil')}
          style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', cursor: 'pointer', color: '#fff' }}
        >
          NBA PRONOS
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {LIENS_PRINCIPAUX.map(({ chemin, label, icone: Icone }) => {
            const actif = location.pathname === chemin
            return (
              <button
                key={chemin}
                onClick={() => navigate(chemin)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'none', border: 'none',
                  color: actif ? '#fff' : '#555',
                  fontWeight: actif ? 600 : 400,
                  fontSize: 13, cursor: 'pointer',
                  padding: '0.4rem 0.75rem', borderRadius: 6,
                  borderBottom: actif ? '2px solid #fff' : '2px solid transparent',
                }}
              >
                <Icone size={15} strokeWidth={actif ? 2 : 1.5} />
                {label}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          style={{ background: 'none', border: '1px solid #222', color: '#555', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={16} strokeWidth={1.5} />
        </button>
      </nav>

      {/* Mobile — bottom nav */}
      <nav style={{
        display: 'flex',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 58,
        background: '#0f0f0f',
        borderTop: '1px solid #1f1f1f',
        alignItems: 'center',
        zIndex: 100,
      }} className="nav-mobile">
        {LIENS_PRINCIPAUX.map(({ chemin, label, icone: Icone }) => {
          const actif = location.pathname === chemin
          return (
            <button
              key={chemin}
              onClick={() => navigate(chemin)}
              style={{
                flex: 1, height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none',
                color: actif ? '#fff' : '#444',
                fontSize: 10, cursor: 'pointer',
                borderTop: actif ? '2px solid #fff' : '2px solid transparent',
              }}
            >
              <Icone size={20} strokeWidth={actif ? 2 : 1.5} />
              {label}
            </button>
          )
        })}
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          style={{
            flex: 1, height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            background: 'none', border: 'none',
            color: '#444', fontSize: 10, cursor: 'pointer',
            borderTop: '2px solid transparent',
          }}
        >
          <Menu size={20} strokeWidth={1.5} />
          Menu
        </button>
      </nav>
    </>
  )
}

export default Navigation