import { supabase } from '../lib/supabase'
import { recupererGagnant } from './espn'
import { ajouterXP } from './xp'

// Retourne le lundi de la semaine courante en ISO string 'YYYY-MM-DD'
const lundiFin = () => {
  const aujourd_hui = new Date()
  const jour = aujourd_hui.getDay() // 0=dim, 1=lun...
  const diffLundi = (jour === 0 ? -6 : 1 - jour)
  const lundi = new Date(aujourd_hui)
  lundi.setDate(aujourd_hui.getDate() + diffLundi)
  return lundi.toISOString().slice(0, 10)
}

export const calculerPoints = async () => {
  // Tous les pronos en attente, tous users confondus
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, equipe_choisie, user_id, match_id, matchs(id, espn_id, type_saison, saison)')
    .eq('resultat', 'en_attente')
    .not('matchs', 'is', null)

  console.log('pronos en attente:', pronosEnAttente)

  if (!pronosEnAttente?.length) return

  // Dédupliquer les matchs
  const matchsUniques = [...new Map(
    pronosEnAttente
      .filter(p => p.matchs)
      .map(p => [p.matchs.espn_id, p.matchs])
  ).values()]

  // Résultats ESPN en parallèle
  const resultatsESPN = await Promise.all(
    matchsUniques.map(m => recupererGagnant(m.espn_id))
  )

  const idxESPN = {}
  matchsUniques.forEach((m, i) => { idxESPN[m.espn_id] = resultatsESPN[i] })
  console.log('matchsUniques:', matchsUniques)
  console.log('resultatsESPN:', resultatsESPN)

  // Users concernés par cette session de validation
  const usersTraites = new Set()

  for (const matchLocal of matchsUniques) {
    const resultatESPN = idxESPN[matchLocal.espn_id]
    if (!resultatESPN) continue

    const { gagnant, type_saison, saison } = resultatESPN

    // Mettre à jour le match en cache
    await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant, type_saison, saison })
      .eq('id', matchLocal.id)

    // Tous les pronos en attente sur ce match
    const { data: tousLesPronos } = await supabase
      .from('pronos')
      .select('id, equipe_choisie, user_id')
      .eq('match_id', matchLocal.id)
      .eq('resultat', 'en_attente')

    console.log('tousLesPronos pour', matchLocal.espn_id, ':', tousLesPronos)

    if (!tousLesPronos?.length) continue

    for (const prono of tousLesPronos) {
      const correct = prono.equipe_choisie === gagnant
      const points  = correct ? 1 : 0

      const { error: errProno } = await supabase
        .from('pronos')
        .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
        .eq('id', prono.id)
      console.log('update prono', prono.id, '→ erreur:', errProno)

      // XP — prono correct
      if (correct) {
        await ajouterXP(prono.user_id, 25, 'passif', 'prono_correct')
      }

      // Marquer cet user pour vérification semaine 100%
      usersTraites.add(prono.user_id)

      if (!correct) continue

      const { data: membres, error: errMembres } = await supabase
        .from('membres_groupe')
        .select('id, points, groupes(type_saison, saison)')
        .eq('user_id', prono.user_id)
        .eq('actif', true)
      console.log('membres pour', prono.user_id, ':', membres, '→ erreur:', errMembres)

      for (const membre of (membres || [])) {
        const ligue = membre.groupes
        if (!ligue) continue
        const matcheLigue =
          !ligue.type_saison ||
          (ligue.type_saison === type_saison && ligue.saison === saison)
        if (matcheLigue) {
          const { error: errMembre } = await supabase
            .from('membres_groupe')
            .update({ points: membre.points + 1 })
            .eq('id', membre.id)
          console.log('update membre', membre.id, '→ erreur:', errMembre)
        }
      }
    }
  }

  // XP — semaine 100% pronostiquée (+50, 1×/semaine)
  const lundi = lundiFin()

  for (const userId of usersTraites) {
    // Déjà obtenu cette semaine ?
    const { data: dejaXPSemaine } = await supabase
      .from('xp_log')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', 'semaine_100_pct')
      .gte('cree_le', lundi)
      .limit(1)

    if (dejaXPSemaine && dejaXPSemaine.length > 0) continue

    // Tous les matchs terminés cette semaine
    const { data: matchsSemaine } = await supabase
      .from('matchs')
      .select('id')
      .eq('statut', 'termine')
      .gte('date_match', lundi)

    if (!matchsSemaine?.length) continue

    // Pronos de l'user sur ces matchs (correct ou incorrect = pronostiqué)
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
