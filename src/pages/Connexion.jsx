import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import swishLogo from '../assets/swish_league_logo.png'

function Connexion() {
  const [email, setEmail]      = useState('')
  const [motDePasse, setMdp]   = useState('')
  const [erreur, setErreur]    = useState(null)
  const [charg, setCharg]      = useState(false)
  const navigate = useNavigate()

  const gererConnexion = async (e) => {
    e.preventDefault()
    setCharg(true); setErreur(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    if (error) setErreur('Email ou mot de passe incorrect')
    else navigate('/accueil')
    setCharg(false)
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'var(--bg-0)',
      backgroundImage: 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, transparent 50%)',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.12)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <img src={swishLogo} alt="Swish League" style={{ height: 72, width: 'auto' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '0.08em', color: '#fff' }}>
            SWISH LEAGUE
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Content de te revoir 👋</p>
        </div>

        {/* Champs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Email',        type: 'email',    val: email,      set: setEmail, ph: 'ton@email.com' },
            { label: 'Mot de passe', type: 'password', val: motDePasse, set: setMdp,   ph: '••••••••' },
          ].map(({ label, type, val, set, ph }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} required
                style={{ background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-1)', fontSize: 14, padding: '10px 12px', outline: 'none', width: '100%', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>

        {erreur && (
          <div style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
            {erreur}
          </div>
        )}

        <button onClick={gererConnexion} disabled={charg}
          style={{ background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px', cursor: 'pointer', width: '100%', fontFamily: 'var(--font-body)', opacity: charg ? 0.6 : 1 }}>
          {charg ? 'Connexion…' : 'Se connecter'}
        </button>

        <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}

export default Connexion
