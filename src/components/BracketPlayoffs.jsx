import { useState, useEffect } from 'react'
import { useNoSpoil } from '../context/NoSpoilContext'

const BASE    = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_V2 = 'https://site.api.espn.com/apis/v2/sports/basketball/nba'
const TIMEOUT = 10000

// Types ESPN → labels rounds playoffs
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

// Génère des plages de 7 jours sur avril-juin de la saison
// Robuste quelle que soit l'année de début des playoffs
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

// ── Carte équipe ──────────────────────────────────────────────────────────────
function CarteEquipe({ equipe, gagnante, noSpoil, compact }) {
  const [imgErr, setImgErr] = useState(false)

  if (!equipe) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: compact ? '4px 8px' : '6px 10px',
      borderRadius: 6, minWidth: compact ? 80 : 110,
      background: 'rgba(255,255,255,0.03)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-2)', flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>TBD</span>
    </div>
  )

  const couleur    = equipe.couleur ? `#${equipe.couleur}` : 'var(--accent)'
  const estGagnant = !noSpoil && gagnante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: compact ? '4px 8px' : '6px 10px',
      borderRadius: 6, minWidth: compact ? 80 : 110,
      position: 'relative', overflow: 'hidden',
      background: estGagnant
        ? `linear-gradient(90deg, ${couleur}28, ${couleur}10)`
        : 'rgba(255,255,255,0.04)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: estGagnant ? `${couleur}60` : 'rgba(255,255,255,0.08)',
    }}>
      {/* Logo flouté arrière-plan */}
      {equipe.logo && !imgErr && (
        <img src={equipe.logo} alt="" aria-hidden="true" style={{
          position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
          width: compact ? 32 : 40, height: compact ? 32 : 40,
          objectFit: 'contain', opacity: 0.07, filter: 'blur(2px)', pointerEvents: 'none',
        }} />
      )}
      {/* Logo net */}
      {equipe.logo && !imgErr
        ? <img src={equipe.logo} alt={equipe.trigramme} onError={() => setImgErr(true)}
            style={{ width: compact ? 14 : 18, height: compact ? 14 : 18, objectFit: 'contain', flexShrink: 0, position: 'relative' }} />
        : <div style={{ width: compact ? 14 : 18, height: compact ? 14 : 18, borderRadius: '50%', background: couleur, flexShrink: 0 }} />
      }
      {/* Trigramme */}
      <span style={{
        fontSize: compact ? 10 : 11, fontWeight: 800,
        fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
        color: estGagnant ? 'var(--text-1)' : 'var(--text-2)',
        flex: 1, position: 'relative',
      }}>{equipe.trigramme}</span>
      {/* Score wins */}
      <span style={{
        fontSize: compact ? 11 : 13, fontWeight: 900,
        fontFamily: 'var(--font-display)',
        color: estGagnant ? couleur : 'var(--text-3)',
        position: 'relative', flexShrink: 0, minWidth: 10, textAlign: 'right',
      }}>{noSpoil ? '?' : equipe.wins}</span>
    </div>
  )
}

// ── Matchup  (2 équipes) ───────────────────────────────────────────────────────
function Matchup({ serie, noSpoil, compact }) {
  if (!serie) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CarteEquipe equipe={null} noSpoil={noSpoil} compact={compact} />
      <CarteEquipe equipe={null} noSpoil={noSpoil} compact={compact} />
    </div>
  )

  const { exterieur, domicile, terminee, summary } = serie
  const gExt = terminee && exterieur.wins > domicile.wins
  const gDom = terminee && domicile.wins > exterieur.wins

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CarteEquipe equipe={exterieur} gagnante={gExt} noSpoil={noSpoil} compact={compact} />
      <CarteEquipe equipe={domicile}  gagnante={gDom} noSpoil={noSpoil} compact={compact} />
      {!noSpoil && summary && (
        <span style={{
          fontSize: 9, paddingLeft: 2, marginTop: 1,
          color: terminee ? 'var(--success)' : 'var(--text-3)',
        }}>{terminee ? '✓ ' : ''}{summary}</span>
      )}
    </div>
  )
}

// ── Colonne d'un round ────────────────────────────────────────────────────────
function ColonneRound({ label, series, noSpoil, compact }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{
        fontSize: 8, fontWeight: 800, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        textAlign: 'center', marginBottom: 8, lineHeight: 1.3,
        whiteSpace: 'pre-line',
      }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'space-evenly' }}>
        {series.length > 0
          ? series.map((s, i) => <Matchup key={i} serie={s} noSpoil={noSpoil} compact={compact} />)
          : <Matchup serie={null} noSpoil={noSpoil} compact={compact} />
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

  useEffect(() => {
    const charger = async () => {
      setCharg(true); setErreur(false)
      try {
        const plages = plagesPlayoffs(saison)

        // Fetch standings (couleurs/logos) + toutes les plages en parallèle
        const [dataStandings, ...dataBoards] = await Promise.all([
          fetchAvecTimeout(`${BASE_V2}/standings?season=${saison}&seasontype=2`).then(r => r.json()),
          ...plages.map(p =>
            fetchAvecTimeout(`${BASE}/scoreboard?dates=${p}`)
              .then(r => r.json())
              .catch(() => ({ events: [] }))
          ),
        ])

        // Couleurs + logos depuis standings
        const mapInfos = {}
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

        // Tous les events de toutes les plages
        const tousEvents = dataBoards.flatMap(d => d.events ?? [])

        // Déduplication par clé typeId + paire d'IDs triés
        // Map.set écrase → dernière occurrence = wins les plus récents
        const mapSeries = new Map()
        tousEvents.forEach(evt => {
          const comp  = evt.competitions?.[0]
          const typeId = comp?.type?.id
          if (!TYPE_ROUNDS[typeId]) return // ignorer non-playoffs
          const serie = comp?.series
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

        // Grouper par conférence + round
        const ouest  = { '1er tour': [], 'Demi-finales': [], 'Finales de conf.': [] }
        const est    = { '1er tour': [], 'Demi-finales': [], 'Finales de conf.': [] }
        let finale   = null

        mapSeries.forEach(s => {
          const round = TYPE_ROUNDS[s.typeId]
          if (s.typeId === '17') { finale = s; return }
          // Conférence : on regarde quelle conf contient l'une des deux équipes
          const triExt = s.exterieur.trigramme
          const triDom = s.domicile.trigramme
          const isEst  = confEst.has(triExt) || confEst.has(triDom)
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

  return (
    <div>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, var(--accent), var(--orange))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '0.12em',
        }}>NBA PLAYOFFS {saison - 1}-{String(saison).slice(2)}</span>
        {noSpoil && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
            🙈 No Spoil actif — scores masqués
          </div>
        )}
      </div>

      {/* Bracket — scroll horizontal sur mobile */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(100px, 1fr)) minmax(90px, 120px) repeat(3, minmax(100px, 1fr))',
          gap: 6,
          minWidth: 680,
          alignItems: 'center',
        }}>

          {/* OUEST : 1er tour → Finales conf */}
          {ORDRE_ROUNDS.map((round, i) => (
            <ColonneRound
              key={`ouest-${round}`}
              label={i === 0 ? `OUEST\n${round}` : round}
              series={bracket.ouest[round]}
              noSpoil={noSpoil}
              compact={i > 0}
            />
          ))}

          {/* FINALES NBA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{
              fontSize: 8, fontWeight: 900, letterSpacing: '0.12em',
              background: 'linear-gradient(90deg, var(--accent), var(--orange))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              textAlign: 'center', whiteSpace: 'nowrap',
            }}>FINALES NBA</div>
            <Matchup serie={bracket.finale} noSpoil={noSpoil} compact={false} />
          </div>

          {/* EST : Finales conf → 1er tour */}
          {[...ORDRE_ROUNDS].reverse().map((round, i) => (
            <ColonneRound
              key={`est-${round}`}
              label={i === 2 ? `EST\n${round}` : round}
              series={bracket.est[round]}
              noSpoil={noSpoil}
              compact={i < 2}
            />
          ))}

        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: 8 }}>
        Source : ESPN · {saison - 1}-{String(saison).slice(2)}
      </p>
    </div>
  )
}
