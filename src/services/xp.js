import { supabase } from '../lib/supabase'
import { XP_BASE, XP_COEFFICIENT } from '../config'
import { BADGES_CATALOGUE } from '../data/badges'

/**
 * Calcule le niveau (1-100) depuis un total XP cumulatif.
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
 */
export async function ajouterXP(userId, xp, source, sourceId = null, meta = {}) {
  const { error: errLog } = await supabase
    .from('xp_log')
    .insert({
      user_id:   userId,
      source,
      source_id: sourceId,
      xp_gagne:  xp,
      meta,
      date_jour: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }),
    })

  if (errLog) {
    console.error('xp_log insert error', errLog)
    return null
  }

  const { data: profil, error: errProfil } = await supabase
    .from('profils')
    .select('xp_total')
    .eq('id', userId)
    .single()

  if (errProfil) return null

  const nouvelXP      = profil.xp_total + xp
  const nouveauNiveau = niveauDepuisXP(nouvelXP)

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
 */
export async function verifierJalons(userId, stats) {
  const { data: profil } = await supabase
    .from('profils')
    .select('badges')
    .eq('id', userId)
    .single()

  const badgesObtenus  = profil?.badges || []
  const nouveauxBadges = []

  const jalons = [
    { slug: 'jalon_10_pronos',     condition: stats.pronos_poses >= 10,   xp: 50  },
    { slug: 'jalon_50_pronos',     condition: stats.pronos_poses >= 50,   xp: 150, badge: 'all_in' },
    { slug: 'jalon_100_pronos',    condition: stats.pronos_poses >= 100,  xp: 300, badge: 'marathonien' },
    { slug: 'jalon_serie_5',       condition: stats.serie_correcte >= 5,  xp: 100, badge: 'en_feu' },
    { slug: 'jalon_serie_10',      condition: stats.serie_correcte >= 10, xp: 250, badge: 'prophete' },
    { slug: 'jalon_winrate_65',    condition: stats.pronos_poses >= 20 && stats.win_rate >= 65, xp: 200, badge: 'analyste' },
    { slug: 'jalon_semaine',       condition: stats.semaines_gagnees >= 1, xp: 150, badge: 'champion' },
    { slug: 'jalon_serie_ratee_5', condition: stats.serie_ratee >= 5,     xp: 0,   badge: 'en_hibernation' },
  ]

  for (const jalon of jalons) {
    if (!jalon.condition) continue

    const { data: dejaLog } = await supabase
      .from('xp_log')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', jalon.slug)
      .limit(1)

    if (dejaLog && dejaLog.length > 0) continue

    if (jalon.xp > 0) {
      await ajouterXP(userId, jalon.xp, 'jalon', jalon.slug)
    }

    if (jalon.badge && !badgesObtenus.includes(jalon.badge)) {
      // Vérifier que le badge existe dans le catalogue
      if (BADGES_CATALOGUE.find(b => b.slug === jalon.badge)) {
        nouveauxBadges.push(jalon.badge)
      }
    }
  }

  if (nouveauxBadges.length > 0) {
    await supabase
      .from('profils')
      .update({ badges: [...badgesObtenus, ...nouveauxBadges] })
      .eq('id', userId)
  }

  return nouveauxBadges
}

/**
 * Vérifie et met à jour la progression d'une mission.
 */
export async function verifierMissions(userId, conditionType, valeur, periode = null) {
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('condition_type', conditionType)
    .eq('actif', true)

  if (!missions || missions.length === 0) return []

  const missionsDeclenchees = []

  for (const mission of missions) {
    const { data: existante } = await supabase
      .from('missions_utilisateurs')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .eq('periode', periode)
      .single()

    if (existante?.completee) continue

    const progression = (existante?.progression || 0) + valeur
    const completee   = progression >= mission.condition_valeur

    if (existante) {
      await supabase
        .from('missions_utilisateurs')
        .update({ progression, completee, completee_le: completee ? new Date().toISOString() : null })
        .eq('id', existante.id)
    } else {
      await supabase
        .from('missions_utilisateurs')
        .insert({ user_id: userId, mission_id: mission.id, progression, completee, completee_le: completee ? new Date().toISOString() : null, periode })
    }

    if (completee) {
      await ajouterXP(userId, mission.xp_recompense, 'mission', mission.id)
      missionsDeclenchees.push(mission)
    }
  }

  return missionsDeclenchees
}
