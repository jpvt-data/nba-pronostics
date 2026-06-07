import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Trash2, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Plus, Pencil, X, Check } from 'lucide-react'
import { BADGES_CATALOGUE } from '../data/badges'

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
            { key: 'dashboard',    label: 'Dashboard' },
            { key: 'scanner',      label: 'Scanner ESPN' },
            { key: 'ligues',       label: 'Ligues' },
            { key: 'utilisateurs', label: 'Utilisateurs' },
            { key: 'moderation',   label: 'Modération' },
            { key: 'missions',     label: 'Missions' },
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

        {onglet === 'dashboard'    && <OngletDashboard />}
        {onglet === 'scanner' && (
          <OngletScanner
            saison={scanSaison} setSaison={setScanSaison}
            progression={scanProgression} setProgression={setScanProgression}
            resultats={scanResultats} setResultats={setScanResultats}
            scanning={scanScanning} setScanning={setScanScanning}
            detailTag={scanDetailTag} setDetailTag={setScanDetailTag}
          />
        )}
        {onglet === 'ligues'        && <OngletLigues scanResultats={scanResultats} scanSaison={scanSaison} />}
        {onglet === 'utilisateurs'  && <OngletUtilisateurs />}
        {onglet === 'moderation'    && <OngletModeration />}
        {onglet === 'missions'      && <OngletMissions />}
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
// ONGLET UTILISATEURS
// ══════════════════════════════════════════

// Badges attribuables manuellement par l'admin (appartenance + evenement)
const BADGES_MANUELS = BADGES_CATALOGUE.filter(b =>
  b.famille === 'appartenance' || b.famille === 'evenement'
)

function OngletUtilisateurs() {
  const [users, setUsers]       = useState([])
  const [filtre, setFiltre]     = useState('')
  const [userSelec, setUserSelec] = useState(null)
  const [charg, setCharg]       = useState(true)
  const [messages, setMessages] = useState({})

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from('profils')
        .select('id, pseudo, badges, xp_total, niveau')
        .order('pseudo', { ascending: true })
      setUsers(data || [])
      setCharg(false)
    }
    charger()
  }, [])

  const usersFiltres = users.filter(u =>
    u.pseudo?.toLowerCase().includes(filtre.toLowerCase())
  )

  const selectionner = async (id) => {
    if (!id) { setUserSelec(null); setMessages({}); return }
    const { data } = await supabase
      .from('profils')
      .select('id, pseudo, badges, xp_total, niveau')
      .eq('id', id).single()
    setUserSelec(data)
    setMessages({})
  }

  const attribuerBadge = async (badge) => {
    if (!userSelec) return
    const badgesActuels = userSelec.badges || []
    if (badgesActuels.includes(badge.slug)) {
      setMessages(m => ({ ...m, [badge.slug]: { type: 'warn', text: `${userSelec.pseudo} a déjà ce badge !` } }))
      return
    }
    const nouveauxBadges = [...badgesActuels, badge.slug]
    const { error } = await supabase.from('profils').update({ badges: nouveauxBadges }).eq('id', userSelec.id)
    if (error) { setMessages(m => ({ ...m, [badge.slug]: { type: 'error', text: "Erreur lors de l'attribution." } })); return }
    setUserSelec(prev => ({ ...prev, badges: nouveauxBadges }))
    setMessages(m => ({ ...m, [badge.slug]: { type: 'ok', text: `Badge "${badge.nom}" attribué !` } }))
  }

  const retirerBadge = async (badge) => {
    if (!userSelec) return
    const badgesActuels = userSelec.badges || []
    if (!badgesActuels.includes(badge.slug)) return
    const nouveauxBadges = badgesActuels.filter(s => s !== badge.slug)
    const { error } = await supabase.from('profils').update({ badges: nouveauxBadges }).eq('id', userSelec.id)
    if (error) { setMessages(m => ({ ...m, [badge.slug]: { type: 'error', text: 'Erreur lors du retrait.' } })); return }
    setUserSelec(prev => ({ ...prev, badges: nouveauxBadges }))
    setMessages(m => ({ ...m, [badge.slug]: { type: 'ok', text: `Badge "${badge.nom}" retiré.` } }))
  }

  return (
    <div style={{ padding: '0 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>GESTION</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--danger)', letterSpacing: '0.02em' }}>UTILISATEURS</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 20px' }}>
        Sélectionne un utilisateur pour lui attribuer des badges manuels.
      </p>

      {charg && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Chargement…</p>}

      {!charg && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {/* Filtre texte */}
          <input
            style={{ ...S.input, width: 140, flexShrink: 0 }}
            placeholder="Filtrer…"
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
          />
          {/* Select dropdown */}
          <select
            style={{ ...S.select, flex: 1 }}
            value={userSelec?.id || ''}
            onChange={e => selectionner(e.target.value)}
          >
            <option value="">— Choisir un utilisateur —</option>
            {usersFiltres.map(u => (
              <option key={u.id} value={u.id}>
                {u.pseudo} · Niv. {u.niveau} · {u.xp_total} XP
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Profil sélectionné + badges */}
      {userSelec && (
        <div style={{ background: 'var(--bg-1)', borderLeft: '3px solid var(--danger)', padding: '16px 16px 20px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 22, color: 'var(--text-1)', letterSpacing: '0.02em' }}>
                {userSelec.pseudo}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                Niv. {userSelec.niveau} · {userSelec.xp_total} XP · {(userSelec.badges || []).length} badge{(userSelec.badges || []).length > 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => { setUserSelec(null); setMessages({}) }}
              style={{ background: 'none', borderWidth: 0, cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, padding: 4 }}
            >✕</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--text-1)', letterSpacing: '0.02em' }}>BADGES</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--danger)', letterSpacing: '0.02em' }}>MANUELS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BADGES_MANUELS.map(b => {
              const obtenu = (userSelec.badges || []).includes(b.slug)
              const msg    = messages[b.slug]
              return (
                <div key={b.slug} style={{
                  padding: '12px 14px',
                  background: obtenu ? 'rgba(245,158,11,0.06)' : 'var(--bg-2)',
                  borderLeft: `3px solid ${obtenu ? 'var(--gold)' : 'var(--border-2)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: obtenu ? 'var(--gold)' : 'var(--text-1)' }}>
                        {obtenu && '✓ '}{b.nom}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{b.description}</div>
                      {msg && (
                        <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: msg.type === 'ok' ? 'var(--success)' : msg.type === 'warn' ? 'var(--gold)' : 'var(--danger)' }}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {!obtenu ? (
                        <button onClick={() => attribuerBadge(b)} style={{
                          padding: '6px 12px', fontSize: 12, fontWeight: 700,
                          background: 'var(--accent)', color: '#fff',
                          borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        }}>Attribuer</button>
                      ) : (
                        <button onClick={() => retirerBadge(b)} style={{
                          padding: '6px 12px', fontSize: 12, fontWeight: 700,
                          background: 'transparent', color: 'var(--danger)',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--danger)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        }}>Retirer</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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

// ONGLET DASHBOARD — à insérer dans Admin.jsx avant const S = {

const XP_LABELS_ADMIN = {
  connexion_quotidienne:  'Connexion quotidienne',
  prono_pose:             'Prono posé',
  premier_prono_jour:     'Premier prono du jour',
  prono_correct:          'Prono correct',
  semaine_100_pct:        'Semaine 100% pronostiquée',
  premier_prono_histoire: "Premier prono de l'histoire",
  fourchette_posee:       "Fourchette d'écart posée",
  fourchette_correcte:    "Fourchette d'écart correcte",
  jalon_10_pronos:        'Jalon — 10 pronos',
  jalon_50_pronos:        'Jalon — 50 pronos + Badge All-In',
  jalon_100_pronos:       'Jalon — 100 pronos + Badge Marathonien',
  jalon_serie_5:          'Jalon — 5 corrects + Badge En Feu',
  jalon_serie_10:         'Jalon — 10 corrects + Badge Prophète',
  jalon_10_fourchettes:   'Jalon — 10 fourchettes + Badge Tireur d\'Élite',
  jalon_winrate_65:       'Jalon — 65% réussite + Badge Analyste',
  jalon_semaine:          'Jalon — Semaine gagnée + Badge Champion',
  jalon_serie_ratee_5:    'Badge En Hibernation',
}


function BlocXPUsers({ profils }) {
  const [userXP, setUserXP]     = useState(null)
  const [userSelec, setUserS]   = useState(null)
  const [charg, setCharg]       = useState(false)
  const [missionsMap, setMissionsMap] = useState({})

  const chargerXP = async (userId) => {
    setCharg(true)
    setUserS(userId)
    const [{ data }, { data: missions }] = await Promise.all([
      supabase
        .from('xp_log')
        .select('source_id, xp_gagne, cree_le, source')
        .eq('user_id', userId)
        .order('cree_le', { ascending: false })
        .limit(100),
      supabase.from('missions').select('id, titre'),
    ])
    // Construire map mission_<id> → titre
    const mmap = {}
    for (const m of (missions || [])) mmap[`mission_${m.id}`] = `Mission "${m.titre}"`
    setMissionsMap(mmap)
    setUserXP(data || [])
    setCharg(false)
  }

  const fmt = (d) => new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {profils.map(p => (
          <button key={p.id} onClick={() => chargerXP(p.id)} style={{
            padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: userSelec === p.id ? 'var(--gold)' : 'var(--bg-2)',
            color: userSelec === p.id ? '#000' : 'var(--text-2)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: userSelec === p.id ? 'var(--gold)' : 'var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>{p.pseudo}</button>
        ))}
      </div>

      {charg && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Chargement…</p>}

      {!charg && userXP && (
        <>
          {/* Résumé total */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10, padding: '8px 12px', background: 'var(--bg-2)', borderLeft: '3px solid var(--gold)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--gold)' }}>
              {userXP.reduce((s, l) => s + l.xp_gagne, 0).toLocaleString('fr-FR')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>XP total — {userXP.length} entrées</span>
          </div>

          {/* Historique */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflowY: 'auto' }}>
            {userXP.map((l, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px',
                background: i % 2 === 0 ? 'var(--bg-2)' : 'transparent',
                borderLeft: '3px solid var(--gold)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {XP_LABELS_ADMIN[l.source_id] || missionsMap[l.source_id] || l.source_id}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                    {fmt(l.cree_le)}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gold)', flexShrink: 0 }}>
                  +{l.xp_gagne} XP
                </span>
              </div>
            ))}
            {userXP.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>Aucun gain XP.</p>}
          </div>
        </>
      )}
    </div>
  )
}

function OngletDashboard() {
  const [periode, setPeriode]   = useState(7)
  const [data, setData]         = useState(null)
  const [charg, setCharg]       = useState(true)
  const [purgeJours, setPurgeJ] = useState(90)
  const [purgeConf, setPurgeC]  = useState(false)
  const [exportMsg, setExportM] = useState(null)

  useEffect(() => { charger() }, [periode])

  const charger = async () => {
    setCharg(true)
    const depuis = new Date()
    depuis.setDate(depuis.getDate() - periode)
    const depuisISO = depuis.toISOString()

    const { data: events } = await supabase
      .from('events')
      .select('user_id, event_type, page, meta, cree_le')
      .gte('cree_le', depuisISO)
      .order('cree_le', { ascending: false })

    const { data: profils } = await supabase
      .from('profils')
      .select('id, pseudo, niveau, xp_total, badges')

    const { data: pronos } = await supabase
      .from('pronos')
      .select('user_id, resultat')
      .neq('resultat', 'en_attente')

    setData({ events: events || [], profils: profils || [], pronos: pronos || [] })
    setCharg(false)
  }

  const exporterCSV = async () => {
    const { data: tous } = await supabase
      .from('events')
      .select('user_id, event_type, page, meta, cree_le')
      .order('cree_le', { ascending: false })
    if (!tous?.length) return
    const entetes = ['user_id', 'event_type', 'page', 'meta', 'cree_le']
    const lignes  = tous.map(e => [
      e.user_id, e.event_type, e.page,
      JSON.stringify(e.meta || {}), e.cree_le
    ].map(v => `"${String(v).replace(/"/g, "'")}"` ).join(','))
    const csv  = [entetes.join(','), ...lignes].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `swish_events_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportM('Export téléchargé ✓')
    setTimeout(() => setExportM(null), 3000)
  }

  const purger = async () => {
    const avant = new Date()
    avant.setDate(avant.getDate() - purgeJours)
    await supabase.from('events').delete().lt('cree_le', avant.toISOString())
    setPurgeC(false)
    charger()
  }

  if (charg) return <p style={{ padding: 24, color: 'var(--text-3)', fontSize: 13 }}>Chargement dashboard…</p>

  const { events: eventsRaw, profils, pronos } = data

  // Exclure l'admin des stats tracking (conservé uniquement pour Historique XP)
  const events = eventsRaw.filter(e => e.user_id !== ADMIN_ID)

  // Calculs
  const sessions       = events.filter(e => e.event_type === 'session_start')
  const usersDistincts = [...new Set(events.map(e => e.user_id))].length
  const aujourdHui     = new Date().toISOString().slice(0, 10)
  const usersAujourd   = [...new Set(
    events.filter(e => e.cree_le.slice(0, 10) === aujourdHui).map(e => e.user_id)
  )].length

  // Fréquentation pages
  const pageVues = {}
  events.filter(e => e.event_type === 'page_view').forEach(e => {
    if (!pageVues[e.page]) pageVues[e.page] = { vues: 0, users: new Set() }
    pageVues[e.page].vues++
    pageVues[e.page].users.add(e.user_id)
  })
  const pagesTriees = Object.entries(pageVues)
    .map(([page, v]) => ({ page, vues: v.vues, users: v.users.size }))
    .sort((a, b) => b.vues - a.vues)
  const totalVues = pagesTriees.reduce((s, p) => s + p.vues, 0)

  // Distribution niveaux
  const titreN = (n) => n <= 10 ? 'Rookie' : n <= 20 ? 'Sixième Homme' : n <= 30 ? 'Starter' : n <= 40 ? 'All-Star' : n <= 60 ? 'MVP' : n <= 80 ? 'Hall of Fame' : 'GOAT'
  const distNiveaux = {}
  profils.forEach(p => {
    const t = titreN(p.niveau || 1)
    distNiveaux[t] = (distNiveaux[t] || 0) + 1
  })

  // Stats profils
  const moyPronos = profils.length > 0
    ? Math.round(pronos.length / profils.length)
    : 0
  const moyBadges = profils.length > 0
    ? (profils.reduce((s, p) => s + (p.badges?.length || 0), 0) / profils.length).toFixed(1)
    : 0

  // Top users sessions
  const sessionsParUser = {}
  sessions.forEach(e => { sessionsParUser[e.user_id] = (sessionsParUser[e.user_id] || 0) + 1 })
  const topUsers = Object.entries(sessionsParUser)
    .map(([uid, nb]) => ({ uid, nb, pseudo: profils.find(p => p.id === uid)?.pseudo || uid.slice(0, 8) }))
    .sort((a, b) => b.nb - a.nb)
    .slice(0, 5)

  // Actions clés
  const nbClicProno    = events.filter(e => e.event_type === 'clic_prono').length
  const nbClicFourch   = events.filter(e => e.event_type === 'clic_fourchette').length
  const nbClicVest     = events.filter(e => e.event_type === 'clic_vestiaire').length
  const nbClicMissions = events.filter(e => e.event_type === 'clic_missions').length
  const nbClicNav      = events.filter(e => e.event_type === 'clic_nav').length

  // Rétention — jours distincts par user sur la période
  const joursParUser = {}
  events.forEach(e => {
    if (!joursParUser[e.user_id]) joursParUser[e.user_id] = new Set()
    joursParUser[e.user_id].add(e.cree_le.slice(0, 10))
  })
  const retentionData = profils
    .map(p => ({ pseudo: p.pseudo, jours: joursParUser[p.id]?.size || 0 }))
    .sort((a, b) => b.jours - a.jours)

  // Composants locaux
  const KPI = ({ label, val, couleur = 'var(--text-1)', sub = null }) => (
    <div style={{ background: 'var(--bg-2)', padding: '12px 14px', borderLeft: '3px solid ' + couleur }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: couleur, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  const TitreBloc = ({ mot1, mot2, couleur2 = 'var(--accent)' }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
      <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
      {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
    </div>
  )

  return (
    <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Sélecteur période */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Période :</span>
        {[7, 14, 30].map(j => (
          <button key={j} onClick={() => setPeriode(j)} style={{
            padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: periode === j ? 'var(--danger)' : 'transparent',
            color: periode === j ? '#fff' : 'var(--text-3)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: periode === j ? 'var(--danger)' : 'var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>{j}j</button>
        ))}
      </div>

      {/* Bloc 1 — Vue d'ensemble */}
      <div>
        <TitreBloc mot1="VUE" mot2="D'ENSEMBLE" couleur2="var(--danger)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <KPI label="USERS TOTAL" val={profils.length} couleur="var(--accent)" />
          <KPI label={`ACTIFS (${periode}j)`} val={usersDistincts} couleur="var(--success)" />
          <KPI label="ACTIFS AUJOURD'HUI" val={usersAujourd} couleur="var(--gold)" />
          <KPI label="SESSIONS PÉRIODE" val={sessions.length} couleur="var(--accent)" />
        </div>
      </div>

      {/* Bloc 2 — Fréquentation pages */}
      <div>
        <TitreBloc mot1="PAGES" mot2="VUES" />
        {pagesTriees.length === 0
          ? <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Aucune donnée sur la période.</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pagesTriees.map(p => (
                <div key={p.page} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-2)', borderLeft: '3px solid var(--accent)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', flex: 1, fontFamily: 'var(--font-display)' }}>{p.page}</span>
                  <div style={{ width: 80, height: 4, background: 'var(--bg-0)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(p.vues / totalVues * 100)}%`, background: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, width: 28, textAlign: 'right' }}>{p.vues}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', width: 52, textAlign: 'right' }}>{p.users} user{p.users > 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{Math.round(p.vues / totalVues * 100)}%</span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Bloc 3 — Profil users */}
      <div>
        <TitreBloc mot1="PROFIL" mot2="USERS" couleur2="var(--gold)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          <KPI label="MOY. PRONOS/USER" val={moyPronos} couleur="var(--accent)" />
          <KPI label="MOY. BADGES/USER" val={moyBadges} couleur="var(--gold)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(distNiveaux).filter(([, n]) => n > 0).map(([titre, nb]) => (
            <div key={titre} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'var(--bg-2)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', flex: 1 }}>{titre}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-1)' }}>{nb}</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>user{nb > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bloc 4 — Actions clés */}
      <div>
        <TitreBloc mot1="ACTIONS" mot2="CLÉS" couleur2="var(--orange)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <KPI label="CLICS PRONO" val={nbClicProno} couleur="var(--accent)" />
          <KPI label="CLICS FOURCHETTE" val={nbClicFourch} couleur="var(--gold)"
            sub={nbClicProno > 0 ? `${Math.round(nbClicFourch / nbClicProno * 100)}% des pronos` : null} />
          <KPI label="MESSAGES VESTIAIRE" val={nbClicVest} couleur="var(--orange)" />
          <KPI label="CLICS MISSIONS" val={nbClicMissions} couleur="var(--success)" />
          <KPI label="NAVIGATIONS" val={nbClicNav} couleur="var(--accent)" />
        </div>
      </div>

      {/* Bloc 5 — Top users */}
      <div>
        <TitreBloc mot1="TOP" mot2="USERS" couleur2="var(--gold)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {topUsers.length === 0
            ? <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Aucune session sur la période.</p>
            : topUsers.map((u, i) => (
              <div key={u.uid} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', background: 'var(--bg-2)',
                borderLeft: `3px solid ${i === 0 ? 'var(--gold)' : i === 1 ? 'var(--text-3)' : 'var(--border)'}`,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: i === 0 ? 'var(--gold)' : 'var(--text-3)', width: 20 }}>#{i+1}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', flex: 1 }}>{u.pseudo}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{u.nb}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>sessions</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Bloc 6 — Rétention */}
      <div>
        <TitreBloc mot1="RÉTENTION" mot2={`(jours actifs / ${periode}j)`} couleur2="var(--success)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {retentionData.filter(u => u.jours > 0).map(u => (
            <div key={u.pseudo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'var(--bg-2)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', flex: 1 }}>{u.pseudo}</span>
              <div style={{ width: 80, height: 4, background: 'var(--bg-0)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round(u.jours / periode * 100))}%`, background: 'var(--success)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--success)' }}>{u.jours}j</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{Math.round(u.jours / periode * 100)}%</span>
            </div>
          ))}
        </div>
      </div>


      {/* Bloc 8 — XP par user */}
      <div>
        <TitreBloc mot1="GAINS" mot2="XP PAR USER" couleur2="var(--gold)" />
        <BlocXPUsers profils={profils} />
      </div>

      {/* Bloc 7 — Export & Purge */}
      <div>
        <TitreBloc mot1="DONNÉES" mot2="& PURGE" couleur2="var(--danger)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={exporterCSV} style={{
              padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: 'var(--accent)', borderWidth: 0, color: '#fff',
              borderRadius: 'var(--radius-sm)',
            }}>
              ⬇ Export CSV (tous les events)
            </button>
            {exportMsg && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{exportMsg}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Purger les events de plus de</span>
            <select value={purgeJours} onChange={e => setPurgeJ(Number(e.target.value))} style={{
              background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-1)', fontSize: 12,
              padding: '5px 8px', cursor: 'pointer',
            }}>
              {[30, 60, 90, 180].map(j => <option key={j} value={j}>{j} jours</option>)}
            </select>
            {!purgeConf
              ? <button onClick={() => setPurgeC(true)} style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'transparent', borderWidth: 1, borderStyle: 'solid',
                  borderColor: 'var(--danger)', color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                }}>Purger</button>
              : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>Confirmer la suppression ?</span>
                  <button onClick={purger} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, background: 'var(--danger)', borderWidth: 0, color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Oui, purger</button>
                  <button onClick={() => setPurgeC(false)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Annuler</button>
                </div>
            }
          </div>
        </div>
      </div>

    </div>
  )
}

// ══════════════════════════════════════════
// ONGLET MISSIONS
// ══════════════════════════════════════════
function OngletMissions() {
  const [missions, setMissions]   = useState([])
  const [completions, setCompl]   = useState({}) // mission_id → nb completions
  const [charg, setCharg]         = useState(true)
  const [toggling, setToggling]   = useState(null) // id en cours de toggle

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setCharg(true)
    const [{ data: ms }, { data: mu }] = await Promise.all([
      supabase.from('missions').select('*').order('type').order('titre'),
      supabase.from('missions_utilisateurs').select('mission_id').eq('completee', true),
    ])
    // Compter les completions par mission
    const counts = {}
    for (const row of (mu || [])) {
      counts[row.mission_id] = (counts[row.mission_id] || 0) + 1
    }
    setMissions(ms || [])
    setCompl(counts)
    setCharg(false)
  }

  const toggleActif = async (mission) => {
    setToggling(mission.id)
    await supabase.from('missions').update({ actif: !mission.actif }).eq('id', mission.id)
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, actif: !m.actif } : m))
    setToggling(null)
  }

  const COULEUR_TYPE = { permanente: 'var(--accent)', hebdomadaire: 'var(--gold)' }

  const LABEL_CONDITION = {
    serie_connexion:     'Série connexion',
    serie_correcte:      'Série pronos corrects',
    connexion_semaine:   'Connexions / semaine',
    pronos_semaine:      'Pronos / semaine',
    fourchette_posee:    'Fourchettes posées',
    fourchette_correcte: 'Fourchettes correctes',
  }

  if (charg) return <p style={{ padding: 24, color: 'var(--text-3)', fontSize: 13 }}>Chargement missions…</p>

  const permanentes   = missions.filter(m => m.type === 'permanente')
  const hebdomadaires = missions.filter(m => m.type === 'hebdomadaire')

  const BlocGroupe = ({ titre, couleur, liste }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>MISSIONS</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: couleur, letterSpacing: '0.02em' }}>{titre}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {liste.map(m => {
          const nb = completions[m.id] || 0
          const enCours = toggling === m.id
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', background: 'var(--bg-2)',
              borderLeft: `3px solid ${m.actif ? couleur : 'var(--border)'}`,
              opacity: m.actif ? 1 : 0.5,
            }}>
              {/* Infos mission */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{m.titre}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px',
                    background: couleur + '22', color: couleur,
                    borderRadius: 'var(--radius-sm)',
                  }}>{m.type}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{m.description}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {LABEL_CONDITION[m.condition_type] || m.condition_type} : <strong style={{ color: 'var(--text-2)' }}>{m.condition_valeur}</strong>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>+{m.xp_recompense} XP</span>
                </div>
              </div>
              {/* Stat completions */}
              <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 40 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: nb > 0 ? 'var(--success)' : 'var(--text-3)' }}>{nb}</div>
                <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>complét.</div>
              </div>
              {/* Toggle actif */}
              <button
                onClick={() => toggleActif(m)}
                disabled={enCours}
                style={{
                  flexShrink: 0, padding: '6px 14px', fontSize: 11, fontWeight: 700,
                  cursor: enCours ? 'wait' : 'pointer',
                  borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid',
                  background: m.actif ? 'var(--success)' : 'var(--bg-1)',
                  color: m.actif ? '#000' : 'var(--text-3)',
                  borderColor: m.actif ? 'var(--success)' : 'var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                {enCours ? '…' : m.actif ? 'ON' : 'OFF'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '0 16px 40px' }}>
      {/* Récap global */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'TOTAL',    val: missions.length,                        couleur: 'var(--text-1)' },
          { label: 'ACTIVES',  val: missions.filter(m => m.actif).length,   couleur: 'var(--success)' },
          { label: 'INACTIVES',val: missions.filter(m => !m.actif).length,  couleur: 'var(--danger)' },
        ].map(k => (
          <div key={k.label} style={{ padding: '10px 12px', background: 'var(--bg-2)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: k.couleur }}>{k.val}</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>
      <BlocGroupe titre="PERMANENTES"   couleur="var(--accent)" liste={permanentes} />
      <BlocGroupe titre="HEBDOMADAIRES" couleur="var(--gold)"   liste={hebdomadaires} />
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
