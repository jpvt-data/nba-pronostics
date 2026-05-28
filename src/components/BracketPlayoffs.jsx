import { useState, useEffect, useRef } from 'react'
import { useNoSpoil } from '../context/NoSpoilContext'

const BASE    = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_V2 = 'https://site.api.espn.com/apis/v2/sports/basketball/nba'
const TIMEOUT = 10000

const TYPE_ROUNDS = {
  '14': '1er tour',
  '15': 'Demi-finales',
  '16': 'Finales de conf.',
  '17': 'FINALE',
}
const ORDRE_ROUNDS = ['1er tour', 'Demi-finales', 'Finales de conf.']

const fetchAvecTimeout = (url) => {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

const plagesPlayoffs = (saison) => {
  const plages = []
  const debut  = new Date(`${saison}-04-01`)
  const fin    = new Date(`${saison}-06-30`)
  let cur      = new Date(debut)
  while (cur <= fin) {
    const d1 = cur.toISOString().slice(0, 10).replace(/-/g, '')
    cur.setDate(cur.getDate() + 6)
    const d2 = (cur > fin ? fin : new Date(cur)).toISOString().slice(0, 10).replace(/-/g, '')
    plages.push(`${d1}-${d2}`)
    cur.setDate(cur.getDate() + 1)
  }
  return plages
}

const formatSummary = (summary, terminee) => {
  if (!summary) return ''
  const match = summary.match(/(\d+-\d+)/)
  const score = match ? match[1] : ''
  if (terminee) return score ? `${score} ✓` : '✓'
  return score
}

// ── Carte équipe ──────────────────────────────────────────────────────────────
function CarteEquipe({ equipe, gagnante, noSpoil, compact, ultra }) {
  const [imgErr, setImgErr] = useState(false)

  const pad      = ultra ? '2px 4px' : compact ? '3px 6px' : '5px 8px'
  const w        = ultra ? 50        : compact ? 70         : 90
  const logoSize = ultra ? 10        : compact ? 12         : 14
  const logoBlur = ultra ? 20        : compact ? 24         : 30
  const fsTri    = ultra ? 8         : compact ? 9          : 10
  const fsScore  = ultra ? 9         : compact ? 10         : 11

  if (!equipe) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: pad, borderRadius: 5, width: w, flexShrink: 0,
      background: 'rgba(255,255,255,0.03)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <div style={{ width: logoSize, height: logoSize, borderRadius: '50%', background: 'var(--bg-2)', flexShrink: 0 }} />
      {!ultra && <span style={{ fontSize: 8, color: 'var(--text-3)', fontStyle: 'italic' }}>TBD</span>}
    </div>
  )

  const couleur    = equipe.couleur ? `#${equipe.couleur}` : 'var(--accent)'
  const estGagnant = !noSpoil && gagnante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: pad, borderRadius: 5,
      width: w, flexShrink: 0,
      position: 'relative', overflow: 'hidden',
      background: estGagnant ? `linear-gradient(90deg, ${couleur}28, ${couleur}10)` : 'rgba(255,255,255,0.04)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: estGagnant ? `${couleur}60` : 'rgba(255,255,255,0.08)',
    }}>
      {equipe.logo && !imgErr && (
        <img src={equipe.logo} alt="" aria-hidden="true" style={{
          position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
          width: logoBlur, height: logoBlur,
          objectFit: 'contain', opacity: 0.07, filter: 'blur(2px)', pointerEvents: 'none',
        }} />
      )}
      {equipe.logo && !imgErr
        ? <img src={equipe.logo} alt={equipe.trigramme} onError={() => setImgErr(true)}
            style={{ width: logoSize, height: logoSize, objectFit: 'contain', flexShrink: 0, position: 'relative' }} />
        : <div style={{ width: logoSize, height: logoSize, borderRadius: '50%', background: couleur, flexShrink: 0 }} />
      }
      <span style={{
        fontSize: fsTri, fontWeight: 800,
        fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
        color: estGagnant ? 'var(--text-1)' : 'var(--text-2)',
        flex: 1, position: 'relative',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{equipe.trigramme}</span>
      <span style={{
        fontSize: fsScore, fontWeight: 900,
        fontFamily: 'var(--font-display)',
        color: estGagnant ? couleur : 'var(--text-3)',
        position: 'relative', flexShrink: 0, minWidth: 8, textAlign: 'right',
      }}>{noSpoil ? '?' : equipe.wins}</span>
    </div>
  )
}

// ── Matchup ───────────────────────────────────────────────────────────────────
function Matchup({ serie, noSpoil, compact, ultra }) {
  if (!serie) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CarteEquipe equipe={null} noSpoil={noSpoil} compact={compact} ultra={ultra} />
      <CarteEquipe equipe={null} noSpoil={noSpoil} compact={compact} ultra={ultra} />
    </div>
  )

  const { exterieur, domicile, terminee, summary } = serie
  const gExt     = terminee && exterieur.wins > domicile.wins
  const gDom     = terminee && domicile.wins > exterieur.wins
  const scoreAff = !noSpoil ? formatSummary(summary, terminee) : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CarteEquipe equipe={exterieur} gagnante={gExt} noSpoil={noSpoil} compact={compact} ultra={ultra} />
      <CarteEquipe equipe={domicile}  gagnante={gDom} noSpoil={noSpoil} compact={compact} ultra={ultra} />
      {scoreAff && (
        <span style={{
          fontSize: 8, paddingLeft: 2, marginTop: 1, fontWeight: 700,
          color: terminee ? 'var(--success)' : 'var(--orange)',
        }}>{scoreAff}</span>
      )}
    </div>
  )
}

// ── Colonne d'un round ────────────────────────────────────────────────────────
function ColonneRound({ label, series, noSpoil, compact, ultra }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        fontSize: ultra ? 6 : 7, fontWeight: 800, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        textAlign: 'center', marginBottom: 6, lineHeight: 1.3,
        whiteSpace: 'pre-line',
      }}>{label}</div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: ultra ? 8 : 10, flex: 1,
        justifyContent: 'space-evenly',
      }}>
        {series.length > 0
          ? series.map((s, i) => <Matchup key={i} serie={s} noSpoil={noSpoil} compact={compact} ultra={ultra} />)
          : <Matchup serie={null} noSpoil={noSpoil} compact={compact} ultra={ultra} />
        }
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function BracketPlayoffs({ saison = 2026 }) {
  const { noSpoil }           = useNoSpoil()
  const [bracket, setBracket] = useState(null)
  const [charg, setCharg]     = useState(true)
  const [erreur, setErreur]   = useState(false)
  const [largeur, setLargeur] = useState(window.innerWidth)
  const scrollRef             = useRef(null)

  useEffect(() => {
    const onResize = () => setLargeur(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const mobile = largeur < 500
  const ultra  = largeur < 380

  // Centrer le scroll sur les Finales NBA
  useEffect(() => {
    if (!bracket || !scrollRef.current) return
    const el      = scrollRef.current
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [bracket])

  useEffect(() => {
    const charger = async () => {
      setCharg(true); setErreur(false)
      try {
        const plages = plagesPlayoffs(saison)

        const [dataStandings, ...dataBoards] = await Promise.all([
          fetchAvecTimeout(`${BASE_V2}/standings?season=${saison}&seasontype=2`).then(r => r.json()),
          ...plages.map(p =>
            fetchAvecTimeout(`${BASE}/scoreboard?dates=${p}`)
              .then(r => r.json())
              .catch(() => ({ events: [] }))
          ),
        ])

        const mapInfos  = {}
        const confEst   = new Set()
        const confOuest = new Set()
        ;(dataStandings.children ?? []).forEach(conf => {
          const estEst = conf.name?.toLowerCase().includes('east')
          ;(conf.standings?.entries ?? []).forEach(e => {
            const eq = e.team
            if (!eq?.abbreviation) return
            mapInfos[eq.abbreviation] = {
              couleur: eq.color ?? null,
              logo:    eq.logos?.[0]?.href ?? null,
            }
            if (estEst) confEst.add(eq.abbreviation)
            else confOuest.add(eq.abbreviation)
          })
        })

        const tousEvents = dataBoards.flatMap(d => d.events ?? [])

        const mapSeries = new Map()
        tousEvents.forEach(evt => {
          const comp   = evt.competitions?.[0]
          const typeId = comp?.type?.id
          if (!TYPE_ROUNDS[typeId]) return
          const serie  = comp?.series
          if (!serie || serie.type !== 'playoff') return

          const home = comp.competitors?.find(c => c.homeAway === 'home')
          const away = comp.competitors?.find(c => c.homeAway === 'away')
          if (!home?.team || !away?.team) return

          const ids     = [home.team.id, away.team.id].sort()
          const cle     = `${typeId}-${ids.join('-')}`
          const triHome = home.team.abbreviation
          const triAway = away.team.abbreviation
          const sHome   = serie.competitors?.find(c => c.id === home.team.id)
          const sAway   = serie.competitors?.find(c => c.id === away.team.id)

          mapSeries.set(cle, {
            typeId,
            terminee:  serie.completed ?? false,
            summary:   serie.summary ?? '',
            exterieur: {
              trigramme: triAway,
              logo:      mapInfos[triAway]?.logo ?? away.team.logo ?? null,
              couleur:   mapInfos[triAway]?.couleur ?? null,
              wins:      sAway?.wins ?? 0,
            },
            domicile: {
              trigramme: triHome,
              logo:      mapInfos[triHome]?.logo ?? home.team.logo ?? null,
              couleur:   mapInfos[triHome]?.couleur ?? null,
              wins:      sHome?.wins ?? 0,
            },
          })
        })

        const ouest = { '1er tour': [], 'Demi-finales': [], 'Finales de conf.': [] }
        const est   = { '1er tour': [], 'Demi-finales': [], 'Finales de conf.': [] }
        let finale  = null

        mapSeries.forEach(s => {
          const round = TYPE_ROUNDS[s.typeId]
          if (s.typeId === '17') { finale = s; return }
          const isEst = confEst.has(s.exterieur.trigramme) || confEst.has(s.domicile.trigramme)
          if (isEst && est[round])   est[round].push(s)
          else if (ouest[round])     ouest[round].push(s)
        })

        setBracket({ ouest, est, finale })
        setCharg(false)
      } catch {
        setErreur(true)
        setCharg(false)
      }
    }
    charger()
  }, [saison])

  if (charg) return (
    <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      Chargement du bracket…
    </p>
  )
  if (erreur || !bracket) return (
    <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      Impossible de charger le bracket.
    </p>
  )

  const aucuneDonnee = ORDRE_ROUNDS.every(r =>
    bracket.ouest[r].length === 0 && bracket.est[r].length === 0
  ) && !bracket.finale
  if (aucuneDonnee) return (
    <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      Aucune donnée playoff disponible pour cette saison.
    </p>
  )

  // Colonnes strictement égales en 1fr — pas de minmax pour éviter les inégalités
  const minW = ultra ? 370 : mobile ? 460 : 580
  const gap  = ultra ? 4 : mobile ? 5 : 8

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, var(--accent), var(--orange))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontSize: mobile ? 13 : 15, fontWeight: 900,
          fontFamily: 'var(--font-display)', letterSpacing: '0.12em',
        }}>NBA PLAYOFFS {saison - 1}-{String(saison).slice(2)}</span>
        {noSpoil && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
            🙈 No Spoil actif — scores masqués
          </div>
        )}
      </div>

      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{
          display: 'grid',
          // 7 colonnes strictement égales en 1fr
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr',
          gap,
          minWidth: minW,
          alignItems: 'stretch', // toutes les colonnes à la même hauteur
        }}>

          {/* OUEST : 1er tour → Finales conf */}
          {ORDRE_ROUNDS.map((round, i) => (
            <ColonneRound
              key={`ouest-${round}`}
              label={i === 0 ? `OUEST\n${round}` : round}
              series={bracket.ouest[round]}
              noSpoil={noSpoil}
              compact={i > 0}
              ultra={ultra || (mobile && i > 0)}
            />
          ))}

          {/* FINALES NBA — centrées haut/bas et gauche/droite */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '0 2px',
          }}>
            <div style={{
              fontSize: ultra ? 6 : 7, fontWeight: 900, letterSpacing: '0.12em',
              background: 'linear-gradient(90deg, var(--accent), var(--orange))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              textAlign: 'center', whiteSpace: 'nowrap',
            }}>FINALES NBA</div>
            <Matchup serie={bracket.finale} noSpoil={noSpoil} compact={false} ultra={ultra} />
          </div>

          {/* EST : Finales conf → 1er tour */}
          {[...ORDRE_ROUNDS].reverse().map((round, i) => (
            <ColonneRound
              key={`est-${round}`}
              label={i === 2 ? `EST\n${round}` : round}
              series={bracket.est[round]}
              noSpoil={noSpoil}
              compact={i < 2}
              ultra={ultra || (mobile && i < 2)}
            />
          ))}

        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: 6 }}>
        Source : ESPN · {saison - 1}-{String(saison).slice(2)}
      </p>
    </div>
  )
}
