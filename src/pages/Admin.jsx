import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Trash2 } from 'lucide-react'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'

function Admin() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== ADMIN_ID) { navigate('/accueil'); return }
    const { data } = await supabase
      .from('messages')
      .select('id, contenu, cree_le, user_id, groupe_id, profils(pseudo), groupes(nom)')
      .order('cree_le', { ascending: false })
      .limit(100)
    setMessages(data || [])
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  const supprimer = async (id) => {
    await supabase.from('messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const formaterDate = (str) => {
    const d = new Date(str + 'Z')
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--danger)' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>ADMIN</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--danger)', letterSpacing: '0.02em', lineHeight: 1 }}>🛡️</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Modération · Messages</p>
        </div>

        <div style={{ background: 'var(--bg-1)', padding: '16px 16px 24px', borderLeft: '3px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>TOUS LES</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--danger)', letterSpacing: '0.02em' }}>MESSAGES</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>({messages.length})</span>
          </div>

          {chargement && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement…</p>}
          {!chargement && messages.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Aucun message.</p>}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px',
                borderBottom: '1px solid var(--border)',
                borderLeft: '3px solid var(--border-2)',
                marginLeft: -16,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {msg.groupes?.nom || '—'}
                  </span>
                  <div style={{ marginTop: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>
                      {msg.profils?.pseudo || '—'}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{msg.contenu}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, display: 'block' }}>
                    {formaterDate(msg.cree_le)}
                  </span>
                </div>
                <button
                  onClick={() => supprimer(msg.id)}
                  style={{ background: 'none', borderWidth: 0, color: 'var(--danger)', cursor: 'pointer', padding: 4, flexShrink: 0, opacity: 0.5, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  )
}

export default Admin