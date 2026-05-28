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

// ── Constantes de layout ──────────────────────────────────────────────────────
// Hauteur fixe d'une carte équipe selon le mode
const H_CARTE    = { normal: 26, compact: 22, ultra: 18 }
// Hauteur fixe d'un matchup (2 cartes + gap 2px + summary 14px)
const H_MATCHUP  = { normal: 26*2+2+14, compact: 22*2+2+12, ultra: 18*2+2+10 }
// Gap entre matchups dans une colonne
const GAP_MATCH  = { normal: 12, compact: 10, ultra: 8 }
// Largeur fixe d'une carte
const W_CARTE    = { normal: 96, compact: 76, ultra: 56 }

// Hauteur totale d'une colonne avec N matchups
const hauteurColonne = (n, mode) =>
  n * H_MATCHUP[mode] + (n - 1) * GAP_MATCH[mode]

// ── Carte équipe ──────────────────────────────────────────────────────────────
function CarteEquipe({ equipe, gagnante, noSpoil, mode = 'normal' }) {
  const [imgErr, setImgErr] = useState(false)
  const h        = H_CARTE[mode]
  const w        = W_CARTE[mode]
  const logoSize = mode === 'ultra' ? 10 : mode === 'compact' ? 12 : 14
  const fsTri    = mode === 'ultra' ? 8  : mode === 'compact' ? 9  : 10
  const fsScore  = mode === 'ultra' ? 9  : mode === 'compact' ? 10 : 11

  if (!equipe) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      height: h, width: w, flexShrink: 0,
      paddingLeft: 4, paddingRight: 4,
      borderRadius: 4,
      background: 'rgba(255,255,255,0.03)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <div style={{ width: logoSize, height: logoSize, borderRadius: '50%', background: 'var(--bg-2)', flexShrink: 0 }} />
      {mode === 'normal' && <span style={{ fontSize: 8, color: 'var(--text-3)', fontStyle: 'italic' }}>TBD</span>}
    </div>
  )

  const couleur    = equipe.couleur ? `#${equipe.couleur}` : 'var(--accent)'
  const estGagnant = !noSpoil && gagnante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      height: h, width: w, flexShrink: 0,
      paddingLeft: 4, paddingRight: 4,
      borderRadius: 4,
      position: 'relative', overflow: 'hidden',
      background: estGagnant ? `linear-gradient(90deg, ${couleur}28, ${couleur}10)` : 'rgba(255,255,255,0.04)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: estGagnant ? `${couleur}60` : 'rgba(255,255,255,0.08)',
    }}>
      {/* Logo flouté */}
      {equipe.logo && !imgErr && (
        <img src={equipe.logo} alt="" aria-hidden="true" style={{
          position: 'absolute', right: -2, top: '50%', transform: 'translateY(-50%)',
          width: h * 1.4, height: h * 1.4,
          objectFit: 'contain', opacity: 0.07, filter: 'blur(2px)', pointerEvents: 'none',
        }} />
      )}
      {/* Logo net */}
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
        position: 'relative', flexShrink: 0,
      }}>{noSpoil ? '?' : equipe.wins}</span>
    </div>
  )
}

// ── Matchup ───────────────────────────────────────────────────────────────────
function Matchup({ serie, noSpoil, mode = 'normal' }) {
  const scoreAff = serie && !noSpoil ? formatSummary(serie.summary, serie.terminee) : ''
  const fsSum    = mode === 'ultra' ? 7 : 8

  if (!serie) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CarteEquipe equipe={null} noSpoil={noSpoil} mode={mode} />
      <CarteEquipe equipe={null} noSpoil={noSpoil} mode={mode} />
      <div style={{ height: fsSum + 4 }} />
    </div>
  )

  const { exterieur, domicile, terminee } = serie
  const gExt = terminee && exterieur.wins > domicile.wins
  const gDom = terminee && domicile.wins > exterieur.wins

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CarteEquipe equipe={exterieur} gagnante={gExt} noSpoil={noSpoil} mode={mode} />
      <CarteEquipe equipe={domicile}  gagnante={gDom} noSpoil={noSpoil} mode={mode} />
      <div style={{ height: fsSum + 4, display: 'flex', alignItems: 'center' }}>
        {scoreAff && (
          <span style={{
            fontSize: fsSum, fontWeight: 700, paddingLeft: 2,
            color: terminee ? 'var(--success)' : 'var(--orange)',
          }}>{scoreAff}</span>
        )}
      </div>
    </div>
  )
}

// ── Colonne : liste de matchups espacés uniformément ─────────────────────────
function Colonne({ label, series, noSpoil, mode, hauteurTotale }) {
  const n   = series.length || 1
  const gap = GAP_MATCH[mode]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Label */}
      <div style={{
        fontSize: mode === 'ultra' ? 6 : 7, fontWeight: 800, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        textAlign: 'center', marginBottom: 6, lineHeight: 1.3,
        whiteSpace: 'pre-line', height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{label}</div>
      {/* Matchups espacés uniformément dans hauteurTotale */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap,
        height: hauteurTotale,
        justifyContent: 'space-evenly',
      }}>
        {(series.length > 0 ? series : [null]).map((s, i) => (
          <Matchup key={i} serie={s} noSpoil={noSpoil} mode={mode} />
        ))}
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

  const mode = largeur < 380 ? 'ultra' : largeur < 500 ? 'compact' : 'normal'

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
            mapInfos[eq.abbreviation] = { couleur: eq.color ?? null, logo: eq.logos?.[0]?.href ?? null }
            if (estEst) confEst.add(eq.abbreviation)
            else confOuest.add(eq.abbreviation)
          })
        })

        const tousEvents = dataBoards.flatMap(d => d.events ?? [])
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
            typeId,
            terminee:  serie.completed ?? false,
            summary:   serie.summary ?? '',
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
          if (isEst && est[round])    est[round].push(s)
          else if (ouest[round])      ouest[round].push(s)
        })

        setBracket({ ouest, est, finale })
        setCharg(false)
      } catch { setErreur(true); setCharg(false) }
    }
    charger()
  }, [saison])

  if (charg) return <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Chargement du bracket…</p>
  if (erreur || !bracket) return <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Impossible de charger le bracket.</p>

  const aucuneDonnee = ORDRE_ROUNDS.every(r => bracket.ouest[r].length === 0 && bracket.est[r].length === 0) && !bracket.finale
  if (aucuneDonnee) return <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Aucune donnée playoff disponible.</p>

  // Hauteur de référence = hauteur de la colonne 1er tour (4 matchups)
  const n1   = Math.max(bracket.ouest['1er tour'].length, bracket.est['1er tour'].length, 1)
  const n2   = Math.max(bracket.ouest['Demi-finales'].length, bracket.est['Demi-finales'].length, 1)
  const n3   = Math.max(bracket.ouest['Finales de conf.'].length, bracket.est['Finales de conf.'].length, 1)
  const gap  = GAP_MATCH[mode]
  const hm   = H_MATCHUP[mode]

  // Hauteur de chaque colonne = même hauteur totale pour toutes
  const hTotale = n1 * hm + (n1 - 1) * gap

  const colW = W_CARTE[mode] + 8 // largeur colonne = carte + padding
  const colGap = mode === 'ultra' ? 6 : mode === 'compact' ? 8 : 12

  // Hauteur finale NBA centrée au-dessus des finales de conf
  const hFinaleCol = n3 * hm + (n3 - 1) * gap

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, var(--accent), var(--orange))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontSize: mode === 'normal' ? 15 : 13, fontWeight: 900,
          fontFamily: 'var(--font-display)', letterSpacing: '0.12em',
        }}>NBA PLAYOFFS {saison - 1}-{String(saison).slice(2)}</span>
        {noSpoil && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>🙈 No Spoil actif — scores masqués</div>}
      </div>

      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{
          display: 'flex', flexDirection: 'row',
          alignItems: 'flex-start',
          gap: colGap,
          padding: '0 8px',
          // Largeur minimale = 6 colonnes + colonne centrale + gaps
          minWidth: colW * 6 + 120 + colGap * 6,
        }}>

          {/* ── OUEST : 1er tour, Demi-finales, Finales conf ── */}
          <Colonne label={`OUEST\n1er tour`}    series={bracket.ouest['1er tour']}        noSpoil={noSpoil} mode={mode} hauteurTotale={hTotale} />
          <Colonne label="Demi-finales"          series={bracket.ouest['Demi-finales']}    noSpoil={noSpoil} mode={mode} hauteurTotale={hTotale} />
          <Colonne label="Finales de conf."      series={bracket.ouest['Finales de conf.']} noSpoil={noSpoil} mode={mode} hauteurTotale={hTotale} />

          {/* ── CENTRE : Finales NBA au-dessus, Finales conf collées ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8,
            paddingTop: 26, // compense le label des colonnes
          }}>
            {/* Finales NBA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                fontSize: mode === 'ultra' ? 6 : 7, fontWeight: 900, letterSpacing: '0.12em',
                background: 'linear-gradient(90deg, var(--accent), var(--orange))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                textAlign: 'center', whiteSpace: 'nowrap', marginBottom: 4,
              }}>FINALES NBA</div>
              <Matchup serie={bracket.finale} noSpoil={noSpoil} mode={mode} />
            </div>

            {/* Séparateur */}
            <div style={{ width: 1, flex: 1, background: 'rgba(99,102,241,0.15)' }} />
          </div>

          {/* ── EST : Finales conf, Demi-finales, 1er tour ── */}
          <Colonne label="Finales de conf."      series={bracket.est['Finales de conf.']}  noSpoil={noSpoil} mode={mode} hauteurTotale={hTotale} />
          <Colonne label="Demi-finales"          series={bracket.est['Demi-finales']}      noSpoil={noSpoil} mode={mode} hauteurTotale={hTotale} />
          <Colonne label={`EST\n1er tour`}       series={bracket.est['1er tour']}           noSpoil={noSpoil} mode={mode} hauteurTotale={hTotale} />

        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: 6 }}>
        Source : ESPN · {saison - 1}-{String(saison).slice(2)}
      </p>
    </div>
  )
}
