import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { track } from '../services/tracker'
import { recupererLiguesCibles } from '../services/ligues'
import { recupererDetailMatch, TAG_CONFIG } from '../services/espn'
import { ajouterXP } from '../services/xp'
import { recupererFourchetteEcart, poserFourchetteEcart } from '../services/ecart'
import Navigation from '../components/Navigation'
import { ChevronLeft } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'

const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY
const ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports/basketball_nba/odds'

// Bookmakers FR affichés section 2
const BOOKS_FR = ['betclic_fr', 'unibet_fr', 'winamax_fr', 'pmu_fr']
const BOOKS_FR_LABELS = { betclic_fr: 'Betclic', unibet_fr: 'Unibet', winamax_fr: 'Winamax', pmu_fr: 'PMU' }

// Bookmakers US/référence affichés section 3
const BOOKS_US = ['draftkings', 'fanduel', 'espnbet', 'pinnacle']
const BOOKS_US_LABELS = { draftkings: 'DraftKings', fanduel: 'FanDuel', espnbet: 'ESPN BET', pinnacle: 'Pinnacle ★' }

// Convertit une cote décimale en probabilité implicite normalisée (%)
const coteEnPct = (coteEq1, coteEq2) => {
  if (!coteEq1 || !coteEq2) return null
  const p1 = 1 / coteEq1
  const p2 = 1 / coteEq2
  const total = p1 + p2
  return { pct1: Math.round(p1 / total * 100), pct2: Math.round(p2 / total * 100) }
}

// Convertit moneyline US en cote décimale
const mlEnDecimal = (ml) => {
  if (!ml) return null
  return ml > 0 ? parseFloat((ml / 100 + 1).toFixed(2)) : parseFloat((100 / Math.abs(ml) + 1).toFixed(2))
}

const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL' || statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

const STATS_LABELS = [
  { key: 'pts', label: 'PPG' }, { key: 'fg',  label: 'FG%' },
  { key: 'tp',  label: '3P%' }, { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' }, { key: 'blk', label: 'BLK' },
  { key: 'stl', label: 'STL' }, { key: 'to',  label: 'TO'  },
]

const BASE_CORE = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba'

const estTropSombre = (hex) => {
  if (!hex) return true
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0,2), 16)
  const g = parseInt(h.slice(2,4), 16)
  const b = parseInt(h.slice(4,6), 16)
  return (0.299*r + 0.587*g + 0.114*b) < 40
}
const getCouleur = (eq) => {
  const c1 = eq.color         ? `#${eq.color}`         : null
  const c2 = eq.alternateColor ? `#${eq.alternateColor}` : null
  if (!estTropSombre(c1)) return c1
  if (!estTropSombre(c2)) return c2
  return 'var(--accent)'
}

const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)' }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

const BarreStat = ({ vE, vD, label, couleurExt, couleurDom }) => {
  if (!vE && !vD) return null
  const nE = parseFloat(vE) || 0
  const nD = parseFloat(vD) || 0
  const total = nE + nD
  const pctE = total > 0 ? Math.round(nE / total * 100) : 50
  const pctD = 100 - pctE
  const meilleureExt = nE >= nD
  const cExt = couleurExt === 'var(--accent)' ? 'var(--accent)' : couleurExt
  const cDom = couleurDom === 'var(--accent)' ? 'var(--orange)' : couleurDom

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 1fr', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: meilleureExt ? 'var(--text-1)' : 'var(--text-3)', minWidth: 36, textAlign: 'right' }}>{vE ?? '–'}</span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg-2)', display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>
            <div style={{ width: `${pctE}%`, height: '100%', background: meilleureExt ? cExt : 'var(--border-2)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--bg-2)', overflow: 'hidden' }}>
            <div style={{ width: `${pctD}%`, height: '100%', background: !meilleureExt ? cDom : 'var(--border-2)', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: !meilleureExt ? 'var(--text-1)' : 'var(--text-3)', minWidth: 36, textAlign: 'left' }}>{vD ?? '–'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Composant BlocCotes ─────────────────────────────────────────────────────
const BlocCotes = ({ cotes, prediction, ext, dom, couleurExt, couleurDom, termine }) => {
  const [modalVisible, setModalVisible] = useState(false)

  const cExt = couleurExt !== 'var(--accent)' ? couleurExt : 'var(--accent)'
  const cDom = couleurDom !== 'var(--accent)' ? couleurDom : 'var(--orange)'

  // Barre de probabilité
  const BarreProb = ({ pctExt, pctDom, opacite = 1, label }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: cExt, opacity: opacite }}>{pctExt}%</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: cDom, opacity: opacite }}>{pctDom}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-2)', display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: `${pctExt}%`, background: cExt, opacity: opacite, transition: 'width 0.5s ease' }} />
        <div style={{ width: `${pctDom}%`, background: cDom, opacity: opacite, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )

  // Carte bookmaker individuelle
  const CarteBook = ({ label, pctExt, pctDom }) => {
    if (!pctExt || !pctDom) return (
      <div style={{ background: 'var(--bg-2)', padding: '8px 10px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Non disponible</div>
      </div>
    )
    return (
      <div style={{ background: 'var(--bg-2)', padding: '8px 10px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, marginBottom: 5 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: cExt }}>{pctExt}%</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', flex: 1, textAlign: 'center' }}>–</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: cDom }}>{pctDom}%</span>
        </div>
        <div style={{ height: 3, background: 'var(--bg-1)', display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${pctExt}%`, background: cExt, opacity: 0.6 }} />
          <div style={{ width: `${pctDom}%`, background: cDom, opacity: 0.6 }} />
        </div>
      </div>
    )
  }

  // Extraction probabilités consensus (moyenne normalisée de tous les books h2h)
  const consensusPct = (() => {
    if (!cotes?.books || cotes.books.length === 0) return null
    let sumExt = 0, sumDom = 0, count = 0
    cotes.books.forEach(b => {
      const h2h = b.markets?.find(m => m.key === 'h2h')
      if (!h2h) return
      const extOdds = h2h.outcomes?.find(o => o.name === cotes.nomExt)?.price
      const domOdds = h2h.outcomes?.find(o => o.name === cotes.nomDom)?.price
      const p = coteEnPct(extOdds, domOdds)
      if (p) { sumExt += p.pct1; sumDom += p.pct2; count++ }
    })
    if (count === 0) return null
    return { pctExt: Math.round(sumExt / count), pctDom: Math.round(sumDom / count) }
  })()

  // Extraction probabilités par bookmaker
  const probsParBook = (bookKey) => {
    if (!cotes?.books) return null
    const book = cotes.books.find(b => b.key === bookKey)
    if (!book) return null
    const h2h = book.markets?.find(m => m.key === 'h2h')
    if (!h2h) return null
    const extOdds = h2h.outcomes?.find(o => o.name === cotes.nomExt)?.price
    const domOdds = h2h.outcomes?.find(o => o.name === cotes.nomDom)?.price
    return coteEnPct(extOdds, domOdds)
  }

  // Données Pinnacle pour section 4
  const pinnacle = cotes?.books?.find(b => b.key === 'pinnacle')
  const spreadPinnacle = (() => {
    const s = pinnacle?.markets?.find(m => m.key === 'spreads')
    if (!s) return null
    const extSpread = s.outcomes?.find(o => o.name === cotes.nomExt)
    if (!extSpread?.point) return null
    const val = extSpread.point
    const favori = val < 0 ? ext.trigramme : dom.trigramme
    return { valeur: Math.abs(val), favori }
  })()
  const totalPinnacle = (() => {
    const t = pinnacle?.markets?.find(m => m.key === 'totals')
    if (!t) return null
    return t.outcomes?.find(o => o.name === 'Over')?.point ?? null
  })()

  // Données ESPN pickcenter pour section 4 (fallback si pas Pinnacle)
  const spreadEspn = cotes?.espnSpread
  const totalEspn = cotes?.espnTotal

  const spreadAffiche = spreadPinnacle ?? spreadEspn
  const totalAffiche = totalPinnacle ?? (totalEspn ? Math.round(totalEspn) : null)

  return (
    <>
      {/* Modal explicatif */}
      {modalVisible && (
        <div
          onClick={() => setModalVisible(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', borderRadius: '12px 12px 0 0', padding: '20px 16px 36px', width: '100%', maxWidth: 480 }}
          >
            <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', marginBottom: 16 }}>Comment lire les cotes ?</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Probabilité de victoire (%)</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>Calculée depuis les cotes des bookmakers. 56% = le marché pense que cette équipe a 56 chances sur 100 de gagner. Plus c'est proche de 50%, plus le match est ouvert.</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Écart de points</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>Le bookmaker de référence (Pinnacle) estime que le favori gagne d'environ X points. Utile pour choisir ta fourchette dans le Bonus Écart.</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Total points attendus</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>Nombre total de points cumulés attendus par les deux équipes. En NBA, 216 = match à rythme standard. En dessous = match serré défensivement.</div>
            </div>
            <button
              onClick={() => setModalVisible(false)}
              style={{ width: '100%', marginTop: 8, padding: '10px', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-1)', borderLeft: '3px solid var(--accent)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0' }}>
          <TitreSection mot1="CONTEXTE" mot2="COTES" />
          <button
            onClick={() => setModalVisible(true)}
            style={{ width: 22, height: 22, borderRadius: '50%', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border-2)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            ?
          </button>
        </div>

        {/* Labels équipes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 8px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cExt, fontFamily: 'var(--font-display)' }}>{ext.trigramme}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: cDom, fontFamily: 'var(--font-display)' }}>{dom.trigramme}</span>
        </div>

        {/* Section 1 — Probabilités de victoire */}
        <div style={{ padding: '0 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Probabilités de victoire</div>

          {prediction ? (
            <BarreProb pctExt={prediction.extPct} pctDom={prediction.domPct} opacite={1} label="Algorithme ESPN" />
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 8 }}>Prédiction ESPN non disponible</div>
          )}

          {consensusPct ? (
            <BarreProb pctExt={consensusPct.pctExt} pctDom={consensusPct.pctDom} opacite={0.6} label={`Consensus marché (${cotes.books.length} bookmakers)`} />
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Consensus marché non disponible</div>
          )}
        </div>

        {/* Section 2 — Bookmakers FR */}
        <div style={{ padding: '12px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            Bookmakers FR
            {cotes?.books && <span style={{ marginLeft: 6, display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', verticalAlign: 'middle' }} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {BOOKS_FR.map(key => {
              const p = probsParBook(key)
              return <CarteBook key={key} label={BOOKS_FR_LABELS[key]} pctExt={p?.pct1} pctDom={p?.pct2} />
            })}
          </div>
        </div>

        {/* Section 3 — Bookmakers US / référence */}
        <div style={{ padding: '12px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Bookmakers US / référence</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {BOOKS_US.map(key => {
              const p = probsParBook(key)
              return <CarteBook key={key} label={BOOKS_US_LABELS[key]} pctExt={p?.pct1} pctDom={p?.pct2} />
            })}
          </div>
          {/* ESPN pickcenter — toujours dans les US */}
          {(() => {
            const espnPct = cotes?.espnPickcenter
            return espnPct ? (
              <div style={{ marginTop: 6 }}>
                <CarteBook label="ESPN BET (pickcenter)" pctExt={espnPct.extPct} pctDom={espnPct.domPct} />
              </div>
            ) : null
          })()}
        </div>

        {/* Section 4 — Prédictions marché */}
        <div style={{ padding: '12px 16px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            Prédictions marché
            <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· Source {spreadPinnacle || totalPinnacle ? 'Pinnacle' : 'ESPN'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>Écart de points</div>
              {spreadAffiche ? (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>{spreadAffiche.valeur} pts</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{spreadAffiche.favori} favori</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Non disponible</div>
              )}
            </div>
            <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>Total points attendus</div>
              {totalAffiche ? (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>{totalAffiche} pts</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Score cumulé des 2 équipes</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Non disponible</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px', textAlign: 'right' }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Source : ESPN · The Odds API — à titre informatif</span>
        </div>

      </div>
    </>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function MatchDetail() {
  const { espn_id } = useParams()
  const navigate    = useNavigate()
  const { noSpoil } = useNoSpoil()
  const [match, setMatch]           = useState(null)
  const [user, setUser]             = useState(null)
  const [prono, setProno]           = useState(null)
  const [resultat, setRes]          = useState(null)
  const [charg, setCharg]           = useState(true)
  const [erreur, setErr]            = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [matchDBId, setMatchDBId]   = useState(null)
  const [ecart, setEcart]           = useState(null)
  const [cotes, setCotes]           = useState(null) // { books, nomExt, nomDom, espnSpread, espnTotal, espnPickcenter }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      track(user.id, 'page_view', '/match', { espn_id })
      const detail = await recupererDetailMatch(espn_id)
      if (!detail) { setErr(true); setCharg(false); return }
      setMatch(detail)

      const { data: tousLesPronos } = await supabase
        .from('pronos').select('equipe_choisie, resultat, matchs(espn_id, id)').eq('user_id', user.id)
      const found = tousLesPronos?.find(p => p.matchs?.espn_id === espn_id)
      if (found) { setProno(found.equipe_choisie); setRes(found.resultat) }

      const { data: matchDBRow } = await supabase.from('matchs').select('id').eq('espn_id', espn_id).maybeSingle()
      if (matchDBRow) {
        setMatchDBId(matchDBRow.id)
        const fourchetteExistante = await recupererFourchetteEcart(user.id, matchDBRow.id)
        if (fourchetteExistante) setEcart(fourchetteExistante)
      }
      setCharg(false)

      if (detail.statut !== 'STATUS_FINAL') {
        // Prédiction ESPN (endpoint core API)
        try {
          const resPred = await fetch(
            `${BASE_CORE}/events/${espn_id}/competitions/${espn_id}/predictor`
          ).then(r => r.json())
          const trouverGP = (equipe) =>
            equipe?.statistics?.find(s => s.name === 'gameProjection')?.value ?? null
          const aPct = trouverGP(resPred.awayTeam)
          const hPct = trouverGP(resPred.homeTeam)
          const extVal = aPct ?? (hPct != null ? 100 - hPct : null)
          const domVal = hPct ?? (aPct != null ? 100 - aPct : null)
          if (extVal != null && domVal != null) {
            const equipePrediite = domVal >= extVal ? detail.domicile.trigramme : detail.exterieur.trigramme
            setPrediction({ domPct: Math.round(domVal), extPct: Math.round(extVal), equipePrediite })
          }
        } catch { /* silencieux */ }

        // ESPN summary — pickcenter (spread + total + moneyline US)
        let espnSpread = null
        let espnTotal = null
        let espnPickcenter = null
        try {
          const resSummary = await fetch(
            `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${espn_id}`
          ).then(r => r.json())
          const pc = resSummary?.pickcenter?.[0]
          if (pc) {
            // Spread ESPN
            const spreadLine = pc.pointSpread?.home?.close?.line
            if (spreadLine) {
              const val = parseFloat(spreadLine)
              const favori = val < 0 ? detail.domicile.trigramme : detail.exterieur.trigramme
              espnSpread = { valeur: Math.abs(val), favori }
            }
            // Total ESPN
            espnTotal = pc.overUnder ?? null
            // Moneyline ESPN → probabilité
            const mlDom = pc.homeTeamOdds?.moneyLine
            const mlExt = pc.awayTeamOdds?.moneyLine
            if (mlDom && mlExt) {
              const coteDom = mlEnDecimal(mlDom)
              const coteExt = mlEnDecimal(mlExt)
              const p = coteEnPct(coteExt, coteDom)
              if (p) espnPickcenter = { extPct: p.pct1, domPct: p.pct2 }
            }
          }
        } catch { /* silencieux */ }

        // The Odds API — tous bookmakers
        try {
          const resOdds = await fetch(
            `${ODDS_API_URL}?apiKey=${ODDS_API_KEY}&regions=eu,us&markets=h2h,spreads,totals&oddsFormat=decimal`
          ).then(r => r.json())

          // Trouver le match ESPN dans la liste The Odds API par nom d'équipe
          const nomExt = detail.exterieur.nom
          const nomDom = detail.domicile.nom
          const matchOdds = resOdds.find(m =>
            (m.away_team?.includes(detail.exterieur.trigramme) || m.away_team === nomExt) &&
            (m.home_team?.includes(detail.domicile.trigramme) || m.home_team === nomDom)
          ) ?? resOdds.find(m =>
            m.away_team?.toLowerCase().includes(detail.exterieur.trigramme.toLowerCase()) ||
            m.home_team?.toLowerCase().includes(detail.domicile.trigramme.toLowerCase())
          )

          if (matchOdds) {
            setCotes({
              books: matchOdds.bookmakers,
              nomExt: matchOdds.away_team,
              nomDom: matchOdds.home_team,
              espnSpread,
              espnTotal,
              espnPickcenter,
            })
          } else {
            // Pas de match trouvé dans The Odds API — on garde quand même ESPN
            setCotes({ books: [], nomExt: detail.exterieur.nom, nomDom: detail.domicile.nom, espnSpread, espnTotal, espnPickcenter })
          }
        } catch {
          // Fallback ESPN only
          setCotes({ books: [], nomExt: detail.exterieur.nom, nomDom: detail.domicile.nom, espnSpread, espnTotal, espnPickcenter })
        }
      }
    }
    init()
  }, [espn_id])

  const FOURCHETTES = [
    { slug: 'serre',      label: 'Serré',      detail: '1-5 pts'  },
    { slug: 'modere',     label: 'Modéré',     detail: '6-10 pts' },
    { slug: 'net',        label: 'Net',         detail: '11-20 pts' },
    { slug: 'large',      label: 'Large',       detail: '21-30 pts' },
    { slug: 'domination', label: 'Domination',  detail: '31+ pts'  },
  ]

  const poserEcart = async (slug) => {
    if (!user || !matchDBId || verrou) return
    const result = await poserFourchetteEcart(user.id, matchDBId, slug)
    track(user.id, 'clic_fourchette', '/match', { fourchette: slug, espn_id: match?.espn_id })
    if (result) setEcart({ ...ecart, fourchette_choisie: slug })
  }

  const faireProno = async (equipe) => {
    if (!match || estVerrouille(match.date, match.statut)) return

    const { data: matchDB } = await supabase.from('matchs').upsert({
      espn_id: match.espn_id, date_match: match.date,
      equipe_domicile: match.domicile.trigramme, equipe_exterieur: match.exterieur.trigramme,
      statut: match.statut, type_saison: match.typeSaisonNum ?? null, saison: match.saisonNum ?? null,
    }, { onConflict: 'espn_id' }).select().single()
    if (!matchDB) return
    setMatchDBId(matchDB.id)

    const { data: pronoExistant } = await supabase
      .from('pronos').select('id')
      .eq('user_id', user.id)
      .eq('match_id', matchDB.id)
      .limit(1)
    const estNouveauProno = !pronoExistant || pronoExistant.length === 0

    const liguesCibles = await recupererLiguesCibles(user.id, match.typeSaisonNum ?? null)
    if (liguesCibles.length > 0) {
      await Promise.all(liguesCibles.map(m =>
        supabase.from('pronos').upsert({
          user_id: user.id, match_id: matchDB.id, equipe_choisie: equipe,
          resultat: 'en_attente', groupe_id: m.groupe_id,
        }, { onConflict: 'user_id,match_id,groupe_id' })
      ))
    } else {
      await supabase.from('pronos').upsert({
        user_id: user.id, match_id: matchDB.id, equipe_choisie: equipe,
        resultat: 'en_attente', groupe_id: null,
      }, { onConflict: 'user_id,match_id,groupe_id' })
    }

    if (estNouveauProno) {
      await ajouterXP(user.id, 10, 'passif', 'prono_pose')
      const aujourdhui = new Date().toISOString().slice(0, 10)
      const { data: dejaPronoJour } = await supabase
        .from('xp_log').select('id')
        .eq('user_id', user.id)
        .eq('source_id', 'premier_prono_jour')
        .gte('cree_le', aujourdhui)
        .limit(1)
      if (!dejaPronoJour || dejaPronoJour.length === 0) {
        await ajouterXP(user.id, 10, 'passif', 'premier_prono_jour')
      }
      const { data: dejaHistoire } = await supabase
        .from('xp_log').select('id')
        .eq('user_id', user.id)
        .eq('source_id', 'premier_prono_histoire')
        .limit(1)
      if (!dejaHistoire || dejaHistoire.length === 0) {
        await ajouterXP(user.id, 75, 'jalon', 'premier_prono_histoire')
      }
    }

    setProno(equipe); setRes('en_attente')
  }

  if (charg) return (
    <><Navigation /><main style={{ flex:1, padding:'20px 16px' }}>
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Chargement…</p>
    </main></>
  )
  if (erreur || !match) return (
    <><Navigation /><main style={{ flex:1, padding:'20px 16px' }}>
      <button onClick={() => navigate(-1)} style={S.retour}><ChevronLeft size={16} /> Retour</button>
      <p style={{ color:'var(--danger)', fontSize:13, marginTop:20 }}>Impossible de charger ce match.</p>
    </main></>
  )

  const { domicile: dom, exterieur: ext } = match
  const verrou     = estVerrouille(match.date, match.statut)
  const termine    = match.statut === 'STATUS_FINAL'
  const enCours    = match.statut === 'STATUS_IN_PROGRESS'
  const dateStr    = new Date(match.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const heureStr   = new Date(match.date).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
  const nbPeriodes = Math.max(dom.periodes?.length || 0, ext.periodes?.length || 0)
  const couleurExt = getCouleur(ext)
  const couleurDom = getCouleur(dom)

  const CarteEquipe = ({ eq, align }) => {
    const selec       = prono === eq.trigramme
    const perdant     = !noSpoil && termine && !eq.winner && (dom.score != null || ext.score != null)
    const couleur     = getCouleur(eq)
    const estAccent   = couleur === 'var(--accent)'
    const bgSelec     = estAccent ? 'var(--accent-dim)' : `${couleur}18`
    const txtSelec    = couleur

    return (
      <button
        onClick={() => !verrou && faireProno(eq.trigramme)}
        disabled={verrou}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '20px 10px 16px',
          background: selec ? bgSelec : 'transparent',
          borderLeft: align === 'ext' ? `3px solid ${selec ? couleur : 'transparent'}` : 'none',
          borderRight: align === 'dom' ? `3px solid ${selec ? couleur : 'transparent'}` : 'none',
          borderTop: 0, borderBottom: 0,
          cursor: verrou ? 'default' : 'pointer',
          flex: 1, opacity: perdant ? 0.35 : 1, transition: 'all 0.15s',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {eq.logo && (
          <img src={eq.logo} alt="" aria-hidden style={{
            position: 'absolute', opacity: selec ? 0.08 : 0.04,
            width: 120, height: 120, objectFit: 'contain',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', filter: 'blur(1px)',
          }} />
        )}
        {eq.logo
          ? <img src={eq.logo} alt={eq.trigramme} style={{ width: 72, height: 72, objectFit: 'contain', position: 'relative' }} />
          : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-3)' }}>{eq.trigramme}</div>
        }
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: selec ? txtSelec : 'var(--text-1)', letterSpacing: '0.04em', position: 'relative' }}>{eq.trigramme}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', position: 'relative', lineHeight: 1.3 }}>{eq.nom}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', position: 'relative' }}>{align === 'ext' ? 'Extérieur' : 'Domicile'}</span>
        {selec && !termine && (
          <span style={{ fontSize: 11, color: txtSelec, fontWeight: 700, marginTop: 2, position: 'relative' }}>✓ Mon prono</span>
        )}
        {selec && termine && !noSpoil && (
          <span style={{ fontSize: 11, fontWeight: 700, marginTop: 2, position: 'relative', color: resultat === 'correct' ? 'var(--success)' : resultat === 'incorrect' ? 'var(--danger)' : 'var(--text-3)' }}>
            {resultat === 'correct' ? '✓ Correct' : resultat === 'incorrect' ? '✗ Raté' : '⏳'}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, paddingBottom: 40 }}>

        <div style={{ padding: '12px 16px 0' }}>
          <button onClick={() => navigate(-1)} style={S.retour}>
            <ChevronLeft size={16} /> Retour
          </button>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {match.saison     && <span style={S.badge}>{match.saison}</span>}
          {match.typeSaison && <span style={{ ...S.badge, background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>{match.typeSaison}</span>}
          {(match.headline || TAG_CONFIG[match.tag]) && (
            <span style={{
              ...S.badge,
              background: (TAG_CONFIG[match.tag]?.couleur || 'var(--accent)') + '22',
              color: TAG_CONFIG[match.tag]?.couleur || 'var(--accent)',
              borderColor: (TAG_CONFIG[match.tag]?.couleur || 'var(--accent)') + '55',
              fontWeight: 700,
            }}>
              {match.headline || TAG_CONFIG[match.tag]?.label}
            </span>
          )}
          {enCours && <span style={{ ...S.badge, background: 'rgba(34,197,94,0.1)', color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)' }}>● Live — Q{match.periode} {match.clock}</span>}
        </div>

        {match.serie?.summary && !noSpoil && (
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--accent)', margin: '0 16px 10px', lineHeight: 1.5 }}>
            {match.serie.description && <span style={{ color: 'var(--text-3)', fontWeight: 400, marginRight: 6 }}>{match.serie.description} ·</span>}
            {match.serie.summary}
          </div>
        )}

        <div style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          {!verrou && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', padding: '10px 16px 0', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {prono ? 'Tu peux encore changer d\'avis' : 'Clique sur une équipe pour pronostiquer'}
            </div>
          )}
          {enCours && !prono && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', padding: '10px 16px 0', fontWeight: 600 }}>
              🔒 Match en cours — pronos fermés
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
            <CarteEquipe eq={ext} align="ext" />
            <div style={{ textAlign: 'center', minWidth: 80, padding: '0 8px' }}>
              {(termine || enCours) && ext.score != null ? (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: noSpoil && termine ? 22 : 44, color: noSpoil && termine ? 'var(--text-3)' : 'var(--text-1)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {noSpoil && termine ? '🙈' : `${ext.score}–${dom.score}`}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 5, fontWeight: enCours ? 700 : 400, color: enCours ? 'var(--success)' : 'var(--text-3)' }}>
                    {enCours ? `Q${match.periode} ${match.clock}` : (noSpoil ? 'Terminé' : 'Final')}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-3)', lineHeight: 1 }}>VS</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontWeight: 600 }}>{heureStr}</div>
                </>
              )}
            </div>
            <CarteEquipe eq={dom} align="dom" />
          </div>

          {nbPeriodes > 0 && !noSpoil && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${nbPeriodes}, 1fr) 44px`, gap: 4, fontSize: 11, textAlign: 'center', minWidth: 240 }}>
                <div />
                {Array.from({ length: nbPeriodes }, (_, i) => (
                  <div key={i} style={{ color: 'var(--text-3)', fontWeight: 600 }}>{i < 4 ? `Q${i+1}` : `OT${i-3}`}</div>
                ))}
                <div style={{ color: 'var(--text-3)', fontWeight: 700 }}>TOT</div>
                {[ext, dom].map(eq => (
                  <React.Fragment key={eq.trigramme}>
                    <div style={{ color: 'var(--text-2)', fontWeight: 700, textAlign: 'left', fontFamily: 'var(--font-display)' }}>{eq.trigramme}</div>
                    {Array.from({ length: nbPeriodes }, (_, i) => (
                      <div key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{eq.periodes?.[i] ?? '–'}</div>
                    ))}
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: eq.winner ? 'var(--success)' : 'var(--text-1)' }}>{eq.score ?? '–'}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-0)', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{dateStr} à {heureStr}</div>
          {match.stade && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {match.stade}{match.ville ? ` · ${match.ville}` : ''}
            </div>
          )}
        </div>

        {/* BONUS ÉCART */}
        {(prono && !termine) || (termine && ecart?.fourchette_choisie) ? (
          <div style={{ background: 'var(--bg-1)', padding: '16px 16px 18px', borderLeft: '3px solid var(--gold)' }}>
            <TitreSection mot1="BONUS" mot2="ÉCART" couleur2="var(--gold)" />
            {!termine && (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 12px', lineHeight: 1.6 }}>
                  Choisis une <strong style={{ color: 'var(--text-2)' }}>fourchette d'écart</strong> et gagne <strong style={{ color: 'var(--gold)' }}>+2 pts</strong> si tu vises juste.
                </p>
                {ecart?.fourchette_choisie && (
                  <p style={{ fontSize: 11, color: 'var(--accent)', margin: '0 0 10px', fontStyle: 'italic' }}>
                    Tu as pronostiqué un écart <strong>{FOURCHETTES.find(f => f.slug === ecart.fourchette_choisie)?.label}</strong> — tu peux encore changer !
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {FOURCHETTES.map(f => {
                    const selec = ecart?.fourchette_choisie === f.slug
                    return (
                      <button
                        key={f.slug}
                        onClick={() => poserEcart(f.slug)}
                        style={{
                          padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid',
                          borderColor: selec ? 'var(--gold)' : 'var(--border-2)',
                          background: selec ? 'var(--gold-dim)' : 'var(--bg-2)',
                          color: selec ? 'var(--gold)' : 'var(--text-2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.8 }}>
                  {FOURCHETTES.map(f => `${f.label} ${f.detail}`).join(' · ')}
                </div>
              </>
            )}
            {termine && ecart?.fourchette_choisie && (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                  Fourchette réelle : <strong style={{ color: 'var(--text-1)' }}>
                    {ecart.fourchette_reelle ? FOURCHETTES.find(f => f.slug === ecart.fourchette_reelle)?.label : '–'}
                  </strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                  Ta fourchette : <strong style={{ color: 'var(--text-1)' }}>
                    {FOURCHETTES.find(f => f.slug === ecart.fourchette_choisie)?.label}
                  </strong>
                  {' '}
                  {ecart.correct === true
                    ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ +2 pts gagnés !</span>
                    : ecart.correct === false
                      ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✗ Raté</span>
                      : <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>⏳ En attente</span>
                  }
                </div>
              </>
            )}
          </div>
        ) : null}

        <div style={{ height: 30 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* BLOC CONTEXTE COTES — uniquement pré-match */}
          {!termine && (prediction || cotes) && (
            <BlocCotes
              cotes={cotes}
              prediction={prediction}
              ext={ext}
              dom={dom}
              couleurExt={couleurExt}
              couleurDom={couleurDom}
              termine={termine}
            />
          )}

          {(ext.l5?.length > 0 || dom.l5?.length > 0) && (
            <div style={{ background: 'var(--bg-0)', padding: '16px 16px 20px', borderLeft: '3px solid var(--border-2)' }}>
              <TitreSection mot1="FORME" mot2="RÉCENTE" couleur2="var(--text-2)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[ext, dom].map(eq => (
                  <div key={eq.trigramme} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, minWidth: 32, fontFamily: 'var(--font-display)' }}>{eq.trigramme}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {eq.l5?.map((j, i) => (
                        <div key={i} style={{
                          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                          background: j.resultat === 'W' ? 'var(--success-dim)' : 'var(--danger-dim)',
                          color: j.resultat === 'W' ? 'var(--success)' : 'var(--danger)',
                          borderWidth: 1, borderStyle: 'solid',
                          borderColor: j.resultat === 'W' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                        }}>{j.resultat}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dom.stats?.fg || ext.stats?.fg) && (
            <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--accent)' }}>
              <TitreSection mot1="STATS" mot2={termine ? 'DU MATCH' : 'SAISON'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ext.logo && <img src={ext.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: couleurExt !== 'var(--accent)' ? couleurExt : 'var(--accent)' }}>{ext.trigramme}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: couleurDom !== 'var(--accent)' ? couleurDom : 'var(--orange)' }}>{dom.trigramme}</span>
                  {dom.logo && <img src={dom.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                </div>
              </div>
              {STATS_LABELS.map(({ key, label }) => {
                const vE = ext.stats?.[key]; const vD = dom.stats?.[key]
                return <BarreStat key={key} vE={vE} vD={vD} label={label} couleurExt={couleurExt} couleurDom={couleurDom} />
              })}
            </div>
          )}

          {(dom.leaders?.length > 0 || ext.leaders?.length > 0) && (
            <div style={{ background: 'var(--bg-0)', padding: '16px 16px 20px', borderLeft: '3px solid var(--gold)' }}>
              <TitreSection mot1="LEADERS" couleur2="var(--gold)" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {[ext, dom].map(eq => (
                  <div key={eq.trigramme}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      {eq.logo && <img src={eq.logo} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />}
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{eq.trigramme} — {eq.nom}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
                      {eq.leaders?.map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {l.photo && <img src={l.photo} alt={l.joueur || ''} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: 'var(--bg-2)' }} />}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.joueur}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gold)' }}>{l.valeur}</span>{' '}{l.categorie}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dom.blessés?.length > 0 || ext.blessés?.length > 0) && (
            <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--danger)' }}>
              <TitreSection mot1="BLESSÉS" mot2="/ ABSENTS" couleur2="var(--danger)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[ext, dom].map(eq => (
                  <div key={eq.trigramme}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{eq.trigramme}</div>
                    {!eq.blessés?.length
                      ? <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✓ RAS</div>
                      : eq.blessés.map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          {b.photo && <img src={b.photo} alt={b.joueur || ''} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-2)', flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{b.joueur}</div>
                            <div style={{ fontSize: 10, color: 'var(--danger)' }}>{b.statut}{b.type ? ` · ${b.type}` : ''}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

const S = {
  retour: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', borderWidth: 0, color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', marginBottom: 12, paddingLeft: 0 },
  badge:  { fontSize: 11, fontWeight: 600, padding: '3px 8px', background: 'var(--bg-2)', color: 'var(--text-3)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)' },
}

export default MatchDetail
