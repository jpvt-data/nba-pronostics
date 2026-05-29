import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'

const MEDAILLES = ['🥇', '🥈', '🥉']

function ClassementRapide({ userId }) {
  const [groupeActif, setGroupeActif] = useState(null)
  const [classement, setClassement]   = useState([])
  const [monRang, setMonRang]         = useState(null)
  const navigate                      = useNavigate()

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
        .select('points, user_id, profils(pseudo, avatar_url)')
        .eq('groupe_id', groupe.id).eq('actif', true)
        .order('points', { ascending: false })
      setClassement(data || [])
      setMonRang((data || []).findIndex(m => m.user_id === userId) + 1)
    }
    if (userId) init()
  }, [userId])

  if (!groupeActif || !classement.length) return null

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{groupeActif.nom}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {monRang > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tu es #{monRang}</span>
          )}
          <button
            onClick={() => navigate('/classement')}
            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', borderWidth: 0, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Détails →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {classement.slice(0, 5).map((membre, i) => {
          const estMoi = membre.user_id === userId
          return (
            <div
              key={membre.user_id}
              onClick={() => navigate(`/mes-pronos?user_id=${membre.user_id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: estMoi ? 'rgba(99,102,241,0.08)' : 'var(--bg-2)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: estMoi ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: i < 3 ? 16 : 13,
                fontFamily: 'var(--font-display)', fontWeight: 700,
                color: i < 3 ? 'var(--gold)' : 'var(--text-3)',
                minWidth: 24, textAlign: 'center',
              }}>
                {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
              </span>
              <Avatar url={membre.profils?.avatar_url} pseudo={membre.profils?.pseudo} taille={32} fontSize={11} />
              <span style={{
                flex: 1, fontSize: 14, fontWeight: estMoi ? 600 : 500,
                color: estMoi ? 'var(--text-1)' : 'var(--text-2)',
                minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {membre.profils?.pseudo}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>
                {membre.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ClassementRapide