import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Trophy, BarChart2, Menu, X, Swords, LogOut, Calendar, Sparkles, Search, Shield, MessageSquare, Layers, Info, FileText } from 'lucide-react'
import { useProfil } from '../context/ProfilContext'
import { track } from '../services/tracker'
import { Avatar } from '../components/Avatar'

// Bottom nav mobile — 4 items fixes (icônes seules)
const LIENS = [
  { chemin: '/accueil',    label: 'Board',      Icone: Home },
  { chemin: '/classement', label: 'Classement', Icone: Trophy },
  { chemin: '/mes-pronos', label: 'Stats',      Icone: BarChart2 },
  { chemin: '/stats',      label: 'Explorer',   Icone: Search },
]

// Liens principaux hamburger
const LIENS_PRINCIPAL = [
  { chemin: '/groupes',    label: 'Ligues',     Icone: Shield },
  { chemin: '/calendrier', label: 'Calendrier', Icone: Calendar },
  { chemin: '/h2h',        label: '1v1',        Icone: Swords },
]

// Liens à venir — inactifs
const LIENS_BIENTOT = [
  { chemin: '/ma-collection', label: 'Collection', Icone: Layers },
  { chemin: '/chat',          label: 'Chat',        Icone: MessageSquare },
]

// Liens footer — inactifs
const LIENS_FOOTER_INACTIFS = [
  { chemin: '/mentions-legales', label: 'Mentions légales', Icone: FileText },
  { chemin: '/a-propos',         label: 'À propos',         Icone: Info },
]

const navBase = {
  position: 'fixed',
  left: 0, right: 0,
  zIndex: 100,
}

const styleLienHamburger = (actif) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  background: actif ? 'var(--accent-dim)' : 'none',
  borderWidth: actif ? 1 : 0, borderStyle: 'solid', borderColor: 'var(--accent-border)',
  color: actif ? 'var(--accent)' : 'var(--text-2)',
  fontSize: 14, cursor: 'pointer',
  paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
  borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
  transition: 'color var(--transition), background var(--transition)',
})

const styleLienInactif = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'none', borderWidth: 0,
  color: 'var(--text-3)',
  fontSize: 14, cursor: 'not-allowed', opacity: 0.4,
  paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem',
  borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
}

function Navigation({ nbPronosAttente = 0, onOpenOnboarding }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [ouvert, setOuvert] = useState(false)
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
    navigate(chemin)
    setOuvert(false)
  }

  // Logo texte — SWISH blanc + LEAGUE violet, italique, hauteur étirée
  const LogoTeko = () => (
    <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
      <span style={{
        fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
        fontSize: 34, color: 'var(--text-1)',
        letterSpacing: '-0.01em', lineHeight: 1,
        fontStyle: 'italic', display: 'inline-block',
      }}>SWISH</span>
      <span style={{
        fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
        fontSize: 34, color: 'var(--accent)',
        letterSpacing: '-0.01em', lineHeight: 1,
        fontStyle: 'italic', display: 'inline-block',
      }}>LEAGUE</span>
    </div>
  )

  const BadgeBientot = () => (
    <span style={{
      marginLeft: 'auto', fontSize: 9, fontWeight: 600,
      color: 'var(--text-3)', background: 'var(--bg-2)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
      borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>bientôt</span>
  )

  return (
    <>
      {ouvert && (
        <div onClick={() => setOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 150, backdropFilter: 'blur(4px)' }} />
      )}

      {/* ── Panneau hamburger ── */}
      <div style={{
        position: 'fixed', top: 0, height: '100%', width: 260,
        right: ouvert ? 0 : '-300px',
        background: 'linear-gradient(180deg, #16162a 0%, var(--bg-1) 100%)',
        borderLeft: '1px solid var(--border)',
        zIndex: 200,
        transition: 'right 0.25s ease',
        padding: '1.25rem 1rem',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* En-tête panneau */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => aller('/stats')} style={{
              background: location.pathname === '/stats' ? 'var(--accent-dim)' : 'none',
              borderWidth: location.pathname === '/stats' ? 1 : 0, borderStyle: 'solid', borderColor: 'var(--accent-border)',
              color: location.pathname === '/stats' ? 'var(--accent)' : 'var(--text-3)',
              cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center',
            }}>
              <Search size={16} strokeWidth={1.5} />
            </button>
            <button onClick={() => setOuvert(false)} style={{ background: 'none', borderWidth: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
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
        {LIENS_PRINCIPAL.map(({ chemin, label, Icone }) => (
          <button key={chemin} onClick={() => aller(chemin)} style={styleLienHamburger(location.pathname === chemin)}>
            <Icone size={18} strokeWidth={1.5} /> {label}
          </button>
        ))}

        {/* Liens à venir */}
        {LIENS_BIENTOT.map(({ chemin, label, Icone }) => (
          <button key={chemin} disabled style={styleLienInactif}>
            <Icone size={18} strokeWidth={1.5} /> {label} <BadgeBientot />
          </button>
        ))}

        <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', margin: '0.75rem 0' }} />

        <button onClick={() => aller('/quoi-de-neuf')} style={styleLienHamburger(location.pathname === '/quoi-de-neuf')}>
          <Sparkles size={18} strokeWidth={1.5} /> Quoi de neuf ?
        </button>

        <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', margin: '0.75rem 0' }} />

        {LIENS_FOOTER_INACTIFS.map(({ chemin, label, Icone }) => (
          <button key={chemin} disabled style={styleLienInactif}>
            <Icone size={18} strokeWidth={1.5} /> {label} <BadgeBientot />
          </button>
        ))}

        {estAdmin && (
          <button onClick={() => aller('/admin')} style={styleLienHamburger(location.pathname === '/admin')}>
            <Shield size={18} strokeWidth={1.5} /> Admin
          </button>
        )}

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
        alignItems: 'stretch',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Contenu centré sur 680px — aligné sur #root */}
        <div style={{
          width: '100%', maxWidth: 680, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          {/* Logo — gauche */}
          <div onClick={() => navigate('/accueil')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <LogoTeko />
          </div>

          {/* Icônes nav + Info + Menu — droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {LIENS.map(({ chemin, Icone }) => {
              const actif = location.pathname === chemin
              return (
                <button key={chemin} onClick={() => aller(chemin)} style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  width: 44, height: 44,
                  background: 'none', borderWidth: 0,
                  color: actif ? 'var(--accent)' : 'var(--text-3)',
                  cursor: 'pointer',
                  transition: 'color var(--transition)',
                }}>
                  {actif && (
                    <span style={{
                      position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)',
                    }} />
                  )}
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <Icone size={20} strokeWidth={actif ? 2 : 1.5} />
                    {chemin === '/accueil' && nbPronosAttente > 0 && (
                      <span style={{
                        position: 'absolute', top: -2, right: -4,
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--danger)',
                        border: '1.5px solid var(--nav-bg)',
                      }} />
                    )}
                  </div>
                </button>
              )
            })}

            {/* Séparateur */}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />

            {/* Info */}
            <button onClick={() => onOpenOnboarding?.()} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36,
              background: 'none', borderWidth: 0,
              color: 'var(--text-3)', cursor: 'pointer',
              transition: 'color var(--transition)',
            }}>
              <Info size={18} strokeWidth={1.5} />
            </button>

            {/* Menu hamburger */}
            <button onClick={() => setOuvert(!ouvert)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36,
              background: 'none', borderWidth: 0,
              color: 'var(--text-3)', cursor: 'pointer',
              transition: 'color var(--transition)',
            }}>
              <Menu size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE — barre logo top ── */}
      <nav className="nav-mobile-logo" style={{
        ...navBase, top: 0, height: 52,
        background: 'var(--nav-bg)',
        borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--nav-border)',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 12px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div onClick={() => navigate('/accueil')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <LogoTeko />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => onOpenOnboarding?.()} style={{
            background: 'none', borderWidth: 0, color: 'var(--text-2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
          }}>
            <Info size={20} strokeWidth={1.5} />
          </button>
          <button onClick={() => setOuvert(!ouvert)} style={{
            background: 'none', borderWidth: 0, color: 'var(--text-2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
          }}>
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE — bottom nav — icônes seules ── */}
      <nav className="nav-mobile-bot" style={{
        ...navBase, bottom: 0, height: 60,
        background: 'var(--nav-bg)',
        borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--nav-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        alignItems: 'stretch',
      }}>
        {LIENS.map(({ chemin, Icone }) => {
          const actif = location.pathname === chemin
          return (
            <button key={chemin} onClick={() => aller(chemin)} style={{
              flex: 1, height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'none', borderWidth: 0,
              color: actif ? 'var(--accent)' : 'var(--text-3)',
              cursor: 'pointer',
              transition: 'color var(--transition)',
            }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                {/* Point actif au-dessus de l'icône */}
                {actif && (
                  <span style={{
                    position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 6px var(--accent)',
                  }} />
                )}
                <Icone size={24} strokeWidth={actif ? 2 : 1.5} />
                {/* Badge pronos en attente */}
                {chemin === '/accueil' && nbPronosAttente > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--danger)',
                    border: '1.5px solid var(--bg-0)',
                  }} />
                )}
              </div>
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default Navigation
