const BASE_URL    = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_WEB    = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_SL     = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba-summer-las-vegas'
const BASE_WEB_SL = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba-summer-las-vegas'

const formaterDate = (date) => date.toISOString().slice(0, 10).replace(/-/g, '')

const TYPE_SAISON = {
  1: 'Pré-saison',
  2: 'Saison régulière',
  3: 'Playoffs',
  5: 'Play-In',
}

const fetchAvecTimeout = (url, ms = 8000) => {
  const ctrl = new AbortController()
  const id   = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}

// Détection type — utilisée scoreboard (notes disponibles) + fallback summary (season.type seul)
const detecterType = (seasonType, headline, compTypeAbbr, isSummerLeague = false) => {
  if (isSummerLeague) return 'summer_league'
  const h = (headline || '').toLowerCase()
  const c = compTypeAbbr || ''

  if (seasonType === 1) return 'preseason'
  if (seasonType === 5) return 'playin'
  if (seasonType === 3) {
    return ['nba finals', 'the finals'].some(p => h.includes(p)) ? 'finals' : 'playoffs'
  }
  if (c === 'ALLSTAR' || ['all-star', 'allstar', 'all star'].some(p => h.includes(p))) return 'allstar'
  if (seasonType === 2) {
    if (['nba cup', 'in-season tournament', 'nba cup - group', 'nba cup - knockout', 'nba cup - semifinal', 'nba cup - final', 'nba cup championship'].some(p => h.includes(p))) return 'nbacup'
    if (['play-in'].some(p => h.includes(p))) return 'playin'
    return 'regular'
  }
  return 'regular'
}

// Tags qui apportent une info supplémentaire vs typeSaison — affichés en badge enrichi
export const TAG_CONFIG = {
  nbacup:       { label: 'NBA Cup',      couleur: '#f97316' },
  allstar:      { label: 'All-Star',     couleur: '#f59e0b' },
  playin:       { label: 'Play-In',      couleur: '#22c55e' },
  playoffs:     { label: 'Playoffs',     couleur: '#ef4444' },
  finals:       { label: 'NBA Finals',   couleur: '#e11d48' },
  // preseason, regular, summer_league → pas de badge enrichi (déjà dans typeSaison)
}

export const recupererMatchs3Jours = async () => {
  const aujourdhui = new Date()
  const dates = [0, 1, 2].map(i => {
    const d = new Date(aujourdhui)
    d.setDate(aujourdhui.getDate() + i)
    return formaterDate(d)
  })

  const resultats = await Promise.allSettled(
    dates.map(d => fetchAvecTimeout(`${BASE_URL}/scoreboard?dates=${d}`).then(r => r.json()))
  )

  const matchs = []
  resultats.forEach((res, i) => {
    if (res.status === 'rejected') { console.error(`Erreur ESPN scoreboard J+${i}:`, res.reason); return }
    ;(res.value.events || []).forEach(evt => {
      const comp  = evt.competitions[0]
      const dom   = comp.competitors.find(c => c.homeAway === 'home')
      const ext   = comp.competitors.find(c => c.homeAway === 'away')
      const venue = comp.venue
      matchs.push({
        espn_id:        evt.id,
        date:           evt.date,
        statut:         comp.status.type.name,
        saison:         evt.season?.year ? `${evt.season.year - 1}-${String(evt.season.year).slice(2)}` : null,
        typeSaison:     TYPE_SAISON[evt.season?.type] || null,
        saisonNum:      evt.season?.year ?? null,
        typeSaisonNum:  evt.season?.type ?? null,
        stade:          venue?.fullName || null,
        ville:          venue?.address?.city || null,
        domicile: {
          nom: dom.team.displayName, trigramme: dom.team.abbreviation, logo: dom.team.logo,
          score: dom.score ?? null, color: dom.team.color || null, alternateColor: dom.team.alternateColor || null,
        },
        exterieur: {
          nom: ext.team.displayName, trigramme: ext.team.abbreviation, logo: ext.team.logo,
          score: ext.score ?? null, color: ext.team.color || null, alternateColor: ext.team.alternateColor || null,
        },
      })
    })
  })
  return matchs
}

export const recupererDetailMatch = async (espnId) => {
  // Appels parallèles : summary (données riches) + scoreboard date du match (pour headline/notes)
  let data          = null
  let isSummerLeague = false

  // Étape 1 : summary NBA standard
  try {
    const res  = await fetchAvecTimeout(`${BASE_WEB}/summary?event=${espnId}`)
    const json = await res.json()
    if (json?.header?.competitions?.[0]) data = json
  } catch { /* silencieux */ }

  // Étape 2 : fallback Summer League si NBA échoue
  if (!data) {
    try {
      const res  = await fetchAvecTimeout(`${BASE_WEB_SL}/summary?event=${espnId}`)
      const json = await res.json()
      if (json?.header?.competitions?.[0]) { data = json; isSummerLeague = true }
    } catch { /* silencieux */ }
  }

  if (!data) return null

  try {
    const comp     = data.header?.competitions?.[0]
    const saison   = data.header?.season
    const boxTeams = data.boxscore?.teams || []
    const venue    = data.gameInfo?.venue

    if (!comp) return null

    const compDom       = comp.competitors?.find(c => c.homeAway === 'home')
    const compExt       = comp.competitors?.find(c => c.homeAway === 'away')
    const boxDom        = boxTeams.find(t => t.homeAway === 'home')
    const boxExt        = boxTeams.find(t => t.homeAway === 'away')
    const saisonNum     = saison?.year ?? null
    const typeSaisonNum = saison?.type ?? null
    const termine       = comp.status?.type?.name === 'STATUS_FINAL'

    // Étape 3 : scoreboard sur la date du match pour récupérer headline/notes
    // (le summary n'expose pas comp.notes)
    let headline = ''
    let tag      = detecterType(typeSaisonNum, '', comp.type?.abbreviation, isSummerLeague)

    if (comp.date) {
      try {
        // Plage J-1 → J pour couvrir les matchs UTC indexés la veille par ESPN
        const dateStr    = comp.date.slice(0, 10).replace(/-/g, '')
        const dateObjM1  = new Date(comp.date)
        dateObjM1.setDate(dateObjM1.getDate() - 1)
        const dateMinus1 = dateObjM1.toISOString().slice(0, 10).replace(/-/g, '')
        const sbBase     = isSummerLeague ? BASE_SL : BASE_URL
        const res        = await fetchAvecTimeout(`${sbBase}/scoreboard?dates=${dateMinus1}-${dateStr}&limit=200`)
        const sb      = await res.json()
        const evtSB   = (sb.events || []).find(e => e.id === espnId)
        if (evtSB) {
          const compSB = evtSB.competitions?.[0]
          headline     = compSB?.notes?.[0]?.headline || ''
          tag          = detecterType(
            evtSB.season?.type,
            headline,
            compSB?.type?.abbreviation,
            false
          )
        }
      } catch { /* silencieux */ }
    }

    // Fallback Finals depuis seasonseries — filet de sécurité si scoreboard sans headline
    if (typeSaisonNum === 3 && tag !== 'finals') {
      const seriePlayoff = data.seasonseries?.find(s => s.type === 'playoff')
      if (seriePlayoff?.description === 'NBA Finals') tag = 'finals'
    }

    // Helpers extraction
    const extraireStats = (boxTeam) => {
      if (!boxTeam?.statistics) return {}
      const idx = {}
      boxTeam.statistics.forEach(s => { idx[s.name] = s.displayValue })
      return termine ? {
        pts: idx['points'] || null, fg: idx['fieldGoalPct'] || null,
        tp: idx['threePointFieldGoalPct'] || null, reb: idx['totalRebounds'] || null,
        ast: idx['assists'] || null, blk: idx['blocks'] || null,
        stl: idx['steals'] || null, to: idx['turnovers'] || null,
      } : {
        pts: idx['avgPoints'] || null, fg: idx['fieldGoalPct'] || null,
        tp: idx['threePointFieldGoalPct'] || null, reb: idx['avgRebounds'] || null,
        ast: idx['avgAssists'] || null, blk: idx['avgBlocks'] || null,
        stl: idx['avgSteals'] || null, to: idx['avgTotalTurnovers'] || null,
      }
    }

    const extraireLeaders = (teamLeaders) => {
      if (!teamLeaders?.leaders) return []
      return teamLeaders.leaders.slice(0, 3).map(cat => {
        const leader = cat.leaders?.[0]
        return { categorie: cat.displayName, valeur: leader?.displayValue || null, joueur: leader?.athlete?.displayName || null, photo: leader?.athlete?.headshot?.href || null }
      })
    }

    const extraireL5 = (teamL5) => {
      if (!teamL5?.events) return []
      return teamL5.events.slice(0, 5).map(e => ({ resultat: e.gameResult, score: e.score, adversaire: e.opponent?.displayName || null }))
    }

    const extraireBlessés = (teamInjuries) => {
      if (!teamInjuries?.injuries) return []
      return teamInjuries.injuries.map(inj => ({
        joueur: inj.athlete?.displayName || null, photo: inj.athlete?.headshot?.href || null,
        statut: inj.type?.description || inj.status || null, type: inj.details?.type || null,
      }))
    }

    const leadersData = data.leaders || []
    const l5Data      = data.lastFiveGames || []
    const injData     = data.injuries || []
    const leadersDom  = leadersData.find(l => l.team?.id === boxDom?.team?.id)
    const leadersExt  = leadersData.find(l => l.team?.id === boxExt?.team?.id)
    const l5Dom       = l5Data.find(l => l.team?.id === boxDom?.team?.id)
    const l5Ext       = l5Data.find(l => l.team?.id === boxExt?.team?.id)
    const injDom      = injData.find(l => l.team?.id === boxDom?.team?.id)
    const injExt      = injData.find(l => l.team?.id === boxExt?.team?.id)

    const seriePlayoff = data.seasonseries?.find(s => s.type === 'playoff')
    const serieRegular = data.seasonseries?.find(s => s.type === 'season')
    const serie        = seriePlayoff || serieRegular || null

    return {
      espn_id:        comp.id,
      date:           comp.date,
      statut:         comp.status?.type?.name,
      statutLabel:    comp.status?.type?.description,
      periode:        comp.status?.period,
      clock:          comp.status?.displayClock,
      saison:         saisonNum ? `${saisonNum - 1}-${String(saisonNum).slice(2)}` : null,
      typeSaison:     isSummerLeague ? 'Summer League' : (TYPE_SAISON[typeSaisonNum] || null),
      saisonNum,
      typeSaisonNum,
      tag,
      headline,
      isSummerLeague,
      stade:          venue?.fullName || null,
      ville:          venue?.address?.city || null,
      serie: serie ? { description: serie.round || serie.description || null, summary: serie.summary || null } : null,
      domicile: {
        nom:            boxDom?.team?.displayName || compDom?.team?.displayName || '',
        trigramme:      boxDom?.team?.abbreviation || compDom?.team?.abbreviation || '',
        logo:           boxDom?.team?.logo || compDom?.team?.logo || null,
        color:          boxDom?.team?.color || compDom?.team?.color || null,
        alternateColor: boxDom?.team?.alternateColor || compDom?.team?.alternateColor || null,
        score:          compDom?.score ?? null,
        winner:         compDom?.winner ?? false,
        periodes:       compDom?.linescores?.map(p => p.displayValue ?? p.value) || [],
        stats:          extraireStats(boxDom),
        leaders:        extraireLeaders(leadersDom),
        l5:             extraireL5(l5Dom),
        blessés:        extraireBlessés(injDom),
      },
      exterieur: {
        nom:            boxExt?.team?.displayName || compExt?.team?.displayName || '',
        trigramme:      boxExt?.team?.abbreviation || compExt?.team?.abbreviation || '',
        logo:           boxExt?.team?.logo || compExt?.team?.logo || null,
        color:          boxExt?.team?.color || compExt?.team?.color || null,
        alternateColor: boxExt?.team?.alternateColor || compExt?.team?.alternateColor || null,
        score:          compExt?.score ?? null,
        winner:         compExt?.winner ?? false,
        periodes:       compExt?.linescores?.map(p => p.displayValue ?? p.value) || [],
        stats:          extraireStats(boxExt),
        leaders:        extraireLeaders(leadersExt),
        l5:             extraireL5(l5Ext),
        blessés:        extraireBlessés(injExt),
      },
    }
  } catch (err) {
    console.error('Erreur ESPN summary:', err)
    return null
  }
}

export const recupererTimeline = async (joursAvant = 15, joursApres = 15) => {
  const aujourdhui = new Date()
  const debut = new Date(aujourdhui); debut.setDate(aujourdhui.getDate() - joursAvant); debut.setHours(0,0,0,0)
  const fin   = new Date(aujourdhui); fin.setDate(aujourdhui.getDate() + joursApres);   fin.setHours(23,59,59,999)

  const plages = []
  let moisCurseur = new Date(debut.getFullYear(), debut.getMonth(), 1)
  const moisFin   = new Date(fin.getFullYear(), fin.getMonth(), 1)
  while (moisCurseur <= moisFin) {
    const debutMois = new Date(moisCurseur)
    const finMois   = new Date(moisCurseur.getFullYear(), moisCurseur.getMonth() + 1, 0)
    const d1 = formaterDate(debutMois > debut ? debutMois : debut)
    const d2 = formaterDate(finMois   < fin   ? finMois   : fin)
    plages.push(`${d1}-${d2}`)
    moisCurseur.setMonth(moisCurseur.getMonth() + 1)
  }

  const resultats = await Promise.allSettled(
    plages.map(plage => fetchAvecTimeout(`${BASE_URL}/scoreboard?dates=${plage}&limit=500`).then(r => r.json()))
  )

  const matchs = []
  resultats.forEach((res, i) => {
    if (res.status === 'rejected') { console.error(`Erreur ESPN timeline plage ${i}:`, res.reason); return }
    ;(res.value.events || []).forEach(evt => {
      const comp      = evt.competitions[0]
      const dom       = comp.competitors.find(c => c.homeAway === 'home')
      const ext       = comp.competitors.find(c => c.homeAway === 'away')
      const venue     = comp.venue
      const dateMatch = new Date(evt.date)
      const statut = comp.status.type.name
      // Ignorer les matchs annulés ou reportés (Game 6/7 potentiels non joués)
      if (statut === 'STATUS_POSTPONED' || statut === 'STATUS_CANCELED' || statut === 'STATUS_UNNECESSARY') return
      if (dateMatch < debut || dateMatch > fin) return
      const headline = comp.notes?.[0]?.headline || ''
      matchs.push({
        espn_id: evt.id, date: evt.date, statut,
        saison: evt.season?.year ? `${evt.season.year - 1}-${String(evt.season.year).slice(2)}` : null,
        typeSaison: TYPE_SAISON[evt.season?.type] || null,
        saisonNum: evt.season?.year ?? null, typeSaisonNum: evt.season?.type ?? null,
        tag: detecterType(evt.season?.type, headline, comp.type?.abbreviation, false),
        headline,
        stade: venue?.fullName || null, ville: venue?.address?.city || null,
        canal: comp.broadcasts?.[0]?.names?.[0] || null,
        domicile: { nom: dom.team.displayName, trigramme: dom.team.abbreviation, logo: dom.team.logo, score: dom.score ?? null, color: dom.team.color || null, alternateColor: dom.team.alternateColor || null },
        exterieur: { nom: ext.team.displayName, trigramme: ext.team.abbreviation, logo: ext.team.logo, score: ext.score ?? null, color: ext.team.color || null, alternateColor: ext.team.alternateColor || null },
      })
    })
  })
  matchs.sort((a, b) => new Date(a.date) - new Date(b.date))
  return matchs
}

export const recupererGagnant = async (espnId) => {
  try {
    const res  = await fetchAvecTimeout(`${BASE_WEB}/summary?event=${espnId}`)
    const data = await res.json()
    const comp = data.header?.competitions?.[0]
    if (!comp || comp.status?.type?.name !== 'STATUS_FINAL') return null
    const gagnant = comp.competitors.find(c => c.winner === true)
    if (!gagnant) return null
    const dom = comp.competitors.find(c => c.homeAway === 'home')
    const ext = comp.competitors.find(c => c.homeAway === 'away')
    const score_domicile  = parseInt(dom?.score, 10) || 0
    const score_exterieur = parseInt(ext?.score, 10) || 0
    const ecart_final = Math.abs(score_domicile - score_exterieur)
    // Calcul tag depuis season.type (sans appel scoreboard supplémentaire — headline non dispo ici)
    const typeSaisonNum = data.header?.season?.type ?? null
    let tag = detecterType(typeSaisonNum, '', comp.type?.abbreviation, false)
    // Fallback Finals via seasonseries si pas de headline
    if (typeSaisonNum === 3 && tag !== 'finals') {
      const serie = data.seasonseries?.find(s => s.type === 'playoff')
      if (serie?.description === 'NBA Finals') tag = 'finals'
    }

    return { gagnant: gagnant.team.abbreviation, type_saison: typeSaisonNum, saison: data.header?.season?.year ?? null, ecart_final, score_domicile, score_exterieur, tag }
  } catch (err) {
    console.error('Erreur récupération gagnant:', err)
    return null
  }
}

// Retourne le statut ESPN brut d'un match — utilisé pour détecter les matchs
// annulés ou inutiles (Game 6/7 de séries terminées plus tôt).
// Valeurs pertinentes : STATUS_CANCELED | STATUS_POSTPONED | STATUS_UNNECESSARY | STATUS_FINAL | null (erreur réseau)
export const recupererStatutMatch = async (espnId) => {
  try {
    const res  = await fetchAvecTimeout(`${BASE_WEB}/summary?event=${espnId}`)
    const data = await res.json()
    return data.header?.competitions?.[0]?.status?.type?.name || null
  } catch (err) {
    console.error('Erreur récupération statut match:', err)
    return null
  }
}
