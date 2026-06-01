import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'
import { BanniereImage } from '../components/UI'

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

const formaterDateESPN  = (d) => d.toISOString().slice(0, 10).replace(/-/g, '')
const formaterJourCourt = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const formaterHeure     = (s) => new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const formaterMois      = (d) => d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

const debutSemaine = (date) => {
  const d = new Date(date)
  const j = d.getDay()
  d.setDate(d.getDate() + (j === 0 ? -6 : 1 - j))
  d.setHours(0, 0, 0, 0)
  return d
}

const ajouterJours = (date, n) => {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}

const memeJour = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate()

function Calendrier() {
  const navigate                    = useNavigate()
  const [vue, setVue]               = useState('7j')
  const [dateRef, setDateRef]       = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [cache, setCache]           = useState({})
  const [chargement, setCharg]      = useState(false)
  const [filtreType, setFiltreType] = useState('tous')
  const [filtreEquipe, setFiltreEq] = useState('toutes')

  const datesVue = useCallback(() => {
    if (vue === '1j') return [new Date(dateRef)]
    if (vue === '3j') return [0,1,2].map(i => ajouterJours(dateRef, i))
    if (vue === '7j') {
      const lundi = debutSemaine(dateRef)
      return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i))
    }
    if (vue === 'mois') {
      const debut = new Date(dateRef.getFullYear(), dateRef.getMonth(), 1)
      const fin   = new Date(dateRef.getFullYear(), dateRef.getMonth() + 1, 0)
      const jours = []
      for (let d = new Date(debut); d <= fin; d = ajouterJours(d, 1)) jours.push(new Date(d))
      return jours
    }
    return [new Date(dateRef)]
  }, [vue, dateRef])

  const chargerDates = useCallback(async (dates) => {
    const manquantes = dates.filter(d => !cache[formaterDateESPN(d)])
    if (!manquantes.length) return
    setCharg(true)
    const nouveau = { ...cache }
    await Promise.all(manquantes.map(async (date) => {
      const cle = formaterDateESPN(date)
      try {
        const res  = await fetch(`${BASE_URL}/scoreboard?dates=${cle}&limit=50`)
        const data = await res.json()
        nouveau[cle] = (data.events || []).map(evt => {
          const comp = evt.competitions[0]
          const dom  = comp.competitors.find(c => c.homeAway === 'home')
          const ext  = comp.competitors.find(c => c.homeAway === 'away')
          return {
            espn_id:    evt.id,
            date:       evt.date,
            statut:     comp.status.type.name,
            typeSaison: evt.season?.type ?? null,
            domicile:   { trigramme: dom.team.abbreviation, logo: dom.team.logo, score: dom.score ?? null },
            exterieur:  { trigramme: ext.team.abbreviation, logo: ext.team.logo, score: ext.score ?? null },
          }
        })
      } catch { nouveau[cle] = [] }
    }))
    setCache(nouveau)
    setCharg(false)
  }, [cache])

  useEffect(() => { chargerDates(datesVue()) }, [dateRef, vue])

  const naviguer = (dir) => {
    const pas = vue === '1j' ? 1 : vue === '3j' ? 3 : vue === '7j' ? 7 : 30
    setDateRef(prev => ajouterJours(prev, dir * pas))
  }

  const allerAujourdhui = () => {
    const d = new Date(); d.setHours(0,0,0,0); setDateRef(d)
  }

  const matchsDate = useCallback((date) => {
    const liste = cache[formaterDateESPN(date)] || []
    return liste.filter(m => {
      if (filtreType !== 'tous' && parseInt(m.typeSaison) !== parseInt(filtreType)) return false
      if (filtreEquipe !== 'toutes' &&
          m.domicile.trigramme  !== filtreEquipe &&
          m.exterieur.trigramme !== filtreEquipe) return false
      return true
    })
  }, [cache, filtreType, filtreEquipe])

  const clicJourMois = useCallback((date) => {
    const matchs = matchsDate(date)
    if (matchs.length >= 2) { setDateRef(date); setVue('1j') }
    else if (matchs.length === 1) navigate(`/match/${matchs[0].espn_id}`)
  }, [matchsDate, navigate])

  const dates   = datesVue()
  const aujourd = new Date(); aujourd.setHours(0,0,0,0)

  const titrePeriode = () => {
    if (vue === '1j')   return formaterJourCourt(dateRef)
    if (vue === '3j')   return `${formaterJourCourt(dates[0])} – ${formaterJourCourt(dates[2])}`
    if (vue === '7j')   return `${formaterJourCourt(dates[0])} – ${formaterJourCourt(dates[6])}`
    if (vue === 'mois') return formaterMois(dateRef)
    return ''
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>CALEN</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>DRIER</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Tous les matchs — passés et à venir.
          </p>
        </div>

        {/* ── Contrôles ── */}
        <div style={{ padding: '16px 16px 0' }}>

          {/* Sélecteur vue */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[
              { key: '1j',   label: '1 jour'  },
              { key: '3j',   label: '3 jours' },
              { key: '7j',   label: 'Semaine' },
              { key: 'mois', label: 'Mois'    },
            ].map(v => (
              <button key={v.key} onClick={() => setVue(v.key)} style={{
                flex: 1, padding: '6px 4px', fontSize: 12, fontWeight: 500,
                background: vue === v.key ? 'var(--accent-dim)' : 'transparent',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: vue === v.key ? 'var(--accent-border)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: vue === v.key ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
              }}>{v.label}</button>
            ))}
          </div>

          {/* Navigation période */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => naviguer(-1)} style={S.navBtn}><ChevronLeft size={16} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{titrePeriode()}</span>
              <button onClick={allerAujourdhui} style={{ ...S.navBtn, fontSize: 11, padding: '3px 8px' }}>Aujourd'hui</button>
            </div>
            <button onClick={() => naviguer(1)} style={S.navBtn}><ChevronRight size={16} /></button>
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={S.select}>
              <option value="tous">Tous types</option>
              <option value="1">Pré-saison</option>
              <option value="2">Saison régulière</option>
              <option value="3">Playoffs</option>
              <option value="5">International</option>
            </select>
            <select value={filtreEquipe} onChange={e => setFiltreEq(e.target.value)} style={S.select}>
              <option value="toutes">Toutes équipes</option>
              {[...new Set(
                Object.values(cache).flat()
                  .flatMap(m => [m.domicile.trigramme, m.exterieur.trigramme])
                  .filter(Boolean)
              )].sort().map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

        </div>

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '1rem 0' }}>
            Chargement…
          </p>
        )}

        {/* ── Vue MOIS ── */}
        {vue === 'mois' && (
          <div style={{ padding: '0 16px 24px', overflow: 'hidden', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {['L','M','M','J','V','S','D'].map((j, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', fontWeight: 600 }}>{j}</div>
              ))}
            </div>
            <GrilleMois dates={dates} matchsDate={matchsDate} aujourd={aujourd} navigate={navigate} onClicJour={clicJourMois} />
          </div>
        )}

        {/* ── Vues colonnes (1j / 3j / 7j) ── */}
        {vue !== 'mois' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dates.length}, 1fr)`,
            gap: vue === '7j' ? 2 : 8,
            padding: '0 16px 24px',
            alignItems: 'start',
            width: '100%',
            overflow: 'hidden',
          }}>
            {dates.map(date => {
              const matchs = matchsDate(date)
              const estAuj = memeJour(date, aujourd)
              return (
                <div key={date.toISOString()} style={{ minWidth: 0 }}>
                  <div style={{
                    textAlign: 'center', marginBottom: 6, paddingBottom: 6,
                    borderBottomWidth: 1, borderBottomStyle: 'solid',
                    borderBottomColor: estAuj ? 'var(--accent)' : 'var(--border)',
                  }}>
                    <div style={{ fontSize: vue === '7j' ? 10 : 12, fontWeight: 600, color: estAuj ? 'var(--accent)' : 'var(--text-2)', textTransform: 'capitalize' }}>
                      {date.toLocaleDateString('fr-FR', { weekday: vue === '7j' ? 'short' : 'long' })}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: vue === '7j' ? 16 : 22, color: estAuj ? 'var(--accent)' : 'var(--text-1)' }}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {matchs.length === 0 && !chargement && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>—</div>
                    )}
                    {matchs.map(match => (
                      <CarteMatch
                        key={match.espn_id}
                        match={match}
                        compact={vue === '7j'}
                        onClick={() => navigate(`/match/${match.espn_id}`)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </>
  )
}

function CarteMatch({ match, compact, onClick }) {
  const { noSpoil } = useNoSpoil()
  const termine = match.statut === 'STATUS_FINAL'
  const enCours = match.statut === 'STATUS_IN_PROGRESS'
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, transparent 60%)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: enCours ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.08)',
      borderRadius: 'var(--radius-sm)',
      padding: compact ? '5px 6px' : '8px 10px',
      cursor: 'pointer', minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{ fontSize: 9, color: enCours ? 'var(--success)' : 'var(--text-3)', fontWeight: enCours ? 700 : 400, marginBottom: 4 }}>
        {enCours ? '● Live' : termine ? 'Final' : formaterHeure(match.date)}
      </div>
      {[match.exterieur, match.domicile].map((eq, i) => (
        <div key={eq.trigramme} style={{ display: 'flex', alignItems: 'center', gap: compact ? 3 : 5, paddingTop: i === 1 ? 2 : 0, minWidth: 0 }}>
          <img src={eq.logo} alt={eq.trigramme} style={{ width: compact ? 14 : 18, height: compact ? 14 : 18, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 11 : 13, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {eq.trigramme}
          </span>
          {(termine || enCours) && eq.score != null && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 11 : 13, color: 'var(--text-2)', flexShrink: 0 }}>
              {noSpoil && termine ? '—' : eq.score}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function GrilleMois({ dates, matchsDate, aujourd, navigate, onClicJour }) {
  const premierJour = dates[0].getDay()
  const padding     = premierJour === 0 ? 6 : premierJour - 1

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, width: '100%' }}>
      {Array.from({ length: padding }, (_, i) => <div key={`pad-${i}`} style={{ minWidth: 0 }} />)}
      {dates.map(date => {
        const matchs    = matchsDate(date)
        const estAuj    = memeJour(date, aujourd)
        const cliquable = matchs.length >= 1
        return (
          <div
            key={date.toISOString()}
            onClick={() => {
              if (matchs.length >= 2)       onClicJour(date)
              else if (matchs.length === 1) navigate(`/match/${matchs[0].espn_id}`)
            }}
            style={{
              minHeight: 52, minWidth: 0, overflow: 'hidden',
              background: estAuj ? 'var(--accent-dim)' : 'linear-gradient(160deg, rgba(99,102,241,0.05) 0%, transparent 80%)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: estAuj ? 'var(--accent-border)' : 'rgba(99,102,241,0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 3px',
              cursor: cliquable ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: estAuj ? 'var(--accent)' : 'var(--text-3)', marginBottom: 3, textAlign: 'center' }}>
              {date.getDate()}
            </div>
            {matchs.slice(0, 3).map(m => (
              <div key={m.espn_id} style={{ fontSize: 9, fontWeight: 600, color: m.statut === 'STATUS_IN_PROGRESS' ? 'var(--success)' : 'var(--text-2)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.exterieur.trigramme}@{m.domicile.trigramme}
              </div>
            ))}
            {matchs.length > 3 && <div style={{ fontSize: 9, color: 'var(--text-3)' }}>+{matchs.length - 3}</div>}
            {matchs.length === 0 && <div style={{ fontSize: 9, color: 'var(--border)', textAlign: 'center' }}>–</div>}
          </div>
        )
      })}
    </div>
  )
}

const S = {
  navBtn: {
    background: 'none',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-3)',
    padding: '5px 8px', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  select: {
    background: 'var(--bg-1)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-2)', fontSize: 12,
    padding: '6px 8px', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
}

export default Calendrier