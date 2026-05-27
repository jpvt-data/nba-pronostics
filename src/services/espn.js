const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_WEB = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba'

const formaterDate = (date) => date.toISOString().slice(0, 10).replace(/-/g, '')

const TYPE_SAISON = { 1: 'Pré-saison', 2: 'Saison régulière', 3: 'Playoffs', 5: 'International' }

export const recupererMatchs3Jours = async () => {
  const matchs = []
  const aujourdhui = new Date()

  for (let i = 0; i < 3; i++) {
    const date = new Date(aujourdhui)
    date.setDate(aujourdhui.getDate() + i)
    try {
      const res  = await fetch(`${BASE_URL}/scoreboard?dates=${formaterDate(date)}`)
      const data = await res.json()

      ;(data.events || []).forEach(evt => {
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
            nom:       dom.team.displayName,
            trigramme: dom.team.abbreviation,
            logo:      dom.team.logo,
            score:     dom.score ?? null,
          },
          exterieur: {
            nom:       ext.team.displayName,
            trigramme: ext.team.abbreviation,
            logo:      ext.team.logo,
            score:     ext.score ?? null,
          },
        })
      })
    } catch (err) {
      console.error('Erreur ESPN scoreboard:', err)
    }
  }
  return matchs
}

export const recupererDetailMatch = async (espnId) => {
  try {
    const res  = await fetch(`${BASE_WEB}/summary?event=${espnId}`)
    const data = await res.json()

    const comp     = data.header?.competitions?.[0]
    const saison   = data.header?.season
    const boxTeams = data.boxscore?.teams || []
    const venue    = data.gameInfo?.venue

    if (!comp) return null

    const compDom = comp.competitors?.find(c => c.homeAway === 'home')
    const compExt = comp.competitors?.find(c => c.homeAway === 'away')
    const boxDom  = boxTeams.find(t => t.homeAway === 'home')
    const boxExt  = boxTeams.find(t => t.homeAway === 'away')

    const saisonNum     = saison?.year ?? null
    const typeSaisonNum = saison?.type ?? null
    const termine       = comp.status?.type?.name === 'STATUS_FINAL'

    const extraireStats = (boxTeam, termine) => {
      if (!boxTeam?.statistics) return {}
      const idx = {}
      boxTeam.statistics.forEach(s => { idx[s.name] = s.displayValue })
      
      if (termine) {
        // Stats réelles du match
        return {
          pts: idx['points']                                              || null,
          fg:  idx['fieldGoalPct']                                        || null,
          tp:  idx['threePointFieldGoalPct']                              || null,
          reb: idx['totalRebounds']                                       || null,
          ast: idx['assists']                                             || null,
          blk: idx['blocks']                                              || null,
          stl: idx['steals']                                              || null,
          to:  idx['turnovers']                                           || null,
        }
      } else {
        // Stats moyennes saison (match à venir)
        return {
          pts: idx['avgPoints']              || null,
          fg:  idx['fieldGoalPct']           || null,
          tp:  idx['threePointFieldGoalPct'] || null,
          reb: idx['avgRebounds']            || null,
          ast: idx['avgAssists']             || null,
          blk: idx['avgBlocks']              || null,
          stl: idx['avgSteals']              || null,
          to:  idx['avgTotalTurnovers']      || null,
        }
      }
    }

    const extraireLeaders = (teamLeaders) => {
      if (!teamLeaders?.leaders) return []
      return teamLeaders.leaders.slice(0, 3).map(cat => {
        const leader = cat.leaders?.[0]
        return {
          categorie: cat.displayName,
          valeur:    leader?.displayValue || null,
          joueur:    leader?.athlete?.displayName || null,
          photo:     leader?.athlete?.headshot?.href || null,
        }
      })
    }

    const extraireL5 = (teamL5) => {
      if (!teamL5?.events) return []
      return teamL5.events.slice(0, 5).map(e => ({
        resultat:   e.gameResult,
        score:      e.score,
        adversaire: e.opponent?.displayName || null,
      }))
    }

    const extraireBlessés = (teamInjuries) => {
      if (!teamInjuries?.injuries) return []
      return teamInjuries.injuries.map(inj => ({
        joueur: inj.athlete?.displayName || null,
        photo:  inj.athlete?.headshot?.href || null,
        statut: inj.type?.description || inj.status || null,
        type:   inj.details?.type || null,
      }))
    }

    const leadersData = data.leaders || []
    const l5Data      = data.lastFiveGames || []
    const injData     = data.injuries || []

    const leadersDom = leadersData.find(l => l.team?.id === boxDom?.team?.id)
    const leadersExt = leadersData.find(l => l.team?.id === boxExt?.team?.id)
    const l5Dom      = l5Data.find(l => l.team?.id === boxDom?.team?.id)
    const l5Ext      = l5Data.find(l => l.team?.id === boxExt?.team?.id)
    const injDom     = injData.find(l => l.team?.id === boxDom?.team?.id)
    const injExt     = injData.find(l => l.team?.id === boxExt?.team?.id)

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
      typeSaison:     TYPE_SAISON[typeSaisonNum] || null,
      saisonNum,
      typeSaisonNum,
      stade:          venue?.fullName || null,
      ville:          venue?.address?.city || null,
      serie: serie ? {
        description: serie.round || serie.description || null,
        summary:     serie.summary || null,
      } : null,
      domicile: {
        nom:       boxDom?.team?.displayName || '',
        trigramme: boxDom?.team?.abbreviation || '',
        logo:      boxDom?.team?.logo || null,
        score:     compDom?.score ?? null,
        winner:    compDom?.winner ?? false,
        periodes:  compDom?.linescores?.map(p => p.displayValue ?? p.value) || [],
        stats:     extraireStats(boxDom, termine),
        leaders:   extraireLeaders(leadersDom),
        l5:        extraireL5(l5Dom),
        blessés:   extraireBlessés(injDom),
      },
      exterieur: {
        nom:       boxExt?.team?.displayName || '',
        trigramme: boxExt?.team?.abbreviation || '',
        logo:      boxExt?.team?.logo || null,
        score:     compExt?.score ?? null,
        winner:    compExt?.winner ?? false,
        periodes:  compExt?.linescores?.map(p => p.displayValue ?? p.value) || [],
        stats:     extraireStats(boxExt, termine),
        leaders:   extraireLeaders(leadersExt),
        l5:        extraireL5(l5Ext),
        blessés:   extraireBlessés(injExt),
      },
    }
  } catch (err) {
    console.error('Erreur ESPN summary:', err)
    return null
  }
}

export const recupererGagnant = async (espnId) => {
  try {
    const res  = await fetch(`${BASE_WEB}/summary?event=${espnId}`)
    const data = await res.json()
    const comp = data.header?.competitions?.[0]
    if (!comp || comp.status?.type?.name !== 'STATUS_FINAL') return null
    const gagnant = comp.competitors.find(c => c.winner === true)
    if (!gagnant) return null
    return {
      gagnant:     gagnant.team.abbreviation,
      type_saison: data.header?.season?.type ?? null,
      saison:      data.header?.season?.year ?? null,
    }
  } catch (err) {
    console.error('Erreur récupération gagnant:', err)
    return null
  }
}