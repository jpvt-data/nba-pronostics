import { useState, useEffect } from 'react'
import { useNoSpoil } from '../context/NoSpoilContext'

const BASE     = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_V2  = 'https://site.api.espn.com/apis/v2/sports/basketball/nba'
const TIMEOUT  = 10000

// Mapping type ESPN → label round
const ROUNDS = {
  '14': { label: '1er tour',              ordre: 1 },
  '15': { label: 'Demi-finales de conf.', ordre: 2 },
  '16': { label: 'Finales de conf.',      ordre: 3 },
  '17': { label: 'Finales NBA',           ordre: 4 },
}

const fetchAvecTimeout = (url) => {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

// Génère la plage de dates playoffs (1er avril → 30 juin de l'année saison)
const plageMois = (saison) => {
  return [
    `${saison}0401-${saison}0430`,
    `${saison}0501-${saison}0531`,
    `${saison}0601-${saison}0630`,
  ]
}

// Extrait la couleur hex depuis les standings ESPN
const couleurHex = (hex) => hex ? `#${hex}` : null

// ── Carte équipe dans le bracket ─────────────────────────────────────────────
function CarteEquipe({ equipe, gagnante, noSpoil, compact = false }) {
  const [imgErr, setImgErr] = useState(false)
  if (!equipe) {
    // Slot vide (équipe non encore qualifiée)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: compact ? 4 : 6,
        padding: compact ? '5px 8px' : '7px 10px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.06)',
        minWidth: compact ? 90 : 120,
      }}>
        <div style={{ width: compact ? 16 : 20, height: compact ? 16 : 20, borderRadius: '50%', background: 'var(--bg-2)' }} />
        <span style={{ fontSize: compact ? 10 : 11, color: 'var(--text-3)', fontStyle: 'italic' }}>À déterminer</span>
      </div>
    )
  }

  const couleur = equipe.couleur ? `#${equipe.couleur}` : 'var(--accent)'
  const estGagnante = !noSpoil && gagnante

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 4 : 6,
      padding: compact ? '5px 8px' : '7px 10px',
      borderRadius: 6,
      background: estGagnante
        ? `linear-gradient(90deg, ${couleur}28, ${couleur}10)`
        : 'rgba(255,255,255,0.04)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: estGagnante ? `${couleur}60` : 'rgba(255,255,255,0.08)',
      minWidth: compact ? 90 : 120,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Logo flouté en arrière-plan */}
      {equipe.logo && !imgErr && (
        <img
          src={equipe.logo}
          alt=""
          style={{
            position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
            width: compact ? 36 : 44, height: compact ? 36 : 44,
            objectFit: 'contain', opacity: 0.08, filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Logo net */}
      {equipe.logo && !imgErr
        ? <img src={equipe.logo} alt={equipe.trigramme} onError={() => setImgErr(true)}
            style={{ width: compact ? 16 : 20, height: compact ? 16 : 20, objectFit: 'contain', flexShrink: 0, position: 'relative' }} />
        : <div style={{ width: compact ? 16 : 20, height: compact ? 16 : 20, borderRadius: '50%', background: couleur, flexShrink: 0, position: 'relative' }} />
      }
      <span style={{
        fontSize: compact ? 11 : 12, fontWeight: 800,
        color: estGagnante ? 'var(--text-1)' : 'var(--text-2)',
        fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
        position: 'relative', flex: 1,
      }}>{equipe.trigramme}</span>
      {/* Score série */}
      <span style={{
        fontSize: compact ? 12 : 14, fontWeight: 900,
        color: estGagnante ? couleur : 'var(--text-3)',
        fontFamily: 'var(--font-display)',
        position: 'relative', flexShrink: 0,
        minWidth: 12, textAlign: 'right',
      }}>
        {noSpoil ? '?' : equipe.wins}
      </span>
    </div>
  )
}

// ── Carte série (matchup complet) ─────────────────────────────────────────────
function CarteSerie({ serie, noSpoil, compact = false }) {
  if (!serie) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CarteEquipe equipe={null} noSpoil={noSpoil} compact={compact} />
      <CarteEquipe equipe={null} noSpoil={noSpoil} compact={compact} />
    </div>
  )

  const { eq1, eq2, terminee } = serie
  const gagnant1 = terminee && eq1.wins > eq2.wins
  const gagnant2 = terminee && eq2.wins > eq1.wins

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CarteEquipe equipe={eq1} gagnante={gagnant1} noSpoil={noSpoil} compact={compact} />
      <CarteEquipe equipe={eq2} gagnante={gagnant2} noSpoil={noSpoil} compact={compact} />
      {!noSpoil && serie.summary && (
        <div style={{ fontSize: 9, color: terminee ? 'var(--success)' : 'var(--text-3)', marginTop: 2, paddingLeft: 2 }}>
          {terminee ? '✓ ' : ''}{serie.summary}
        </div>
      )}
    </div>
  )
}

// ── Colonne d'un round ────────────────────────────────────────────────────────
function ColonneRound({ label, series, noSpoil, compact = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        textAlign: 'center', marginBottom: 4,
      }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'space-around', flex: 1 }}>
        {series.map((s, i) => (
          <CarteSerie key={i} serie={s} noSpoil={noSpoil} compact={compact} />
        ))}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function BracketPlayoffs({ saison = 2026 }) {
  const { noSpoil }             = useNoSpoil()
  const [bracket, setBracket]   = useState(null)  // { ouest: {r1,r2,r3}, est: {r1,r2,r3}, finale }
  const [couleurs, setCouleurs] = useState({})     // { trigramme: { couleur, logo } }
  const [chargement, setCharg]  = useState(true)
  const [erreur, setErreur]     = useState(false)

  useEffect(() => {
    const charger = async () => {
      setCharg(true); setErreur(false)
      try {
        // Fetch standings pour les couleurs + fetch scoreboard playoffs en parallèle
        const [dataStandings, dataBoard] = await Promise.all([
          fetchAvecTimeout(`${BASE_V2}/standings?season=${saison}&seasontype=2`).then(r => r.json()),
          Promise.all(
            plageMois(saison).map(p =>
              fetchAvecTimeout(`${BASE}/scoreboard?dates=${p}&seasontype=3`).then(r => r.json())
            )
          ).then(resultats => ({ events: resultats.flatMap(r => r.events ?? []) })),
        ])

        // Extraire couleurs depuis standings
        const mapCouleurs = {}
        ;(dataStandings.children ?? []).forEach(conf => {
          ;(conf.standings?.entries ?? []).forEach(e => {
            const eq = e.team
            if (eq?.abbreviation) {
              mapCouleurs[eq.abbreviation] = {
                couleur: eq.color ?? null,
                logo:    eq.logos?.[0]?.href ?? null,
              }
            }
          })
        })
        setCouleurs(mapCouleurs)

        // Parser les séries depuis le scoreboard
        // Map : clé = IDs triés, valeur = série la plus récente
        const mapSeries = new Map()
        ;(dataBoard.events ?? []).forEach(evt => {
          const comp  = evt.competitions?.[0]
          const serie = comp?.series
          const type  = comp?.type
          if (!serie || serie.type !== 'playoff') return
          if (!type?.id || !ROUNDS[type.id]) return

          const compEq = comp.competitors ?? []
          if (compEq.length < 2) return

          // Récupérer les équipes depuis competitors
          const home = compEq.find(c => c.homeAway === 'home')
          const away = compEq.find(c => c.homeAway === 'away')
          if (!home || !away) return

          // Identifier la paire
          const ids = [home.team?.id, away.team?.id].sort()
          const cle = `${type.id}-${ids.join('-')}`

          // Wins depuis serie.competitors (plus fiable)
          const sHome = serie.competitors?.find(c => c.id === home.team?.id)
          const sAway = serie.competitors?.find(c => c.id === away.team?.id)

          const triHome = home.team?.abbreviation
          const triAway = away.team?.abbreviation

          mapSeries.set(cle, {
            typeId:    type.id,
            terminee:  serie.completed ?? false,
            summary:   serie.summary ?? '',
            eq1: {
              trigramme: triAway,
              logo:      home.team?.logo ?? away.team?.logo ?? null,  // fallback
              wins:      sAway?.wins ?? 0,
              couleur:   mapCouleurs[triAway]?.couleur ?? null,
            },
            eq2: {
              trigramme: triHome,
              logo:      home.team?.logo ?? null,
              wins:      sHome?.wins ?? 0,
              couleur:   mapCouleurs[triHome]?.couleur ?? null,
            },
          })
        })

        // Corriger les logos depuis mapCouleurs (plus fiables que ceux du scoreboard playoffs)
        mapSeries.forEach((s) => {
          if (mapCouleurs[s.eq1.trigramme]?.logo) s.eq1.logo = mapCouleurs[s.eq1.trigramme].logo
          if (mapCouleurs[s.eq2.trigramme]?.logo) s.eq2.logo = mapCouleurs[s.eq2.trigramme].logo
          if (!s.eq1.couleur && mapCouleurs[s.eq1.trigramme]) s.eq1.couleur = mapCouleurs[s.eq1.trigramme].couleur
          if (!s.eq2.couleur && mapCouleurs[s.eq2.trigramme]) s.eq2.couleur = mapCouleurs[s.eq2.trigramme].couleur
        })

        // Grouper par round et conférence
        // Pour distinguer Est/Ouest on se base sur les équipes connues
        // ESPN scoreboard n'expose pas la conférence par série — on déduit depuis standings
        const confEst   = new Set()
        const confOuest = new Set()
        ;(dataStandings.children ?? []).forEach(conf => {
          const estEst = conf.name?.toLowerCase().includes('east')
          ;(conf.standings?.entries ?? []).forEach(e => {
            const tri = e.team?.abbreviation
            if (tri) (estEst ? confEst : confOuest).add(tri)
          })
        })

        // Détermine la conférence d'une série (les 2 équipes sont dans la même conf)
        const confSerie = (s) => {
          if (confEst.has(s.eq1.trigramme)) return 'est'
          if (confOuest.has(s.eq1.trigramme)) return 'ouest'
          return 'finale' // Finales NBA (type 17)
        }

        // Construction du bracket
        const rounds = { ouest: {}, est: {}, finale: null }
        mapSeries.forEach((s) => {
          if (s.typeId === '17') { rounds.finale = s; return }
          const conf  = confSerie(s)
          const round = ROUNDS[s.typeId]?.label ?? s.typeId
          if (!rounds[conf][round]) rounds[conf][round] = []
          rounds[conf][round].push(s)
        })

        setBracket(rounds)
        setCharg(false)
      } catch {
        setErreur(true)
        setCharg(false)
      }
    }
    charger()
  }, [saison])

  if (chargement) return (
    <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      Chargement du bracket…
    </p>
  )

  if (erreur || !bracket) return (
    <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      Impossible de charger le bracket.
    </p>
  )

  const ordreRounds = ['1er tour', 'Demi-finales de conf.', 'Finales de conf.']

  // Nombre max de séries par round (pour espacer correctement)
  const seriesOuest = ordreRounds.map(r => bracket.ouest[r] ?? [])
  const seriesEst   = ordreRounds.map(r => bracket.est[r]   ?? [])

  const aucuneDonnee = seriesOuest.every(s => s.length === 0) && seriesEst.every(s => s.length === 0) && !bracket.finale

  if (aucuneDonnee) return (
    <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      Aucun match playoff trouvé pour cette saison.
    </p>
  )

  return (
    <div>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, var(--accent), var(--orange))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)',
          letterSpacing: '0.12em',
        }}>NBA PLAYOFFS {saison - 1}-{String(saison).slice(2)}</div>
        {noSpoil && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
            🙈 No Spoil actif — scores masqués
          </div>
        )}
      </div>

      {/* Layout bracket : Ouest | Finale | Est */}
      {/* Mobile : vertical. Desktop : horizontal */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr) auto repeat(3, 1fr)',
          gap: 8,
          minWidth: 680,
          alignItems: 'center',
        }}>

          {/* ── CONFÉRENCE OUEST (colonnes 1→3, de gauche vers le centre) ── */}
          {ordreRounds.map((round, i) => (
            <ColonneRound
              key={`ouest-${i}`}
              label={i === 0 ? `OUEST — ${round}` : round}
              series={seriesOuest[i]}
              noSpoil={noSpoil}
              compact={i > 0}
            />
          ))}

          {/* ── FINALES NBA (centre) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 8px' }}>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '0.15em',
              background: 'linear-gradient(90deg, var(--accent), var(--orange))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              textAlign: 'center', whiteSpace: 'nowrap',
            }}>FINALES NBA</div>
            <CarteSerie serie={bracket.finale} noSpoil={noSpoil} compact={false} />
          </div>

          {/* ── CONFÉRENCE EST (colonnes 5→7, du centre vers la droite) ── */}
          {[...ordreRounds].reverse().map((round, i) => (
            <ColonneRound
              key={`est-${i}`}
              label={i === 2 ? `EST — ${round}` : round}
              series={seriesEst[ordreRounds.length - 1 - i]}
              noSpoil={noSpoil}
              compact={i < 2}
            />
          ))}

        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: 8 }}>
        Source : ESPN · Saison {saison - 1}-{String(saison).slice(2)}
      </p>
    </div>
  )
}
