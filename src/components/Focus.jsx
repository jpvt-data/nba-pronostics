import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bloc, LabelSection } from '../components/UI'

// Priorité des messages : matchs urgents > streak > win rate > position
async function genererMessages(userId) {
  const messages = []

  // 1. Streak — derniers pronos résolus
  const { data: derniers } = await supabase
    .from('pronos')
    .select('resultat, cree_le')
    .eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])
    .order('cree_le', { ascending: false })
    .limit(20)

  let streak = 0
  let typeStreak = null
  if (derniers?.length) {
    typeStreak = derniers[0].resultat
    for (const p of derniers) {
      if (p.resultat === typeStreak) streak++
      else break
    }
  }

  // 2. Pronos en attente (matchs à venir non pronostiqués)
  const { count: enAttente } = await supabase
    .from('pronos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resultat', 'en_attente')

  // 3. Win rate global
  const { data: tous } = await supabase
    .from('pronos')
    .select('resultat')
    .eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])

  const totalResolus = tous?.length || 0
  const corrects = tous?.filter(p => p.resultat === 'correct').length || 0
  const winRate = totalResolus >= 5 ? Math.round((corrects / totalResolus) * 100) : null

  // Construction messages — max 2
  if (enAttente > 0) {
    messages.push({
      icone: '⏳',
      texte: `${enAttente} prono${enAttente > 1 ? 's' : ''} en attente de résultat`,
      couleur: 'var(--text-2)',
    })
  }

  if (streak >= 2 && typeStreak === 'correct') {
    messages.push({
      icone: '🔥',
      texte: `Tu es sur une série de ${streak} pronos réussis, continue !`,
      couleur: 'var(--success)',
    })
  } else if (streak >= 2 && typeStreak === 'incorrect') {
    messages.push({
      icone: '💪',
      texte: `${streak} ratés d'affilée — tu vas renverser ça !`,
      couleur: 'var(--danger)',
    })
  }

  if (messages.length < 2 && winRate !== null) {
    messages.push({
      icone: '🎯',
      texte: `Tu réussis ${winRate}% de tes pronos cette saison`,
      couleur: 'var(--accent)',
    })
  }

  return messages.slice(0, 2)
}

function Focus({ userId }) {
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!userId) return
    genererMessages(userId).then(msgs => {
      setMessages(msgs)
      setChargement(false)
    })
  }, [userId])

  // Pas de message = pas de bloc
  if (!chargement && !messages.length) return null

  return (
    <Bloc>
      <LabelSection>Focus</LabelSection>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {chargement ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>…</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{msg.icone}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: msg.couleur, lineHeight: 1.4 }}>
                {msg.texte}
              </span>
            </div>
          ))
        )}
      </div>
    </Bloc>
  )
}

export default Focus
