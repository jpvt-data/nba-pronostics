import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { VERSION_COURANTE } from '../data/changelog'

const CLE_STORAGE = `popup_vu_${VERSION_COURANTE}`

function PopupChangelog({ forceOuvert = false, onFermer }) {
  const [visible, setVisible] = useState(false)
  const [pseudo, setPseudo]   = useState(null)
  const [connecte, setConnecte] = useState(false)
  const [phase, setPhase]     = useState(0) // 0=logo, 1=mot1, 2=mot2, 3=mot3, 4=complet
  const navigate              = useNavigate()

  useEffect(() => {
    if (forceOuvert) { setVisible(true); return }
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

  // Animation séquentielle : logo → mot 1 → mot 2 → mot 3 → complet
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
    localStorage.setItem(CLE_STORAGE, '1')
    setVisible(false)
    onFermer?.()
  }

  if (!visible) return null

  const MOTS = ['Pronostique.', 'Clashe.', 'Règne.']
  const COULEURS = ['var(--text-1)', 'var(--accent)', 'var(--orange)']

  return (
    <>
      <div onClick={fermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300 }} />

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
        gap: 0,
      }}>

        {/* Accroche top */}
        <p style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          marginBottom: 28, textAlign: 'center',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.4s',
        }}>
          L'app de pronos NBA entre potes
        </p>

        {/* Logo texte */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 0,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s, transform 0.4s',
          marginBottom: 20,
        }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 42, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>SWISH</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 42, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>LEAGUE</span>
        </div>

        {/* Tagline animée mot par mot */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 36, minHeight: 24 }}>
          {MOTS.map((mot, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              color: COULEURS[i],
              letterSpacing: '0.04em',
              opacity: phase >= i + 2 ? 1 : 0,
              transform: phase >= i + 2 ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.35s, transform 0.35s',
            }}>{mot}</span>
          ))}
        </div>

        {/* Séparateur */}
        <div style={{ width: '100%', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', marginBottom: 24 }} />

        {/* Message utilisateur */}
        <div style={{
          width: '100%', marginBottom: 20, textAlign: 'center',
          opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.4s 0.1s',
        }}>
          {connecte && pseudo ? (
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              Content de te revoir,{' '}
              <span style={{ fontFamily: 'var(--font-title)', fontSize: 18, color: 'var(--text-1)', fontWeight: 600 }}>{pseudo}</span>
              {' '}👋
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
              Rejoins tes potes et pronostique chaque match NBA.
            </p>
          )}
        </div>

        {/* CTA */}
        <div style={{
          width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
          opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.4s 0.2s',
        }}>
          {connecte ? (
            <button onClick={fermer} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(90deg, var(--accent), var(--orange))',
              borderWidth: 0, borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.06em',
            }}>
              C'EST PARTI 🏀
            </button>
          ) : (
            <>
              <button onClick={() => { fermer(); navigate('/connexion') }} style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(90deg, var(--accent), var(--orange))',
                borderWidth: 0, borderRadius: 'var(--radius-sm)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                letterSpacing: '0.06em',
              }}>
                SE CONNECTER
              </button>
              <button onClick={() => { fermer(); navigate('/inscription') }} style={{
                width: '100%', padding: '11px',
                background: 'transparent',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Créer un compte
              </button>
            </>
          )}
        </div>

      </div>
    </>
  )
}

export default PopupChangelog