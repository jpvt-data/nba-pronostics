// src/services/points.js
import { supabase } from '../lib/supabase'
import { recupererGagnant, recupererStatutMatch } from './espn'
import { ajouterXP, verifierJalons, verifierMissions } from './xp'
import { donnerCartes } from './cartes'

// Retourne le lundi de la semaine courante en ISO string 'YYYY-MM-DD' heure Paris
export const lundiFin = () => {
  const maintenant = new Date()
  const dateStrParis = maintenant.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const paris = new Date(dateStrParis + 'T12:00:00')
  const jour = paris.getDay()
  const diffLundi = (jour === 0 ? -6 : 1 - jour)
  const lundi = new Date(paris)
  lundi.setDate(paris.getDate() + diffLundi)
  return lundi.toISOString().slice(0, 10)
}

// Retourne les bornes UTC de la semaine Paris précédente
// Retourne null si on n'est pas lundi heure Paris
const bornesSemainePrecedente = () => {
  const maintenant = new Date()
  const paris = new Date(maintenant.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  if (paris.getDay() !== 1) return null
  const offsetMs = maintenant.getTime() - paris.getTime()
  const lundiDebut = new Date(paris)
  lundiDebut.setDate(paris.getDate() - 7)
  lundiDebut.setHours(0, 1, 0, 0)
  const dimancheFin = new Date(paris)
  dimancheFin.setDate(paris.getDate() - 1)
  dimancheFin.setHours(23, 59, 59, 999)
  return {
    debut: new Date(lundiDebut.getTime() + offsetMs).toISOString(),
    fin:   new Date(dimancheFin.getTime() + offsetMs).toISOString(),
  }
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

// Résout une fourchette — appelé depuis calculerPoints (pass 1 et pass 2)
const résoudreFourchette = async (pe, fourchetteReelle, type_saison, saison, lundi) => {
  const correctEcart = pe.fourchette_choisie === fourchetteReelle

  // Vérifier si le prono du même match est correct pour cet user
  const { data: pronoUser } = await supabase
    .from('pronos')
    .select('resultat')
    .eq('user_id', pe.user_id)
    .eq('match_id', pe.match_id)
    .maybeSingle()
  const pronoCorrect = pronoUser?.resultat === 'correct'

  // Règle points : fourchette seule = 1pt, prono+fourchette = +2pts (total 3)
  const pointsEcart = correctEcart ? (pronoCorrect ? 2 : 1) : 0

  await supabase
    .from('pronos_ecart')
    .update({ fourchette_reelle: fourchetteReelle, correct: correctEcart, points_gagnes: pointsEcart })
    .eq('id', pe.id)

  if (correctEcart) {
    await ajouterXP(pe.user_id, 30, 'passif', 'fourchette_correcte')
    await verifierMissions(pe.user_id, 'fourchette_correcte', 1, lundi, 'increment')
    await donnerCartes(pe.user_id, 1, 'fourchette')

    // Jalon — 10 fourchettes correctes cumulatives
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

    // +pts ligue si fourchette correcte
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

export const calculerPoints = async () => {
  const lundi = lundiFin()

  // ── PASSE 0 : nettoyage des matchs annulés / inutiles ────────────────────
  // Matchs locaux non terminés dont la date est dépassée de plus de 24h.
  // On interroge ESPN : si STATUS_CANCELED / STATUS_POSTPONED / STATUS_UNNECESSARY
  // → suppression des pronos + marquage match 'annule' (ex: Game 6/7 non joués).
  const STATUTS_ANNULES = ['STATUS_CANCELED', 'STATUS_POSTPONED', 'STATUS_UNNECESSARY']
  const hier = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: matchsOrphelins } = await supabase
    .from('matchs')
    .select('id, espn_id')
    .neq('statut', 'termine')
    .neq('statut', 'annule')
    .lt('date_match', hier)

  for (const m of (matchsOrphelins || [])) {
    const statut = await recupererStatutMatch(m.espn_id)
    if (!statut || !STATUTS_ANNULES.includes(statut)) continue

    console.log(`[nettoyage] Match annulé détecté — espn_id:${m.espn_id} statut ESPN:${statut}`)

    // Supprimer fourchettes puis pronos liés à ce match
    await supabase.from('pronos_ecart').delete().eq('match_id', m.id)
    await supabase.from('pronos').delete().eq('match_id', m.id)
    await supabase.from('matchs').update({ statut: 'annule' }).eq('id', m.id)
  }

  // ── PASSE 1 : résoudre les pronos en attente ──────────────────────────────
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, equipe_choisie, user_id, match_id, matchs(id, espn_id, type_saison, saison)')
    .eq('resultat', 'en_attente')
    .not('matchs', 'is', null)

  console.log('pronos en attente:', pronosEnAttente)

  const usersTraites = new Set()

  if (pronosEnAttente?.length) {
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

    for (const matchLocal of matchsUniques) {
      const resultatESPN = idxESPN[matchLocal.espn_id]
      if (!resultatESPN) continue

      const { gagnant, type_saison, saison, ecart_final, score_domicile, score_exterieur, tag } = resultatESPN

      const fourchetteReelle =
        ecart_final == null ? null :
        ecart_final <= 5    ? 'serre'     :
        ecart_final <= 10   ? 'modere'    :
        ecart_final <= 20   ? 'net'       :
        ecart_final <= 30   ? 'large'     : 'domination'

      await supabase
        .from('matchs')
        .update({ statut: 'termine', gagnant, type_saison, saison, score_domicile, score_exterieur, tag })
        .eq('id', matchLocal.id)

      const { data: tousLesPronos } = await supabase
        .from('pronos')
        .select('id, equipe_choisie, user_id')
        .eq('match_id', matchLocal.id)
        .eq('resultat', 'en_attente')

      for (const prono of (tousLesPronos || [])) {
        const correct = prono.equipe_choisie === gagnant
        const points  = correct ? 1 : 0

        await supabase
          .from('pronos')
          .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
          .eq('id', prono.id)

        if (correct) {
          await ajouterXP(prono.user_id, 25, 'passif', 'prono_correct')
          await donnerCartes(prono.user_id, 1, 'prono')

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

        usersTraites.add(prono.user_id)
      }

      // Résoudre les fourchettes de ce match (dans la foulée des pronos)
      if (fourchetteReelle) {
        const { data: pronosEcart } = await supabase
          .from('pronos_ecart')
          .select('id, user_id, fourchette_choisie, match_id')
          .eq('match_id', matchLocal.id)
          .is('fourchette_reelle', null)

        for (const pe of (pronosEcart || [])) {
          await résoudreFourchette(pe, fourchetteReelle, type_saison, saison, lundi)
          usersTraites.add(pe.user_id)
        }
      }
    }
  }

  // ── PASSE 2 : fourchettes orphelines sur matchs déjà terminés ────────────
  // Couvre le cas où le prono a été résolu avant que la fourchette soit posée,
  // ou si calculerPoints a tourné sans traiter la fourchette
  const { data: fourchetteOrphelines } = await supabase
    .from('pronos_ecart')
    .select('id, user_id, fourchette_choisie, match_id, matchs(id, espn_id, statut, score_domicile, score_exterieur, type_saison, saison)')
    .is('fourchette_reelle', null)
    .not('matchs', 'is', null)

  for (const pe of (fourchetteOrphelines || [])) {
    const m = pe.matchs
    if (!m || m.statut !== 'termine') continue
    if (m.score_domicile == null || m.score_exterieur == null) continue

    const ecartFinal = Math.abs(m.score_domicile - m.score_exterieur)
    const fourchetteReelle =
      ecartFinal <= 5  ? 'serre'     :
      ecartFinal <= 10 ? 'modere'    :
      ecartFinal <= 20 ? 'net'       :
      ecartFinal <= 30 ? 'large'     : 'domination'

    await résoudreFourchette(pe, fourchetteReelle, m.type_saison, m.saison, lundi)
    usersTraites.add(pe.user_id)
  }

  // ── Post-validation : jalons + semaine 100% ───────────────────────────────
  for (const userId of usersTraites) {
    const stats = await calculerStatsUser(userId)
    await verifierJalons(userId, stats)

    const bornes = bornesSemainePrecedente()
    if (!bornes) continue

    const { data: dejaXPSemaine } = await supabase
      .from('xp_log')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', 'semaine_100_pct')
      .gte('cree_le', bornes.debut)
      .lte('cree_le', bornes.fin)
      .limit(1)

    if (dejaXPSemaine?.length > 0) continue

    const { data: matchsSemaine } = await supabase
      .from('matchs')
      .select('id')
      .eq('statut', 'termine')
      .gte('date_match', bornes.debut)
      .lte('date_match', bornes.fin)

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
