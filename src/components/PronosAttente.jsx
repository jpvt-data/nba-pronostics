import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function PronosAttente({ userId, refreshKey }) {
  const [pronos, setPronos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur)')
        .eq('user_id', userId).eq('resultat', 'en_attente')
        .order('cree_le', { ascending: true })
      setPronos(data || [])
    }
    if (userId) init()
  }, [userId, refreshKey])

  if (!pronos.length) return (
    <p style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
      Aucun prono en attente.
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {pronos.map((p, i) => {
        const m = p.matchs
        if (!m) return null
        return (
          <div
            key={i}
            onClick={() => navigate(`/match/${m.espn_id}`)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(99,102,241,0.06)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
              {m.equipe_exterieur} @ {m.equipe_domicile}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--accent)',
              fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
              background: 'rgba(99,102,241,0.12)',
              borderRadius: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2,
            }}>
              → {p.equipe_choisie}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default PronosAttente
