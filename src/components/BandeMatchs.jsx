import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNoSpoil } from '../context/NoSpoilContext'

const formaterHeure = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formaterJourLong = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).toUpperCase()

const estAujourdhui = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00')
  const auj = new Date()
  return d.getDate() === auj.getDate() &&
    d.getMonth() === auj.getMonth() &&
    d.getFullYear() === auj.getFullYear()
}

const couleurValide = (hex) => {
  if (!hex) return false
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0,2), 16)
  const g = parseInt(h.slice(2,4), 16)
  const b = parseInt(h.slice(4,6), 16)
  return (0.299*r + 0.587*g + 0.114*b) >= 30
}

const getCouleur = (equipe) => {
  if (couleurValide(equipe?.color)) return `#${equipe.color}`
  if (couleurValide(equipe?.alternateColor)) return `#${equipe.alternateColor}`
  return '#6366f1'
}

const grouperParJour = (matchs) =>
  Object.entries(
    matchs.reduce((acc, m) => {
      const jour = new Date(m.date).toISOString().slice(0, 10)
      if (!acc[jour]) acc[jour] = []
      acc[jour].push(m)
      return acc
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b))

const EQUIPES_NBA = [
  { tri: 'ATL', nom: 'Hawks',        logo: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png' },
  { tri: 'BOS', nom: 'Celtics',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' },
  { tri: 'BKN', nom: 'Nets',         logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png' },
  { tri: 'CHA', nom: 'Hornets',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png' },
  { tri: 'CHI', nom: 'Bulls',        logo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' },
  { tri: 'CLE', nom: 'Cavaliers',    logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' },
  { tri: 'DAL', nom: 'Mavericks',    logo: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' },
  { tri: 'DEN', nom: 'Nuggets',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png' },
  { tri: 'DET', nom: 'Pistons',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png' },
  { tri: 'GS',  nom: 'Warriors',     logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png'  },
  { tri: 'HOU', nom: 'Rockets',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png' },
  { tri: 'IND', nom: 'Pacers',       logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png' },
  { tri: 'LAC', nom: 'Clippers',     logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png' },
  { tri: 'LAL', nom: 'Lakers',       logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
  { tri: 'MEM', nom: 'Grizzlies',    logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png' },
  { tri: 'MIA', nom: 'Heat',         logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' },
  { tri: 'MIL', nom: 'Bucks',        logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' },
  { tri: 'MIN', nom: 'Timberwolves', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' },
  { tri: 'NO',  nom: 'Pelicans',     logo: 'https://a.espncdn.com/i/teamlogos/nba/500/no.png'  },
  { tri: 'NY',  nom: 'Knicks',       logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png'  },
  { tri: 'OKC', nom: 'Thunder',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' },
  { tri: 'ORL', nom: 'Magic',        logo: 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png' },
  { tri: 'PHI', nom: 'Sixers',       logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' },
  { tri: 'PHX', nom: 'Suns',         logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' },
  { tri: 'POR', nom: 'Blazers',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' },
  { tri: 'SA',  nom: 'Spurs',        logo: 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png'  },
  { tri: 'SAC', nom: 'Kings',        logo: 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png' },
  { tri: 'TOR', nom: 'Raptors',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png' },
  { tri: 'UTA', nom: 'Jazz',         logo: 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png'},
  { tri: 'WAS', nom: 'Wizards',      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png' },
]

function FiltreEquipe({ equipeFiltre, onSelect }) {
  const [ouvert, setOuvert] = useState(false)
  const refModal = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (refModal.current && !refModal.current.contains(e.target)) setOuvert(false) }
    if (ouvert) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ouvert])

  const equipeActuelle = EQUIPES_NBA.find(e => e.tri === equipeFiltre)

  return (
    <div style={{ position: 'relative' }} ref={refModal}>
      <button onClick={() => setOuvert(!ouvert)} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: equipeFiltre ? 'rgba(99,102,241,0.15)' : 'none',
        border: `1px solid ${equipeFiltre ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer',
        fontSize: 11, color: equipeFiltre ? 'var(--accent)' : 'var(--text-3)', fontWeight: 600,
      }}>
        {equipeActuelle
          ? <><img src={equipeActuelle.logo} style={{ width: 16, height: 16, objectFit: 'contain' }} alt="" />{equipeActuelle.tri}</>
          : 'Équipe'}
      </button>
      {ouvert && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 200, marginTop: 4,
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 8,
          width: 220, maxHeight: 320, overflowY: 'auto', boxShadow: 'var(--shadow-md)',
        }}>
          {equipeFiltre && (
            <button onClick={() => { onSelect(null); setOuvert(false) }} style={{
              width: '100%', textAlign: 'left', padding: '6px 8px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginBottom: 4,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Toutes les équipes
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {EQUIPES_NBA.map(eq => (
              <button key={eq.tri} onClick={() => { onSelect(eq.tri); setOuvert(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px',
                background: equipeFiltre === eq.tri ? 'var(--accent-dim)' : 'none',
                border: equipeFiltre === eq.tri ? '1px solid var(--accent-border)' : '1px solid transparent',
                borderRadius: 4, cursor: 'pointer',
              }}>
                <img src={eq.logo} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.04em' }}>{eq.tri}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CarteMatch({ match, pronoData, onProno, userId }) {
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()
  // pronoData = { equipe, resultat } ou null
  const [pronoLocal, setPronoLocal] = useState(pronoData?.equipe || null)
  const [loading, setLoading] = useState(false)

  // Sync si pronoData change
  useEffect(() => { setPronoLocal(pronoData?.equipe || null) }, [pronoData])

  const termine = match.statut === 'STATUS_FINAL'
  const enCours = match.statut === 'STATUS_IN_PROGRESS'
  const aVenir  = !termine && !enCours

  const ext = match.exterieur
  const dom = match.domicile
  const c1  = getCouleur(ext)
  const c2  = getCouleur(dom)

  const handleProno = async (e, equipe) => {
    e.stopPropagation()
    if (!userId || loading) return
    setLoading(true)
    await onProno(match, equipe)
    setPronoLocal(equipe)
    setLoading(false)
  }

  const extChoise = pronoLocal === ext.trigramme
  const domChoise = pronoLocal === dom.trigramme

  let resultatProno = null
  if (pronoLocal && termine) {
    const scoreDom = parseInt(dom.score)
    const scoreExt = parseInt(ext.score)
    if (!isNaN(scoreDom) && !isNaN(scoreExt)) {
      const gagnant = scoreDom > scoreExt ? dom.trigramme : ext.trigramme
      resultatProno = pronoLocal === gagnant ? 'correct' : 'incorrect'
    }
  }

  return (
    <div onClick={() => navigate(`/match/${match.espn_id}`)} style={{
      position: 'relative',
      width: '80vw', maxWidth: 320, minWidth: 260,
      height: 175, flexShrink: 0,
      cursor: 'pointer', overflow: 'hidden',
      opacity: noSpoil && termine ? 0.6 : 1,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, ${c1}55 0%, #0d0d12 42%, #0d0d12 58%, ${c2}55 100%)` }} />
      <img src={ext.logo} alt="" style={{ position: 'absolute', left: -40, top: '50%', transform: 'translateY(-50%)', width: 220, height: 220, objectFit: 'contain', opacity: 0.1, pointerEvents: 'none', filter: 'saturate(0.3) brightness(1.5)' }} />
      <img src={dom.logo} alt="" style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', width: 220, height: 220, objectFit: 'contain', opacity: 0.1, pointerEvents: 'none', filter: 'saturate(0.3) brightness(1.5)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(0deg, rgba(6,6,8,0.95) 0%, transparent 100%)' }} />

      {/* Label type de saison — haut-centre, flottant au-dessus des logos */}
      {match.typeSaisonNum && (
        <div style={{ position: 'absolute', top: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700,
            letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
          }}>
            {match.typeSaisonNum === 1 ? 'Pré-saison'
              : match.typeSaisonNum === 2 ? 'Saison régulière'
              : match.typeSaisonNum === 3 ? 'Playoffs'
              : null}
          </span>
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Logos + score */}
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '8px 8px 0', gap: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: pronoLocal && !extChoise ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <img src={ext.logo} style={{ width: 80, height: 80, objectFit: 'contain', filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.8))${extChoise ? ` drop-shadow(0 0 8px ${c1})` : ''}` }} alt={ext.trigramme} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: extChoise ? c1 : 'rgba(255,255,255,0.75)', letterSpacing: '0.06em' }}>{ext.trigramme}</span>
          </div>

          <div style={{ minWidth: 90, textAlign: 'center', paddingBottom: 2 }}>
            {(termine || enCours) ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{ext.score}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>–</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{dom.score}</span>
                </div>
                {enCours && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'blink 1.2s infinite', display: 'inline-block' }} /><span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#22c55e', fontWeight: 700, letterSpacing: '0.12em' }}>LIVE</span></div>}
              </>
            ) : <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{formaterHeure(match.date)}</div>}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: pronoLocal && !domChoise ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <img src={dom.logo} style={{ width: 80, height: 80, objectFit: 'contain', filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.8))${domChoise ? ` drop-shadow(0 0 8px ${c2})` : ''}` }} alt={dom.trigramme} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: domChoise ? c2 : 'rgba(255,255,255,0.75)', letterSpacing: '0.06em' }}>{dom.trigramme}</span>
          </div>
        </div>

        {/* Bas */}
        <div style={{ padding: '4px 10px 8px' }}>
          {aVenir && (
            <div onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
                  {pronoLocal ? `Mon prono · ${pronoLocal} ✓` : 'Ton prono ?'}
                </div>
                {match.stade && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.05em', textAlign: 'right', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.stade}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ eq: ext, c: c1 }, { eq: dom, c: c2 }].map(({ eq, c }) => {
                  const sel = pronoLocal === eq.trigramme
                  return (
                    <button key={eq.trigramme} onClick={(e) => handleProno(e, eq.trigramme)} style={{
                      flex: 1, padding: '5px 0',
                      background: sel ? c : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${sel ? c : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 2,
                      fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                      color: sel ? '#fff' : 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.08em', cursor: 'pointer',
                      boxShadow: sel ? `0 0 10px ${c}70` : 'none',
                      opacity: pronoLocal && !sel ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}>{eq.trigramme}</button>
                  )
                })}
              </div>
            </div>
          )}
          {!aVenir && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 0' }}>
                {resultatProno === 'correct' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.04em' }}>Pronostic correct !</span></>}
                {resultatProno === 'incorrect' && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: '0.04em' }}>Pronostic raté !</span></>}
                {!pronoLocal && <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>Non pronostiqué</span>}
                {pronoLocal && !resultatProno && <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>Mon prono · {pronoLocal}</span></>}
              </div>
              {match.stade && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.05em', textAlign: 'right', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.stade}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupeJour({ jour, matchs, pronos, onProno, userId, refEl }) {
  const aujd = estAujourdhui(jour)
  return (
    <div ref={refEl} style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4, marginBottom: 8 }}>
        {aujd && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', display: 'inline-block' }} />}
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: aujd ? 'var(--accent)' : 'var(--text-3)', letterSpacing: '0.16em' }}>
          {aujd ? "AUJOURD'HUI" : formaterJourLong(jour)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {matchs.map(match => (
          <CarteMatch
            key={match.espn_id}
            match={match}
            pronoData={pronos[match.espn_id] || null}
            onProno={onProno}
            userId={userId}
          />
        ))}
      </div>
    </div>
  )
}

function BandeMatchs({ matchs, userId, onProno, onBadge, equipeFiltre, onFiltreChange }) {
  const [pronos, setPronos] = useState({})
  const scrollRef      = useRef(null)
  const cibleScrollRef = useRef(null)
  const groupesRefsArr = useRef([])  // refs sur chaque GroupeJour
  const [hovered, setHovered]       = useState(false)
  const [peutGauche, setPeutGauche] = useState(false)
  const [peutDroite, setPeutDroite] = useState(true)

  const mettreAJourFleches = () => {
    const c = scrollRef.current
    if (!c) return
    setPeutGauche(c.scrollLeft > 10)
    setPeutDroite(c.scrollLeft < c.scrollWidth - c.clientWidth - 10)
  }

  // Trouver le groupe le plus centré à l'écran actuellement
  const indexGroupeCourant = () => {
    const c = scrollRef.current
    if (!c) return 0
    const centreCourant = c.scrollLeft + c.clientWidth / 2
    let plusProche = 0, distMin = Infinity
    groupesRefsArr.current.forEach((el, i) => {
      if (!el) return
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centreCourant)
      if (dist < distMin) { distMin = dist; plusProche = i }
    })
    return plusProche
  }

  const scrollerVersGroupe = (idx) => {
    const c = scrollRef.current
    const el = groupesRefsArr.current[idx]
    if (!c || !el) return
    const centre = el.offsetLeft - (c.clientWidth / 2) + (el.offsetWidth / 2)
    c.scrollTo({ left: Math.max(0, centre), behavior: 'smooth' })
    setTimeout(mettreAJourFleches, 350)
  }

  const scrollerGauche = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  }
  const scrollerDroite = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
  }

  useEffect(() => {
    const charger = async () => {
      if (!userId) return
      // REQUÊTE ORIGINALE — celle qui marchait
      const espnIds = matchs.map(m => m.espn_id)
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, resultat, matchs(espn_id)')
        .eq('user_id', userId)
      const idx = {}
      data?.forEach(p => {
        if (p.matchs && espnIds.includes(p.matchs.espn_id))
          idx[p.matchs.espn_id] = { equipe: p.equipe_choisie, resultat: p.resultat }
      })
      setPronos(idx)
      const nbAttente = matchs.filter(m =>
        m.statut !== 'STATUS_FINAL' && m.statut !== 'STATUS_IN_PROGRESS' && !idx[m.espn_id]
      ).length
      if (onBadge) onBadge(nbAttente)
    }
    charger()
  }, [userId, matchs])

  useEffect(() => {
    if (!cibleScrollRef.current || !scrollRef.current) return
    const container = scrollRef.current
    const el = cibleScrollRef.current
    // Centrer le groupe cible dans le container (fix desktop)
    setTimeout(() => {
      const centre = el.offsetLeft - (container.clientWidth / 2) + (el.offsetWidth / 2)
      container.scrollLeft = Math.max(0, centre)
      mettreAJourFleches()
    }, 100)
  }, [matchs])

  if (!matchs.length) return null

  const matchsFiltres = equipeFiltre
    ? matchs.filter(m => m.domicile.trigramme === equipeFiltre || m.exterieur.trigramme === equipeFiltre)
    : matchs

  const groupes = grouperParJour(matchsFiltres)
  console.log('matchs tags:', matchsFiltres.map(m => ({ id: m.espn_id, tag: m.tag, headline: m.headline, date: m.date?.slice(0,10) })))
  const aujourdhui = new Date().toISOString().slice(0, 10)
  // Chercher le premier jour avec un match à venir (pas terminé, pas en cours)
  const jourAvecProno = groupes.find(([j, ms]) => 
    ms.some(m => m.statut !== 'STATUS_FINAL' && m.statut !== 'STATUS_IN_PROGRESS')
  )?.[0]
  const jourCible = jourAvecProno || groupes[groupes.length - 1]?.[0]

  if (!groupes.length) return (
    <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-3)' }}>
      Aucun match pour cette équipe sur la période.
    </div>
  )

  const styleFleche = (visible) => ({
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 100, width: 36, height: 36,
    background: '#f0ede8', border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 20, color: '#1a1a2e',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transition: 'opacity 0.2s',
    userSelect: 'none',
  })

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => { setHovered(true); mettreAJourFleches() }}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} } .fleche-bande { display: flex; } @media (max-width: 768px) { .fleche-bande { display: none !important; } }`}</style>

      {/* Flèche gauche */}
      <button className="fleche-bande" style={{ ...styleFleche(peutGauche), left: 6 }} onClick={scrollerGauche}>‹</button>

      <div
        ref={scrollRef}
        onScroll={mettreAJourFleches}
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingTop: 10, paddingBottom: 16, position: 'relative', zIndex: 0  }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', gap: 20, paddingLeft: 16, paddingRight: 16, width: 'max-content', alignItems: 'flex-start' }}>
          {groupes.map(([jour, matchsJour]) => (
            <GroupeJour
              key={jour}
              jour={jour}
              matchs={matchsJour}
              pronos={pronos}
              onProno={onProno}
              userId={userId}
              refEl={jour === jourCible ? cibleScrollRef : null}
            />
          ))}
        </div>
      </div>

      {/* Flèche droite */}
      <button className="fleche-bande" style={{ ...styleFleche(peutDroite), right: 6 }} onClick={scrollerDroite}>›</button>
    </div>
  )
}

export { FiltreEquipe }
export default BandeMatchs
