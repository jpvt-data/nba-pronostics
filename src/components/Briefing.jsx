import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BADGES_CATALOGUE } from '../data/badges'
import { lundiFin } from '../services/points'

const DISMISS_KEY = (key) => {
  const today = new Date().toISOString().slice(0, 10)
  return `briefing_dismiss_${key}_${today}`
}
const estDismisse = (key) => !!localStorage.getItem(DISMISS_KEY(key))
const dismisser   = (key) => localStorage.setItem(DISMISS_KEY(key), '1')

const titrDepuisNiveau = (n) => {
  if (n <= 10) return 'Rookie'
  if (n <= 20) return 'Sixième Homme'
  if (n <= 30) return 'Starter'
  if (n <= 40) return 'All-Star'
  if (n <= 60) return 'MVP'
  if (n <= 80) return 'Hall of Fame'
  return 'GOAT'
}

const TITRES_MESSAGES = {
  'Sixième Homme': "Tu sors du banc !",
  'Starter':       "Tu joues les grandes minutes !",
  'All-Star':      "L'élite te reconnaît !",
  'MVP':           "Tu domines le classement !",
  'Hall of Fame':  "Une légende est née !",
  'GOAT':          "Il n'y a plus rien à prouver.",
}

const JALONS_MESSAGES = {
  premier_prono_histoire: { icone: '🎯', texte: "+75 XP — premier prono de ta vie posé. L'aventure commence !" },
  semaine_100_pct:        { icone: '💯', texte: "+50 XP — semaine parfaite ! Tu as pronostiqué tous les matchs." },
  jalon_10_pronos:        { icone: '🎖️', texte: "+50 XP — 10 pronos posés, tu prends tes marques !" },
  jalon_50_pronos:        { icone: '🃏', texte: "+150 XP — 50 pronos posés ! Badge All-In débloqué." },
  jalon_100_pronos:       { icone: '🏃', texte: "+300 XP — 100 pronos ! Marathonien confirmé." },
  jalon_serie_5:          { icone: '🔥', texte: "+100 XP — 5 corrects d'affilée ! Badge En Feu mérité." },
  jalon_serie_10:         { icone: '👑', texte: "+250 XP — 10 corrects d'affilée ! Tu es un Prophète." },
  jalon_winrate_65:       { icone: '🧠', texte: "+200 XP — 65% de réussite sur 20 pronos. Analyste de haut vol." },
  jalon_semaine:          { icone: '🏆', texte: "+150 XP — semaine gagnée ! Badge Champion décroché." },
  jalon_serie_ratee_5:    { icone: '🧊', texte: "Badge En Hibernation obtenu… ça va aller, ça arrive aux meilleurs." },
  jalon_10_fourchettes:   { icone: '🏹', texte: "+200 XP — 10 fourchettes d'écart correctes ! Badge Tireur d'Élite débloqué." },
}

async function genererMessages(userId, nbPronosAttente, matchs = []) {
  const messages = []
  const maintenant = new Date()
  const il_y_a_24h = new Date(maintenant - 24 * 60 * 60 * 1000).toISOString()
  const il_y_a_7j  = new Date(maintenant - 7 * 24 * 60 * 60 * 1000).toISOString()

  // ── Jalons XP récents (< 24h) ──
  const { data: logsRecents } = await supabase
    .from('xp_log')
    .select('source_id, cree_le')
    .eq('user_id', userId)
    .in('source', ['jalon', 'passif'])
    .gte('cree_le', il_y_a_24h)
    .order('cree_le', { ascending: false })

  const jalonsVus = new Set()
  for (const log of (logsRecents || [])) {
    const info = JALONS_MESSAGES[log.source_id]
    if (!info || jalonsVus.has(log.source_id)) continue
    jalonsVus.add(log.source_id)
    messages.push({
      id: `jalon_${log.source_id}`,
      icone: info.icone,
      texte: info.texte,
      couleur: 'var(--gold)',
    })
  }

  // ── Missions complétées < 24h ──
  const { data: missionsCompletees } = await supabase
    .from('missions_utilisateurs')
    .select('mission_id, completee_le, missions(titre, xp_recompense)')
    .eq('user_id', userId)
    .eq('completee', true)
    .gte('completee_le', il_y_a_24h)

  for (const mu of (missionsCompletees || [])) {
    const m = mu.missions
    if (!m) continue
    messages.push({
      id: `mission_complete_${mu.mission_id}`,
      icone: '🎯',
      texte: `Mission "${m.titre}" accomplie — +${m.xp_recompense} XP !`,
      couleur: 'var(--gold)',
    })
  }

  // ── Missions en cours proches de la complétion (>= 50%) ──
  const periodeHebdo = lundiFin()

  const { data: missionsPermEnCours } = await supabase
    .from('missions_utilisateurs')
    .select('progression, missions(id, slug, titre, condition_type, condition_valeur)')
    .eq('user_id', userId)
    .eq('completee', false)
    .is('periode', null)

  const { data: missionsHebdoEnCours } = await supabase
    .from('missions_utilisateurs')
    .select('progression, missions(id, slug, titre, condition_type, condition_valeur)')
    .eq('user_id', userId)
    .eq('completee', false)
    .eq('periode', periodeHebdo)

  const missionsEnCours = [...(missionsPermEnCours || []), ...(missionsHebdoEnCours || [])]

  const libelleMissionProche = (slug, titre, restant) => {
    const s = restant > 1 ? 's' : ''
    switch (slug) {
      case 'connexion_5j':
        return `Plus que ${restant} jour${s} de connexion pour décrocher la mission "${titre}" !`
      case 'connexion_10j':
        return `Encore ${restant} jour${s} de suite pour valider la mission "${titre}" !`
      case 'connexion_30j':
        return `Il te manque ${restant} jour${s} de connexion pour terminer la mission "${titre}" !`
      case 'serie_3_corrects':
        return `Plus que ${restant} prono${s} correct${s} d'affilée pour valider la mission "${titre}" !`
      case 'serie_5_corrects':
        return `Encore ${restant} prono${s} correct${s} d'affilée pour décrocher la mission "${titre}" !`
      case 'fourchettes_3_semaine':
        return `Il te manque ${restant} fourchette${s} à poser pour compléter la mission "${titre}" !`
      case 'fourchettes_2_correctes':
        return `Plus qu'${restant} fourchette${s} correcte${s} pour valider la mission "${titre}" !`
      case 'connexion_5j_semaine':
        return `Encore ${restant} jour${s} connecté cette semaine pour terminer la mission "${titre}" !`
      case 'pronos_5_semaine':
        return `Plus que ${restant} prono${s} à poser cette semaine pour décrocher la mission "${titre}" !`
      default:
        return `Plus que ${restant} étape${s} pour terminer la mission "${titre}" !`
    }
  }

  for (const mu of (missionsEnCours || [])) {
    const m = mu.missions
    if (!m || mu.progression === 0) continue
    const pct = mu.progression / m.condition_valeur
    if (pct >= 0.5) {
      const restant = m.condition_valeur - mu.progression
      messages.push({
        id: `mission_proche_${m.id}`,
        icone: '⚡',
        texte: libelleMissionProche(m.slug, m.titre, restant),
        couleur: 'var(--accent)',
      })
    }
  }

  // ── Badges récemment obtenus (< 7 jours) ──
  const { data: logsJalons7j } = await supabase
    .from('xp_log')
    .select('source_id, cree_le')
    .eq('user_id', userId)
    .eq('source', 'jalon')
    .gte('cree_le', il_y_a_7j)

  const jalon2badge = {
    jalon_50_pronos:    'all_in',
    jalon_100_pronos:   'marathonien',
    jalon_serie_5:      'en_feu',
    jalon_serie_10:     'prophete',
    jalon_winrate_65:   'analyste',
    jalon_semaine:      'champion',
    jalon_serie_ratee_5:'en_hibernation',
    jalon_10_fourchettes:'tireur_d_elite',
  }

  const { data: profil } = await supabase
    .from('profils')
    .select('badges, niveau')
    .eq('id', userId).single()

  const badgesObtenus = profil?.badges || []
  const niveauActuel  = profil?.niveau || 1

  const badgesAnnonces = new Set()
  for (const log of (logsJalons7j || [])) {
    const badgeSlug = jalon2badge[log.source_id]
    if (!badgeSlug || badgesAnnonces.has(badgeSlug)) continue
    const badge = BADGES_CATALOGUE.find(b => b.slug === badgeSlug)
    if (!badge) continue
    badgesAnnonces.add(badgeSlug)
    if (!jalonsVus.has(log.source_id)) {
      messages.push({
        id: `badge_${badgeSlug}`,
        icone: badge.emoji || '🏅',
        texte: `Badge "${badge.nom}" débloqué — ${badge.description}`,
        couleur: 'var(--gold)',
      })
    }
  }

  const cleBadgesVus = `swish_briefing_badges_${userId}`
  const badgesBriefingVus = JSON.parse(localStorage.getItem(cleBadgesVus) || '[]')
  const badgesManuelsNouveaux = badgesObtenus.filter(s => {
    const badge = BADGES_CATALOGUE.find(b => b.slug === s)
    if (!badge) return false
    if (badge.famille === 'performance') return false
    return !badgesBriefingVus.includes(s)
  })
  for (const slug of badgesManuelsNouveaux) {
    const badge = BADGES_CATALOGUE.find(b => b.slug === slug)
    if (!badge) continue
    messages.push({
      id: `badge_manuel_${slug}`,
      icone: '🏅',
      texte: `Badge "${badge.nom}" obtenu — ${badge.description}`,
      couleur: 'var(--gold)',
    })
  }
  if (badgesManuelsNouveaux.length > 0) {
    localStorage.setItem(cleBadgesVus, JSON.stringify(badgesObtenus))
  }

  // ── Changement de niveau / titre ──
  const cleNiveau = `swish_niveau_${userId}`
  const dernierNiveau = parseInt(localStorage.getItem(cleNiveau) || '0')
  if (dernierNiveau > 0 && niveauActuel > dernierNiveau) {
    const titreActuel    = titrDepuisNiveau(niveauActuel)
    const titrePrecedent = titrDepuisNiveau(dernierNiveau)
    if (titreActuel !== titrePrecedent) {
      const msgTitre = TITRES_MESSAGES[titreActuel]
      messages.push({
        id: `titre_${titreActuel}`,
        icone: '⬆️',
        texte: `Tu es maintenant **${titreActuel}** — ${msgTitre}`,
        couleur: 'var(--gold)',
      })
    } else {
      messages.push({
        id: `niveau_${niveauActuel}`,
        icone: '⬆️',
        texte: `Bravo ! Tu es passé au niveau ${niveauActuel} !`,
        couleur: 'var(--gold)',
      })
    }
  }
  localStorage.setItem(cleNiveau, String(niveauActuel))

  // ── Fourchettes d'écart en attente de résultat ──
  const { count: fourchetteEnAttente } = await supabase
    .from('pronos_ecart')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('fourchette_reelle', null)
  if (fourchetteEnAttente > 0) {
    messages.push({
      id: 'fourchette_en_attente', icone: '🎯',
      texte: `${fourchetteEnAttente} fourchette${fourchetteEnAttente > 1 ? 's' : ''} d'écart en jeu — les résultats arrivent`,
      couleur: 'var(--gold)', lien: '/mes-pronos',
    })
  }

  // ── Pronos en attente ──
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

  // ── Streak ──
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

  // ── Win rate ──
  const { data: tous } = await supabase
    .from('pronos').select('resultat').eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])
  const totalResolus = tous?.length || 0
  const corrects     = tous?.filter(p => p.resultat === 'correct').length || 0
  const winRate      = totalResolus >= 5 ? Math.round((corrects / totalResolus) * 100) : null
  if (winRate !== null) {
    messages.push({ id: 'winrate', icone: '🎯', texte: `Tu réussis ${winRate}% de tes pronos`, couleur: 'var(--accent)' })
  }

  // ── Profil incomplet ──
  if (!estDismisse('profil_incomplet')) {
    const { data: profilCheck } = await supabase
      .from('profils').select('avatar_url, description').eq('id', userId).single()
    if (!profilCheck?.avatar_url || !profilCheck?.description) {
      messages.push({
        id: 'profil_incomplet', icone: '👤',
        texte: 'Ton profil est incomplet — ajoute un avatar ou une bio',
        couleur: 'var(--accent)', dismissable: true, lien: '/profil',
      })
    }
  }

  // ── Ligues ──
  const GROUPE_GENERAL = 'aaaaaaaa-0000-0000-0000-000000000001'
  const auj_str = maintenant.toISOString().slice(0, 10)
  const { data: liguesUser } = await supabase
    .from('membres_groupe')
    .select('groupe_id, groupes(nom, type_saison, date_debut, date_fin, saison)')
    .eq('user_id', userId).eq('actif', true)

  const ligues      = liguesUser?.filter(m => m.groupe_id !== GROUPE_GENERAL).map(m => m.groupes).filter(Boolean) || []
  const ligueActive = ligues.find(g => (!g.date_debut || g.date_debut <= auj_str) && (!g.date_fin || g.date_fin >= auj_str))
  const ligueAVenir = ligues.filter(g => g.date_debut && g.date_debut > auj_str).sort((a, b) => a.date_debut.localeCompare(b.date_debut))[0]
  const il_y_a_7j_str = new Date(maintenant - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const ligueTerminee = ligues.find(g => g.date_fin && g.date_fin < auj_str && g.date_fin >= il_y_a_7j_str)

  const formaterDate = (str) => new Date(str + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  if (ligueActive) {
    const { type_saison: typeSaison, nom, date_fin } = ligueActive
    const icone = typeSaison === 3 ? '🏆' : '🏀'
    const couleur = typeSaison === 3 ? 'var(--gold)' : 'var(--accent)'
    let texte = `La ligue "${nom}" est en cours !`
    if (date_fin) {
      const diffFin = Math.floor((new Date(date_fin + 'T12:00:00') - maintenant) / (1000 * 60 * 60 * 24))
      if (diffFin <= 15) texte = `La ligue "${nom}" se termine bientôt — plus que ${diffFin} jour${diffFin > 1 ? 's' : ''} !`
    }
    messages.push({ id: 'ligue_active', icone, texte, couleur })
  } else if (ligueAVenir) {
    messages.push({ id: 'ligue_a_venir', icone: '📅', texte: `La ligue "${ligueAVenir.nom}" commence le ${formaterDate(ligueAVenir.date_debut)}`, couleur: 'var(--accent)' })
  } else if (ligueTerminee) {
    messages.push({ id: 'ligue_terminee', icone: '🎉', texte: `La ligue "${ligueTerminee.nom}" vient de se terminer — bien joué !`, couleur: 'var(--success)' })
  }

  // ── Prochain match ──
  const prochainMatch = matchs
    .filter(m => m.statut !== 'STATUS_FINAL' && m.statut !== 'STATUS_IN_PROGRESS')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  if (prochainMatch) {
    const diffJours = Math.floor((new Date(prochainMatch.date) - new Date()) / (1000 * 60 * 60 * 24))
    const texteMatch = diffJours <= 0 ? 'Match ce soir !' : diffJours === 1 ? 'Prochain match demain' : `Prochain match dans ${diffJours} jours`
    messages.push({ id: 'prochain_match', icone: '📅', texte: texteMatch, couleur: 'var(--text-2)' })
  }

  // ── Roue quotidienne dispo ──
  const jourParisRoue = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const { data: dejaRoueBriefing } = await supabase
    .from('xp_log').select('id')
    .eq('user_id', userId)
    .eq('source', 'roue_quotidienne')
    .eq('date_jour', jourParisRoue)
    .limit(1)
  if (!dejaRoueBriefing?.length) {
    messages.push({
      id: 'roue_dispo',
      icone: '🎡',
      texte: 'Ta roue du jour t\'attend — retente ta chance !',
      couleur: 'var(--accent)',
    })
  }

  return messages
}

export default function Briefing({ userId, nbPronosAttente = 0, matchs = [] }) {
  const [messages, setMessages]   = useState([])
  const [chargement, setCharg]    = useState(true)
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

  // Dédupliquer par texte — évite les doublons si une mission génère plusieurs entrées
  const texteVus = new Set()
  const visibles = messages.filter(m => {
    if (dismisses[m.id]) return false
    if (texteVus.has(m.texte)) return false
    texteVus.add(m.texte)
    return true
  })
  if (!visibles.length) return null

  const liste = [...visibles, ...visibles]
  const dureeParMsg = 5
  const dureeTotal  = dureeParMsg * visibles.length

  return (
    <div style={{
      background: '#f0ede8',
      height: 44,
      marginTop: 20, marginBottom: 10,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex', alignItems: 'center',
    }}>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          gap: 0px;
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
            flexShrink: 0, marginRight: 32,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: msg.couleur || 'var(--accent)', display: 'inline-block',
            }} />
            <span
              onClick={() => msg.lien ? navigate(msg.lien) : undefined}
              style={{
                fontSize: 12, fontWeight: 600, color: '#1a1a2e',
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
                  padding: '2px 4px', display: 'flex', alignItems: 'center',
                  color: 'rgba(0,0,0,0.35)',
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
            <span style={{ color: 'rgba(0,0,0,0.25)', fontSize: 14, marginLeft: 8 }}>|</span>
          </div>
        ))}
      </div>
    </div>
  )
}
