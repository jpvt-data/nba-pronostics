import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { VERSION_COURANTE } from '../data/changelog'

const CLE_STORAGE = `popup_vu_${VERSION_COURANTE}`

function PopupChangelog({ forceOuvert = false, onFermer }) {
  const [visible, setVisible]   = useState(false)
  const [pseudo, setPseudo]     = useState(null)
  const [connecte, setConnecte] = useState(false)
  const [phase, setPhase]       = useState(0)
  const [email, setEmail]       = useState('')
  const [mdp, setMdp]           = useState('')
  const [erreur, setErreur]     = useState(null)
  const [charg, setCharg]       = useState(false)
  const navigate                = useNavigate()

  useEffect(() => {
    setVisible(true)
  }, [forceOuvert])

  useEffect(() => {
    if (!visible) return
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setConnecte(true)
        const { data: profil } = await supabase
          .from('profils').select('pseudo').eq('id', user.id).single()
        setPseudo(profil?.pseudo || null)
      }
    }
    charger()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 1900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [visible])

  const fermer = () => {
    setVisible(false)
    onFermer?.()
    if (connecte) navigate('/accueil')
  }

  const seConnecter = async () => {
    setCharg(true); setErreur(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: mdp })
    if (error) { setErreur('Email ou mot de passe incorrect'); setCharg(false); return }
    localStorage.setItem('skip_popup', '1')
    setVisible(false)
    navigate('/accueil')
    setCharg(false)
  }

  if (!visible) return null

  const MOTS = ['Pronostique.', 'Clashe.', 'Règne.']
  const COULEURS = ['var(--text-1)', 'var(--accent)', 'var(--orange)']

  return (
    <>
      {/* Conditionnel : */}
      <div
        onClick={connecte ? fermer : undefined}
        style={{ position: 'fixed', inset: 0, background: connecte ? 'rgba(0,0,0,0.85)' : 'var(--bg-0)', zIndex: 300 }}
      />

      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(400px, 92vw)',
        background: 'var(--bg-1)',
        borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)',
        zIndex: 301,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '36px 24px 28px',
      }}>

        {/* Accroche */}
        <p style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          marginBottom: 20, textAlign: 'center',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.4s',
        }}>
          L'app de pronos NBA entre potes
        </p>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 0,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s, transform 0.4s',
          marginBottom: 16,
        }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 42, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>SWISH</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 42, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>LEAGUE</span>
        </div>

        {/* Tagline */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28, minHeight: 20 }}>
          {MOTS.map((mot, i) => (
            <span key={i} style={{
              fontSize: 12, fontWeight: 600, color: COULEURS[i], letterSpacing: '0.04em',
              opacity: phase >= i + 2 ? 1 : 0,
              transform: phase >= i + 2 ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.35s, transform 0.35s',
            }}>{mot}</span>
          ))}
        </div>

        {/* Séparateur */}
        <div style={{ width: '100%', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', marginBottom: 24 }} />

        {/* Connecté */}
        {connecte && (
          <div style={{
            width: '100%', display: 'flex', flexDirection: 'column', gap: 16,
            opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.4s 0.1s',
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
              Content de te revoir,{' '}
              <span style={{ fontFamily: 'var(--font-title)', fontSize: 18, color: 'var(--text-1)', fontWeight: 600 }}>{pseudo}</span>
              {' '}👋
            </p>
            <button onClick={fermer} style={{
              width: '100%', padding: '12px',
              background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
            }}>
              C'EST PARTI 🏀
            </button>
          </div>
        )}

        {/* Non connecté — formulaire */}
        {!connecte && (
          <div style={{
            width: '100%', display: 'flex', flexDirection: 'column', gap: 12,
            opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.4s 0.1s',
          }}>
            {[
              { label: 'Email',        type: 'email',    val: email, set: setEmail, ph: 'ton@email.com' },
              { label: 'Mot de passe', type: 'password', val: mdp,   set: setMdp,   ph: '••••••••' },
            ].map(({ label, type, val, set, ph }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                <input
                  type={type} value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={ph}
                  onKeyDown={e => e.key === 'Enter' && seConnecter()}
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

            <button onClick={seConnecter} disabled={charg} style={{
              width: '100%', padding: '12px', marginTop: 4,
              background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.06em', opacity: charg ? 0.6 : 1,
            }}>
              {charg ? 'Connexion…' : 'SE CONNECTER'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
              Pas encore de compte ?{' '}
              <Link to="/inscription" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                Créer un compte
              </Link>
            </p>
          </div>
        )}

      </div>
    </>
  )
}

export default PopupChangelog