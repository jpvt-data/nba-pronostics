import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ClassementRapide({ userId }) {
  const [groupeActif, setGroupeActif] = useState(null)
  const [classement, setClassement]   = useState([])
  const [monRang, setMonRang]         = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom)')
        .eq('user_id', userId).eq('actif', true).limit(1)
      if (!membres?.length) return
      const groupe = membres[0].groupes
      setGroupeActif(groupe)
      const { data } = await supabase
        .from('membres_groupe')
        .select('points, user_id, profils(pseudo)')
        .eq('groupe_id', groupe.id).eq('actif', true)
        .order('points', { ascending: false })
      setClassement(data || [])
      setMonRang((data || []).findIndex(m => m.user_id === userId) + 1)
    }
    if (userId) init()
  }, [userId])

  if (!groupeActif || !classement.length) return null

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3>{groupeActif.nom}</h3>
        {monRang > 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tu es #{monRang}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {classement.slice(0, 5).map((membre, i) => {
          const estMoi = membre.user_id === userId
          return (
            <div key={membre.user_id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12,
              background: estMoi ? 'var(--accent-dim)' : 'transparent',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: estMoi ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: estMoi ? 'var(--accent)' : 'var(--text-3)', minWidth: 22 }}>
                #{i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: estMoi ? 'var(--text-1)' : 'var(--text-2)', fontWeight: estMoi ? 600 : 400 }}>
                {membre.profils?.pseudo}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: estMoi ? 'var(--accent)' : 'var(--text-2)' }}>
                {membre.points}<span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ClassementRapide