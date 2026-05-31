import { useEffect, useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { VERSION_COURANTE } from '../data/changelog'
import { useNoSpoil } from '../context/NoSpoilContext'
import { supabase } from '../lib/supabase'

const CLE_STORAGE = `popup_vu_${VERSION_COURANTE}`

function PopupChangelog({ forceOuvert = false, onFermer }) {
  const [visible, setVisible]     = useState(false)
  const [message, setMessage]     = useState(null)
  const [pseudo, setPseudo]       = useState(null)
  const { noSpoil, toggleNoSpoil } = useNoSpoil()

  useEffect(() => {
    if (forceOuvert) { setVisible(true); return }
    localStorage.removeItem(CLE_STORAGE)
    setVisible(true)
  }, [forceOuvert])

  useEffect(() => {
    if (!visible) return
    const chargerMessage = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer le pseudo
      const { data: profil } = await supabase
        .from('profils').select('pseudo').eq('id', user.id).single()
      setPseudo(profil?.pseudo || null)

      const { count } = await supabase
        .from('pronos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('resultat', 'en_attente')
      if (count > 0) {
        setMessage(`⏳ ${count} prono${count > 1 ? 's' : ''} en attente de résultat`)
      } else {
        setMessage('🏀 Bon retour ! Prêt à pronostiquer ?')
      }
    }
    chargerMessage()
  }, [visible])

  const fermer = () => {
    localStorage.setItem(CLE_STORAGE, '1')
    setVisible(false)
    onFermer?.()
  }

  if (!visible) return null

  return (
    <>
      <div onClick={fermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} />

      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(420px, 92vw)',
        background: '#12121c',
        borderWidth: 1, borderStyle: 'solid', borderColor: '#2a2a3e',
        borderRadius: 14,
        zIndex: 301,
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#1e1e2e',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '0.06em',
              background: 'linear-gradient(90deg, var(--accent), var(--orange))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              SWISH LEAGUE
            </span>
            <button onClick={fermer} style={{ background: 'none', borderWidth: 0, color: '#4a4a6a', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Welcome back */}
          {pseudo && (
            <p style={{
              margin: '6px 0 0', fontSize: 12,
              color: 'var(--text-3)', lineHeight: 1.4,
            }}>
              👋 Content de te revoir,{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{pseudo}</span> !
            </p>
          )}
        </div>

        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Encart No Spoil */}
          <div style={{
            padding: '12px 14px',
            background: noSpoil ? 'rgba(99,102,241,0.1)' : 'var(--bg-2)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: noSpoil ? 'rgba(99,102,241,0.4)' : '#1e1e2e',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f0', marginBottom: 2 }}>Mode No Spoil</div>
              <div style={{ fontSize: 11, color: '#9090b0', lineHeight: 1.4 }}>
                Masque les scores des matchs terminés.
              </div>
            </div>
            <button onClick={toggleNoSpoil} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: noSpoil ? '#6366f1' : 'transparent',
              borderWidth: 1, borderStyle: 'solid', borderColor: noSpoil ? '#6366f1' : '#2a2a3e',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: noSpoil ? '#fff' : '#9090b0',
            }}>
              {noSpoil ? <Eye size={13} /> : <EyeOff size={13} />}
              {noSpoil ? 'Actif' : 'Inactif'}
            </button>
          </div>

          {/* Message contextuel */}
          {message && (
            <div style={{
              padding: '11px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderWidth: 1, borderStyle: 'solid', borderColor: '#1e1e2e',
              borderRadius: 10,
              fontSize: 13, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.4,
            }}>
              {message}
            </div>
          )}

          {/* CTA */}
          <button onClick={fermer} style={{
            width: '100%', padding: '10px',
            background: 'linear-gradient(90deg, var(--accent), var(--orange))',
            borderWidth: 0, borderRadius: 8,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.04em', marginTop: 2,
          }}>
            C'est parti
          </button>

        </div>
      </div>
    </>
  )
}

export default PopupChangelog