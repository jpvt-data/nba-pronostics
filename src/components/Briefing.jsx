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

  // 1. Matchs ESPN sans prono — guideline dismissable
  if (nbPronosAttente > 0 && !estDismisse('pronos_attente')) {
    messages.push({
      id:          'pronos_attente',
      icone:       '🏀',
      texte:       `T'as ${nbPronosAttente} match${nbPronosAttente > 1 ? 's' : ''} à pronostiquer !`,
      couleur:     'var(--orange)',
      dismissable: true,
      lien:        '/',
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

  if (streak >= 2 && typeStreak === 'correct') {
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

  // 6. Contexte ligue Supabase
  const aujourd_hui = new Date()
  const auj_str     = aujourd_hui.toISOString().slice(0, 10)

  const { data: liguesUser } = await supabase
    .from('membres_groupe')
    .select('groupes(nom, type_saison, date_debut, date_fin, saison)')
    .eq('user_id', userId)
    .eq('actif', true)

  const ligues = liguesUser
    ?.map(m => m.groupes)
    .filter(Boolean) || []

  // Ligue active (date_debut <= aujourd'hui <= date_fin ou pas de date_fin)
  const ligueActive = ligues.find(g =>
    (!g.date_debut || g.date_debut <= auj_str) &&
    (!g.date_fin   || g.date_fin   >= auj_str)
  )

  // Ligue à venir (date_debut dans le futur)
  const ligueAVenir = ligues
    .filter(g => g.date_debut && g.date_debut > auj_str)
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut))[0]

  // Ligue terminée récemment (date_fin < aujourd'hui, dans les 7 derniers jours)
  const il_y_a_7j = new Date(aujourd_hui)
  il_y_a_7j.setDate(aujourd_hui.getDate() - 7)
  const il_y_a_7j_str = il_y_a_7j.toISOString().slice(0, 10)
  const ligueTerminee = ligues.find(g =>
    g.date_fin && g.date_fin < auj_str && g.date_fin >= il_y_a_7j_str
  )

  const formaterDate = (str) => {
    const d = new Date(str + 'T12:00:00')
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  if (ligueActive) {
    const typeSaison = ligueActive.type_saison
    const nom        = ligueActive.nom
    const saison     = ligueActive.saison || ''
    const icone      = typeSaison === 3 ? '🏆' : '🏀'

    if (ligueActive.date_fin) {
      const dateFinObj  = new Date(ligueActive.date_fin + 'T12:00:00')
      const diffFin     = Math.floor((dateFinObj - aujourd_hui) / (1000 * 60 * 60 * 24))
      if (diffFin <= 7) {
        messages.push({
          id:      'ligue_active',
          icone,
          texte:   `"${nom}" se termine dans ${diffFin} jour${diffFin > 1 ? 's' : ''} !`,
          couleur: typeSaison === 3 ? 'var(--gold)' : 'var(--accent)',
        })
      } else {
        messages.push({
          id:      'ligue_active',
          icone,
          texte:   `"${nom}" ${saison ? `${saison} ` : ''}en cours`,
          couleur: typeSaison === 3 ? 'var(--gold)' : 'var(--accent)',
        })
      }
    } else {
      messages.push({
        id:      'ligue_active',
        icone,
        texte:   `"${nom}" ${saison ? `${saison} ` : ''}en cours`,
        couleur: typeSaison === 3 ? 'var(--gold)' : 'var(--accent)',
      })
    }
  } else if (ligueAVenir) {
    messages.push({
      id:      'ligue_a_venir',
      icone:   '📅',
      texte:   `La ligue "${ligueAVenir.nom}" commence le ${formaterDate(ligueAVenir.date_debut)}`,
      couleur: 'var(--accent)',
    })
  } else if (ligueTerminee) {
    messages.push({
      id:      'ligue_terminee',
      icone:   '🎉',
      texte:   `La ligue "${ligueTerminee.nom}" vient de se terminer — bien joué !`,
      couleur: 'var(--success)',
    })
  }

  // 7. Prochain match à venir
  const maintenant = new Date()
  const prochainMatch = matchs
    .filter(m => m.statut !== 'STATUS_FINAL' && m.statut !== 'STATUS_IN_PROGRESS')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  if (prochainMatch) {
    const dateMatch = new Date(prochainMatch.date)
    const diffMs    = dateMatch - maintenant
    const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    let texteMatch
    if (diffJours <= 0)      texteMatch = 'Match ce soir !'
    else if (diffJours === 1) texteMatch = 'Prochain match demain'
    else                      texteMatch = `Prochain match dans ${diffJours} jours`
    messages.push({
      id:      'prochain_match',
      icone:   '📅',
      texte:   texteMatch,
      couleur: 'var(--text-2)',
    })
  }

  return messages
}

function Briefing({ userId, nbPronosAttente = 0, matchs = [] }) {
  const [messages, setMessages] = useState([])
  const [index, setIndex]       = useState(0)
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

  // Carousel auto 6s — reset à chaque action manuelle
  useEffect(() => {
    if (messages.length <= 1) return
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % messages.length)
    }, 6000)
    return () => clearInterval(timerRef.current)
  }, [messages])

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % messages.length)
    }, 6000)
  }

  if (chargement) return null
  if (!messages.length) return null

  const msg     = messages[index]
  const hasNext = messages.length > 1

  const handleDismiss = () => {
    if (msg.dismissable) dismisser(msg.id)
    const suivants = messages.filter((_, i) => i !== index)
    setMessages(suivants)
    setIndex(i => Math.min(i, suivants.length - 1))
    resetTimer()
  }

  const handleSuivant = () => {
    setIndex(i => (i + 1) % messages.length)
    resetTimer()
  }

  const handleClic = () => { if (msg.lien) navigate(msg.lien) }

  return (
    <div style={{
      background: '#f0ede8',
      padding: '10px 16px 12px',
      marginTop: 12, marginBottom: 4,
    }}>
      {/* Message */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(0,0,0,0.04)',
        borderLeft: `3px solid ${msg.couleur}`,
      }}>
        {/* Zone cliquable */}
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

        {/* Croix dismiss */}
        {msg.dismissable && (
          <button onClick={handleDismiss} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'rgba(0,0,0,0.5)', padding: '4px 10px',
            lineHeight: 1, flexShrink: 0,
          }} title="Ignorer">✕</button>
        )}
      </div>

      {/* Bas : points + bouton Suivant */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 3, paddingLeft: 2 }}>
          {messages.map((_, i) => (
            <div key={i} style={{
              width: i === index ? 14 : 4, height: 3, borderRadius: 2,
              background: i === index ? msg.couleur : 'rgba(0,0,0,0.15)',
              transition: 'width 0.25s ease',
            }} />
          ))}
        </div>
        {hasNext && (
          <button onClick={handleSuivant} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.45)',
            padding: '2px 0', letterSpacing: '0.03em',
          }}>Suivant →</button>
        )}
      </div>
    </div>
  )
}

export default Briefing
