import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { LabelSection } from '../components/UI'
import { Trash2 } from 'lucide-react'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'

function Admin() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [userId, setUserId] = useState(null)

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== ADMIN_ID) { navigate('/accueil'); return }
    setUserId(user.id)

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
      <main style={{ flex: 1, padding: '20px 16px' }}>
        <div style={{
          padding: '20px 16px',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Modération</p>
          <h2 style={{ margin: '4px 0 0' }}>Admin 🛡️</h2>
        </div>

        <div style={{ marginTop: 16 }}>
          <LabelSection>Tous les messages ({messages.length})</LabelSection>

          {chargement && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 12 }}>Chargement…</p>}

          {!chargement && messages.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 12 }}>Aucun message.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px',
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Ligue */}
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {msg.groupes?.nom || '—'}
                  </span>
                  {/* Pseudo + contenu */}
                  <div style={{ marginTop: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>
                      {msg.profils?.pseudo || '—'}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {msg.contenu}
                    </span>
                  </div>
                  {/* Date */}
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, display: 'block' }}>
                    {formaterDate(msg.cree_le)}
                  </span>
                </div>
                {/* Bouton supprimer */}
                <button
                  onClick={() => supprimer(msg.id)}
                  style={{
                    background: 'none', borderWidth: 0,
                    color: 'var(--danger)', cursor: 'pointer',
                    padding: 4, flexShrink: 0,
                    opacity: 0.6, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
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