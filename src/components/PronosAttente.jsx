import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function PronosAttente({ userId, refreshKey }) {
  const [pronos, setPronos] = useState([])

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

  if (!pronos.length) return null

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: 10 }}>Tes pronos en attente</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {pronos.map((p, i) => {
          const m = p.matchs
          if (!m) return null
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12,
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {m.equipe_exterieur} @ {m.equipe_domicile}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                → {p.equipe_choisie}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PronosAttente