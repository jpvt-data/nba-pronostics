import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

function Inscription() {
  const [pseudo, setPseudo]  = useState('')
  const [email, setEmail]    = useState('')
  const [mdp, setMdp]        = useState('')
  const [erreur, setErreur]  = useState(null)
  const [charg, setCharg]    = useState(false)
  const navigate             = useNavigate()

  const gererInscription = async () => {
    setCharg(true); setErreur(null)
    const { data, error } = await supabase.auth.signUp({ email, password: mdp })
    if (error) { setErreur(error.message); setCharg(false); return }
    const { error: errProfil } = await supabase.from('profils').insert({ id: data.user.id, pseudo })
    if (errProfil) { setErreur('Ce pseudo est déjà pris'); setCharg(false); return }
    localStorage.setItem('skip_popup', '1')
    navigate('/accueil')
    setCharg(false)
  }

  const CHAMPS = [
    { label: 'Pseudo',       type: 'text',     val: pseudo, set: setPseudo, ph: 'MonPseudo' },
    { label: 'Email',        type: 'email',    val: email,  set: setEmail,  ph: 'ton@email.com' },
    { label: 'Mot de passe', type: 'password', val: mdp,    set: setMdp,    ph: '••••••••', min: 6 },
  ]

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'var(--bg-0)',
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg-1)',
        borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)',
        padding: '36px 24px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>

        {/* Logo Teko — identique navbar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
            fontSize: 52, color: 'var(--text-1)',
            letterSpacing: '-0.01em', lineHeight: 1,
            fontStyle: 'italic', transform: 'translateY(3px)', display: 'inline-block',
          }}>SWISH</span>
          <span style={{
            fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
            fontSize: 52, color: 'var(--accent)',
            letterSpacing: '-0.01em', lineHeight: 1,
            fontStyle: 'italic', transform: 'translateY(3px)', display: 'inline-block',
          }}>LEAGUE</span>
        </div>
        <p style={{
          fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          margin: '0 0 28px', textAlign: 'center',
        }}>
          Vis la saison NBA autrement.
        </p>

        <div style={{ width: '100%', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', marginBottom: 24 }} />

        {/* Champs */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CHAMPS.map(({ label, type, val, set, ph, min }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
              <input
                type={type} value={val}
                onChange={e => set(e.target.value)}
                placeholder={ph} minLength={min}
                onKeyDown={e => e.key === 'Enter' && gererInscription()}
                style={{
                  background: 'var(--bg-0)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-1)',
                  fontSize: 14, padding: '10px 12px', outline: 'none',
                  width: '100%', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          {erreur && (
            <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-dim)', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              {erreur}
            </div>
          )}

          <button onClick={gererInscription} disabled={charg} style={{
            width: '100%', padding: '12px', marginTop: 4,
            background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.06em', opacity: charg ? 0.6 : 1,
          }}>
            {charg ? 'Inscription…' : "S'INSCRIRE"}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
            Déjà un compte ?{' '}
            <Link to="/connexion" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Se connecter
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Inscription