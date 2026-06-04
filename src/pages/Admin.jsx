import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Trash2, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Plus, Pencil, X, Check } from 'lucide-react'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'
const BASE_NBA = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
const BASE_SL  = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba-summer-las-vegas/scoreboard'

const SAISONS = [
  { label: '2023-24', anneeDebut: 2023, anneeFin: 2024 },
  { label: '2024-25', anneeDebut: 2024, anneeFin: 2025 },
  { label: '2025-26', anneeDebut: 2025, anneeFin: 2026 },
  { label: '2026-27', anneeDebut: 2026, anneeFin: 2027 },
  { label: '2027-28', anneeDebut: 2027, anneeFin: 2028 },
  { label: '2028-29', anneeDebut: 2028, anneeFin: 2029 },
  { label: '2029-30', anneeDebut: 2029, anneeFin: 2030 },
]

const plagesMois = (anneeDebut, anneeFin) => [
  { label: 'Juil', debut: `${anneeDebut}0701`, fin: `${anneeDebut}0731`, summerLeague: true },
  { label: 'Août', debut: `${anneeDebut}0801`, fin: `${anneeDebut}0831`, summerLeague: true },
  { label: 'Sep',  debut: `${anneeDebut}0901`, fin: `${anneeDebut}0930` },
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

const detecterType = (evt, comp, isSummerLeague = false) => {
  if (isSummerLeague) return 'summer_league'
  const seasonType = evt.season?.type
  const compType   = comp.type?.abbreviation || ''
  const headline   = (comp.notes?.[0]?.headline || '').toLowerCase()
  if (seasonType === 1) return 'preseason'
  if (seasonType === 5) return 'playin'
  if (seasonType === 3) {
    const estFinals = ['nba finals', 'the finals'].some(p => headline.includes(p))
    return estFinals ? 'finals' : 'playoffs'
  }
  if (compType === 'ALLSTAR' || ['all-star', 'allstar', 'all star'].some(p => headline.includes(p))) return 'allstar'
  if (seasonType === 2) {
    if (['nba cup', 'in-season tournament', 'nba cup - group', 'nba cup - knockout', 'nba cup - semifinal', 'nba cup - final', 'nba cup championship'].some(p => headline.includes(p))) return 'nbacup'
    if (['play-in'].some(p => headline.includes(p))) return 'playin'
    return 'regular'
  }
  return 'inconnu'
}

const TYPES_CONFIG = {
  preseason:    { label: 'Pré-saison',        couleur: '#6366f1', obligatoire: true,  priorite: 1 },
  regular:      { label: 'Saison régulière',  couleur: '#9090b0', obligatoire: true,  priorite: 2 },
  nbacup:       { label: 'NBA Cup',           couleur: '#f97316', obligatoire: false, priorite: 3 },
  allstar:      { label: 'All-Star',          couleur: '#f59e0b', obligatoire: true,  priorite: 4 },
  playin:       { label: 'Play-In',           couleur: '#22c55e', obligatoire: true,  priorite: 5 },
  playoffs:     { label: 'Playoffs',          couleur: '#ef4444', obligatoire: true,  priorite: 6 },
  finals:       { label: 'NBA Finals',        couleur: '#e11d48', obligatoire: true,  priorite: 7 },
  summer_league:{ label: 'Summer League',     couleur: '#06b6d4', obligatoire: false, priorite: 8 },
  inconnu:      { label: 'Non identifié ⚠️', couleur: '#ef4444', obligatoire: false, priorite: 99 },
}

// Types disponibles pour créer une ligue
const TYPES_LIGUE = [
  { value: '',             label: 'Toutes phases (ligue générale)',  tag: null,           typeSaison: null },
  { value: 'preseason',    label: 'Pré-saison',                      tag: 'preseason',    typeSaison: 1    },
  { value: 'regular',      label: 'Saison régulière',                tag: 'regular',      typeSaison: 2    },
  { value: 'nbacup',       label: 'NBA Cup',                         tag: 'nbacup',       typeSaison: 2    },
  { value: 'allstar',      label: 'All-Star',                        tag: 'allstar',      typeSaison: 2    },
  { value: 'playin',       label: 'Play-In',                         tag: 'playin',       typeSaison: 5    },
  { value: 'playoffs',     label: 'Playoffs',                        tag: 'playoffs',     typeSaison: 3    },
  { value: 'finals',       label: 'NBA Finals',                      tag: 'finals',       typeSaison: 3    },
  { value: 'summer_league',label: 'Summer League',                   tag: 'summer_league',typeSaison: 2    },
]

const TYPES_OBLIGS = Object.keys(TYPES_CONFIG).filter(t => TYPES_CONFIG[t].obligatoire)
const fmtDate = (str) => str ? new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const extraireMatchs = (data, isSummerLeague = false) =>
  (data.events || []).map(evt => {
    const comp = evt.competitions?.[0]
    if (!comp) return null
    const dom = comp.competitors?.find(c => c.homeAway === 'home')
    const ext = comp.competitors?.find(c => c.homeAway === 'away')
    return {
      date: evt.date?.slice(0, 10),
      dom: dom?.team?.abbreviation || '?',
      ext: ext?.team?.abbreviation || '?',
      seasonType: evt.season?.type,
      slug: evt.season?.slug || '',
      compType: comp.type?.abbreviation || '',
      headline: comp.notes?.[0]?.headline || '',
      ville: comp.venue?.address?.city || '',
      pays: comp.venue?.address?.country || '',
      neutralSite: comp.neutralSite || false,
      source: isSummerLeague ? 'sl' : 'nba',
      tag: detecterType(evt, comp, isSummerLeague),
    }
  }).filter(Boolean)

// ══════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════
function Admin() {
  const navigate = useNavigate()
  const [autrise, setAutorise] = useState(false)
  const [onglet, setOnglet]   = useState('scanner')

  // State scanner persistant — survit aux changements d'onglet
  const [scanSaison, setScanSaison]         = useState('2025-26')
  const [scanProgression, setScanProgression] = useState([])
  const [scanResultats, setScanResultats]   = useState(null)
  const [scanScanning, setScanScanning]     = useState(false)
  const [scanDetailTag, setScanDetailTag]   = useState(null)

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

        <div style={{ display: 'flex', gap: 4, padding: '0 16px 16px', flexWrap: 'wrap' }}>
          {[
            { key: 'scanner',    label: 'Scanner ESPN' },
            { key: 'ligues',     label: 'Ligues' },
            { key: 'moderation', label: 'Modération' },
          ].map(o => (
            <button key={o.key} onClick={() => setOnglet(o.key)} style={{
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid', cursor: 'pointer',
              background: onglet === o.key ? 'var(--danger)' : 'transparent',
              color: onglet === o.key ? '#fff' : 'var(--text-3)',
              borderColor: onglet === o.key ? 'var(--danger)' : 'var(--border)',
            }}>{o.label}</button>
          ))}
        </div>

        {onglet === 'scanner' && (
          <OngletScanner
            saison={scanSaison} setSaison={setScanSaison}
            progression={scanProgression} setProgression={setScanProgression}
            resultats={scanResultats} setResultats={setScanResultats}
            scanning={scanScanning} setScanning={setScanScanning}
            detailTag={scanDetailTag} setDetailTag={setScanDetailTag}
          />
        )}
        {onglet === 'ligues'     && <OngletLigues scanResultats={scanResultats} scanSaison={scanSaison} />}
        {onglet === 'moderation' && <OngletModeration />}
      </main>
    </>
  )
}

// ══════════════════════════════════════════
// ONGLET SCANNER ESPN
// ══════════════════════════════════════════
function OngletScanner({ saison, setSaison, progression, setProgression, resultats, setResultats, scanning, setScanning, detailTag, setDetailTag }) {
  const annule = useRef(false)
  const saisonConfig = SAISONS.find(s => s.label === saison)

  const scanner = async () => {
    annule.current = false
    setScanning(true)
    setResultats(null)
    setDetailTag(null)
    const plages = plagesMois(saisonConfig.anneeDebut, saisonConfig.anneeFin)
    setProgression(plages.map(p => ({ label: p.label, statut: 'attente', nb: 0, nbSL: 0 })))
    const tousMatchs = []
    for (let i = 0; i < plages.length; i++) {
      if (annule.current) break
      const plage = plages[i]
      setProgression(prev => prev.map((p, idx) => idx === i ? { ...p, statut: 'en cours' } : p))
      let nbNBA = 0, nbSL = 0
      try {
        const res = await fetch(`${BASE_NBA}?dates=${plage.debut}-${plage.fin}&limit=500`)
        const data = await res.json()
        const matchs = extraireMatchs(data, false)
        tousMatchs.push(...matchs)
        nbNBA = matchs.length
      } catch { /* silencieux */ }
      if (plage.summerLeague) {
        await sleep(300)
        try {
          const res = await fetch(`${BASE_SL}?dates=${plage.debut}-${plage.fin}&limit=500`)
          const data = await res.json()
          const matchs = extraireMatchs(data, true)
          tousMatchs.push(...matchs)
          nbSL = matchs.length
        } catch { /* silencieux */ }
      }
      setProgression(prev => prev.map((p, idx) =>
        idx === i ? { ...p, statut: (nbNBA + nbSL) > 0 ? 'ok' : 'vide', nb: nbNBA, nbSL } : p
      ))
      await sleep(300)
    }
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
        Scan complet juillet → juin · NBA + Summer League · Résultats persistants entre onglets
      </p>

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
        {resultats && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Données disponibles pour créer des ligues</span>}
      </div>

      {progression.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
          {progression.map((p, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 8px', minWidth: 46,
              background: p.statut === 'ok' ? 'var(--success-dim)' : p.statut === 'vide' ? 'var(--bg-2)' : p.statut === 'erreur' ? 'var(--danger-dim)' : p.statut === 'en cours' ? 'var(--accent-dim)' : 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: p.statut === 'ok' ? 'rgba(34,197,94,0.3)' : p.statut === 'erreur' ? 'rgba(239,68,68,0.3)' : p.statut === 'en cours' ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)' }}>{p.label}</span>
              <span style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>
                {p.statut === 'en cours' ? '…' : p.statut === 'ok' ? `${p.nb}${p.nbSL > 0 ? `+${p.nbSL}` : ''}` : p.statut === 'vide' ? 'vide' : p.statut === 'erreur' ? 'ERR' : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {resultats && (
        <>
          <TableauSynthese synthese={resultats.synthese} detailTag={detailTag} onClickTag={t => setDetailTag(detailTag === t ? null : t)} />
          {detailTag && resultats.synthese[detailTag] && (
            <><div style={{ height: 20 }} /><TableauDetail tag={detailTag} matchs={resultats.synthese[detailTag].matchs} onClose={() => setDetailTag(null)} /></>
          )}
          {resultats.synthese['inconnu'] && detailTag !== 'inconnu' && (
            <><div style={{ height: 20 }} /><TableauDetail tag="inconnu" matchs={resultats.synthese['inconnu'].matchs} onClose={null} initOuvert /></>
          )}
        </>
      )}
    </div>
  )
}

// ── Tableau synthèse ──
function TableauSynthese({ synthese, detailTag, onClickTag }) {
  const typesTrouves = Object.keys(synthese)
  const nbOk = TYPES_OBLIGS.filter(t => typesTrouves.includes(t)).length
  const lignesObligs = TYPES_OBLIGS.map(t => ({ tag: t, manquant: !typesTrouves.includes(t) }))
  const lignesOptionnels = typesTrouves.filter(t => !TYPES_OBLIGS.includes(t) && t !== 'inconnu').sort((a, b) => (TYPES_CONFIG[a]?.priorite || 99) - (TYPES_CONFIG[b]?.priorite || 99)).map(t => ({ tag: t }))
  const lignesInconnu = typesTrouves.includes('inconnu') ? [{ tag: 'inconnu' }] : []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--text-1)', letterSpacing: '0.02em' }}>SYNTHÈSE</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--accent)', letterSpacing: '0.02em' }}>DÉTECTION</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: nbOk === TYPES_OBLIGS.length ? 'var(--success)' : 'var(--gold)', fontWeight: 700 }}>{nbOk}/{TYPES_OBLIGS.length} obligatoires ✓</span>
          {lignesOptionnels.length > 0 && <span style={{ fontSize: 11, color: 'var(--accent)' }}>+{lignesOptionnels.length} optionnel{lignesOptionnels.length > 1 ? 's' : ''}</span>}
        </div>
      </div>
      <SectionLabel label="Types obligatoires" info="attendus chaque saison" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
        {lignesObligs.map(({ tag, manquant }, i) => <LigneSynthese key={tag} tag={tag} data={synthese[tag]} manquant={manquant} actif={detailTag === tag} i={i} onClickTag={onClickTag} />)}
      </div>
      {(lignesOptionnels.length > 0 || lignesInconnu.length > 0) && (
        <><SectionLabel label="Détectés (optionnels)" info="présents cette saison" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...lignesOptionnels, ...lignesInconnu].map(({ tag }, i) => <LigneSynthese key={tag} tag={tag} data={synthese[tag]} manquant={false} actif={detailTag === tag} i={i} onClickTag={onClickTag} />)}
        </div></>
      )}
      <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 10 }}>Clique sur une ligne pour voir le détail · ⊕ = terrain neutre</p>
    </div>
  )
}

function SectionLabel({ label, info }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', background: 'var(--bg-2)', marginBottom: 2 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      {info && <span style={{ fontSize: 9, color: 'var(--text-3)', opacity: 0.6 }}>— {info}</span>}
    </div>
  )
}

function LigneSynthese({ tag, data, manquant, actif, i, onClickTag }) {
  const config = TYPES_CONFIG[tag] || { label: tag, couleur: '#9090b0' }
  const exNote = data?.matchs?.find(m => m.headline)?.headline || ''
  return (
    <div onClick={() => data && onClickTag(tag)} style={{
      display: 'grid', gridTemplateColumns: '110px 150px 82px 82px 55px 1fr 90px',
      cursor: data ? 'pointer' : 'default',
      background: actif ? 'var(--accent-dim)' : manquant ? 'rgba(239,68,68,0.06)' : i % 2 === 0 ? 'var(--bg-1)' : 'transparent',
      borderLeft: `3px solid ${manquant ? 'var(--danger)' : config.couleur}`,
      opacity: manquant ? 0.65 : 1, transition: 'background 0.15s',
    }}
    onMouseEnter={e => { if (data && !actif) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
    onMouseLeave={e => { if (!actif) e.currentTarget.style.background = manquant ? 'rgba(239,68,68,0.06)' : i % 2 === 0 ? 'var(--bg-1)' : 'transparent' }}>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: config.couleur + '22', color: config.couleur, padding: '2px 5px', borderRadius: 3 }}>{tag}</span>
      </div>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{config.label}</span>
      </div>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center' }}><span style={{ fontSize: 11, color: 'var(--text-2)' }}>{data ? fmtDate(data.dateMin) : '—'}</span></div>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center' }}><span style={{ fontSize: 11, color: 'var(--text-2)' }}>{data ? fmtDate(data.dateMax) : '—'}</span></div>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: data ? 'var(--text-1)' : 'var(--text-3)' }}>{data ? data.matchs.length : 0}</span></div>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exNote ? `"${exNote.slice(0, 40)}"` : '—'}</span>
      </div>
      <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {manquant ? <><AlertCircle size={12} color="var(--danger)" /><span style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700 }}>MANQUANT</span></>
          : <><CheckCircle size={12} color="var(--success)" /><span style={{ fontSize: 9, color: 'var(--success)', fontWeight: 700 }}>OK</span></>}
      </div>
    </div>
  )
}

function TableauDetail({ tag, matchs, onClose, initOuvert = false }) {
  const [ouvert, setOuvert] = useState(initOuvert)
  const config = TYPES_CONFIG[tag] || { label: tag, couleur: '#9090b0' }
  const notesUniques = [...new Set(matchs.map(m => m.headline).filter(Boolean))].slice(0, 20)
  return (
    <div style={{ background: 'var(--bg-1)', borderLeft: `3px solid ${config.couleur}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }} onClick={() => setOuvert(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 15, color: config.couleur, letterSpacing: '0.02em' }}>{config.label.toUpperCase()}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{matchs.length} matchs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onClose && <button onClick={e => { e.stopPropagation(); onClose() }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>}
          {ouvert ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
        </div>
      </div>
      {ouvert && (
        <div style={{ padding: '0 0 12px' }}>
          {notesUniques.length > 0 && (
            <div style={{ padding: '8px 12px', background: 'var(--bg-2)', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes ESPN : </span>
              <span style={{ fontSize: 10, color: 'var(--accent)' }}>{notesUniques.map(n => `"${n}"`).join(' · ')}</span>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 640 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 90px 130px 50px 70px 1fr 60px', borderBottom: '1px solid var(--border)', padding: '0 12px' }}>
                {['Date', 'Match', 'Ville / Pays', 'S.T.', 'Comp', 'Notes ESPN', 'Source'].map(h => (
                  <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 4px' }}>{h}</div>
                ))}
              </div>
              {matchs.slice(0, 300).map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 90px 130px 50px 70px 1fr 60px', background: i % 2 === 0 ? 'transparent' : 'var(--bg-2)', padding: '0 12px' }}>
                  <div style={{ padding: '5px 4px', fontSize: 11, color: 'var(--text-2)' }}>{fmtDate(m.date)}</div>
                  <div style={{ padding: '5px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>{m.ext}@{m.dom}</div>
                  <div style={{ padding: '5px 4px', fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.ville || '—'}{m.neutralSite ? ' ⊕' : ''}</div>
                  <div style={{ padding: '5px 4px' }}><span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: m.seasonType === 1 ? '#6366f1' : m.seasonType === 3 ? '#ef4444' : m.seasonType === 5 ? '#22c55e' : '#9090b0' }}>{m.seasonType ?? '?'}</span></div>
                  <div style={{ padding: '5px 4px', fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>{m.compType || '—'}</div>
                  <div style={{ padding: '5px 4px', fontSize: 10, color: m.headline ? 'var(--text-2)' : 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.headline || '—'}</div>
                  <div style={{ padding: '5px 4px' }}><span style={{ fontSize: 9, color: m.source === 'sl' ? '#06b6d4' : 'var(--text-3)' }}>{m.source === 'sl' ? 'SL' : 'NBA'}</span></div>
                </div>
              ))}
              {matchs.length > 300 && <p style={{ fontSize: 11, color: 'var(--text-3)', padding: '8px 12px' }}>… {matchs.length - 300} matchs supplémentaires.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// ONGLET LIGUES
// ══════════════════════════════════════════
function OngletLigues({ scanResultats, scanSaison }) {
  const [ligues, setLigues]         = useState([])
  const [chargement, setCharg]      = useState(true)
  const [formulaire, setFormulaire] = useState(null) // null | {} | {id,...}
  const [erreur, setErreur]         = useState('')
  const [sauvegarde, setSauveg]     = useState(false)

  const charger = async () => {
    setCharg(true)
    const { data } = await supabase.from('groupes').select('*').order('date_debut', { ascending: false, nullsFirst: false })
    setLigues(data || [])
    setCharg(false)
  }

  useEffect(() => { charger() }, [])

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette ligue ? Irréversible.')) return
    await supabase.from('membres_groupe').delete().eq('groupe_id', id)
    await supabase.from('groupes').delete().eq('id', id)
    setLigues(prev => prev.filter(l => l.id !== id))
  }

  const ouvrirNouveau = () => {
    setErreur('')
    setFormulaire({ nom: '', date_debut: '', date_fin: '', tag: '', type_saison: null, saison: new Date().getFullYear(), description: '' })
  }

  const ouvrirEdition = (ligue) => {
    setErreur('')
    const tagActuel = TYPES_LIGUE.find(t => t.typeSaison === ligue.type_saison && t.tag === ligue.tag)?.value || ''
    setFormulaire({ ...ligue, _tagValue: tagActuel })
  }

  const onChangeTag = (val) => {
    const t = TYPES_LIGUE.find(x => x.value === val)
    setFormulaire(prev => ({
      ...prev,
      _tagValue: val,
      tag: t?.tag || null,
      type_saison: t?.typeSaison || null,
    }))
  }

  // Remplir depuis scanner ESPN
  const remplirDepuisScanner = () => {
    if (!scanResultats || !formulaire) return
    const tagValue = formulaire._tagValue || ''
    const t = TYPES_LIGUE.find(x => x.value === tagValue)
    if (!t || !t.tag) return
    const data = scanResultats.synthese[t.tag]
    if (!data) { setErreur(`Aucune donnée scanner pour "${t.label}" sur ${scanSaison}`); return }
    const config = TYPES_CONFIG[t.tag]
    const saisonNum = SAISONS.find(s => s.label === scanSaison)?.anneeFin || new Date().getFullYear()
    const notesExemples = [...new Set(data.matchs.map(m => m.headline).filter(Boolean))].slice(0, 3)
    setErreur('')
    setFormulaire(prev => ({
      ...prev,
      nom: prev.nom || `${config.label} ${scanSaison}`,
      date_debut: data.dateMin || prev.date_debut,
      date_fin:   data.dateMax || prev.date_fin,
      saison:     saisonNum,
      description: prev.description || `${config.label} — saison ${scanSaison}. ${data.matchs.length} matchs détectés (${fmtDate(data.dateMin)} → ${fmtDate(data.dateMax)}).${notesExemples.length > 0 ? ` Phases : ${notesExemples.join(', ')}.` : ''}`,
    }))
  }

  const sauvegarder = async () => {
    setErreur('')
    const { nom, date_debut, date_fin } = formulaire
    if (!nom?.trim()) { setErreur('Le nom est obligatoire.'); return }
    if (!date_debut || !date_fin) { setErreur('Les dates sont obligatoires.'); return }
    if (date_fin < date_debut) { setErreur('Date de fin avant date de début.'); return }
    setSauveg(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      nom: formulaire.nom.trim(),
      date_debut: formulaire.date_debut,
      date_fin: formulaire.date_fin,
      type_saison: formulaire.type_saison || null,
      saison: parseInt(formulaire.saison) || null,
      tag: formulaire.tag || null,
      description: formulaire.description?.trim() || null,
    }
    if (formulaire.id) {
      await supabase.from('groupes').update(payload).eq('id', formulaire.id)
    } else {
      await supabase.from('groupes').insert({ ...payload, admin_id: user.id, code_invitation: null })
    }
    await charger()
    setSauveg(false)
    setFormulaire(null)
  }

  const maintenant = new Date()
  const categoriser = (l) => {
    const debut = l.date_debut ? new Date(l.date_debut) : null
    const fin   = l.date_fin   ? new Date(l.date_fin)   : null
    if (fin && fin < maintenant)     return 'terminees'
    if (debut && debut > maintenant) return 'a_venir'
    return 'en_cours'
  }

  return (
    <div style={{ padding: '0 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>GESTION</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--accent)', letterSpacing: '0.02em' }}>LIGUES</span>
        </div>
        <button onClick={ouvrirNouveau} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff', borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          <Plus size={14} /> Nouvelle ligue
        </button>
      </div>

      {scanResultats && (
        <div style={{ padding: '8px 12px', background: 'var(--success-dim)', borderLeft: '3px solid var(--success)', marginBottom: 16, fontSize: 11, color: 'var(--success)' }}>
          ✓ Données scanner disponibles pour {scanSaison} — utilise "Remplir depuis ESPN" dans le formulaire
        </div>
      )}

      {chargement && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement…</p>}

      {!chargement && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ligues.map(ligue => {
            const cat    = categoriser(ligue)
            const config = TYPES_CONFIG[ligue.tag] || null
            return (
              <div key={ligue.id} style={{
                padding: '12px 14px', background: 'var(--bg-1)',
                borderLeft: `3px solid ${config?.couleur || 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{ligue.nom}</span>
                      {config && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: config.couleur + '22', color: config.couleur, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>
                          {ligue.tag}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: cat === 'en_cours' ? 'var(--success)' : cat === 'a_venir' ? 'var(--gold)' : 'var(--text-3)', fontWeight: 600 }}>
                        {cat === 'en_cours' ? '● En cours' : cat === 'a_venir' ? '◷ À venir' : '✓ Terminée'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {fmtDate(ligue.date_debut)} → {fmtDate(ligue.date_fin)}
                      {ligue.saison && <span style={{ marginLeft: 8 }}>· Saison ESPN {ligue.saison}</span>}
                    </div>
                    {ligue.description && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ligue.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => ouvrirEdition(ligue)} style={{ background: 'none', borderWidth: 0, cursor: 'pointer', padding: 6 }}><Pencil size={14} color="var(--accent)" /></button>
                    <button onClick={() => supprimer(ligue.id)} style={{ background: 'none', borderWidth: 0, cursor: 'pointer', padding: 6 }}><Trash2 size={14} color="var(--danger)" /></button>
                  </div>
                </div>
              </div>
            )
          })}
          {ligues.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Aucune ligue. Crée la première !</p>}
        </div>
      )}

      {/* Formulaire modal */}
      {formulaire && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setFormulaire(null) }}>
          <div style={{ width: '100%', maxWidth: 560, background: 'var(--bg-1)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', padding: '20px 16px 32px', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>{formulaire.id ? 'MODIFIER' : 'NOUVELLE'}</span>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--accent)', letterSpacing: '0.02em' }}>LIGUE</span>
              </div>
              <button onClick={() => setFormulaire(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Nom */}
              <Champ label="Nom *">
                <input style={S.input} value={formulaire.nom || ''} onChange={e => setFormulaire(p => ({ ...p, nom: e.target.value }))} placeholder="ex: NBA Cup 2025-26" />
              </Champ>

              {/* Type de phase */}
              <Champ label="Phase ESPN">
                <select style={S.input} value={formulaire._tagValue || ''} onChange={e => onChangeTag(e.target.value)}>
                  {TYPES_LIGUE.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Champ>

              {/* Bouton remplir depuis scanner */}
              {scanResultats && (
                <button onClick={remplirDepuisScanner} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  fontSize: 12, fontWeight: 600, background: 'var(--success-dim)',
                  color: 'var(--success)', borderWidth: 1, borderStyle: 'solid',
                  borderColor: 'rgba(34,197,94,0.3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                }}>
                  <Search size={13} /> Remplir depuis scanner ESPN ({scanSaison})
                </button>
              )}
              {!scanResultats && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, fontStyle: 'italic' }}>
                  💡 Lance le scanner ESPN pour pré-remplir les dates et la description automatiquement
                </p>
              )}

              {/* Saison ESPN */}
              <Champ label="Saison ESPN">
                <select style={S.input} value={formulaire.saison || new Date().getFullYear()} onChange={e => setFormulaire(p => ({ ...p, saison: parseInt(e.target.value) }))}>
                  {SAISONS.map(s => <option key={s.anneeFin} value={s.anneeFin}>{s.label} (ESPN {s.anneeFin})</option>)}
                </select>
              </Champ>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Champ label="Date début *">
                  <input style={S.input} type="date" value={formulaire.date_debut?.slice(0, 10) || ''} onChange={e => setFormulaire(p => ({ ...p, date_debut: e.target.value }))} />
                </Champ>
                <Champ label="Date fin *">
                  <input style={S.input} type="date" value={formulaire.date_fin?.slice(0, 10) || ''} onChange={e => setFormulaire(p => ({ ...p, date_fin: e.target.value }))} />
                </Champ>
              </div>

              {/* Description */}
              <Champ label="Description">
                <textarea
                  style={{ ...S.input, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                  value={formulaire.description || ''}
                  onChange={e => setFormulaire(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description de la ligue, règles, contexte…"
                />
              </Champ>

              {erreur && <p style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: 0 }}>{erreur}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setFormulaire(null)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-3)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Annuler</button>
                <button onClick={sauvegarder} disabled={sauvegarde} style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={14} /> {sauvegarde ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Champ({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
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
      .order('cree_le', { ascending: false }).limit(100)
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
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
  input: {
    background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-1)', fontSize: 12,
    padding: '7px 10px', fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
  },
}

export default Admin
