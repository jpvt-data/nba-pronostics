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

const DIM = {
  normal:  { w: 80, h: 20, logo: 12, fsTri: 9,  fsScore: 10, gap: 10, fsSum: 8, fsLabel: 7,  labelH: 18, sumH: 12 },
  compact: { w: 56, h: 15, logo: 10, fsTri: 8,  fsScore: 9,  gap: 6,  fsSum: 7, fsLabel: 6,  labelH: 16, sumH: 10 },
  ultra:   { w: 40, h: 12, logo: 8,  fsTri: 7,  fsScore: 8,  gap: 4,  fsSum: 6, fsLabel: 5,  labelH: 14, sumH: 9  },
}

const hMatchup = (d) => d.h * 2 + 2 + d.sumH

// Trie le 1er tour pour aligner avec les demi-finales :
// Pour chaque demi-finale, trouve les 2 matchs du 1er tour qui l'ont produite
// (une des équipes de la demi vient de ce match)
function trierPremierTourParDemis(premierTour, demis) {
  if (!demis.length || !premierTour.length) return premierTour

  const resultat = []
  const utilises = new Set()

  for (const demi of demis) {
    const equipesDemi = new Set([demi.exterieur.trigramme, demi.domicile.trigramme])
    const matchesDemi = premierTour.filter((m, idx) => {
      if (utilises.has(idx)) return false
      return equipesDemi.has(m.exterieur.trigramme) || equipesDemi.has(m.domicile.trigramme)
    })
    matchesDemi.forEach(m => {
      const idx = premierTour.indexOf(m)
      if (!utilises.has(idx)) { utilises.add(idx); resultat.push(m) }
    })
  }

  // Restants non matchés
  premierTour.forEach((m, idx) => { if (!utilises.has(idx)) resultat.push(m) })
  return resultat
}

// ── Carte équipe ──────────────────────────────────────────────────────────────
function CarteEquipe({ equipe, gagnante, noSpoil, d }) {
  const [imgErr, setImgErr] = useState(false)

  if (!equipe) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      height: d.h, width: d.w, flexShrink: 0, paddingLeft: 4, paddingRight: 4,
      background: 'rgba(255,255,255,0.02)',
      borderLeft: '2px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ width: d.logo, height: d.logo, background: 'var(--bg-2)', flexShrink: 0 }} />
    </div>
  )

  const couleur    = equipe.couleur ? `#${equipe.couleur}` : 'var(--accent)'
  const estGagnant = !noSpoil && gagnante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      height: d.h, width: d.w, flexShrink: 0, paddingLeft: 4, paddingRight: 4,
      position: 'relative', overflow: 'hidden',
      background: estGagnant ? `${couleur}18` : 'rgba(255,255,255,0.03)',
      borderLeft: `2px solid ${estGagnant ? couleur : 'rgba(255,255,255,0.08)'}`,
    }}>
      {equipe.logo && !imgErr && (
        <img src={equipe.logo} alt="" aria-hidden="true" style={{
          position: 'absolute', right: -2, top: '50%', transform: 'translateY(-50%)',
          width: d.h * 1.6, height: d.h * 1.6,
          objectFit: 'contain', opacity: 0.07, filter: 'blur(2px)', pointerEvents: 'none',
        }} />
      )}
      {equipe.logo && !imgErr
        ? <img src={equipe.logo} alt={equipe.trigramme} onError={() => setImgErr(true)}
            style={{ width: d.logo, height: d.logo, objectFit: 'contain', flexShrink: 0, position: 'relative' }} />
        : <div style={{ width: d.logo, height: d.logo, background: couleur, flexShrink: 0 }} />
      }
      <span style={{
        fontSize: d.fsTri, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.03em',
        color: estGagnant ? 'var(--text-1)' : 'var(--text-2)',
        flex: 1, position: 'relative', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{equipe.trigramme}</span>
      <span style={{
        fontSize: d.fsScore, fontWeight: 900, fontFamily: 'var(--font-display)',
        color: estGagnant ? couleur : 'var(--text-3)',
        position: 'relative', flexShrink: 0,
      }}>{noSpoil ? '?' : equipe.wins}</span>
    </div>
  )
}

// ── Matchup ───────────────────────────────────────────────────────────────────
function Matchup({ serie, noSpoil, d }) {
  const scoreAff = serie && !noSpoil ? formatSummary(serie.summary, serie.terminee) : ''

  if (!serie) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: hMatchup(d), flexShrink: 0 }}>
      <CarteEquipe equipe={null} noSpoil={noSpoil} d={d} />
      <CarteEquipe equipe={null} noSpoil={noSpoil} d={d} />
      <div style={{ height: d.sumH }} />
    </div>
  )

  const { exterieur, domicile, terminee } = serie
  const gExt = terminee && exterieur.wins > domicile.wins
  const gDom = terminee && domicile.wins > exterieur.wins

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, height: hMatchup(d), flexShrink: 0 }}>
      <CarteEquipe equipe={exterieur} gagnante={gExt} noSpoil={noSpoil} d={d} />
      <CarteEquipe equipe={domicile}  gagnante={gDom} noSpoil={noSpoil} d={d} />
      <div style={{ height: d.sumH, display: 'flex', alignItems: 'center' }}>
        {scoreAff && (
          <span style={{
            fontSize: d.fsSum, fontWeight: 700, paddingLeft: 2,
            color: terminee ? 'var(--success)' : 'var(--orange)',
          }}>{scoreAff}</span>
        )}
      </div>
    </div>
  )
}

// ── Colonne ───────────────────────────────────────────────────────────────────
function Colonne({ label, series, noSpoil, d, hTotale }) {
  const items = series.length > 0 ? series : [null]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{
        fontSize: d.fsLabel, fontWeight: 800, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        textAlign: 'center', height: d.labelH,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        whiteSpace: 'pre-line', lineHeight: 1.2, marginBottom: 10,
        wordBreak: 'break-word', maxWidth: d.w,
      }}>{label}</div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: hTotale, justifyContent: 'space-evenly', gap: d.gap,
      }}>
        {items.map((s, i) => <Matchup key={i} serie={s} noSpoil={noSpoil} d={d} />)}
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
  const finaleRef             = useRef(null)

  useEffect(() => {
    const onResize = () => setLargeur(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const mode = largeur < 380 ? 'ultra' : largeur < 520 ? 'compact' : 'normal'
  const d    = DIM[mode]

  useEffect(() => {
    if (!bracket || !scrollRef.current || !finaleRef.current) return
    // rAF garantit que le layout est calculé (clientWidth=0 sinon = scroll page entière)
    requestAnimationFrame(() => {
      const container = scrollRef.current
      const el        = finaleRef.current
      if (!container || !el || container.clientWidth === 0) return
      const elCenter  = el.offsetLeft + el.offsetWidth / 2
      container.scrollLeft = elCenter - container.clientWidth / 2
    })
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
            mapInfos[eq.abbreviation] = { couleur: eq.color ?? null, logo: eq.logos?.[0]?.href ?? null }
            if (estEst) confEst.add(eq.abbreviation)
            else confOuest.add(eq.abbreviation)
          })
        })

        const tousEvents = dataBoards.flatMap(db => db.events ?? [])
        const mapSeries  = new Map()

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
            typeId, terminee: serie.completed ?? false, summary: serie.summary ?? '',
            exterieur: { trigramme: triAway, logo: mapInfos[triAway]?.logo ?? away.team.logo ?? null, couleur: mapInfos[triAway]?.couleur ?? null, wins: sAway?.wins ?? 0 },
            domicile:  { trigramme: triHome, logo: mapInfos[triHome]?.logo ?? home.team.logo ?? null, couleur: mapInfos[triHome]?.couleur ?? null, wins: sHome?.wins ?? 0 },
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

        // Tri 1er tour basé sur les équipes des demi-finales
        ouest['1er tour'] = trierPremierTourParDemis(ouest['1er tour'], ouest['Demi-finales'])
        est['1er tour']   = trierPremierTourParDemis(est['1er tour'],   est['Demi-finales'])

        setBracket({ ouest, est, finale })
        setCharg(false)
      } catch { setErreur(true); setCharg(false) }
    }
    charger()
  }, [saison])

  if (charg)             return <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Chargement du bracket…</p>
  if (erreur || !bracket) return <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Impossible de charger le bracket.</p>

  const aucuneDonnee = ORDRE_ROUNDS.every(r => bracket.ouest[r].length === 0 && bracket.est[r].length === 0) && !bracket.finale
  if (aucuneDonnee)    return <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Aucune donnée playoff disponible.</p>

  const hm      = hMatchup(d)
  const n1      = Math.max(bracket.ouest['1er tour'].length, bracket.est['1er tour'].length, 1)
  const hTotale = n1 * hm + (n1 - 1) * d.gap
  const colGap  = mode === 'ultra' ? 5 : mode === 'compact' ? 7 : 10

  return (
    <div style={{ padding: '0 16px', marginBottom: 24 }}>

      {/* ── Titre charte ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>NBA PLAY</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>OFFS</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 24, color: 'var(--text-3)', letterSpacing: '0.02em', lineHeight: 1, marginLeft: 8 }}>
          {saison - 1}-{String(saison).slice(2)}
        </span>
      </div>


      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 8, display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: colGap, padding: '0 8px' }}>

          {/* OUEST */}
          <Colonne label={`OUEST\n1er tour`}     series={bracket.ouest['1er tour']}         noSpoil={noSpoil} d={d} hTotale={hTotale} />
          <Colonne label="Demi-finales"           series={bracket.ouest['Demi-finales']}     noSpoil={noSpoil} d={d} hTotale={hTotale} />
          <Colonne label="Finales de conf."       series={bracket.ouest['Finales de conf.']} noSpoil={noSpoil} d={d} hTotale={hTotale} />

          {/* FINALE NBA */}
          <div ref={finaleRef} style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, alignItems: 'center' }}>
            <div style={{
              height: d.labelH, marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: d.fsLabel * 1.6, color: 'var(--text-1)', letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap' }}>FINALE</span>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: d.fsLabel * 1.6, color: 'var(--accent)', letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap' }}>NBA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', height: hTotale, justifyContent: 'center', alignItems: 'center' }}>
              <Matchup serie={bracket.finale} noSpoil={noSpoil} d={d} />
            </div>
          </div>

          {/* EST */}
          <Colonne label="Finales de conf."       series={bracket.est['Finales de conf.']}  noSpoil={noSpoil} d={d} hTotale={hTotale} />
          <Colonne label="Demi-finales"           series={bracket.est['Demi-finales']}      noSpoil={noSpoil} d={d} hTotale={hTotale} />
          <Colonne label={`EST\n1er tour`}        series={bracket.est['1er tour']}           noSpoil={noSpoil} d={d} hTotale={hTotale} />

        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: 4 }}>
        Source : ESPN · {saison - 1}-{String(saison).slice(2)}
      </p>
    </div>
  )
}