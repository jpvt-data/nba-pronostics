import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function RunsPotes({ userId }) {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    const init = async () => {
      // Récupère les groupes de l'user
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id')
        .eq('user_id', userId)
        .eq('actif', true)

      if (!membres?.length) return
      const groupeIds = membres.map(m => m.groupe_id)

      // Récupère tous les membres de ces groupes (sauf l'user)
      const { data: potes } = await supabase
        .from('membres_groupe')
        .select('user_id, profils(pseudo)')
        .in('groupe_id', groupeIds)
        .eq('actif', true)
        .neq('user_id', userId)

      if (!potes?.length) return

      // Pour chaque pote, récupère ses derniers pronos terminés
      const runsDetectes = []

      for (const pote of potes) {
        const { data: derniersPronos } = await supabase
          .from('pronos')
          .select('resultat')
          .eq('user_id', pote.user_id)
          .in('resultat', ['correct', 'incorrect'])
          .order('cree_le', { ascending: false })
          .limit(5)

        if (!derniersPronos?.length) continue

        // Calcule le run actuel (série consécutive)
        const premierResultat = derniersPronos[0].resultat
        let compteur = 0
        for (const prono of derniersPronos) {
          if (prono.resultat === premierResultat) compteur++
          else break
        }

        // N'affiche que les runs >= 3
        if (compteur >= 3) {
          runsDetectes.push({
            pseudo: pote.profils?.pseudo,
            type: premierResultat,
            compteur,
          })
        }
      }

      setRuns(runsDetectes)
    }
    if (userId) init()
  }, [userId])

  if (runs.length === 0) return null

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Dans le groupe
      </h3>

      {runs.map((run, index) => (
        <div key={index} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.6rem 0.75rem',
          background: run.type === 'correct' ? '#1a3a1a' : '#3a1a1a',
          border: `1px solid ${run.type === 'correct' ? '#2d5a2d' : '#5a2d2d'}`,
          borderRadius: 8, marginBottom: 4,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {run.pseudo}
          </span>
          <span style={{ fontSize: 13, color: run.type === 'correct' ? '#4CAF50' : '#f44336' }}>
            {run.type === 'correct'
              ? `🔥 ${run.compteur} corrects de suite`
              : `❄️ ${run.compteur} ratés de suite`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default RunsPotes