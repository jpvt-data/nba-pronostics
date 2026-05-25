import { useState, useEffect } from 'react'

const BASE_ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

function LeadersStats() {
  const [leaders, setLeaders] = useState({ pts: [], reb: [], ast: [] })
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        // On récupère le scoreboard récent — derniers matchs terminés
        const hier = new Date()
        hier.setDate(hier.getDate() - 1)
        const dateHier = hier.toISOString().slice(0, 10).replace(/-/g, '')
        const response = await fetch(`${BASE_ESPN}/scoreboard?dates=${dateHier}`)
        const data = await response.json()

        const matchsTermines = (data.events || []).filter(
          evt => evt.competitions[0].status.type.name === 'STATUS_FINAL'
        )
        console.log('matchs terminés:', matchsTermines.length)
        console.log('events:', data.events?.length)
        console.log('competition:', matchsTermines[0]?.competitions[0])
        console.log('leaders ESPN:', matchsTermines[0]?.competitions[0]?.leaders)

        // Collecte les leaders de chaque match terminé
        const statsJoueurs = {}

        matchsTermines.forEach(evt => {
          const competition = evt.competitions[0]
          const leadersMatch = competition.leaders || []

          leadersMatch.forEach(cat => {
            const catNom = cat.name // points, rebounds, assists
            if (!['points', 'rebounds', 'assists'].includes(catNom)) return

            cat.leaders?.forEach(l => {
              const id = l.athlete?.id
              if (!id) return
              if (!statsJoueurs[id]) {
                statsJoueurs[id] = {
                  nom: l.athlete.displayName,
                  equipe: l.athlete.team?.abbreviation || '',
                  photo: l.athlete.headshot || null,
                  points: 0, rebounds: 0, assists: 0,
                  matchs: 0,
                }
              }
              statsJoueurs[id][catNom] += parseFloat(l.value) || 0
              statsJoueurs[id].matchs++
            })
          })
        })
        console.log('statsJoueurs:', statsJoueurs)
        console.log('joueurs:', Object.values(statsJoueurs))

        const joueurs = Object.values(statsJoueurs)

        // Top 3 par catégorie sur les matchs récents
        const top = (cat) => [...joueurs]
          .sort((a, b) => b[cat] - a[cat])
          .slice(0, 3)

        setLeaders({
          pts: top('points'),
          reb: top('rebounds'),
          ast: top('assists'),
        })
      } catch (err) {
        console.error('Erreur LeadersStats:', err)
      }
      setChargement(false)
    }
    init()
  }, [])

  const categories = [
    { label: 'Points', clé: 'pts', stat: 'points' },
    { label: 'Rebonds', clé: 'reb', stat: 'rebounds' },
    { label: 'Passes', clé: 'ast', stat: 'assists' },
  ]

  if (chargement) return null

  const aucunDonnée = categories.every(cat => leaders[cat.clé].length === 0)
  if (aucunDonnée) return null

  return (
    <div style={{ margin: '1.5rem 0 4rem' }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Leaders — matchs récents
      </h3>

      {categories.map(({ label, clé, stat }) => (
        leaders[clé].length > 0 && (
          <div key={clé} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 11, color: '#444', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            {leaders[clé].map((joueur, j) => (
              <div key={j} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                border: '1px solid #1f1f1f',
                borderRadius: 8, marginBottom: 4,
              }}>
                {joueur.photo && (
                  <img src={joueur.photo} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <span style={{ flex: 1, fontSize: 13, color: '#aaa' }}>
                  {joueur.nom} <span style={{ color: '#444' }}>{joueur.equipe}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {joueur[stat]}
                </span>
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  )
}

export default LeadersStats