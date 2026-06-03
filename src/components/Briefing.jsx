import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const DISMISS_KEY = (key) => {
  const today = new Date().toISOString().slice(0, 10)
  return `briefing_dismiss_${key}_${today}`
}
const estDismisse = (key) => !!localStorage.getItem(DISMISS_KEY(key))
const dismisser   = (key) => localStorage.setItem(DISMISS_KEY(key), '1')

async function genererMessages(userId, nbPronosAttente, matchs = []) {
  const messages = []

  if (nbPronosAttente > 0 && !estDismisse('pronos_attente')) {
    messages.push({
      id: 'pronos_attente', icone: '🏀',
      texte: `T'as ${nbPronosAttente} match${nbPronosAttente > 1 ? 's' : ''} à pronostiquer !`,
      couleur: 'var(--orange)', dismissable: true, lien: '/',
    })
  }

  const { count: enAttente } = await supabase
    .from('pronos').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('resultat', 'en_attente')
  if (enAttente > 0) {
    messages.push({
      id: 'pronos_encours', icone: '⏳',
      texte: `${enAttente} prono${enAttente > 1 ? 's' : ''} en cours — résultats à venir`,
      couleur: 'var(--text-2)', lien: '/mes-pronos',
    })
  }

  const { data: derniers } = await supabase
    .from('pronos').select('resultat, cree_le').eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])
    .order('cree_le', { ascending: false }).limit(20)

  let streak = 0, typeStreak = null
  if (derniers?.length) {
    typeStreak = derniers[0].resultat
    for (const p of derniers) {
      if (p.resultat === typeStreak) streak++
      else break
    }
  }

  if (streak >= 2 && typeStreak === 'correct') {
    messages.push({ id: 'streak_correct', icone: '🔥', texte: `Série de ${streak} pronos réussis — continue !`, couleur: 'var(--success)' })
  } else if (streak >= 3 && typeStreak === 'incorrect') {
    messages.push({ id: 'streak_incorrect', icone: '❄️', texte: `${streak} ratés d'affilée… tu vas t'en sortir`, couleur: 'var(--danger)' })
  } else if (streak === 1 && typeStreak === 'incorrect' && derniers?.length >= 3) {
    const avantDernier = derniers[1].resultat
    let streakPrecedent = 0
    for (let i = 1; i < derniers.length; i++) {
      if (derniers[i].resultat === avantDernier) streakPrecedent++
      else break
    }
    if (streakPrecedent >= 2 && avantDernier === 'correct') {
      messages.push({ id: 'serie_cassee', icone: '💔', texte: `Ta série de ${streakPrecedent} vient de prendre fin`, couleur: 'var(--orange)' })
    }
  }

  const { data: tous } = await supabase
    .from('pronos').select('resultat').eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])
  const totalResolus = tous?.length || 0
  const corrects     = tous?.filter(p => p.resultat === 'correct').length || 0
  const winRate      = totalResolus >= 5 ? Math.round((corrects / totalResolus) * 100) : null
  if (winRate !== null) {
    messages.push({ id: 'winrate', icone: '🎯', texte: `Tu réussis ${winRate}% de tes pronos`, couleur: 'var(--accent)' })
  }

  if (!estDismisse('profil_incomplet')) {
    const { data: profil } = await supabase
      .from('profils').select('avatar_url, description').eq('id', userId).single()
    if (!profil?.avatar_url || !profil?.description) {
      messages.push({
        id: 'profil_incomplet', icone: '👤',
        texte: 'Ton profil est incomplet — ajoute un avatar ou une bio',
        couleur: 'var(--accent)', dismissable: true, lien: '/profil',
      })
    }
  }

  const aujourd_hui = new Date()
  const auj_str     = aujourd_hui.toISOString().slice(0, 10)

  const { data: liguesUser } = await supabase
    .from('membres_groupe')
    .select('groupes(nom, type_saison, date_debut, date_fin, saison)')
    .eq('user_id', userId).eq('actif', true)

  const ligues       = liguesUser?.map(m => m.groupes).filter(Boolean) || []
  const ligueActive  = ligues.find(g => (!g.date_debut || g.date_debut <= auj_str) && (!g.date_fin || g.date_fin >= auj_str))
  const ligueAVenir  = ligues.filter(g => g.date_debut && g.date_debut > auj_str).sort((a, b) => a.date_debut.localeCompare(b.date_debut))[0]
  const il_y_a_7j    = new Date(aujourd_hui); il_y_a_7j.setDate(aujourd_hui.getDate() - 7)
  const il_y_a_7j_str = il_y_a_7j.toISOString().slice(0, 10)
  const ligueTerminee = ligues.find(g => g.date_fin && g.date_fin < auj_str && g.date_fin >= il_y_a_7j_str)

  const formaterDate = (str) => new Date(str + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  if (ligueActive) {
    const { type_saison: typeSaison, nom, date_fin } = ligueActive
    const icone = typeSaison === 3 ? '🏆' : '🏀'
    const couleur = typeSaison === 3 ? 'var(--gold)' : 'var(--accent)'
    let texte = `"${nom}" en cours`
    if (date_fin) {
      const diffFin = Math.floor((new Date(date_fin + 'T12:00:00') - aujourd_hui) / (1000 * 60 * 60 * 24))
      if (diffFin <= 7) texte = `"${nom}" se termine dans ${diffFin} jour${diffFin > 1 ? 's' : ''} !`
    }
    messages.push({ id: 'ligue_active', icone, texte, couleur })
  } else if (ligueAVenir) {
    messages.push({ id: 'ligue_a_venir', icone: '📅', texte: `La ligue "${ligueAVenir.nom}" commence le ${formaterDate(ligueAVenir.date_debut)}`, couleur: 'var(--accent)' })
  } else if (ligueTerminee) {
    messages.push({ id: 'ligue_terminee', icone: '🎉', texte: `La ligue "${ligueTerminee.nom}" vient de se terminer — bien joué !`, couleur: 'var(--success)' })
  }

  const prochainMatch = matchs
    .filter(m => m.statut !== 'STATUS_FINAL' && m.statut !== 'STATUS_IN_PROGRESS')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  if (prochainMatch) {
    const diffJours = Math.floor((new Date(prochainMatch.date) - new Date()) / (1000 * 60 * 60 * 24))
    const texteMatch = diffJours <= 0 ? 'Match ce soir !' : diffJours === 1 ? 'Prochain match demain' : `Prochain match dans ${diffJours} jours`
    messages.push({ id: 'prochain_match', icone: '📅', texte: texteMatch, couleur: 'var(--text-2)' })
  }

  return messages
}

export default function Briefing({ userId, nbPronosAttente = 0, matchs = [] }) {
  const [messages, setMessages] = useState([])
  const [chargement, setCharg]  = useState(true)
  const [tick, setTick]         = useState(0)
  const [dismisses, setDismisses] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    if (!userId) return
    genererMessages(userId, nbPronosAttente, matchs).then(msgs => {
      setMessages(msgs)
      setCharg(false)
    })
  }, [userId, nbPronosAttente])

  const handleDismiss = (id, dismissable) => {
    if (dismissable) dismisser(id)
    setDismisses(d => ({ ...d, [id]: true }))
  }

  if (chargement) return null

  const visibles = messages.filter(m => !dismisses[m.id])
  if (!visibles.length) return null

  // Durée totale : chaque message = 4s (1s glisse entrée + 2.5s pause + 0.5s glisse sortie)
  // On duplique la liste pour boucle seamless
  const liste = [...visibles, ...visibles]
  const dureeParMsg = 10 // secondes
  const dureeTotal  = dureeParMsg * visibles.length

  return (
    <div style={{
      background: '#f0ede8',
      height: 44,
      marginTop: 8, marginBottom: 8,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex', alignItems: 'center',
    }}>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          gap: 24px;
          white-space: nowrap;
          animation: ticker ${dureeTotal}s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="ticker-track">
        {liste.map((msg, i) => (
          <div key={`${msg.id}-${i}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14 }}>{msg.icone}</span>
            <span
              onClick={() => msg.lien ? navigate(msg.lien) : undefined}
              style={{
                fontSize: 12, fontWeight: 600, color: '#1a1a2e',
                borderLeft: `2px solid ${msg.couleur}`, paddingLeft: 8,
                cursor: msg.lien ? 'pointer' : 'default',
              }}
            >
              {msg.texte}
            </span>
            {msg.dismissable && i < visibles.length && (
              <button
                onClick={() => handleDismiss(msg.id, msg.dismissable)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, color: 'rgba(0,0,0,0.35)', padding: '2px 4px',
                }}
              >✕</button>
            )}
            {/* Séparateur entre messages */}
            <span style={{ color: 'rgba(0,0,0,0.25)', fontSize: 14, marginLeft: 8 }}>|</span>
          </div>
        ))}
      </div>
    </div>
  )
}