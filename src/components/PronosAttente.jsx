import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function PronosAttente({ matchs, userId }) {
  const [pronosAttente, setPronosAttente] = useState([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur, statut)')
        .eq('user_id', userId)
        .eq('resultat', 'en_attente')
        .order('cree_le', { ascending: true })

      setPronosAttente(data || [])
    }
    if (userId) init()
  }, [userId])

  if (pronosAttente.length === 0) return null

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Tes pronos en attente
      </h3>

      {pronosAttente.map((prono, index) => {
        const match = prono.matchs
        if (!match) return null

        return (
          <div key={index} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.6rem 0.75rem',
            border: '1px solid #1f1f1f',
            borderRadius: 8, marginBottom: 4,
          }}>
            <span style={{ fontSize: 13, color: '#aaa' }}>
              {match.equipe_exterieur} @ {match.equipe_domicile}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              → {prono.equipe_choisie}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default PronosAttente