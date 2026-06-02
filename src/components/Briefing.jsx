import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Clé localStorage pour les dismiss — format "briefing_dismiss_KEY_DATE"
const DISMISS_KEY = (key) => {
  const today = new Date().toISOString().slice(0, 10)
  return `briefing_dismiss_${key}_${today}`
}

const estDismisse = (key) => !!localStorage.getItem(DISMISS_KEY(key))
const dismisser   = (key) => localStorage.setItem(DISMISS_KEY(key), '1')

async function genererMessages(userId, nbPronosAttente) {
  const messages = []

  // 1. Matchs ESPN sans prono — guideline dismissable
  if (nbPronosAttente > 0 && !estDismisse('pronos_attente')) {
    messages.push({
      id:         'pronos_attente',
      icone:      '🏀',
      texte:      `T'as ${nbPronosAttente} match${nbPronosAttente > 1 ? 's' : ''} à pronostiquer !`,
      couleur:    'var(--orange)',
      dismissable: true,
      lien:       '/', // reste sur le board, scroll naturel
    })
  }

  // 2. Pronos Supabase en attente de résultat
  const { count: enAttente } = await supabase
    .from('pronos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resultat', 'en_attente')

  if (enAttente > 0) {
    messages.push({
      id:      'pronos_encours',
      icone:   '⏳',
      texte:   `${enAttente} prono${enAttente > 1 ? 's' : ''} en cours — résultats à venir`,
      couleur: 'var(--text-2)',
      lien:    '/mes-pronos',
    })
  }

  // 3. Streak et série cassée
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

  if (streak >= 3 && typeStreak === 'correct') {
    messages.push({
      id:      'streak_correct',
      icone:   '🔥',
      texte:   `Série de ${streak} pronos réussis — continue !`,
      couleur: 'var(--success)',
    })
  } else if (streak >= 3 && typeStreak === 'incorrect') {
    messages.push({
      id:      'streak_incorrect',
      icone:   '❄️',
      texte:   `${streak} ratés d'affilée… tu vas t'en sortir`,
      couleur: 'var(--danger)',
    })
  } else if (streak === 1 && typeStreak === 'incorrect' && derniers?.length >= 3) {
    const avantDernier = derniers[1].resultat
    let streakPrecedent = 0
    for (let i = 1; i < derniers.length; i++) {
      if (derniers[i].resultat === avantDernier) streakPrecedent++
      else break
    }
    if (streakPrecedent >= 2 && avantDernier === 'correct') {
      messages.push({
        id:      'serie_cassee',
        icone:   '💔',
        texte:   `Ta série de ${streakPrecedent} vient de prendre fin`,
        couleur: 'var(--orange)',
      })
    }
  }

  // 4. Win rate
  const { data: tous } = await supabase
    .from('pronos')
    .select('resultat')
    .eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])

  const totalResolus = tous?.length || 0
  const corrects     = tous?.filter(p => p.resultat === 'correct').length || 0
  const winRate      = totalResolus >= 5 ? Math.round((corrects / totalResolus) * 100) : null

  if (winRate !== null) {
    messages.push({
      id:      'winrate',
      icone:   '🎯',
      texte:   `Tu réussis ${winRate}% de tes pronos`,
      couleur: 'var(--accent)',
    })
  }

  // 5. Profil incomplet — guideline dismissable
  if (!estDismisse('profil_incomplet')) {
    const { data: profil } = await supabase
      .from('profils')
      .select('avatar_url, description')
      .eq('id', userId)
      .single()

    if (!profil?.avatar_url || !profil?.description) {
      messages.push({
        id:          'profil_incomplet',
        icone:       '👤',
        texte:       'Ton profil est incomplet — ajoute un avatar ou une bio',
        couleur:     'var(--accent)',
        dismissable: true,
        lien:        '/profil',
      })
    }
  }

  return messages
}

function Briefing({ userId, nbPronosAttente = 0 }) {
  const [messages, setMessages]   = useState([])
  const [index, setIndex]         = useState(0)
  const [chargement, setCharg]    = useState(true)
  const navigate                  = useNavigate()

  useEffect(() => {
    if (!userId) return
    genererMessages(userId, nbPronosAttente).then(msgs => {
      setMessages(msgs)
      setCharg(false)
    })
  }, [userId, nbPronosAttente])

  if (chargement) return null
  if (!messages.length) return null

  const msg        = messages[index]
  const hasNext    = messages.length > 1

  const handleDismiss = () => {
    if (msg.dismissable) dismisser(msg.id)
    // Retirer le message de la liste locale
    const suivants = messages.filter((_, i) => i !== index)
    setMessages(suivants)
    setIndex(i => Math.min(i, suivants.length - 1))
  }

  const handleSuivant = () => {
    setIndex(i => (i + 1) % messages.length)
  }

  const handleClic = () => {
    if (msg.lien) navigate(msg.lien)
  }

  return (
    <div style={{
      background: '#f0ede8',
      padding: '10px 16px 12px',
      marginTop: 12, marginBottom: 4,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(0,0,0,0.04)',
        borderLeft: `3px solid ${msg.couleur}`,
      }}>
        {/* Zone message cliquable */}
        <div
          onClick={msg.lien ? handleClic : undefined}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            cursor: msg.lien ? 'pointer' : 'default',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{msg.icone}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.4 }}>
            {msg.texte}
          </span>
        </div>

        {/* Actions droite */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingRight: 8, gap: 2 }}>
          {/* Dismiss — uniquement si dismissable */}
          {msg.dismissable && (
            <button onClick={handleDismiss} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'rgba(0,0,0,0.25)', padding: '4px 6px',
              lineHeight: 1,
            }} title="Ignorer">✕</button>
          )}
          {/* Suivant */}
          {hasNext && (
            <button onClick={handleSuivant} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'rgba(0,0,0,0.3)', padding: '4px 6px',
              lineHeight: 1, fontWeight: 700,
            }} title="Message suivant">›</button>
          )}
        </div>
      </div>

      {/* Indicateur position */}
      {hasNext && (
        <div style={{ display: 'flex', gap: 3, marginTop: 6, paddingLeft: 2 }}>
          {messages.map((_, i) => (
            <div key={i} style={{
              width: i === index ? 14 : 4, height: 3, borderRadius: 2,
              background: i === index ? msg.couleur : 'rgba(0,0,0,0.15)',
              transition: 'width 0.25s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Briefing
