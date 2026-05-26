import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Home, Trophy, BarChart2, Menu, X, Users, LogOut, Calendar, Sparkles, EyeOff } from 'lucide-react'
import PopupChangelog from './PopupChangelog'
import { useNoSpoil } from '../context/NoSpoilContext'

const LIENS = [
  { chemin: '/accueil',    label: 'Board',     Icone: Home },
  { chemin: '/classement', label: 'Classement', Icone: Trophy },
  { chemin: '/mes-pronos', label: 'Mes stats',  Icone: BarChart2 },
]

/* ── styles partagés ── */
const navBase = {
  position: 'fixed',
  left: 0, right: 0,
  background: 'var(--bg-0)',
  zIndex: 100,
}

function Navigation() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [ouvert, setOuvert] = useState(false)
  const [changelogOuvert, setChangelogOuvert] = useState(false)
  const { noSpoil, toggleNoSpoil } = useNoSpoil()

  const deconnecter = async () => { await supabase.auth.signOut(); setOuvert(false) }
  const aller = (chemin) => { navigate(chemin); setOuvert(false) }

  return (
    <>
      {/* ── Overlay hamburger ── */}
      {ouvert && (
        <div
          onClick={() => setOuvert(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150 }}
        />
      )}

      {/* ── Panneau hamburger ── */}
      <div style={{
        position: 'fixed', top: 0, height: '100%', width: 260,
        right: ouvert ? 0 : '-300px',
        background: 'var(--bg-1)',
        borderLeft: `1px solid var(--border)`,
        zIndex: 200,
        transition: 'right 0.25s ease',
        padding: '1.25rem 1rem',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</span>
          <button
            onClick={() => setOuvert(false)}
            style={{ background: 'none', borderWidth: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => aller('/groupes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', borderWidth: 0, color: 'var(--text-2)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem',
            paddingLeft: '0.5rem', paddingRight: '0.5rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Users size={18} strokeWidth={1.5} /> Groupes
        </button>

        <button
          onClick={() => aller('/calendrier')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', borderWidth: 0, color: 'var(--text-2)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem',
            paddingLeft: '0.5rem', paddingRight: '0.5rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Calendar size={18} strokeWidth={1.5} /> Calendrier
        </button>

        <button
          onClick={toggleNoSpoil}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: noSpoil ? 'rgba(99,102,241,0.1)' : 'none',
            borderWidth: noSpoil ? 1 : 0, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.3)',
            color: noSpoil ? 'var(--accent)' : 'var(--text-2)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem',
            paddingLeft: '0.5rem', paddingRight: '0.5rem',
            borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'left',
          }}
        >
          <EyeOff size={18} strokeWidth={1.5} />
          {noSpoil ? 'No Spoil — actif' : 'No Spoil'}
        </button>

        <button
          onClick={() => { setChangelogOuvert(true); setOuvert(false) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', borderWidth: 0, color: 'var(--text-2)',
            fontSize: 14, cursor: 'pointer',
            paddingTop: '0.75rem', paddingBottom: '0.75rem',
            paddingLeft: '0.5rem', paddingRight: '0.5rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Sparkles size={18} strokeWidth={1.5} /> Quoi de neuf ?
        </button>

        <div style={{ marginTop: 'auto', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', paddingTop: '1rem' }}>
          <button
            onClick={deconnecter}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', borderWidth: 0, color: 'var(--text-3)',
              fontSize: 14, cursor: 'pointer',
              paddingTop: '0.75rem', paddingBottom: '0.75rem',
              paddingLeft: '0.5rem', paddingRight: '0.5rem',
            }}
          >
            <LogOut size={18} strokeWidth={1.5} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ── DESKTOP — barre top complète ── */}
      <nav
        className="nav-desktop-full"
        style={{
          ...navBase,
          top: 0,
          height: 52,
          borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        <span
          onClick={() => navigate('/accueil')}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '0.08em', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          NBA PRONOS
        </span>

        <div style={{ display: 'flex', gap: 4 }}>
          {LIENS.map(({ chemin, label, Icone }) => {
            const actif = location.pathname === chemin
            return (
              <button
                key={chemin}
                onClick={() => aller(chemin)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', borderWidth: 0,
                  color: actif ? 'var(--text-1)' : 'var(--text-3)',
                  fontWeight: actif ? 600 : 400,
                  fontSize: 13, cursor: 'pointer',
                  paddingTop: 5, paddingBottom: 5,
                  paddingLeft: 12, paddingRight: 12,
                  borderRadius: 'var(--radius-sm)',
                  /* indicateur actif : underline bas uniquement */
                  boxShadow: actif ? 'inset 0 -2px 0 var(--accent)' : 'none',
                }}
              >
                <Icone size={15} strokeWidth={actif ? 2 : 1.5} />
                {label}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setOuvert(!ouvert)}
          style={{
            background: 'none',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
            color: 'var(--text-3)',
            paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Menu size={16} strokeWidth={1.5} />
        </button>
      </nav>

      {/* ── MOBILE — barre logo top (fine, 40px) ── */}
      <nav
        className="nav-mobile-logo"
        style={{
          ...navBase,
          top: 0,
          height: 40,
          borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <span
          onClick={() => navigate('/accueil')}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          NBA PRONOS
        </span>
        <button
          onClick={() => setOuvert(!ouvert)}
          style={{
            background: 'none', borderWidth: 0,
            color: 'var(--text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: 4,
          }}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
      </nav>

      {/* ── MOBILE — bottom nav ── */}
      <nav
        className="nav-mobile-bot"
        style={{
          ...navBase,
          bottom: 0,
          height: 60,
          borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)',
          alignItems: 'stretch',
        }}
      >
        {LIENS.map(({ chemin, label, Icone }) => {
          const actif = location.pathname === chemin
          return (
            <button
              key={chemin}
              onClick={() => aller(chemin)}
              style={{
                flex: 1, height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', borderWidth: 0,
                color: actif ? 'var(--text-1)' : 'var(--text-3)',
                fontSize: 10, fontWeight: 500, cursor: 'pointer',
                /* indicateur actif : ligne en haut */
                boxShadow: actif ? 'inset 0 2px 0 var(--accent)' : 'none',
              }}
            >
              <Icone size={22} strokeWidth={actif ? 2 : 1.5} />
              {label}
            </button>
          )
        })}
      </nav>
      {changelogOuvert && (
        <PopupChangelog forceOuvert onFermer={() => setChangelogOuvert(false)} />
      )}
    </>
  )
}

export default Navigation