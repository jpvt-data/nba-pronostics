import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function ResetPassword() {
  const [mdp, setMdp]         = useState('')
  const [mdp2, setMdp2]       = useState('')
  const [erreur, setErreur]   = useState(null)
  const [charg, setCharg]     = useState(false)
  const [succes, setSucces]   = useState(false)
  const navigate               = useNavigate()

  const valider = async () => {
    setErreur(null)
    if (mdp.length < 6) { setErreur('6 caractères minimum'); return }
    if (mdp !== mdp2) { setErreur('Les mots de passe ne correspondent pas'); return }

    setCharg(true)
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setCharg(false)

    if (error) { setErreur('Lien expiré ou invalide — refais une demande'); return }
    setSucces(true)
    setTimeout(() => navigate('/accueil'), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', padding: 24,
    }}>
      <div style={{
        width: 'min(400px, 92vw)',
        background: 'var(--bg-1)',
        borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)',
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-title)', fontSize: 28, color: 'var(--text-1)',
          margin: 0, textAlign: 'center', fontStyle: 'italic',
        }}>
          NOUVEAU MOT DE PASSE
        </h1>

        {succes ? (
          <div style={{ fontSize: 14, color: 'var(--success)', background: 'var(--success-dim)', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(34,197,94,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
            Mot de passe mis à jour. Redirection…
          </div>
        ) : (
          <>
            {[
              { label: 'Nouveau mot de passe', val: mdp, set: setMdp },
              { label: 'Confirmer',            val: mdp2, set: setMdp2 },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                <input
                  type="password" value={val}
                  onChange={e => set(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && valider()}
                  style={{
                    background: 'var(--bg-0)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-1)',
                    fontSize: 14, padding: '10px 12px', outline: 'none',
                    width: '100%', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {erreur && (
              <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-dim)', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                {erreur}
              </div>
            )}

            <button onClick={valider} disabled={charg} style={{
              width: '100%', padding: '12px',
              background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.06em', opacity: charg ? 0.6 : 1,
            }}>
              {charg ? 'Mise à jour…' : 'VALIDER'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
