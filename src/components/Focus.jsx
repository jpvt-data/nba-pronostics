import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Bloc, LabelSection } from '../components/UI'

// Génère tous les messages disponibles — plus de limite arbitraire
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

  // 2. Pronos en attente
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

  // Construction — tous les messages pertinents
  if (enAttente > 0) {
    messages.push({
      icone: '⏳',
      texte: `Tu as ${enAttente} pronostic${enAttente > 1 ? 's' : ''} en cours ! T'es sûr.e de ton choix ? 🤞`,
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

  if (winRate !== null) {
    messages.push({
      icone: '🎯',
      texte: `Tu réussis ${winRate}% de tes pronos cette saison`,
      couleur: 'var(--accent)',
    })
  }

  return messages
}

function Focus({ userId }) {
  const [messages, setMessages] = useState([])
  const [indexActif, setIndexActif] = useState(0)
  const [visible, setVisible] = useState(true)
  const [chargement, setChargement] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    genererMessages(userId).then(msgs => {
      setMessages(msgs)
      setChargement(false)
    })
  }, [userId])

  // Carousel — rotation toutes les 4s avec fade out/in
  useEffect(() => {
    if (messages.length <= 1) return
    timerRef.current = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndexActif(i => (i + 1) % messages.length)
        setVisible(true)
      }, 350)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [messages])

  if (!chargement && !messages.length) return null

  const msg = messages[indexActif]

  return (
    <Bloc>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LabelSection>Focus</LabelSection>
        {/* Points de pagination */}
        {messages.length > 1 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {messages.map((_, i) => (
              <div key={i} style={{
                width: i === indexActif ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === indexActif ? 'var(--accent)' : 'var(--border-2)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, minHeight: 44 }}>
        {chargement ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>…</p>
        ) : msg ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)',
            borderRadius: 'var(--radius-sm)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{msg.icone}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: msg.couleur, lineHeight: 1.4 }}>
              {msg.texte}
            </span>
          </div>
        ) : null}
      </div>
    </Bloc>
  )
}

export default Focus
