import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Trophy, BarChart2, Menu, X, Users, LogOut } from 'lucide-react'

const LIENS = [
  { chemin: '/accueil',    label: 'Pronos',     icone: Home },
  { chemin: '/classement', label: 'Classement', icone: Trophy },
  { chemin: '/mes-pronos', label: 'Mes stats',  icone: BarChart2 },
]

const S = {
  /* navbar desktop */
  navDesk: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 52,
    background: 'var(--bg-0)', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', zIndex: 100,
  },
  brand: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
    letterSpacing: '0.08em', color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer',
  },
  brandDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'var(--accent)',
  },
  /* nav mobile */
  navMob: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
    background: 'var(--bg-0)', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'stretch', zIndex: 100,
  },
  /* overlay */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150,
  },
  /* panneau hamburger */
  panneau: {
    position: 'fixed', top: 0, height: '100%', width: 260,
    background: 'var(--bg-1)', borderLeft: '1px solid var(--border)',
    zIndex: 200, transition: 'right 0.25s ease',
    padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column',
  },
}

function Navigation() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [ouvert, setOuvert] = useState(false)

  const deconnecter = async () => { await supabase.auth.signOut(); setOuvert(false) }
  const aller = (chemin) => { navigate(chemin); setOuvert(false) }

  const boutonNav = (chemin, label, Icone, mobile = false) => {
    const actif = location.pathname === chemin
    return (
      <button key={chemin} onClick={() => aller(chemin)} style={{
        ...(mobile ? {
          flex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          fontSize: 10, fontWeight: 500,
          borderTop: `2px solid ${actif ? 'var(--accent)' : 'transparent'}`,
        } : {
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: actif ? 600 : 400,
          padding: '5px 12px', borderRadius: 'var(--radius-sm)',
          borderBottom: `2px solid ${actif ? 'var(--accent)' : 'transparent'}`,
        }),
        background: 'none', border: 'none',
        color: actif ? 'var(--text-1)' : 'var(--text-3)',
        cursor: 'pointer',
      }}>
        <Icone size={mobile ? 22 : 16} strokeWidth={actif ? 2 : 1.5} />
        {label}
      </button>
    )
  }

  return (
    <>
      {ouvert && <div onClick={() => setOuvert(false)} style={S.overlay} />}

      {/* Panneau hamburger */}
      <div style={{ ...S.panneau, right: ouvert ? 0 : '-300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</span>
          <button onClick={() => setOuvert(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <button onClick={() => aller('/groupes')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', color: 'var(--text-2)',
          fontSize: 14, cursor: 'pointer', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)',
        }}>
          <Users size={18} strokeWidth={1.5} /> Groupes
        </button>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button onClick={deconnecter} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', color: 'var(--text-3)',
            fontSize: 14, cursor: 'pointer', padding: '0.75rem 0.5rem',
          }}>
            <LogOut size={18} strokeWidth={1.5} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Desktop */}
      <nav style={S.navDesk} className="nav-desktop">
        <div style={S.brand} onClick={() => navigate('/accueil')}>
          <div style={S.brandDot} />
          NBA PRONOS
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {LIENS.map(({ chemin, label, icone: I }) => boutonNav(chemin, label, I))}
        </div>
        <button onClick={() => setOuvert(!ouvert)} style={{
          background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)',
          padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <Menu size={16} strokeWidth={1.5} />
        </button>
      </nav>

      {/* Mobile */}
      <nav style={S.navMob} className="nav-mobile">
        {LIENS.map(({ chemin, label, icone: I }) => boutonNav(chemin, label, I, true))}
        <button onClick={() => setOuvert(!ouvert)} style={{
          flex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          background: 'none', border: 'none', borderTop: '2px solid transparent',
          color: 'var(--text-3)', fontSize: 10, cursor: 'pointer',
        }}>
          <Menu size={22} strokeWidth={1.5} /> Menu
        </button>
      </nav>
    </>
  )
}

export default Navigation