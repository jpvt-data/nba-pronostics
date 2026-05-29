import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LabelSection, Bloc } from '../components/UI'

function RunsPotes({ userId }) {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    const init = async () => {
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id')
        .eq('user_id', userId).eq('actif', true)
      if (!membres?.length) return

      const groupeIds = membres.map(m => m.groupe_id)
      const { data: potes } = await supabase
        .from('membres_groupe')
        .select('user_id, profils(pseudo)')
        .in('groupe_id', groupeIds).eq('actif', true).neq('user_id', userId)
      if (!potes?.length) return

      const runsDetectes = []
      for (const pote of potes) {
        const { data: derniers } = await supabase
          .from('pronos')
          .select('resultat')
          .eq('user_id', pote.user_id)
          .in('resultat', ['correct', 'incorrect'])
          .order('cree_le', { ascending: false })
          .limit(5)
        if (!derniers?.length) continue
        const premier = derniers[0].resultat
        let count = 0
        for (const p of derniers) {
          if (p.resultat === premier) count++
          else break
        }
        if (count >= 3) runsDetectes.push({ pseudo: pote.profils?.pseudo, type: premier, count })
      }
      setRuns(runsDetectes)
    }
    if (userId) init()
  }, [userId])

  // Masqué si aucun run détecté
  if (!runs.length) return null

  return (
    <Bloc>
      <LabelSection>Runs des potes</LabelSection>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {runs.map((run, i) => {
          const feu = run.type === 'correct'
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px',
              background: feu ? 'var(--success-dim)' : 'var(--danger-dim)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: feu ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{run.pseudo}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: feu ? 'var(--success)' : 'var(--danger)' }}>
                {feu ? `🔥 ${run.count} corrects` : `❄️ ${run.count} ratés`}
              </span>
            </div>
          )
        })}
      </div>
    </Bloc>
  )
}

export default RunsPotes
