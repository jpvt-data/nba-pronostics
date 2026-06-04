import { supabase } from '../lib/supabase'

// --- Courbe de progression ---
// Paramètres dans config.js — ne jamais hardcoder ici
import { XP_BASE, XP_COEFFICIENT } from '../config'

/**
 * Calcule le niveau (1-100) depuis un total XP cumulatif.
 * XP requis pour niveau N = XP_BASE * XP_COEFFICIENT^(N-1)
 * On somme jusqu'à ce que le total soit dépassé.
 */
export function niveauDepuisXP(xpTotal) {
  let xpCumule = 0
  for (let n = 1; n <= 100; n++) {
    const xpPourCeNiveau = Math.round(XP_BASE * Math.pow(XP_COEFFICIENT, n - 1))
    xpCumule += xpPourCeNiveau
    if (xpTotal < xpCumule) return n
  }
  return 100
}

/**
 * XP total nécessaire pour ENTRER dans un niveau donné.
 * Utile pour afficher la barre de progression.
 */
export function xpPourNiveau(niveau) {
  let total = 0
  for (let n = 1; n < niveau; n++) {
    total += Math.round(XP_BASE * Math.pow(XP_COEFFICIENT, n - 1))
  }
  return total
}

/**
 * Ajoute de l'XP à un utilisateur.
 * - Insert dans xp_log
 * - Met à jour xp_total + niveau dans profils
 * Retourne le nouveau profil { xp_total, niveau } ou null si erreur.
 */
export async function ajouterXP(userId, xp, source, sourceId = null, meta = {}) {
  // 1. Insert xp_log
  const { error: errLog } = await supabase
    .from('xp_log')
    .insert({ user_id: userId, source, source_id: sourceId, xp_gagne: xp, meta })

  if (errLog) {
    console.error('xp_log insert error', errLog)
    return null
  }

  // 2. Récupérer xp_total actuel
  const { data: profil, error: errProfil } = await supabase
    .from('profils')
    .select('xp_total')
    .eq('id', userId)
    .single()

  if (errProfil) return null

  const nouvelXP = profil.xp_total + xp
  const nouveauNiveau = niveauDepuisXP(nouvelXP)

  // 3. Mettre à jour profils
  const { error: errUpdate } = await supabase
    .from('profils')
    .update({ xp_total: nouvelXP, niveau: nouveauNiveau })
    .eq('id', userId)

  if (errUpdate) return null

  return { xp_total: nouvelXP, niveau: nouveauNiveau }
}

/**
 * Vérifie les jalons automatiques après une action.
 * stats = { pronos_poses, pronos_corrects, serie_correcte, serie_ratee, win_rate, semaines_gagnees }
 * Déclenche ajouterXP + badge si jalon atteint pour la première fois.
 */
export async function verifierJalons(userId, stats) {
  // Récupérer les badges déjà obtenus
  const { data: profil } = await supabase
    .from('profils')
    .select('badges')
    .eq('id', userId)
    .single()

  const badgesObtenus = profil?.badges || []
  const nouveauxBadges = []

  const jalons = [
    // { condition, xp, badge (optionnel), slug unique pour xp_log }
    { slug: 'jalon_10_pronos',    condition: stats.pronos_poses >= 10,   xp: 50 },
    { slug: 'jalon_50_pronos',    condition: stats.pronos_poses >= 50,   xp: 150, badge: 'all_in' },
    { slug: 'jalon_100_pronos',   condition: stats.pronos_poses >= 100,  xp: 300 },
    { slug: 'jalon_serie_5',      condition: stats.serie_correcte >= 5,  xp: 100, badge: 'en_feu' },
    { slug: 'jalon_serie_10',     condition: stats.serie_correcte >= 10, xp: 250, badge: 'prophete' },
    { slug: 'jalon_winrate_65',   condition: stats.pronos_poses >= 20 && stats.win_rate >= 65, xp: 200, badge: 'analyste' },
    { slug: 'jalon_semaine',      condition: stats.semaines_gagnees >= 1, xp: 150, badge: 'champion' },
    { slug: 'jalon_serie_ratee_5',condition: stats.serie_ratee >= 5,     xp: 0,   badge: 'cold_turkey' },
  ]

  for (const jalon of jalons) {
    if (!jalon.condition) continue
    // Vérifier si déjà déclenché (présence dans xp_log)
    const { data: dejaLog } = await supabase
      .from('xp_log')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', jalon.slug)
      .limit(1)

    if (dejaLog && dejaLog.length > 0) continue // jalon déjà obtenu

    // Déclencher XP si xp > 0
    if (jalon.xp > 0) {
      await ajouterXP(userId, jalon.xp, 'jalon', jalon.slug)
    }

    // Attribuer badge si défini
    if (jalon.badge && !badgesObtenus.includes(jalon.badge)) {
      nouveauxBadges.push(jalon.badge)
    }
  }

  // Mise à jour badges en une fois
  if (nouveauxBadges.length > 0) {
    await supabase
      .from('profils')
      .update({ badges: [...badgesObtenus, ...nouveauxBadges] })
      .eq('id', userId)
  }

  return nouveauxBadges // retourne les nouveaux badges pour notif Briefing
}

/**
 * Vérifie et met à jour la progression d'une mission pour un utilisateur.
 * periode = 'YYYY-MM-DD' (quotidienne) | 'YYYY-WNN' (hebdo) | null (permanente/event)
 */
export async function verifierMissions(userId, conditionType, valeur, periode = null) {
  // Récupérer les missions actives correspondant à cette condition
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('condition_type', conditionType)
    .eq('actif', true)

  if (!missions || missions.length === 0) return []

  const missionsDeclenchees = []

  for (const mission of missions) {
    // Récupérer ou créer la ligne de progression
    const { data: existante } = await supabase
      .from('missions_utilisateurs')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .eq('periode', periode)
      .single()

    if (existante?.completee) continue // déjà complétée pour cette période

    const progression = (existante?.progression || 0) + valeur
    const completee = progression >= mission.condition_valeur

    if (existante) {
      await supabase
        .from('missions_utilisateurs')
        .update({
          progression,
          completee,
          completee_le: completee ? new Date().toISOString() : null
        })
        .eq('id', existante.id)
    } else {
      await supabase
        .from('missions_utilisateurs')
        .insert({
          user_id: userId,
          mission_id: mission.id,
          progression,
          completee,
          completee_le: completee ? new Date().toISOString() : null,
          periode
        })
    }

    // Déclencher XP + badge si mission complétée
    if (completee) {
      await ajouterXP(userId, mission.xp_recompense, 'mission', mission.id)
      missionsDeclenchees.push(mission)
    }
  }

  return missionsDeclenchees // retourne les missions complétées pour notif Briefing
}