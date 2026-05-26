import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

const TYPE_SAISON = { 1: 'Pré-saison', 2: 'Régulière', 3: 'Playoffs', 4: 'NBA Cup', 5: 'International' }

const SAISONS = Array.from({ length: 23 }, (_, i) => {
  const fin = 2026 - i
  return { label: `${fin - 1}-${String(fin).slice(2)}`, fin }
})

const EQUIPES_NBA = [
  'ATL','BOS','BKN','CHA','CHI','CLE','DAL','DEN','DET','GSW',
  'HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NY',
  'OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS'
]

const formaterDateESPN = (date) => date.toISOString().slice(0, 10).replace(/-/g, '')
const formaterJourCourt = (date) => date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const formaterHeure = (dateStr) => new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const formaterMois = (date) => date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

const debutSemaine = (date) => {
  const d = new Date(date)
  const jour = d.getDay()
  const diff = jour === 0 ? -6 : 1 - jour
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const ajouterJours = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const memeJour = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const estMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

function Calendrier() {
  const navigate   = useNavigate()
  const [vueActuelle, setVue]       = useState(estMobile() ? '1j' : '7j')
  const [dateRef, setDateRef]       = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [cache, setCache]           = useState({})      // { 'YYYYMMDD': [matchs] }
  const [chargement, setCharg]      = useState(false)
  const [filtreType, setFiltreType] = useState('tous')
  const [filtreEquipe, setFiltreEq] = useState('toutes')
  const [filtreSaison, setFiltreSaison] = useState(SAISONS[0])

  // Calcule les dates à afficher selon la vue
  const datesVue = useCallback(() => {
    if (vueActuelle === '1j') return [new Date(dateRef)]
    if (vueActuelle === '3j') return [0,1,2].map(i => ajouterJours(dateRef, i))
    if (vueActuelle === '7j') {
      const lundi = debutSemaine(dateRef)
      return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i))
    }
    if (vueActuelle === 'mois') {
      const debut = new Date(dateRef.getFullYear(), dateRef.getMonth(), 1)
      const fin   = new Date(dateRef.getFullYear(), dateRef.getMonth() + 1, 0)
      const jours = []
      for (let d = new Date(debut); d <= fin; d = ajouterJours(d, 1)) jours.push(new Date(d))
      return jours
    }
    return [new Date(dateRef)]
  }, [vueActuelle, dateRef])

  // Charge les dates manquantes dans le cache
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
        const typeSaison = data.season?.type

        nouveau[cle] = (data.events || []).map(evt => {
          const comp = evt.competitions[0]
          const dom  = comp.competitors.find(c => c.homeAway === 'home')
          const ext  = comp.competitors.find(c => c.homeAway === 'away')
          return {
            espn_id:    evt.id,
            date:       evt.date,
            statut:     comp.status.type.name,
            statutCourt: comp.status.type.shortDetail || comp.status.type.description,
            typeSaison: typeSaison || null,
            domicile:   { trigramme: dom.team.abbreviation, logo: dom.team.logo, score: dom.score ?? null },
            exterieur:  { trigramme: ext.team.abbreviation, logo: ext.team.logo, score: ext.score ?? null },
          }
        })
      } catch {
        nouveau[cle] = []
      }
    }))

    setCache(nouveau)
    setCharg(false)
  }, [cache])

  useEffect(() => {
    chargerDates(datesVue())
  }, [dateRef, vueActuelle])

  // Navigation
  const naviguer = (direction) => {
    const pas = vueActuelle === '1j' ? 1 : vueActuelle === '3j' ? 3 : vueActuelle === '7j' ? 7 : 30
    setDateRef(prev => ajouterJours(prev, direction * pas))
  }

  const allerAujourdhui = () => {
    const d = new Date(); d.setHours(0,0,0,0); setDateRef(d)
  }

  // Matchs filtrés pour une date
  const matchsDate = (date) => {
    const cle   = formaterDateESPN(date)
    const liste = cache[cle] || []
    return liste.filter(m => {
      if (filtreType !== 'tous' && m.typeSaison !== parseInt(filtreType)) return false
      if (filtreEquipe !== 'toutes' &&
          m.domicile.trigramme !== filtreEquipe &&
          m.exterieur.trigramme !== filtreEquipe) return false
      return true
    })
  }

  const dates = datesVue()
  const aujourd = new Date(); aujourd.setHours(0,0,0,0)

  // Titre de la période affichée
  const titrePeriode = () => {
    if (vueActuelle === '1j') return formaterJourCourt(dateRef)
    if (vueActuelle === '3j') return `${formaterJourCourt(dates[0])} – ${formaterJourCourt(dates[2])}`
    if (vueActuelle === '7j') return `${formaterJourCourt(dates[0])} – ${formaterJourCourt(dates[6])}`
    if (vueActuelle === 'mois') return formaterMois(dateRef)
    return ''
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, padding: '16px 0 32px' }}>

        {/* ── Header ── */}
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <h2 style={{ marginBottom: 16 }}>Calendrier NBA</h2>

          {/* Sélecteur vue */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[
              { key: '1j', label: '1 jour' },
              { key: '3j', label: '3 jours' },
              { key: '7j', label: 'Semaine' },
              { key: 'mois', label: 'Mois' },
            ].map(v => (
              <button key={v.key} onClick={() => setVue(v.key)} style={{
                flex: 1, padding: '6px 4px', fontSize: 12, fontWeight: 500,
                background: vueActuelle === v.key ? 'var(--accent-dim)' : 'transparent',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: vueActuelle === v.key ? 'var(--accent-border)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: vueActuelle === v.key ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
              }}>{v.label}</button>
            ))}
          </div>

          {/* Navigation période */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button onClick={() => naviguer(-1)} style={S.navBtn}><ChevronLeft size={16} /></button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
              {titrePeriode()}
            </div>
            <button onClick={() => naviguer(1)} style={S.navBtn}><ChevronRight size={16} /></button>
            <button onClick={allerAujourdhui} style={{ ...S.navBtn, padding: '5px 10px', fontSize: 11 }}>
              Auj.
            </button>
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* Saison */}
            <select
              value={filtreSaison.fin}
              onChange={e => setFiltreSaison(SAISONS.find(s => s.fin === parseInt(e.target.value)))}
              style={S.select}
            >
              {SAISONS.map(s => (
                <option key={s.fin} value={s.fin}>{s.label}</option>
              ))}
            </select>

            {/* Type */}
            <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={S.select}>
              <option value="tous">Tous types</option>
              <option value="1">Pré-saison</option>
              <option value="2">Régulière</option>
              <option value="3">Playoffs</option>
              <option value="4">NBA Cup</option>
              <option value="5">International</option>
            </select>

            {/* Équipe */}
            <select value={filtreEquipe} onChange={e => setFiltreEq(e.target.value)} style={S.select}>
              <option value="toutes">Toutes équipes</option>
              {EQUIPES_NBA.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* ── Contenu ── */}
        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Chargement…
          </p>
        )}

        {/* Vue mois — grille */}
        {vueActuelle === 'mois' && (
          <div style={{ padding: '0 16px' }}>
            {/* En-têtes jours semaine */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {['L','M','M','J','V','S','D'].map((j, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', fontWeight: 600 }}>{j}</div>
              ))}
            </div>
            <GrilleMois dates={dates} matchsDate={matchsDate} aujourd={aujourd} navigate={navigate} />
          </div>
        )}

        {/* Vues 1j / 3j / 7j — colonnes */}
        {vueActuelle !== 'mois' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dates.length}, 1fr)`,
            gap: vueActuelle === '7j' ? 2 : 8,
            padding: '0 16px',
            alignItems: 'start',
          }}>
            {dates.map(date => {
              const matchs   = matchsDate(date)
              const estAuj   = memeJour(date, aujourd)

              return (
                <div key={date.toISOString()}>
                  {/* En-tête jour */}
                  <div style={{
                    textAlign: 'center', marginBottom: 6,
                    paddingBottom: 6,
                    borderBottomWidth: 1, borderBottomStyle: 'solid',
                    borderBottomColor: estAuj ? 'var(--accent)' : 'var(--border)',
                  }}>
                    <div style={{ fontSize: vueActuelle === '7j' ? 10 : 12, fontWeight: 600, color: estAuj ? 'var(--accent)' : 'var(--text-2)', textTransform: 'capitalize' }}>
                      {date.toLocaleDateString('fr-FR', { weekday: vueActuelle === '7j' ? 'short' : 'long' })}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: vueActuelle === '7j' ? 16 : 22, color: estAuj ? 'var(--accent)' : 'var(--text-1)' }}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Matchs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {matchs.length === 0 && !chargement && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>—</div>
                    )}
                    {matchs.map(match => (
                      <CarteMatch
                        key={match.espn_id}
                        match={match}
                        compact={vueActuelle === '7j'}
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

/* ── Carte match compacte ── */
function CarteMatch({ match, compact, onClick }) {
  const termine = match.statut === 'STATUS_FINAL'
  const enCours = match.statut === 'STATUS_IN_PROGRESS'

  const couleurStatut = enCours ? 'var(--success)' : termine ? 'var(--text-3)' : 'var(--text-3)'

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-1)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: enCours ? 'rgba(34,197,94,0.3)' : 'var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: compact ? '5px 6px' : '8px 10px',
      cursor: 'pointer',
    }}>
      {/* Heure / statut */}
      <div style={{ fontSize: 9, color: couleurStatut, fontWeight: enCours ? 700 : 400, marginBottom: 4 }}>
        {enCours ? '● Live' : termine ? 'Final' : formaterHeure(match.date)}
      </div>

      {/* Équipes */}
      {[match.exterieur, match.domicile].map((eq, i) => (
        <div key={eq.trigramme} style={{
          display: 'flex', alignItems: 'center', gap: compact ? 3 : 5,
          paddingTop: i === 1 ? 2 : 0,
        }}>
          <img
            src={eq.logo}
            alt={eq.trigramme}
            style={{ width: compact ? 14 : 18, height: compact ? 14 : 18, objectFit: 'contain', flexShrink: 0 }}
          />
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: compact ? 11 : 13,
            color: 'var(--text-1)', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{eq.trigramme}</span>
          {(termine || enCours) && eq.score != null && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 11 : 13, color: 'var(--text-2)' }}>
              {eq.score}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Grille mois ── */
function GrilleMois({ dates, matchsDate, aujourd, navigate }) {
  // Padding avant le 1er jour (lundi = 0)
  const premierJour = dates[0].getDay()
  const padding = premierJour === 0 ? 6 : premierJour - 1

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
      {Array.from({ length: padding }, (_, i) => <div key={`pad-${i}`} />)}
      {dates.map(date => {
        const matchs = matchsDate(date)
        const estAuj = memeJour(date, aujourd)
        return (
          <div key={date.toISOString()} style={{
            minHeight: 52,
            background: estAuj ? 'var(--accent-dim)' : 'var(--bg-1)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: estAuj ? 'var(--accent-border)' : 'var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 3px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: estAuj ? 'var(--accent)' : 'var(--text-3)', marginBottom: 3, textAlign: 'center' }}>
              {date.getDate()}
            </div>
            {matchs.slice(0, 3).map(m => (
              <div
                key={m.espn_id}
                onClick={() => navigate(`/match/${m.espn_id}`)}
                style={{
                  fontSize: 9, fontWeight: 600,
                  color: m.statut === 'STATUS_IN_PROGRESS' ? 'var(--success)' : 'var(--text-2)',
                  marginBottom: 1, cursor: 'pointer',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {m.exterieur.trigramme}@{m.domicile.trigramme}
              </div>
            ))}
            {matchs.length > 3 && (
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>+{matchs.length - 3}</div>
            )}
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