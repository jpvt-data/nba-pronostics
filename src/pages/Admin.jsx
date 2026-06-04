import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Trash2, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'
const BASE_ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'

const SAISONS = [
  { label: '2023-24', anneeDebut: 2023, anneeFin: 2024 },
  { label: '2024-25', anneeDebut: 2024, anneeFin: 2025 },
  { label: '2025-26', anneeDebut: 2025, anneeFin: 2026 },
  { label: '2026-27', anneeDebut: 2026, anneeFin: 2027 },
]

const plagesMois = (anneeDebut, anneeFin) => [
  { label: 'Oct',  debut: `${anneeDebut}1001`, fin: `${anneeDebut}1031` },
  { label: 'Nov',  debut: `${anneeDebut}1101`, fin: `${anneeDebut}1130` },
  { label: 'Déc',  debut: `${anneeDebut}1201`, fin: `${anneeDebut}1231` },
  { label: 'Jan',  debut: `${anneeFin}0101`,   fin: `${anneeFin}0131` },
  { label: 'Fév',  debut: `${anneeFin}0201`,   fin: `${anneeFin}0228` },
  { label: 'Mar',  debut: `${anneeFin}0301`,   fin: `${anneeFin}0331` },
  { label: 'Avr',  debut: `${anneeFin}0401`,   fin: `${anneeFin}0430` },
  { label: 'Mai',  debut: `${anneeFin}0501`,   fin: `${anneeFin}0531` },
  { label: 'Juin', debut: `${anneeFin}0601`,   fin: `${anneeFin}0630` },
]

const detecterType = (evt, comp) => {
  const seasonType = evt.season?.type
  const compType = comp.type?.abbreviation
  const headline = (comp.notes?.[0]?.headline || '').toLowerCase()
  const ville = (comp.venue?.address?.city || '').toLowerCase()
  const pays = (comp.venue?.address?.country || '').toLowerCase()
  const salle = (comp.venue?.fullName || '').toLowerCase()

  if (seasonType === 1) return 'preseason'
  if (seasonType === 5) return 'playin'
  if (seasonType === 3) {
    if (headline.includes('nba finals') || headline.includes('finals - game')) return 'finals'
    return 'playoffs'
  }
  if (compType === 'ALLSTAR') return 'allstar'
  if (seasonType === 2) {
    if (headline.includes('nba cup') || headline.includes('in-season tournament')) return 'nbacup'
    if (headline.includes('all-star') || headline.includes('allstar')) return 'allstar'
    if (headline.includes('play-in')) return 'playin'
    if (headline.includes('paris')) return 'paris'
    if (headline.includes('abu dhabi') || ville.includes('abu dhabi') || pays.includes('united arab')) return 'abudhabi'
    if (headline.includes('mexico') || ville.includes('mexico city') || ville.includes('ciudad de méxico')) return 'mexico'
    if (headline.includes('berlin') || ville.includes('berlin')) return 'berlin'
    if (headline.includes('manchester') || headline.includes('london') || ville.includes('manchester') || ville.includes('london')) return 'uk'
    if (comp.neutralSite) {
      const villesUS = ['las vegas', 'inglewood', 'phoenix', 'atlanta', 'chicago', 'dallas', 'denver', 'houston', 'miami', 'minneapolis', 'new york', 'brooklyn', 'boston', 'philadelphia', 'portland', 'sacramento', 'san antonio', 'san francisco', 'oklahoma city', 'memphis', 'new orleans', 'toronto', 'milwaukee', 'cleveland', 'detroit', 'charlotte', 'washington', 'orlando', 'indiana', 'golden state']
      if (!villesUS.some(v => ville.includes(v))) return 'international'
    }
    return 'regular'
  }
  return 'inconnu'
}

const TYPES_CONFIG = {
  preseason:     { label: 'Pré-saison',            couleur: '#6366f1', priorite: 1 },
  regular:       { label: 'Saison régulière',       couleur: '#9090b0', priorite: 2 },
  nbacup:        { label: 'NBA Cup',                couleur: '#f97316', priorite: 3 },
  allstar:       { label: 'All-Star',               couleur: '#f59e0b', priorite: 4 },
  playin:        { label: 'Play-In',                couleur: '#22c55e', priorite: 5 },
  playoffs:      { label: 'Playoffs',               couleur: '#ef4444', priorite: 6 },
  finals:        { label: 'NBA Finals',             couleur: '#e11d48', priorite: 7 },
  paris:         { label: 'Paris Game',             couleur: '#8b5cf6', priorite: 8 },
  abudhabi:      { label: 'Abu Dhabi Games',        couleur: '#8b5cf6', priorite: 9 },
  mexico:        { label: 'Mexico Game',            couleur: '#8b5cf6', priorite: 10 },
  berlin:        { label: 'Berlin Game',            couleur: '#8b5cf6', priorite: 11 },
  uk:            { label: 'UK Game',                couleur: '#8b5cf6', priorite: 12 },
  international: { label: 'Match international',    couleur: '#8b5cf6', priorite: 13 },
  inconnu:       { label: 'Non identifié',          couleur: '#ef4444', priorite: 99 },
}

const TYPES_ATTENDUS = ['preseason', 'regular', 'nbacup', 'allstar', 'playin', 'playoffs', 'finals', 'paris', 'abudhabi', 'mexico', 'berlin', 'uk']

const fmtDate = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ══════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════
function Admin() {
  const navigate = useNavigate()
  const [autrise, setAutorise] = useState(false)
  const [onglet, setOnglet] = useState('scanner')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id !== ADMIN_ID) navigate('/accueil')
      else setAutorise(true)
    })
  }, [])

  if (!autrise) return null

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>
        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--danger)' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>ADMIN</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--danger)', letterSpacing: '0.02em', lineHeight: 1 }}>🛡️</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Zone d'administration</p>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '0 16px 16px' }}>
          {[{ key: 'scanner', label: 'Scanner ESPN' }, { key: 'moderation', label: 'Modération' }].map(o => (
            <button key={o.key} onClick={() => setOnglet(o.key)} style={{
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid', cursor: 'pointer',
              background: onglet === o.key ? 'var(--danger)' : 'transparent',
              color: onglet === o.key ? '#fff' : 'var(--text-3)',
              borderColor: onglet === o.key ? 'var(--danger)' : 'var(--border)',
            }}>{o.label}</button>
          ))}
        </div>

        {onglet === 'scanner'    && <OngletScanner />}
        {onglet === 'moderation' && <OngletModeration />}
      </main>
    </>
  )
}

// ══════════════════════════════════════════
// ONGLET SCANNER ESPN
// ══════════════════════════════════════════
function OngletScanner() {
  const [saison, setSaison] = useState('2025-26')
  const [scanning, setScanning] = useState(false)
  const [progression, setProgression] = useState([])
  const [resultats, setResultats] = useState(null)
  const [detailTag, setDetailTag] = useState(null)
  const annule = useRef(false)

  const saisonConfig = SAISONS.find(s => s.label === saison)

  const scanner = async () => {
    annule.current = false
    setScanning(true)
    setResultats(null)
    setDetailTag(null)

    const plages = plagesMois(saisonConfig.anneeDebut, saisonConfig.anneeFin)
    setProgression(plages.map(p => ({ label: p.label, statut: 'attente', nb: 0 })))

    const tousMatchs = []

    for (let i = 0; i < plages.length; i++) {
      if (annule.current) break
      const plage = plages[i]

      setProgression(prev => prev.map((p, idx) => idx === i ? { ...p, statut: 'en cours' } : p))

      try {
        const res = await fetch(`${BASE_ESPN}?dates=${plage.debut}-${plage.fin}&limit=500`)
        const data = await res.json()
        const events = data.events || []

        events.forEach(evt => {
          const comp = evt.competitions?.[0]
          if (!comp) return
          const tag = detecterType(evt, comp)
          tousMatchs.push({
            date: evt.date?.slice(0, 10),
            dom: comp.competitors?.find(c => c.homeAway === 'home')?.team?.abbreviation || '?',
            ext: comp.competitors?.find(c => c.homeAway === 'away')?.team?.abbreviation || '?',
            seasonType: evt.season?.type,
            slug: evt.season?.slug || '',
            compType: comp.type?.abbreviation || '',
            headline: comp.notes?.[0]?.headline || '',
            ville: comp.venue?.address?.city || '',
            neutralSite: comp.neutralSite || false,
            tag,
          })
        })

        setProgression(prev => prev.map((p, idx) =>
          idx === i ? { ...p, statut: events.length > 0 ? 'ok' : 'vide', nb: events.length } : p
        ))
      } catch {
        setProgression(prev => prev.map((p, idx) =>
          idx === i ? { ...p, statut: 'erreur', nb: 0 } : p
        ))
      }
      await sleep(300)
    }

    // Synthèse
    const synthese = {}
    tousMatchs.forEach(m => {
      if (!synthese[m.tag]) synthese[m.tag] = { matchs: [], dateMin: null, dateMax: null }
      synthese[m.tag].matchs.push(m)
      if (!synthese[m.tag].dateMin || m.date < synthese[m.tag].dateMin) synthese[m.tag].dateMin = m.date
      if (!synthese[m.tag].dateMax || m.date > synthese[m.tag].dateMax) synthese[m.tag].dateMax = m.date
    })

    setResultats({ synthese, total: tousMatchs.length })
    setScanning(false)
  }

  return (
    <div style={{ padding: '0 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>SCANNER</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--accent)', letterSpacing: '0.02em' }}>ESPN</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 16px' }}>
        Scanne tous les matchs d'une saison mois par mois et détecte chaque type d'événement.
      </p>

      {/* Contrôles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={saison} onChange={e => { setSaison(e.target.value); setResultats(null) }} disabled={scanning} style={S.select}>
          {SAISONS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>

        {!scanning ? (
          <button onClick={scanner} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#fff', borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            <Search size={14} /> Scanner {saison}
          </button>
        ) : (
          <button onClick={() => { annule.current = true; setScanning(false) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, background: 'var(--danger)', color: '#fff', borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            ✕ Arrêter
          </button>
        )}

        {resultats && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{resultats.total} matchs scannés</span>}
      </div>

      {/* Progression mois */}
      {progression.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
          {progression.map((p, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 10px', minWidth: 54,
              background: p.statut === 'ok' ? 'var(--success-dim)' : p.statut === 'vide' ? 'var(--bg-2)' : p.statut === 'erreur' ? 'var(--danger-dim)' : p.statut === 'en cours' ? 'var(--accent-dim)' : 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: p.statut === 'ok' ? 'rgba(34,197,94,0.3)' : p.statut === 'erreur' ? 'rgba(239,68,68,0.3)' : p.statut === 'en cours' ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)' }}>{p.label}</span>
              <span style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>
                {p.statut === 'en cours' ? '…' : p.statut === 'ok' ? `${p.nb}` : p.statut === 'vide' ? 'vide' : p.statut === 'erreur' ? 'ERR' : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Résultats */}
      {resultats && (
        <>
          <TableauSynthese synthese={resultats.synthese} detailTag={detailTag} onClickTag={setDetailTag} />
          {detailTag && resultats.synthese[detailTag] && (
            <>
              <div style={{ height: 20 }} />
              <TableauDetail tag={detailTag} matchs={resultats.synthese[detailTag].matchs} onClose={() => setDetailTag(null)} />
            </>
          )}
          {resultats.synthese['inconnu'] && detailTag !== 'inconnu' && (
            <>
              <div style={{ height: 20 }} />
              <TableauDetail tag="inconnu" matchs={resultats.synthese['inconnu'].matchs} onClose={null} initOuvert />
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Tableau synthèse ──
function TableauSynthese({ synthese, detailTag, onClickTag }) {
  const typesTrouves = Object.keys(synthese)
  const typesManquants = TYPES_ATTENDUS.filter(t => !typesTrouves.includes(t))
  const typesExtra = typesTrouves.filter(t => !TYPES_ATTENDUS.includes(t) && t !== 'inconnu' && t !== 'regular')

  const lignes = [
    ...TYPES_ATTENDUS.map(t => ({ tag: t, manquant: !typesTrouves.includes(t) })),
    ...typesExtra.map(t => ({ tag: t, manquant: false })),
    ...(synthese['inconnu'] ? [{ tag: 'inconnu', manquant: false }] : []),
  ]

  const nbOk = TYPES_ATTENDUS.filter(t => typesTrouves.includes(t)).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--text-1)', letterSpacing: '0.02em' }}>SYNTHÈSE</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--accent)', letterSpacing: '0.02em' }}>DÉTECTION</span>
        </div>
        <span style={{ fontSize: 11, color: nbOk === TYPES_ATTENDUS.length ? 'var(--success)' : 'var(--gold)', fontWeight: 700 }}>
          {nbOk}/{TYPES_ATTENDUS.length} types détectés
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 160px 90px 90px 60px 100px 60px', gap: 0, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
        {['Type', 'Label', 'Début', 'Fin', 'Matchs', 'Notes ESPN (ex.)', 'Statut'].map(h => (
          <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 6px' }}>{h}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {lignes.map(({ tag, manquant }, i) => {
          const config = TYPES_CONFIG[tag] || { label: tag, couleur: '#9090b0' }
          const data = synthese[tag]
          const actif = detailTag === tag
          const exNote = data?.matchs?.find(m => m.headline)?.headline || ''

          return (
            <div
              key={tag}
              onClick={() => data && onClickTag(actif ? null : tag)}
              style={{
                display: 'grid', gridTemplateColumns: '120px 160px 90px 90px 60px 100px 60px',
                gap: 0, cursor: data ? 'pointer' : 'default',
                background: actif ? 'var(--accent-dim)' : manquant ? 'rgba(239,68,68,0.06)' : i % 2 === 0 ? 'var(--bg-1)' : 'transparent',
                borderLeft: `3px solid ${manquant ? 'var(--danger)' : config.couleur}`,
                opacity: manquant ? 0.65 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (data && !actif) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
              onMouseLeave={e => { if (!actif) e.currentTarget.style.background = manquant ? 'rgba(239,68,68,0.06)' : i % 2 === 0 ? 'var(--bg-1)' : 'transparent' }}
            >
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: config.couleur + '22', color: config.couleur, padding: '2px 5px', borderRadius: 3 }}>
                  {tag}
                </span>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{config.label}</span>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{data ? fmtDate(data.dateMin) : '—'}</span>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{data ? fmtDate(data.dateMax) : '—'}</span>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: data ? 'var(--text-1)' : 'var(--text-3)' }}>
                  {data ? data.matchs.length : 0}
                </span>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: 'var(--text-3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exNote ? `"${exNote.slice(0, 30)}"` : '—'}
                </span>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                {manquant
                  ? <><AlertCircle size={12} color="var(--danger)" /><span style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700 }}>MANQUANT</span></>
                  : <><CheckCircle size={12} color="var(--success)" /><span style={{ fontSize: 9, color: 'var(--success)', fontWeight: 700 }}>OK</span></>
                }
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>
        Clique sur une ligne pour voir le détail · ⊕ = match en terrain neutre
      </p>
    </div>
  )
}

// ── Tableau détail matchs ──
function TableauDetail({ tag, matchs, onClose, initOuvert = false }) {
  const [ouvert, setOuvert] = useState(initOuvert)
  const config = TYPES_CONFIG[tag] || { label: tag, couleur: '#9090b0' }

  return (
    <div style={{ background: 'var(--bg-1)', borderLeft: `3px solid ${config.couleur}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }} onClick={() => setOuvert(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 15, color: config.couleur, letterSpacing: '0.02em' }}>
            {config.label.toUpperCase()}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{matchs.length} matchs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onClose && (
            <button onClick={e => { e.stopPropagation(); onClose() }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
          )}
          {ouvert ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
        </div>
      </div>

      {ouvert && (
        <div style={{ overflowX: 'auto', padding: '0 0 12px' }}>
          <div style={{ minWidth: 640 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 90px 120px 50px 70px 1fr 100px', borderBottom: '1px solid var(--border)', padding: '0 12px' }}>
              {['Date', 'Match', 'Ville / Salle', 'S.T.', 'Comp', 'Notes ESPN', 'Tag'].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 4px' }}>{h}</div>
              ))}
            </div>

            {matchs.slice(0, 300).map((m, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '80px 90px 120px 50px 70px 1fr 100px',
                background: i % 2 === 0 ? 'transparent' : 'var(--bg-2)',
                padding: '0 12px',
              }}>
                <div style={{ padding: '5px 4px', fontSize: 11, color: 'var(--text-2)' }}>{fmtDate(m.date)}</div>
                <div style={{ padding: '5px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
                  {m.ext}@{m.dom}
                </div>
                <div style={{ padding: '5px 4px', fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.ville || '—'}{m.neutralSite ? ' ⊕' : ''}
                </div>
                <div style={{ padding: '5px 4px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: m.seasonType === 1 ? '#6366f1' : m.seasonType === 3 ? '#ef4444' : m.seasonType === 5 ? '#22c55e' : '#9090b0' }}>
                    {m.seasonType ?? '?'}
                  </span>
                </div>
                <div style={{ padding: '5px 4px', fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                  {m.compType || '—'}
                </div>
                <div style={{ padding: '5px 4px', fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.headline || '—'}
                </div>
                <div style={{ padding: '5px 4px' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', background: (TYPES_CONFIG[m.tag]?.couleur || '#9090b0') + '22', color: TYPES_CONFIG[m.tag]?.couleur || '#9090b0', padding: '2px 5px', borderRadius: 3 }}>
                    {m.tag}
                  </span>
                </div>
              </div>
            ))}

            {matchs.length > 300 && (
              <p style={{ fontSize: 11, color: 'var(--text-3)', padding: '8px 12px' }}>… {matchs.length - 300} matchs supplémentaires non affichés.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// ONGLET MODÉRATION
// ══════════════════════════════════════════
function OngletModeration() {
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)

  const charger = async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, contenu, cree_le, user_id, groupe_id, profils(pseudo), groupes(nom)')
      .order('cree_le', { ascending: false })
      .limit(100)
    setMessages(data || [])
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  const supprimer = async (id) => {
    await supabase.from('messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const formaterDate = (str) => {
    const d = new Date(str + 'Z')
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ background: 'var(--bg-1)', padding: '16px 16px 24px', borderLeft: '3px solid var(--danger)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>TOUS LES</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--danger)', letterSpacing: '0.02em' }}>MESSAGES</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>({messages.length})</span>
      </div>
      {chargement && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement…</p>}
      {!chargement && messages.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Aucun message.</p>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--border)', borderLeft: '3px solid var(--border-2)', marginLeft: -16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{msg.groupes?.nom || '—'}</span>
              <div style={{ marginTop: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>{msg.profils?.pseudo || '—'}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{msg.contenu}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, display: 'block' }}>{formaterDate(msg.cree_le)}</span>
            </div>
            <button onClick={() => supprimer(msg.id)} style={{ background: 'none', borderWidth: 0, color: 'var(--danger)', cursor: 'pointer', padding: 4, flexShrink: 0, opacity: 0.5 }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const S = {
  select: {
    background: 'var(--bg-1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
    padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
}

export default Admin
