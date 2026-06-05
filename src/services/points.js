// src/services/points.js
import { supabase } from '../lib/supabase'
import { recupererGagnant } from './espn'
import { ajouterXP, verifierJalons, verifierMissions } from './xp'

// Retourne le lundi de la semaine courante en ISO string 'YYYY-MM-DD'
export const lundiFin = () => {
  const aujourd_hui = new Date()
  const jour = aujourd_hui.getDay()
  const diffLundi = (jour === 0 ? -6 : 1 - jour)
  const lundi = new Date(aujourd_hui)
  lundi.setDate(aujourd_hui.getDate() + diffLundi)
  return lundi.toISOString().slice(0, 10)
}

// Calcule les stats d'un user depuis Supabase pour verifierJalons
const calculerStatsUser = async (userId) => {
  const { data: pronos } = await supabase
    .from('pronos')
    .select('resultat')
    .eq('user_id', userId)
    .in('resultat', ['correct', 'incorrect'])
    .order('cree_le', { ascending: false })

  const { count: pronos_poses } = await supabase
    .from('pronos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('resultat', 'en_attente')

  const pronos_corrects = pronos?.filter(p => p.resultat === 'correct').length || 0

  let serie_correcte = 0
  for (const p of (pronos || [])) {
    if (p.resultat === 'correct') serie_correcte++
    else break
  }

  let serie_ratee = 0
  for (const p of (pronos || [])) {
    if (p.resultat === 'incorrect') serie_ratee++
    else break
  }

  const vingtDerniers = pronos?.slice(0, 20) || []
  const win_rate = vingtDerniers.length >= 20
    ? Math.round(vingtDerniers.filter(p => p.resultat === 'correct').length / 20 * 100)
    : 0

  const { count: semaines_gagnees } = await supabase
    .from('semaines_gagnees')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    pronos_poses:     pronos_poses || 0,
    pronos_corrects,
    serie_correcte,
    serie_ratee,
    win_rate,
    semaines_gagnees: semaines_gagnees || 0,
  }
}

export const calculerPoints = async () => {
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, equipe_choisie, user_id, match_id, matchs(id, espn_id, type_saison, saison)')
    .eq('resultat', 'en_attente')
    .not('matchs', 'is', null)

  console.log('pronos en attente:', pronosEnAttente)

  if (!pronosEnAttente?.length) return

  const matchsUniques = [...new Map(
    pronosEnAttente
      .filter(p => p.matchs)
      .map(p => [p.matchs.espn_id, p.matchs])
  ).values()]

  const resultatsESPN = await Promise.all(
    matchsUniques.map(m => recupererGagnant(m.espn_id))
  )

  const idxESPN = {}
  matchsUniques.forEach((m, i) => { idxESPN[m.espn_id] = resultatsESPN[i] })

  const usersTraites = new Set()
  const lundi = lundiFin()

  for (const matchLocal of matchsUniques) {
    const resultatESPN = idxESPN[matchLocal.espn_id]
    if (!resultatESPN) continue

    const { gagnant, type_saison, saison, ecart_final } = resultatESPN

    const fourchetteReelle =
      ecart_final == null ? null :
      ecart_final <= 5    ? 'serre'     :
      ecart_final <= 10   ? 'modere'    :
      ecart_final <= 20   ? 'net'       :
      ecart_final <= 30   ? 'large'     : 'domination'

    await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant, type_saison, saison })
      .eq('id', matchLocal.id)

    const { data: tousLesPronos } = await supabase
      .from('pronos')
      .select('id, equipe_choisie, user_id')
      .eq('match_id', matchLocal.id)
      .eq('resultat', 'en_attente')

    if (!tousLesPronos?.length) continue

    for (const prono of tousLesPronos) {
      const correct = prono.equipe_choisie === gagnant
      const points  = correct ? 1 : 0

      await supabase
        .from('pronos')
        .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
        .eq('id', prono.id)

      if (correct) {
        // XP prono correct
        await ajouterXP(prono.user_id, 25, 'passif', 'prono_correct')

        // Mission série correcte — calcul local immédiat (mode set)
        const { data: derniersP } = await supabase
          .from('pronos')
          .select('resultat')
          .eq('user_id', prono.user_id)
          .in('resultat', ['correct', 'incorrect'])
          .order('cree_le', { ascending: false })
          .limit(20)
        let serieCorrecte = 0
        for (const p of (derniersP || [])) {
          if (p.resultat === 'correct') serieCorrecte++
          else break
        }
        await verifierMissions(prono.user_id, 'serie_correcte', serieCorrecte, null, 'set')
      }

      usersTraites.add(prono.user_id)

      if (!correct) continue

      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('id, points, groupes(type_saison, saison)')
        .eq('user_id', prono.user_id)
        .eq('actif', true)

      for (const membre of (membres || [])) {
        const ligue = membre.groupes
        if (!ligue) continue
        const matcheLigue =
          !ligue.type_saison ||
          (ligue.type_saison === type_saison && ligue.saison === saison)
        if (matcheLigue) {
          await supabase
            .from('membres_groupe')
            .update({ points: membre.points + 1 })
            .eq('id', membre.id)
        }
      }
    }

    // Validation pronos_ecart
    if (fourchetteReelle) {
      const { data: pronosEcart } = await supabase
        .from('pronos_ecart')
        .select('id, user_id, fourchette_choisie')
        .eq('match_id', matchLocal.id)
        .is('fourchette_reelle', null)

      for (const pe of (pronosEcart || [])) {
        const correctEcart = pe.fourchette_choisie === fourchetteReelle
        const pointsEcart  = correctEcart ? 2 : 0

        await supabase
          .from('pronos_ecart')
          .update({ fourchette_reelle: fourchetteReelle, correct: correctEcart, points_gagnes: pointsEcart })
          .eq('id', pe.id)

        if (correctEcart) {
          // XP fourchette correcte
          await ajouterXP(pe.user_id, 30, 'passif', 'fourchette_correcte')

          // Mission fourchette correcte (hebdomadaire — incrément)
          await verifierMissions(pe.user_id, 'fourchette_correcte', 1, lundi, 'increment')

          // Jalon — 10 fourchettes correctes cumulatives → badge Tireur d'Élite
          const { data: dejaJalon } = await supabase
            .from('xp_log').select('id')
            .eq('user_id', pe.user_id)
            .eq('source_id', 'jalon_10_fourchettes')
            .limit(1)
          if (!dejaJalon || dejaJalon.length === 0) {
            const { count: nbCorrects } = await supabase
              .from('pronos_ecart')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', pe.user_id)
              .eq('correct', true)
            if (nbCorrects >= 10) {
              await ajouterXP(pe.user_id, 200, 'jalon', 'jalon_10_fourchettes')
              const { data: profil } = await supabase.from('profils').select('badges').eq('id', pe.user_id).single()
              const badges = profil?.badges || []
              if (!badges.includes('tireur_d_elite')) {
                await supabase.from('profils').update({ badges: [...badges, 'tireur_d_elite'] }).eq('id', pe.user_id)
              }
            }
          }

          // +2 pts ligue si fourchette correcte
          const { data: membres } = await supabase
            .from('membres_groupe')
            .select('id, points, groupes(type_saison, saison)')
            .eq('user_id', pe.user_id)
            .eq('actif', true)

          for (const membre of (membres || [])) {
            const ligue = membre.groupes
            if (!ligue) continue
            const matcheLigue =
              !ligue.type_saison ||
              (ligue.type_saison === type_saison && ligue.saison === saison)
            if (matcheLigue) {
              await supabase
                .from('membres_groupe')
                .update({ points: membre.points + pointsEcart })
                .eq('id', membre.id)
            }
          }
        }
      }
    }
  }

  // Post-validation : jalons + semaine 100% par user
  for (const userId of usersTraites) {
    const stats = await calculerStatsUser(userId)
    await verifierJalons(userId, stats)

    const { data: dejaXPSemaine } = await supabase
      .from('xp_log')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', 'semaine_100_pct')
      .gte('cree_le', lundi)
      .limit(1)

    if (dejaXPSemaine && dejaXPSemaine.length > 0) continue

    const { data: matchsSemaine } = await supabase
      .from('matchs')
      .select('id')
      .eq('statut', 'termine')
      .gte('date_match', lundi)

    if (!matchsSemaine?.length) continue

    const idMatchs = matchsSemaine.map(m => m.id)
    const { data: pronosUser } = await supabase
      .from('pronos')
      .select('match_id')
      .eq('user_id', userId)
      .in('match_id', idMatchs)
      .in('resultat', ['correct', 'incorrect'])

    const pronostiques = new Set(pronosUser?.map(p => p.match_id) || [])
    const tous100 = idMatchs.every(id => pronostiques.has(id))

    if (tous100) {
      await ajouterXP(userId, 50, 'jalon', 'semaine_100_pct')
      console.log('semaine 100% pour', userId)
    }
  }
}
