import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'


async function genererMessages(userId, nbPronosAttente) {
  const messages = []

  // 1. Matchs ESPN sans prono (badge)
  if (nbPronosAttente > 0) {
    messages.push({
      icone: '🏀',
      texte: `Il te reste ${nbPronosAttente} match${nbPronosAttente > 1 ? 's' : ''} à pronostiquer !`,
      couleur: 'var(--orange)',
    })
  }

  // 2. Pronos posés mais pas encore résolus (Supabase)
  const { count: enAttente } = await supabase
    .from('pronos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resultat', 'en_attente')

  if (enAttente > 0) {
    messages.push({
      icone: '⏳',
      texte: `Tu as ${enAttente} pronostic${enAttente > 1 ? 's' : ''} en cours ! T'es sûr.e de ton choix ? 🤞`,
      couleur: 'var(--text-2)',
    })
  }

  // 3. Streak — derniers pronos résolus
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
    } else if (streak === 1 && typeStreak === 'incorrect' && derniers?.length >= 3) {
      // Dernier = raté, vérifier si avant il y avait une série ≥ 2 correcte
      const avantDernier = derniers[1].resultat
      let streakPrecedent = 0
      for (let i = 1; i < derniers.length; i++) {
        if (derniers[i].resultat === avantDernier) streakPrecedent++
        else break
      }
      if (streakPrecedent >= 2 && avantDernier === 'correct') {
        messages.push({
          icone: '💔',
          texte: `Tu viens de briser ta série de ${streakPrecedent} pronos réussis ! Ça arrive 😤`,
          couleur: 'var(--orange)',
        })
      }
    }

  // 4. Win rate global
  const { data: tous } = await supabase
    .from('pronos')
    .select('resultat')
    .eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])

  const totalResolus = tous?.length || 0
  const corrects = tous?.filter(p => p.resultat === 'correct').length || 0
  const winRate = totalResolus >= 5 ? Math.round((corrects / totalResolus) * 100) : null

  if (winRate !== null) {
    messages.push({
      icone: '🎯',
      texte: `Tu réussis ${winRate}% de tes pronos cette saison`,
      couleur: 'var(--accent)',
    })
  }

  return messages
}

function Focus({ userId, nbPronosAttente = 0 }) {
  const [messages, setMessages] = useState([])
  const [indexActif, setIndexActif] = useState(0)
  const [visible, setVisible] = useState(true)
  const [chargement, setChargement] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    genererMessages(userId, nbPronosAttente).then(msgs => {
      setMessages(msgs)
      setChargement(false)
    })
  }, [userId, nbPronosAttente])

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
    <div style={{
      background: '#f5f5f0',
      padding: '12px 16px 14px 16px',
      margin: '0 0 0 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 22, color: '#0d0d12', letterSpacing: '0.02em', lineHeight: 1 }}>SPOT<span style={{ color: 'var(--accent)' }}>LIGHT</span></span>
        {messages.length > 1 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {messages.map((_, i) => (
              <div key={i} style={{
                width: i === indexActif ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === indexActif ? 'var(--accent)' : '#ccc',
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ minHeight: 44 }}>
        {chargement ? (
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>…</p>
        ) : msg ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.04)',
            borderLeft: `3px solid ${msg.couleur}`,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{msg.icone}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.4 }}>
              {msg.texte}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Focus