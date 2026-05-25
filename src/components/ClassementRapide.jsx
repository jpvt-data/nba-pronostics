import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ClassementRapide({ userId }) {
  const [groupeActif, setGroupeActif] = useState(null)
  const [classement, setClassement] = useState([])
  const [monRang, setMonRang] = useState(null)

  useEffect(() => {
    const init = async () => {
      // Récupère le premier groupe actif de l'user
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom)')
        .eq('user_id', userId)
        .eq('actif', true)
        .limit(1)

      if (!membres?.length) return
      const groupe = membres[0].groupes
      setGroupeActif(groupe)

      // Classement du groupe
      const { data } = await supabase
        .from('membres_groupe')
        .select('points, user_id, profils(pseudo)')
        .eq('groupe_id', groupe.id)
        .eq('actif', true)
        .order('points', { ascending: false })

      setClassement(data || [])

      // Rang de l'user
      const rang = (data || []).findIndex(m => m.user_id === userId) + 1
      setMonRang(rang)
    }
    if (userId) init()
  }, [userId])

  if (!groupeActif || classement.length === 0) return null

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {groupeActif.nom}
        </h3>
        {monRang && (
          <span style={{ fontSize: 12, color: '#555' }}>Tu es #{monRang}</span>
        )}
      </div>

      {classement.slice(0, 5).map((membre, index) => {
        const estMoi = membre.user_id === userId
        return (
          <div key={membre.user_id} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 0.75rem',
            background: estMoi ? '#1a1a2e' : 'transparent',
            border: estMoi ? '1px solid #2a2a4e' : '1px solid transparent',
            borderRadius: 8, marginBottom: 4,
          }}>
            <span style={{ fontSize: 12, color: '#444', minWidth: 20 }}>#{index + 1}</span>
            <span style={{ flex: 1, fontSize: 13, color: estMoi ? '#fff' : '#aaa', fontWeight: estMoi ? 600 : 400 }}>
              {membre.profils?.pseudo}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: estMoi ? '#fff' : '#666' }}>
              {membre.points} pts
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default ClassementRapide