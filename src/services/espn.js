// Service ESPN — récupération des matchs NBA
const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

// Formate une date en YYYYMMDD pour ESPN
const formaterDate = (date) => {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

// Récupère les matchs sur les 3 prochains jours
export const recupererMatchs3Jours = async () => {
  const matchs = []
  const aujourd_hui = new Date()

  for (let i = 0; i < 3; i++) {
    const date = new Date(aujourd_hui)
    date.setDate(aujourd_hui.getDate() + i)
    const dateFormatee = formaterDate(date)

    try {
      const response = await fetch(`${BASE_URL}/scoreboard?dates=${dateFormatee}`)
      const data = await response.json()

      const evenements = data.events || []
      evenements.forEach((evt) => {
        const competition = evt.competitions[0]
        const domicile = competition.competitors.find(c => c.homeAway === 'home')
        const exterieur = competition.competitors.find(c => c.homeAway === 'away')

        matchs.push({
          espn_id: evt.id,
          date: evt.date,
          statut: competition.status.type.name, // STATUS_SCHEDULED | STATUS_IN_PROGRESS | STATUS_FINAL
          domicile: {
            nom: domicile.team.displayName,
            trigramme: domicile.team.abbreviation,
            logo: domicile.team.logo,
            score: domicile.score || null,
          },
          exterieur: {
            nom: exterieur.team.displayName,
            trigramme: exterieur.team.abbreviation,
            logo: exterieur.team.logo,
            score: exterieur.score || null,
          },
        })
      })
    } catch (err) {
      console.error(`Erreur ESPN pour la date ${dateFormatee}:`, err)
    }
  }

  return matchs
}