import { useState, useEffect } from 'react'

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

const formaterDate = (date) => date.toISOString().slice(0, 10).replace(/-/g, '')

// Génère les 4 derniers jours pour s'assurer d'avoir des matchs playoffs
const getDatesRecentes = () => {
  const aujourd = new Date()
  return [0, 1, 2, 3].map(i => {
    const d = new Date(aujourd)
    d.setDate(aujourd.getDate() - i)
    return formaterDate(d)
  })
}

const parseSerie = (evt) => {
  const comp   = evt.competitions?.[0]
  const serie  = comp?.series
  if (!serie || serie.type !== 'playoff') return null

  const dom = comp.competitors?.find(c => c.homeAway === 'home')
  const ext = comp.competitors?.find(c => c.homeAway === 'away')
  if (!dom || !ext) return null

  // Clé unique par paire d'équipes (ordre fixe par ID)
  const ids  = [dom.team.id, ext.team.id].sort()
  const cle  = ids.join('-')

  // Retrouve les wins de chaque équipe dans serie.competitors
  const serieDom = serie.competitors?.find(c => c.id === dom.team.id)
  const serieExt = serie.competitors?.find(c => c.id === ext.team.id)
  const winsDom  = serieDom?.wins ?? 0
  const winsExt  = serieExt?.wins ?? 0

  // Label résumé
  let label = serie.summary ?? ''
  if (winsDom > winsExt) label = `${dom.team.abbreviation} mène ${winsDom}-${winsExt}`
  else if (winsExt > winsDom) label = `${ext.team.abbreviation} mène ${winsExt}-${winsDom}`
  else if (winsDom === winsExt && winsDom > 0) label = `Égalité ${winsDom}-${winsExt}`
  else label = serie.summary ?? ''

  const terminee = serie.completed ?? false

  return {
    cle,
    dom: {
      trigramme: dom.team.abbreviation,
      logo:      dom.team.logo ?? null,
      wins:      winsDom,
    },
    ext: {
      trigramme: ext.team.abbreviation,
      logo:      ext.team.logo ?? null,
      wins:      winsExt,
    },
    label,
    terminee,
    total: serie.totalCompetitions ?? 7,
  }
}

export default function SeriesPlayoffs({ typeSaison }) {
  const [series, setSeries]         = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState(false)

  useEffect(() => {
    if (typeSaison !== 3) return

    const dates = getDatesRecentes()

    Promise.allSettled(
      dates.map(d =>
        fetch(`${BASE_URL}/scoreboard?dates=${d}`).then(r => r.json())
      )
    ).then(resultats => {
      const map = new Map()

      resultats.forEach(res => {
        if (res.status === 'rejected') return
        ;(res.value.events ?? []).forEach(evt => {
          const serie = parseSerie(evt)
          if (!serie) return
          // Garde uniquement la première occurrence (J le plus récent en premier)
          if (!map.has(serie.cle)) map.set(serie.cle, serie)
        })
      })

      setSeries([...map.values()])
      setChargement(false)
    }).catch(() => {
      setErreur(true)
      setChargement(false)
    })
  }, [typeSaison])

  if (typeSaison !== 3) return null
  if (erreur || (!chargement && series.length === 0)) return null

  return (
    <div style={{
      margin: '12px 16px 0',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
      padding: '16px 16px 12px',
    }}>
      <h3 style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg, var(--accent), var(--orange))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: '0.1em', fontSize: 13, fontWeight: 700, margin: 0,
      }}>Séries Playoffs</h3>

      {chargement ? (
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '8px 0' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {series.map(s => (
            <div key={s.cle} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: s.terminee ? 'rgba(34,197,94,0.06)' : 'rgba(99,102,241,0.06)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: s.terminee ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.08)',
            }}>
              {/* Équipe extérieur */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'flex-end' }}>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: s.ext.wins > s.dom.wins ? 'var(--text-1)' : 'var(--text-3)',
                }}>{s.ext.trigramme}</span>
                {s.ext.logo && <img src={s.ext.logo} alt={s.ext.trigramme} style={{ width: 22, height: 22, objectFit: 'contain' }} />}
              </div>

              {/* Score série */}
              <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 40 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
                  {s.ext.wins} – {s.dom.wins}
                </span>
              </div>

              {/* Équipe domicile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                {s.dom.logo && <img src={s.dom.logo} alt={s.dom.trigramme} style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: s.dom.wins > s.ext.wins ? 'var(--text-1)' : 'var(--text-3)',
                }}>{s.dom.trigramme}</span>
              </div>

              {/* Label */}
              {s.terminee
                ? <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>✓ Terminée</span>
                : <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, maxWidth: 80, textAlign: 'right', lineHeight: 1.3 }}>{s.label}</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}