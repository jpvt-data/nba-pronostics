import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import { BanniereImage, LabelSection } from '../components/UI'
import { Search, ChevronRight, ArrowLeft } from 'lucide-react'
import BracketPlayoffs from '../components/BracketPlayoffs'
import { SAISON_ESPN } from '../config'

const BASE     = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_V2  = 'https://site.api.espn.com/apis/v2/sports/basketball/nba'
const BASE_WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba'
const TIMEOUT  = 8000

const fetchAvecTimeout = (url) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

const couleurEquipe = (hex) => hex ? `#${hex}` : 'var(--accent)'

function LogoEquipe({ url, trigramme, taille = 32, couleur }) {
  const [erreur, setErreur] = useState(false)
  if (url && !erreur) {
    return <img src={url} alt={trigramme} onError={() => setErreur(true)}
      style={{ width: taille, height: taille, objectFit: 'contain', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: taille, height: taille, borderRadius: '50%', flexShrink: 0,
      background: couleur || 'var(--accent-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: taille * 0.3, fontWeight: 800, color: '#fff',
    }}>{trigramme?.slice(0, 3)}</div>
  )
}

function PhotoJoueur({ url, nom, taille = 48 }) {
  const [erreur, setErreur] = useState(false)
  if (url && !erreur) {
    return <img src={url} alt={nom} onError={() => setErreur(true)}
      style={{ width: taille, height: taille, objectFit: 'cover', objectPosition: 'top',
        borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: taille, height: taille, borderRadius: 'var(--radius-sm)', flexShrink: 0,
      background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: taille * 0.35, color: 'var(--text-3)',
    }}>?</div>
  )
}

function BadgeClincher({ val }) {
  if (!val) return null
  const MAP = {
    'z':  { color: '#6366f1' }, 'y': { color: '#22c55e' },
    'x':  { color: '#22c55e' }, 'xp': { color: '#f97316' },
    'pb': { color: '#f97316' }, 'e': { color: '#ef4444' },
    '*':  { color: '#fbbf24' },
  }
  const b = MAP[val]
  if (!b) return null
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: b.color, background: `${b.color}20`,
      borderRadius: 3, paddingLeft: 3, paddingRight: 3, paddingTop: 1, paddingBottom: 1,
      marginLeft: 4, flexShrink: 0,
    }}>{val}</span>
  )
}

const parseEquipe = (e) => {
  const eq    = e.team
  const stats = e.stats || []
  const v     = (n) => stats.find(s => s.name === n)?.value ?? null
  const dv    = (n) => stats.find(s => s.name === n)?.displayValue ?? '—'
  const sum   = (n) => stats.find(s => s.name === n)?.summary ?? '—'
  return {
    id:         eq.id,
    trigramme:  eq.abbreviation,
    nom:        eq.displayName,
    nomCourt:   eq.shortDisplayName,
    logo:       eq.logos?.[0]?.href ?? null,
    logoSombre: eq.logos?.[1]?.href ?? eq.logos?.[0]?.href ?? null,
    couleur:    eq.color ?? null,
    seed:       v('playoffSeed') ?? 99,
    wins:       v('wins') ?? 0,
    losses:     v('losses') ?? 0,
    pct:        dv('winPercent'),
    gb:         dv('gamesBehind'),
    domicile:   sum('Home'),
    exterieur:  sum('Road'),
    l10:        sum('Last Ten Games'),
    serie:      dv('streak'),
    clincher:   dv('clincher'),
  }
}

// ── Parser roster (structure directe athletes[]) ─────────────────────────────
const parseRoster = (data, equipe) =>
  (data.athletes ?? []).map(j => ({
    id:         j.id,
    nom:        j.fullName,
    prenom:     j.firstName,
    nomFam:     j.lastName,
    numero:     j.jersey ?? '—',
    position:   j.position?.abbreviation ?? '?',
    positionFull: j.position?.displayName ?? '?',
    photo:      j.headshot?.href ?? null,
    taille:     j.displayHeight ?? '—',
    poids:      j.displayWeight ?? '—',
    age:        j.age ?? '—',
    equipeId:   equipe.id,
    equipeTri:  equipe.trigramme,
    equipenom:  equipe.nom,
    equipeLogo: equipe.logo,
    equipeCouleur: equipe.couleur,
  }))

// ── ONGLET CLASSEMENTS ───────────────────────────────────────────────────────
function OngletClassementsAvecSync({ onEquipeClick, onEquipesChargées }) {
  const [donnees, setDonnees]         = useState({ est: [], ouest: [], saisons: [] })
  const [onglet, setOnglet]           = useState('est')
  const [saison, setSaison]           = useState(2026)
  const [typeSaison, setTypeSaison]   = useState('reguliere') // 'reguliere' | 'playoffs'
  const [chargement, setChargement]   = useState(true)
  const [erreur, setErreur]           = useState(false)
  const [labelSaison, setLabelSaison] = useState('2025-26')

  const charger = (annee) => {
    setChargement(true); setErreur(false)
    fetchAvecTimeout(`${BASE_V2}/standings?season=${annee}&seasontype=2`)
      .then(r => r.json())
      .then(data => {
        const saisonsDispos = (data.seasons ?? [])
          .filter(s => s.types?.some(t => t.id === '2' && t.hasStandings))
          .map(s => ({ year: s.year, label: s.displayName }))
          .sort((a, b) => b.year - a.year)
        const conferences = data.children ?? []
        const est = [], ouest = []
        conferences.forEach(conf => {
          const nom   = conf.name ?? ''
          const liste = (conf.standings?.entries ?? []).map(parseEquipe).sort((a, b) => a.seed - b.seed)
          if (nom.toLowerCase().includes('east')) est.push(...liste)
          else ouest.push(...liste)
        })
        setLabelSaison(data.season?.displayName ?? `${annee}`)
        setDonnees({ est, ouest, saisons: saisonsDispos })
        onEquipesChargées([...est, ...ouest])
        setChargement(false)
      })
      .catch(() => { setErreur(true); setChargement(false) })
  }

  useEffect(() => { charger(saison) }, [saison])

  // Sélecteur de saison — commun aux deux modes
  const selecteurSaison = (
    <select value={saison} onChange={e => setSaison(Number(e.target.value))} style={{
      fontSize: 12, fontWeight: 600, color: 'var(--text-1)', background: 'var(--bg-1)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer',
    }}>
      {donnees.saisons.length > 0
        ? donnees.saisons.map(s => <option key={s.year} value={s.year}>{s.label}</option>)
        : <option value={2026}>2025-26</option>}
    </select>
  )

  const liste = onglet === 'est' ? donnees.est : donnees.ouest

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <LabelSection>Classement NBA</LabelSection>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Saison {labelSaison}</span>
      </div>

      {/* Toggle type de saison */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { val: 'reguliere', label: 'Saison régulière' },
          { val: 'playoffs',  label: 'Playoffs' },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setTypeSaison(val)} style={{
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            paddingTop: 6, paddingBottom: 6, paddingLeft: 14, paddingRight: 14,
            borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid',
            background:  typeSaison === val ? 'rgba(249,115,22,0.14)' : 'transparent',
            borderColor: typeSaison === val ? 'rgba(249,115,22,0.5)'  : 'var(--border)',
            color:       typeSaison === val ? 'var(--orange)'          : 'var(--text-3)',
          }}>{label}</button>
        ))}
      </div>

      {/* Sélecteur de saison */}
      <div style={{ marginBottom: 12 }}>
        {selecteurSaison}
      </div>

      {/* MODE PLAYOFFS : bracket */}
      {typeSaison === 'playoffs' && (
        <BracketPlayoffs saison={saison} />
      )}

      {/* MODE SAISON RÉGULIÈRE : standings */}
      {typeSaison === 'reguliere' && (
        <>
          {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}
          {erreur && <p style={{ color: 'var(--danger)', fontSize: 13 }}>Erreur ESPN</p>}

          {!chargement && !erreur && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['est', 'ouest'].map(tab => (
                  <button key={tab} onClick={() => setOnglet(tab)} style={{
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16,
                    borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid',
                    background:  onglet === tab ? 'rgba(99,102,241,0.18)' : 'transparent',
                    borderColor: onglet === tab ? 'rgba(99,102,241,0.5)'  : 'var(--border)',
                    color:       onglet === tab ? 'var(--accent)'          : 'var(--text-3)',
                  }}>{tab === 'est' ? 'Conférence Est' : 'Conférence Ouest'}</button>
                ))}
              </div>

              {/* En-tête tableau */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '24px 24px 1fr 56px 44px 44px 56px 56px 44px',
                gap: 4, padding: '4px 8px',
                fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <span>#</span><span />
                <span>Équipe</span>
                <span style={{ textAlign: 'center' }}>Bilan</span>
                <span style={{ textAlign: 'center' }}>PCT</span>
                <span style={{ textAlign: 'center' }}>GB</span>
                <span style={{ textAlign: 'center' }}>Dom.</span>
                <span style={{ textAlign: 'center' }}>Ext.</span>
                <span style={{ textAlign: 'center' }}>STRK</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {liste.map((eq, idx) => {
                  const couleur = couleurEquipe(eq.couleur)
                  const playoff = eq.seed <= 6
                  const playIn  = eq.seed === 7 || eq.seed === 8
                  return (
                    <button key={eq.id} onClick={() => onEquipeClick(eq)} style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 24px 1fr 56px 44px 44px 56px 56px 44px',
                      gap: 4, alignItems: 'center',
                      padding: '7px 8px', borderRadius: 'var(--radius-sm)',
                      background: playoff
                        ? `linear-gradient(90deg, ${couleur}12, transparent)`
                        : playIn ? 'rgba(249,115,22,0.04)' : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderWidth: 0,
                      borderLeftWidth: playoff ? 2 : playIn ? 1 : 0,
                      borderLeftStyle: 'solid',
                      borderLeftColor: playoff ? couleur : 'rgba(249,115,22,0.4)',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: playoff ? 'var(--accent)' : 'var(--text-3)' }}>
                        {eq.seed}
                      </span>
                      <LogoEquipe url={eq.logo} trigramme={eq.trigramme} taille={20} couleur={couleur} />
                      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {eq.trigramme}
                        </span>
                        <BadgeClincher val={eq.clincher} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
                        {eq.wins}-{eq.losses}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textAlign: 'center' }}>
                        {eq.pct}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>{eq.gb}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-2)', textAlign: 'center' }}>{eq.domicile}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-2)', textAlign: 'center' }}>{eq.exterieur}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center',
                        color: eq.serie?.startsWith('W') ? 'var(--success)' : eq.serie?.startsWith('L') ? 'var(--danger)' : 'var(--text-3)',
                      }}>{eq.serie}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}><span style={{ color: 'var(--accent)' }}>■</span> Top 6 — playoffs directs</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}><span style={{ color: 'rgba(249,115,22,0.8)' }}>■</span> 7-8 — Play-in</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>PCT = win% · STRK = série en cours (W3 = 3 victoires, L2 = 2 défaites)</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── ONGLET ÉQUIPES ───────────────────────────────────────────────────────────
function OngletEquipes({ equipesStandings, equipeInitiale }) {
  const [equipeChoisie, setEquipeChoisie] = useState(equipeInitiale ?? null)

  useEffect(() => {
    if (equipeInitiale) setEquipeChoisie(equipeInitiale)
  }, [equipeInitiale])

  if (equipeChoisie) {
    return <FicheEquipe equipe={equipeChoisie} onRetour={() => setEquipeChoisie(null)} />
  }

  const liste = [...equipesStandings].sort((a, b) => a.nom.localeCompare(b.nom))

  return (
    <div>
      <LabelSection>30 Franchises NBA</LabelSection>
      {liste.length === 0
        ? <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 12 }}>Charge d'abord l'onglet Classements.</p>
        : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10, marginTop: 12,
          }}>
            {liste.map(eq => {
              const couleur = couleurEquipe(eq.couleur)
              return (
                <button key={eq.id} onClick={() => setEquipeChoisie(eq)} style={{
                  background: `linear-gradient(135deg, ${couleur}18, ${couleur}06)`,
                  borderWidth: 1, borderStyle: 'solid', borderColor: `${couleur}40`,
                  borderRadius: 'var(--radius-md)', padding: '14px 10px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'transform 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = couleur; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${couleur}40`; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <LogoEquipe url={eq.logoSombre} trigramme={eq.trigramme} taille={44} couleur={couleur} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.05em' }}>{eq.trigramme}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{eq.nomCourt}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── FICHE ÉQUIPE ─────────────────────────────────────────────────────────────
function FicheEquipe({ equipe, onRetour }) {
  const [onglet, setOnglet]         = useState('roster')
  const [roster, setRoster]         = useState([])
  const [blessés, setBlessés]       = useState([])
  const [chargement, setChargement] = useState(true)
  const [chargementStats, setChargementStats] = useState(false)
  const [joueurChoisi, setJoueurChoisi] = useState(null)

  const couleur = couleurEquipe(equipe.couleur)

  useEffect(() => {
    setChargement(true)
    Promise.allSettled([
      fetchAvecTimeout(`${BASE}/teams/${equipe.id}/roster`).then(r => r.json()),
      fetchAvecTimeout(`${BASE}/teams/${equipe.id}/injuries`).then(r => r.json()),
    ]).then(([resRoster, resBlessés]) => {
      if (resRoster.status === 'fulfilled') {
        const joueurs = parseRoster(resRoster.value, equipe)
        setRoster(joueurs)
        // Chargement stats en parallèle pour tri par PPG
        setChargementStats(true)
        Promise.allSettled(
          joueurs.map(j =>
            fetchAvecTimeout(`${BASE_WEB}/athletes/${j.id}/stats?season=${SAISON_ESPN}&seasontype=2`)
              .then(r => r.json())
              .then(data => {
                const catAvg = (data.categories ?? []).find(c => c.name === 'averages')
                if (!catAvg) return { id: j.id, ppg: 0 }
                const names   = catAvg.names ?? []
                const statRow = catAvg.statistics?.find(s => s.season?.year === SAISON_ESPN)
                    ?? catAvg.statistics?.[catAvg.statistics.length - 1]
                const vals = statRow?.stats ?? []
                const idx  = names.indexOf('avgPoints')
                return { id: j.id, ppg: idx !== -1 ? parseFloat(vals[idx]) || 0 : 0 }
              })
              .catch(() => ({ id: j.id, ppg: 0 }))
          )
        ).then(resultats => {
          const ppgMap = {}
          resultats.forEach(r => {
            if (r.status === 'fulfilled') ppgMap[r.value.id] = r.value.ppg
          })
          setRoster(prev =>
            [...prev].sort((a, b) => (ppgMap[b.id] ?? 0) - (ppgMap[a.id] ?? 0))
              .map(j => ({ ...j, ppg: ppgMap[j.id] ?? 0 }))
          )
          setChargementStats(false)
        })
      }
      if (resBlessés.status === 'fulfilled') {
        setBlessés((resBlessés.value.injuries ?? []).map(b => ({
          id:     b.athlete?.id,
          nom:    b.athlete?.displayName ?? '?',
          statut: b.status ?? '?',
          detail: b.details?.detail ?? '',
        })))
      }
      setChargement(false)
    })
  }, [equipe.id])

  if (joueurChoisi) {
    return <FicheJoueur joueur={joueurChoisi} equipe={equipe} onRetour={() => setJoueurChoisi(null)} />
  }

  return (
    <div>
      <button onClick={onRetour} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', borderWidth: 0, color: 'var(--text-3)',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0,
      }}>
        <ArrowLeft size={16} /> Toutes les équipes
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
        background: `linear-gradient(135deg, ${couleur}20, ${couleur}06)`,
        borderRadius: 'var(--radius-lg)', borderWidth: 1, borderStyle: 'solid', borderColor: `${couleur}40`,
        marginBottom: 16,
      }}>
        <LogoEquipe url={equipe.logoSombre} trigramme={equipe.trigramme} taille={56} couleur={couleur} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            {equipe.nom}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {equipe.trigramme}{equipe.wins != null ? ` · ${equipe.wins}-${equipe.losses} (${equipe.pct})` : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { val: 'roster',  label: 'Effectif' },
          { val: 'blessés', label: `Blessés${blessés.length > 0 ? ` (${blessés.length})` : ''}` },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setOnglet(val)} style={{
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 14,
            borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid',
            background:  onglet === val ? `${couleur}20` : 'transparent',
            borderColor: onglet === val ? `${couleur}80` : 'var(--border)',
            color:       onglet === val ? couleur : 'var(--text-3)',
          }}>{label}</button>
        ))}
      </div>

      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}

      {!chargement && onglet === 'roster' && (
        <div>
          {chargementStats && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
              Tri par PPG en cours…
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {roster.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Effectif indisponible.</p>
              : roster.map(j => (
                <button key={j.id} onClick={() => setJoueurChoisi(j)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '8px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${couleur}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <PhotoJoueur url={j.photo} nom={j.nom} taille={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {j.nom}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>#{j.numero} · {j.positionFull}</div>
                  </div>
                  {/* PPG affiché si dispo */}
                  {j.ppg > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: couleur, fontFamily: 'var(--font-display)' }}>
                        {j.ppg.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700 }}>PPG</div>
                    </div>
                  )}
                  <ChevronRight size={14} color="var(--text-3)" />
                </button>
              ))
            }
          </div>
        </div>
      )}

      {!chargement && onglet === 'blessés' && (
        <div>
          {blessés.length === 0
            ? <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun blessé répertorié.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blessés.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: 'rgba(239,68,68,0.06)', borderWidth: 1, borderStyle: 'solid',
                    borderColor: 'rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{b.nom}</div>
                      {b.detail && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.detail}</div>}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--danger)',
                      background: 'rgba(239,68,68,0.12)', borderRadius: 4,
                      paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6,
                    }}>{b.statut}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

// ── ONGLET JOUEURS — tous les joueurs, 30 rosters en parallèle ───────────────
function OngletJoueurs({ equipesStandings }) {
  const [tousJoueurs, setTousJoueurs]   = useState([])
  const [chargement, setChargement]     = useState(false)
  const [progression, setProgression]   = useState(0)
  const [recherche, setRecherche]       = useState('')
  const [filtreEquipe, setFiltreEquipe] = useState('')
  const [joueurChoisi, setJoueurChoisi] = useState(null)

  // Chargement au montage si on a les équipes
  useEffect(() => {
    if (equipesStandings.length === 0 || tousJoueurs.length > 0) return
    setChargement(true)
    setProgression(0)

    let done = 0
    const total = equipesStandings.length

    Promise.allSettled(
      equipesStandings.map(eq =>
        fetchAvecTimeout(`${BASE}/teams/${eq.id}/roster`)
          .then(r => r.json())
          .then(data => {
            done++
            setProgression(Math.round((done / total) * 100))
            return parseRoster(data, eq)
          })
          .catch(() => { done++; setProgression(Math.round((done / total) * 100)); return [] })
      )
    ).then(resultats => {
      const tous = resultats
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => a.nom.localeCompare(b.nom))
      setTousJoueurs(tous)
      setChargement(false)
    })
  }, [equipesStandings])

  if (joueurChoisi) {
    const equipe = equipesStandings.find(e => e.id === joueurChoisi.equipeId) ?? null
    return <FicheJoueur joueur={joueurChoisi} equipe={equipe} onRetour={() => setJoueurChoisi(null)} />
  }

  const equipesTri = [...equipesStandings].sort((a, b) => a.nom.localeCompare(b.nom))

  const joueursFiltres = tousJoueurs.filter(j => {
    const matchNom    = j.nom.toLowerCase().includes(recherche.toLowerCase())
    const matchEquipe = filtreEquipe === '' || j.equipeId === filtreEquipe
    return matchNom && matchEquipe
  })

  return (
    <div>
      <LabelSection>Joueurs NBA</LabelSection>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un joueur…"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingTop: 8, paddingBottom: 8, paddingLeft: 32, paddingRight: 12,
              fontSize: 13, color: 'var(--text-1)', background: 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </div>
        {/* Filtre équipe */}
        <select
          value={filtreEquipe}
          onChange={e => setFiltreEquipe(e.target.value)}
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--text-1)', background: 'var(--bg-1)',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 10px', cursor: 'pointer',
          }}
        >
          <option value="">Toutes les équipes</option>
          {equipesTri.map(eq => (
            <option key={eq.id} value={eq.id}>{eq.nom} ({eq.trigramme})</option>
          ))}
        </select>
      </div>

      {/* Chargement avec progression */}
      {chargement && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 8 }}>
            Chargement des rosters… {progression}%
          </p>
          <div style={{
            height: 4, background: 'var(--bg-2)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progression}%`,
              background: 'var(--accent)', transition: 'width 0.2s',
            }} />
          </div>
        </div>
      )}

      {equipesStandings.length === 0 && !chargement && (
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Charge d'abord l'onglet Classements.</p>
      )}

      {/* Liste joueurs */}
      {!chargement && tousJoueurs.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
            {joueursFiltres.length} joueur{joueursFiltres.length > 1 ? 's' : ''}
            {filtreEquipe || recherche ? ' (filtré)' : ' au total'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {joueursFiltres.map(j => {
              const couleur = couleurEquipe(j.equipeCouleur)
              return (
                <button key={`${j.id}-${j.equipeId}`} onClick={() => setJoueurChoisi(j)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '7px 10px',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${couleur}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <PhotoJoueur url={j.photo} nom={j.nom} taille={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {j.nom}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>#{j.numero} · {j.position}</div>
                  </div>
                  {/* Badge équipe */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <LogoEquipe url={j.equipeLogo} trigramme={j.equipeTri} taille={18} couleur={couleur} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>{j.equipeTri}</span>
                  </div>
                  <ChevronRight size={13} color="var(--text-3)" />
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}


// ── RADAR STATS ─────────────────────────────────────────────────────────────
// Normalisation par rapport aux maximums NBA réalistes par catégorie
const RADAR_AXES = [
  { label: 'PTS', key: 'pts', max: 35 },
  { label: 'REB', key: 'reb', max: 14 },
  { label: 'AST', key: 'ast', max: 12 },
  { label: 'FG%', key: 'fg',  max: 65 },
  { label: '3P%', key: 'fg3', max: 50 },
]

function RadarStats({ stats, couleur }) {
  const SIZE    = 200          // taille SVG (carré)
  const CX      = SIZE / 2     // centre X
  const CY      = SIZE / 2     // centre Y
  const R       = 78           // rayon max du radar
  const N       = RADAR_AXES.length
  const NIVEAUX = 4            // cercles de référence

  // Angle de chaque axe — on commence à -90° (12h) et on tourne dans le sens horaire
  const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2

  // Coordonnées d'un point sur un axe à un ratio donné (0-1)
  const point = (i, ratio) => ({
    x: CX + R * ratio * Math.cos(angle(i)),
    y: CY + R * ratio * Math.sin(angle(i)),
  })

  // Valeurs normalisées (0-1) pour chaque axe
  const valeurs = RADAR_AXES.map(ax => {
    const raw = parseFloat(stats[ax.key])
    if (isNaN(raw)) return 0
    return Math.min(raw / ax.max, 1)
  })

  // Polygone données
  const polyPoints = valeurs.map((v, i) => {
    const p = point(i, v)
    return `${p.x},${p.y}`
  }).join(' ')

  // Polygone grille (cercle niveau k)
  const gridPoly = (ratio) => RADAR_AXES.map((_, i) => {
    const p = point(i, ratio)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0 20px' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>

        {/* Cercles de référence */}
        {Array.from({ length: NIVEAUX }).map((_, k) => (
          <polygon key={k}
            points={gridPoly((k + 1) / NIVEAUX)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Axes */}
        {RADAR_AXES.map((_, i) => {
          const p = point(i, 1)
          return (
            <line key={i}
              x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke="rgba(255,255,255,0.08)" strokeWidth={1}
            />
          )
        })}

        {/* Polygone données — remplissage couleur équipe */}
        <polygon
          points={polyPoints}
          fill={`${couleur}30`}
          stroke={couleur}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Points sur chaque axe */}
        {valeurs.map((v, i) => {
          const p = point(i, v)
          return (
            <circle key={i} cx={p.x} cy={p.y} r={3}
              fill={couleur} stroke="var(--bg-0)" strokeWidth={1.5}
            />
          )
        })}

        {/* Labels axes */}
        {RADAR_AXES.map((ax, i) => {
          const p     = point(i, 1.22)
          const pct   = parseFloat(stats[ax.key])
          const label = isNaN(pct) ? '—' : ax.key.includes('%') ? `${pct}%` : pct
          return (
            <g key={i}>
              <text x={p.x} y={p.y - 2}
                textAnchor="middle" dominantBaseline="auto"
                fontSize={9} fontWeight={700} fill="var(--text-3)"
                style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >{ax.label}</text>
              <text x={p.x} y={p.y + 9}
                textAnchor="middle" dominantBaseline="auto"
                fontSize={10} fontWeight={800} fill="var(--text-1)"
                fontFamily="var(--font-display)"
              >{label}</text>
            </g>
          )
        })}

      </svg>
    </div>
  )
}

// ── FICHE JOUEUR ─────────────────────────────────────────────────────────────
function FicheJoueur({ joueur, equipe, onRetour }) {
  const [profil, setProfil]         = useState(null)
  const [stats, setStats]           = useState(null)
  const [gameLog, setGameLog]       = useState([])
  const [chargement, setChargement] = useState(true)
  const couleur = equipe ? couleurEquipe(equipe.couleur) : couleurEquipe(joueur.equipeCouleur)

  useEffect(() => {
    setChargement(true)
    // Données de base depuis le roster (athletes/{id} CORS bloqué)
    setProfil({
      nom:        joueur.nom,
      photo:      joueur.photo ?? null,
      numero:     joueur.numero ?? '—',
      position:   joueur.positionFull ?? joueur.position ?? '—',
      age:        joueur.age ?? '—',
      taille:     joueur.taille ?? '—',
      poids:      joueur.poids ?? '—',
      experience: '—',
    })

    // Stats moyennes + game log en parallèle
    Promise.allSettled([
      fetchAvecTimeout(`${BASE_WEB}/athletes/${joueur.id}/stats?season=${SAISON_ESPN}&seasontype=2`)
        .then(r => r.json()),
      fetchAvecTimeout(`${BASE_WEB}/athletes/${joueur.id}/gamelog`)
        .then(r => r.json()),
    ]).then(([resStats, resLog]) => {
      // Stats moyennes
      if (resStats.status === 'fulfilled') {
        const data   = resStats.value
        const catAvg = (data.categories ?? []).find(c => c.name === 'averages')
        if (catAvg) {
          const names   = catAvg.names ?? []
          const statRow = catAvg.statistics?.find(s => s.season?.year === SAISON_ESPN)
            ?? catAvg.statistics?.[catAvg.statistics.length - 1]
          const vals = statRow?.stats ?? []
          const v = (n) => { const i = names.indexOf(n); return i !== -1 ? vals[i] : '—' }
          setStats({
            pts: v('avgPoints'), reb: v('avgRebounds'), ast: v('avgAssists'),
            stl: v('avgSteals'), blk: v('avgBlocks'), min: v('avgMinutes'),
            fg:  v('fieldGoalPct'), fg3: v('threePointFieldGoalPct'),
            ft:  v('freeThrowPct'), gp:  v('gamesPlayed'),
          })
        }
      }

      // Game log — tous les seasonTypes (playoffs prioritaire si en cours)
      if (resLog.status === 'fulfilled') {
        const data      = resLog.value
        const labels    = data.labels ?? []   // ex: ["MIN","FG","FG%","3PT","3P%","FT","FT%","REB","AST","BLK",...]
        const eventsMap = data.events ?? {}   // dict eventId → metadata
        const lignes    = []

        const i = (nom) => labels.indexOf(nom)

        ;(data.seasonTypes ?? []).forEach(st => {
          ;(st.categories ?? []).forEach(cat => {
            ;(cat.events ?? []).forEach(ev => {
              const meta = eventsMap[ev.eventId]
              if (!meta) return
              const s = ev.stats
              lignes.push({
                eventId:    ev.eventId,
                date:       meta.gameDate,
                atVs:       meta.atVs,
                adversaire: meta.opponent?.abbreviation ?? '?',
                resultat:   meta.gameResult,
                score:      meta.score,
                min: s[i('MIN')]  ?? '—',
                pts: s[i('PTS')]  ?? '—',
                reb: s[i('REB')]  ?? '—',
                ast: s[i('AST')]  ?? '—',
                fg:  s[i('FG%')] ?? '—',
                tp:  s[i('3P%')] ?? '—',
              })
            })
          })
        })

        // Tri chronologique inversé — matchs récents en premier
        lignes.sort((a, b) => new Date(b.date) - new Date(a.date))
        setGameLog(lignes.slice(0, 15))
      }

      setChargement(false)
    })
  }, [joueur.id])

  const statItems = stats ? [
    { label: 'PPG', val: stats.pts }, { label: 'RPG', val: stats.reb },
    { label: 'APG', val: stats.ast }, { label: 'SPG', val: stats.stl },
    { label: 'BPG', val: stats.blk }, { label: 'Min', val: stats.min },
    { label: 'FG%', val: stats.fg },  { label: '3P%', val: stats.fg3 },
    { label: 'FT%', val: stats.ft },  { label: 'MJ',  val: stats.gp },
  ] : []

  const formaterDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  return (
    <div>
      <button onClick={onRetour} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', borderWidth: 0, color: 'var(--text-3)',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0,
      }}>
        <ArrowLeft size={16} />
        {equipe ? `Retour — ${equipe.trigramme}` : joueur.equipeTri ? `Retour — ${joueur.equipeTri}` : 'Retour'}
      </button>

      {/* En-tête joueur */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 20px',
        background: `linear-gradient(135deg, ${couleur}18, ${couleur}06)`,
        borderRadius: 'var(--radius-lg)', borderWidth: 1, borderStyle: 'solid', borderColor: `${couleur}40`,
        marginBottom: 16,
      }}>
        <PhotoJoueur url={profil?.photo ?? joueur.photo} nom={joueur.nom} taille={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            {profil?.nom ?? joueur.nom}
          </div>
          <div style={{ fontSize: 12, color: couleur, fontWeight: 700, marginTop: 4 }}>
            {joueur.equipeTri && `${joueur.equipeTri} · `}#{profil?.numero ?? joueur.numero} · {profil?.position ?? joueur.positionFull}
          </div>
          {profil && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Âge', val: profil.age },
                { label: 'Taille', val: profil.taille },
                { label: 'Poids', val: profil.poids },
                { label: 'Exp.', val: profil.experience },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement des stats…</p>}

      {/* Stats moyennes saison */}
      {!chargement && stats && (
        <>
          <LabelSection>Stats saison</LabelSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 10, marginBottom: 20 }}>
            {statItems.map(({ label, val }) => (
              <div key={label} style={{
                background: 'var(--bg-1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>{val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {!chargement && !stats && <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 20 }}>Stats indisponibles.</p>}

      {/* Radar stats */}
      {!chargement && stats && <RadarStats stats={stats} couleur={couleur} />}

      {/* Game log — 15 derniers matchs */}
      {!chargement && gameLog.length > 0 && (
        <>
          <LabelSection>Derniers matchs</LabelSection>

          {/*
            Stratégie colonnes sticky mobile :
            - Col 0 (Date) + Col 1 (Adv+R) : sticky à gauche, fond opaque
            - Col 2-6 (stats) : scroll horizontal, largeur égale
            On utilise un tableau HTML natif pour pouvoir faire sticky sur mobile
          */}
          <div style={{ marginTop: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 480 }}>
              <colgroup>
                <col style={{ width: 52 }} /> {/* Date — sticky */}
                <col style={{ width: 56 }} /> {/* Adv — sticky */}
                <col style={{ width: 28 }} /> {/* W/L — sticky */}
                <col /> <col /> <col /> <col /> <col /> <col />  {/* stats égales */}
              </colgroup>

              {/* En-tête */}
              <thead>
                <tr style={{ borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)' }}>
                  {[
                    { label: 'Date',  sticky: true,  align: 'left'   },
                    { label: 'Adv',   sticky: true,  align: 'left'   },
                    { label: 'R',     sticky: true,  align: 'center' },
                    { label: 'MIN',   sticky: false, align: 'center' },
                    { label: 'PTS',   sticky: false, align: 'center' },
                    { label: 'REB',   sticky: false, align: 'center' },
                    { label: 'AST',   sticky: false, align: 'center' },
                    { label: 'FG%',   sticky: false, align: 'center' },
                    { label: '3P%',   sticky: false, align: 'center' },
                  ].map(({ label, sticky, align }, ci) => (
                    <th key={label} style={{
                      fontSize: 9, fontWeight: 700, color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '7px 6px', textAlign: align,
                      background: 'var(--bg-1)',
                      position: sticky ? 'sticky' : 'static',
                      left: sticky ? [0, 52, 108][ci] : 'auto',
                      zIndex: sticky ? 2 : 'auto',
                    }}>{label}</th>
                  ))}
                </tr>
              </thead>

              {/* Corps */}
              <tbody>
                {gameLog.map((l, i) => {
                  const bg = i % 2 === 0 ? 'var(--bg-1)' : 'var(--bg-0)'
                  return (
                    <tr key={l.eventId} style={{ borderBottomWidth: i < gameLog.length - 1 ? 1 : 0, borderBottomStyle: 'solid', borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                      {/* Date — sticky */}
                      <td style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 6px', background: bg, position: 'sticky', left: 0, zIndex: 1 }}>
                        {formaterDate(l.date)}
                      </td>
                      {/* Adversaire — sticky */}
                      <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', padding: '6px 4px', background: bg, position: 'sticky', left: 52, zIndex: 1 }}>
                        {l.atVs === '@' ? '@' : 'vs'} {l.adversaire}
                      </td>
                      {/* Résultat — sticky */}
                      <td style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', padding: '6px 4px', background: bg, position: 'sticky', left: 108, zIndex: 1, color: l.resultat === 'W' ? 'var(--success)' : 'var(--danger)' }}>
                        {l.resultat}
                      </td>
                      {/* Stats */}
                      <td style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '6px 4px' }}>{l.min}</td>
                      <td style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', textAlign: 'center', padding: '6px 4px', fontFamily: 'var(--font-display)' }}>{l.pts}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center', padding: '6px 4px' }}>{l.reb}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center', padding: '6px 4px' }}>{l.ast}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '6px 4px' }}>{l.fg}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '6px 4px' }}>{l.tp}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10 }}>
            {[
              { k: 'MIN', v: 'Minutes' },
              { k: 'PTS', v: 'Points' },
              { k: 'REB', v: 'Rebonds' },
              { k: 'AST', v: 'Passes décisives' },
              { k: 'FG%', v: 'Réussite aux tirs' },
              { k: '3P%', v: 'Réussite à 3 pts' },
              { k: 'W/L', v: 'Victoire / Défaite' },
            ].map(({ k, v }) => (
              <span key={k} style={{ fontSize: 10, color: 'var(--text-3)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{k}</span> {v}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const ONGLETS = [
  { val: 'classements', label: 'Classements' },
  { val: 'equipes',     label: 'Équipes' },
  { val: 'joueurs',     label: 'Joueurs' },
]

export default function Stats() {
  const [onglet, setOnglet]                     = useState('classements')
  const [equipesStandings, setEquipesStandings] = useState([])
  const [equipeViaClassement, setEquipeViaClassement] = useState(null)

  const handleEquipesChargées = (equipes) => {
    if (equipes.length > 0 && equipesStandings.length === 0) setEquipesStandings(equipes)
  }

  const handleEquipeClick = (eq) => {
    setEquipeViaClassement(eq)
    setOnglet('equipes')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', paddingBottom: 80 }}>
      <Navigation />
      <div className="nav-desktop-full" style={{ height: 52 }} />
      <div className="nav-mobile-logo" style={{ height: 40 }} />

      <BanniereImage src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" alt="Explorer NBA">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '0.08em', color: '#fff' }}>EXPLORER</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Classements · Équipes · Joueurs</div>
      </BanniereImage>

      <div style={{
        display: 'flex', marginLeft: 16, marginRight: 16,
        borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)',
      }}>
        {ONGLETS.map(({ val, label }) => (
          <button key={val} onClick={() => setOnglet(val)} style={{
            flex: 1, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            paddingTop: 12, paddingBottom: 12, background: 'none', borderWidth: 0,
            color: onglet === val ? 'var(--text-1)' : 'var(--text-3)',
            boxShadow: onglet === val ? 'inset 0 -2px 0 var(--accent)' : 'none',
            transition: 'color 0.15s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {onglet === 'classements' && (
          <OngletClassementsAvecSync onEquipeClick={handleEquipeClick} onEquipesChargées={handleEquipesChargées} />
        )}
        {onglet === 'equipes' && (
          <OngletEquipes equipesStandings={equipesStandings} equipeInitiale={equipeViaClassement} />
        )}
        {onglet === 'joueurs' && (
          <OngletJoueurs equipesStandings={equipesStandings} />
        )}
      </div>
    </div>
  )
}
