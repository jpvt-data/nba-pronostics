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
  const [indexActif, setIndexActif] = useState(0)
  const [phase, setPhase]       = useState('entree') // 'entree' | 'pause' | 'sortie'
  const [chargement, setCharg]  = useState(true)
  const timerRef                = useRef(null)
  const navigate                = useNavigate()

  useEffect(() => {
    if (!userId) return
    genererMessages(userId, nbPronosAttente, matchs).then(msgs => {
      setMessages(msgs)
      setCharg(false)
    })
  }, [userId, nbPronosAttente])

  const demarrerCycle = (msgs, idx) => {
    clearTimeout(timerRef.current)
    if (!msgs.length) return
    setPhase('entree')
    timerRef.current = setTimeout(() => {
      setPhase('pause')
      timerRef.current = setTimeout(() => {
        setPhase('sortie')
        timerRef.current = setTimeout(() => {
          const suivant = (idx + 1) % msgs.length
          setIndexActif(suivant)
          demarrerCycle(msgs, suivant)
        }, 600)
      }, 3000)
    }, 600)
  }

  useEffect(() => {
    if (!messages.length) return
    demarrerCycle(messages, indexActif)
    return () => clearTimeout(timerRef.current)
  }, [messages])

  const handleDismiss = () => {
    clearTimeout(timerRef.current)
    const msg = messages[indexActif]
    if (msg.dismissable) dismisser(msg.id)
    const suivants = messages.filter((_, i) => i !== indexActif)
    if (!suivants.length) { setMessages([]); return }
    const nouvelIdx = indexActif % suivants.length
    setMessages(suivants)
    setIndexActif(nouvelIdx)
    setTimeout(() => demarrerCycle(suivants, nouvelIdx), 50)
  }

  if (chargement || !messages.length) return null

  const msg = messages[indexActif]

  const translateX = phase === 'entree' ? '-110%' : phase === 'pause' ? '0%' : '110%'
  const transition = phase === 'pause' ? 'none' : 'transform 0.6s cubic-bezier(0.4,0,0.2,1)'

  return (
    <div style={{
      background: '#f0ede8',
      height: 44,
      marginTop: 8, marginBottom: 8,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Message animé */}
      <div style={{
        position: 'absolute', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transform: `translateX(${translateX})`,
        transition,
        paddingLeft: 16, paddingRight: phase === 'pause' && msg.dismissable ? 40 : 16,
        boxSizing: 'border-box',
      }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>{msg.icone}</span>
        <span
          onClick={() => msg.lien ? navigate(msg.lien) : undefined}
          style={{
            fontSize: 12, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.3,
            cursor: msg.lien ? 'pointer' : 'default',
            borderLeft: `2px solid ${msg.couleur}`, paddingLeft: 8,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {msg.texte}
        </span>
      </div>

      {/* Croix — uniquement en pause et si dismissable */}
      {phase === 'pause' && msg.dismissable && (
        <button onClick={handleDismiss} style={{
          position: 'absolute', right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'rgba(0,0,0,0.4)', padding: '4px 6px',
          lineHeight: 1,
        }}>✕</button>
      )}

      {/* Points indicateurs */}
      {messages.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 4, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 3,
        }}>
          {messages.map((_, i) => (
            <div key={i} style={{
              width: i === indexActif ? 12 : 3, height: 3, borderRadius: 2,
              background: i === indexActif ? msg.couleur : 'rgba(0,0,0,0.15)',
              transition: 'width 0.25s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}