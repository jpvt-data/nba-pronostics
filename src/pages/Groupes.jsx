import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import CreerGroupe from '../components/CreerGroupe'
import RejoindreGroupe from '../components/RejoindreGroupe'

function Groupes() {
  const [groupes, setGroupes]   = useState([])
  const [charg, setCharg]       = useState(true)
  const [vue, setVue]           = useState(null) // 'creer' | 'rejoindre' | null
  const [userId, setUserId]     = useState(null)

  const chargerGroupes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user.id)
    const { data } = await supabase
      .from('membres_groupe')
      .select('id, groupe_id, points, actif, groupes(id, nom, code_invitation, admin_id)')
      .eq('user_id', user.id).eq('actif', true)
    setGroupes(data || [])
    setCharg(false)
  }

  const quitterGroupe = async (membreId) => {
    await supabase.from('membres_groupe').update({ actif: false }).eq('id', membreId)
    chargerGroupes()
  }

  useEffect(() => { chargerGroupes() }, [])

  const toggleVue = (v) => setVue(vue === v ? null : v)

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, padding: '20px 16px' }}>
        <h2 style={{ marginBottom: 20 }}>Mes groupes</h2>

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}

        {/* Liste des groupes */}
        {!charg && groupes.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '2rem 1rem',
            background: 'var(--bg-1)',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-3)', fontSize: 14, marginBottom: 20,
          }}>
            Tu n'es dans aucun groupe.<br />
            <span style={{ fontSize: 13 }}>Crée-en un ou rejoins celui d'un pote.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {groupes.map(m => {
            const estAdmin = m.groupes.admin_id === userId
            return (
              <div key={m.groupe_id} style={{
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>
                      {m.groupes.nom}
                      {estAdmin && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, marginLeft: 8,
                          background: 'var(--accent-dim)', color: 'var(--accent)',
                          borderRadius: 4, padding: '2px 6px',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)',
                        }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Code : <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: 13, color: 'var(--accent)', letterSpacing: '0.06em',
                      }}>{m.groupes.code_invitation}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-1)' }}>
                      {m.points}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</div>
                  </div>
                </div>

                <button
                  onClick={() => quitterGroupe(m.id)}
                  style={{
                    fontSize: 12, color: 'var(--text-3)',
                    background: 'none',
                    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10,
                    cursor: 'pointer',
                  }}
                >
                  Quitter
                </button>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => toggleVue('creer')}
            style={{
              flex: 1, padding: '10px',
              background: vue === 'creer' ? 'var(--accent-dim)' : 'transparent',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: vue === 'creer' ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: vue === 'creer' ? 'var(--accent)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            + Créer un groupe
          </button>
          <button
            onClick={() => toggleVue('rejoindre')}
            style={{
              flex: 1, padding: '10px',
              background: vue === 'rejoindre' ? 'var(--accent-dim)' : 'transparent',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: vue === 'rejoindre' ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: vue === 'rejoindre' ? 'var(--accent)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Rejoindre
          </button>
        </div>

        {vue === 'creer'      && <CreerGroupe    onSuccess={() => { setVue(null); chargerGroupes() }} />}
        {vue === 'rejoindre'  && <RejoindreGroupe onSuccess={() => { setVue(null); chargerGroupes() }} />}

      </main>
    </>
  )
}

export default Groupes