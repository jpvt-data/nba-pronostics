import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Trophy, BarChart2, Menu, X, Swords, LogOut, Calendar, Sparkles, TrendingUp, Shield } from 'lucide-react'
import { useProfil } from '../context/ProfilContext'
import { track } from '../services/tracker'
import { Avatar } from '../components/Avatar'
import swishLogo from '../assets/swish_league_logo.png'

const LIENS = [
  { chemin: '/accueil',    label: 'Board',      Icone: Home },
  { chemin: '/classement', label: 'Classement', Icone: Trophy },
  { chemin: '/mes-pronos', label: 'Mes stats',  Icone: BarChart2 },
  { chemin: '/stats',      label: 'Explorer',   Icone: TrendingUp },
]

const navBase = {
  position: 'fixed',
  left: 0, right: 0,
  background: 'var(--bg-0)',
  zIndex: 100,
}

function Navigation({ nbPronosAttente = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [ouvert, setOuvert]     = useState(false)
  const { profil } = useProfil()
  const [estAdmin, setEstAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEstAdmin(user?.id === 'fa55d016-896c-4eb4-b48a-241d6be71ad0')
    })
  }, [])

  const deconnecter = async () => {
    await supabase.auth.signOut()
    setOuvert(false)
    navigate('/connexion')
  }

  const aller = (chemin) => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) track(user.id, 'clic_nav', chemin, { destination: chemin })
    })
    navigate(chemin); setOuvert(false)
  }

  // Logo Teko — SWISH noir, LEAGUE violet + accroche dessous
  const LogoTeko = ({ size = 20 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700, fontSize: size * 1.6, color: 'var(--nav-text)', letterSpacing: '-0.01em', lineHeight: 1 }}>SWISH</span>
        <span style={{ fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700, fontSize: size * 1.6, color: 'var(--accent)', letterSpacing: '-0.01em', lineHeight: 1 }}>LEAGUE</span>
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 7.5, fontWeight: 500, color: 'var(--nav-text-dim)', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1, marginTop: 1, paddingLeft: 1 }}>Pronostique · Flambe · Règne</span>
    </div>
  )

  return (
    <>
      {ouvert && (
        <div onClick={() => setOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150 }} />
      )}

      {/* ── Panneau hamburger ── */}
      <div style={{
        position: 'fixed', top: 0, height: '100%', width: 260,
        right: ouvert ? 0 : '-300px',
        background: 'var(--bg-1)',
        borderLeft: '1px solid var(--border)',
        zIndex: 200,
        transition: 'right 0.25s ease',
        padding: '1.25rem 1rem',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</span>
          <button onClick={() => setOuvert(false)} style={{ background: 'none', borderWidth: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Profil */}
        <button onClick={() => aller('/profil')} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: location.pathname === '/profil' ? 'var(--accent-dim)' : 'var(--bg-2)',
          borderWidth: 1, borderStyle: 'solid',
          borderColor: location.pathname === '/profil' ? 'var(--accent-border)' : 'var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px', cursor: 'pointer', marginBottom: '1rem', width: '100%', textAlign: 'left',
        }}>
          <Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={36} fontSize={13} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profil?.pseudo || '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Mon profil</div>
          </div>
        </button>

        <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', marginBottom: '0.75rem' }} />

        {/* Liens principaux */}
        {[
          { chemin: '/stats',      label: 'Explorer',   Icone: TrendingUp },
          { chemin: '/groupes',    label: 'Ligues',     Icone: Shield },
          { chemin: '/calendrier', label: 'Calendrier', Icone: Calendar },
        ].map(({ chemin, label, Icone }) => (
          <button key={chemin} onClick={() => aller(chemin)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: location.pathname === chemin ? 'var(--accent-dim)' : 'none',
            borderWidth: location.pathname === chemin ? 1 : 0, borderStyle: 'solid', borderColor: 'var(--accent-border)',
            color: location.pathname === chemin ? 'var(--accent)' : 'var(--text-2)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
            borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
          }}>
            <Icone size={18} strokeWidth={1.5} /> {label}
          </button>
        ))}

        <button onClick={() => aller('/h2h')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: location.pathname === '/h2h' ? 'var(--accent-dim)' : 'none',
          borderWidth: location.pathname === '/h2h' ? 1 : 0, borderStyle: 'solid', borderColor: 'var(--accent-border)',
          color: location.pathname === '/h2h' ? 'var(--accent)' : 'var(--text-2)',
          fontSize: 14, cursor: 'pointer',
          paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
          borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
        }}>
          <Swords size={18} strokeWidth={1.5} /> 1v1
        </button>

        <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', margin: '0.75rem 0' }} />

        {estAdmin && (
          <button onClick={() => aller('/admin')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: location.pathname === '/admin' ? 'var(--accent-dim)' : 'none',
            borderWidth: location.pathname === '/admin' ? 1 : 0, borderStyle: 'solid', borderColor: 'var(--accent-border)',
            color: location.pathname === '/admin' ? 'var(--accent)' : 'var(--text-2)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
            borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
          }}>
            🛡️ Admin
          </button>
        )}
        
        <button onClick={() => aller('/quoi-de-neuf')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: location.pathname === '/quoi-de-neuf' ? 'var(--accent-dim)' : 'none',
          borderWidth: location.pathname === '/quoi-de-neuf' ? 1 : 0, borderStyle: 'solid', borderColor: 'var(--accent-border)',
          color: location.pathname === '/quoi-de-neuf' ? 'var(--accent)' : 'var(--text-2)',
          fontSize: 14, cursor: 'pointer',
          paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
          borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
        }}>
          <Sparkles size={18} strokeWidth={1.5} /> Quoi de neuf ?
        </button>

        <div style={{ marginTop: 'auto', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', paddingTop: '1rem' }}>
          <button onClick={deconnecter} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', borderWidth: 0, color: 'var(--text-3)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
          }}>
            <LogOut size={18} strokeWidth={1.5} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ── DESKTOP — barre top ── */}
      <nav className="nav-desktop-full" style={{
        ...navBase, top: 0, height: 52,
        background: 'var(--nav-bg)',
        borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--nav-border)',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 0 8px',
        boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
      }}>
        <div onClick={() => navigate('/accueil')} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <LogoTeko size={22} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {LIENS.map(({ chemin, label, Icone }) => {
            const actif = location.pathname === chemin
            return (
              <button key={chemin} onClick={() => aller(chemin)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', borderWidth: 0,
                color: actif ? '#0d0d12' : '#333',
                fontWeight: actif ? 600 : 400, fontSize: 13, cursor: 'pointer',
                paddingTop: 5, paddingBottom: 5, paddingLeft: 12, paddingRight: 12,
                borderRadius: 'var(--radius-sm)',
                boxShadow: actif ? 'inset 0 -2px 0 var(--accent)' : 'none',
              }}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icone size={15} strokeWidth={actif ? 2 : 1.5} />
                  {chemin === '/accueil' && nbPronosAttente > 0 && (
                    <span style={{
                      position: 'absolute', top: -3, right: -5,
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--danger)',
                      border: '1.5px solid var(--nav-bg)',
                    }} />
                  )}
                </div>
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/profil')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: '#e0e0e0',
            borderRadius: 'var(--radius-sm)', padding: '4px 10px 4px 6px', cursor: 'pointer',
          }}>
            <Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={24} fontSize={9} />
            <span style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>{profil?.pseudo || '—'}</span>
          </button>
          <button onClick={() => setOuvert(!ouvert)} style={{
            background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: '#e0e0e0',
            color: '#555', paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <Menu size={16} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE — barre logo top ── */}
      <nav className="nav-mobile-logo" style={{
        ...navBase, top: 0, height: 52,
        background: 'var(--nav-bg)',
        borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--nav-border)',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 0 8px',
        boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
      }}>
        <div onClick={() => navigate('/accueil')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <LogoTeko size={18} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => navigate('/profil')} style={{ background: 'none', borderWidth: 0, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={26} fontSize={9} />
          </button>
          <button onClick={() => setOuvert(!ouvert)} style={{ background: 'none', borderWidth: 0, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE — bottom nav ── */}
      <nav className="nav-mobile-bot" style={{
        ...navBase, bottom: 0, height: 60,
        borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)',
        alignItems: 'stretch',
      }}>
        {LIENS.map(({ chemin, label, Icone }) => {
          const actif = location.pathname === chemin
          return (
            <button key={chemin} onClick={() => aller(chemin)} style={{
              flex: 1, height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', borderWidth: 0,
              color: actif ? 'var(--text-1)' : 'var(--text-3)',
              fontSize: 10, fontWeight: 500, cursor: 'pointer',
              boxShadow: actif ? 'inset 0 2px 0 var(--accent)' : 'none',
            }}>
              {/* Badge sur Board — mobile */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icone size={22} strokeWidth={actif ? 2 : 1.5} />
                {chemin === '/accueil' && nbPronosAttente > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--danger)',
                    border: '1.5px solid var(--bg-0)',
                  }} />
                )}
              </div>
              {label}
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default Navigation