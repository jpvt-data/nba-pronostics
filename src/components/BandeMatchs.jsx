import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNoSpoil } from '../context/NoSpoilContext'

const formaterJourCourt = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const formaterHeure = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const estAujourdhui = (dateStr) => {
  const d = new Date(dateStr)
  const auj = new Date()
  return d.getDate() === auj.getDate() && d.getMonth() === auj.getMonth() && d.getFullYear() === auj.getFullYear()
}

const estPasse = (dateStr) => new Date(dateStr) < new Date()

// Couleur hex valide et pas trop sombre
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

// Groupe les matchs par jour
const grouperParJour = (matchs) => {
  const groupes = {}
  matchs.forEach(m => {
    const jour = new Date(m.date).toISOString().slice(0, 10)
    if (!groupes[jour]) groupes[jour] = []
    groupes[jour].push(m)
  })
  return Object.entries(groupes).sort(([a], [b]) => a.localeCompare(b))
}

function CarteMatch({ match, prono, onProno, userId }) {
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()
  const [pronoLocal, setPronoLocal] = useState(prono || null)
  const [loading, setLoading] = useState(false)

  const termine  = match.statut === 'STATUS_FINAL'
  const enCours  = match.statut === 'STATUS_IN_PROGRESS'
  const aVenir   = !termine && !enCours
  const dom      = match.domicile
  const ext      = match.exterieur

  const c1 = getCouleur(dom)
  const c2 = getCouleur(ext)

  const handleProno = async (e, equipe) => {
    e.stopPropagation()
    if (!userId || loading) return
    setLoading(true)
    await onProno(match, equipe)
    setPronoLocal(equipe)
    setLoading(false)
  }

  // Résultat du prono
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
    <div
      onClick={() => navigate(`/match/${match.espn_id}`)}
      style={{
        position: 'relative',
        width: '82vw',
        maxWidth: 340,
        minWidth: 280,
        height: 190,
        flexShrink: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: noSpoil && termine ? 0.6 : 1,
      }}
    >
      {/* Fond gradient couleurs équipes */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(105deg, ${c1}55 0%, #0d0d12 45%, #0d0d12 55%, ${c2}55 100%)`,
      }} />
      {/* Logos en fond watermark */}
      <img src={dom.logo} alt="" style={{
        position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
        width: 110, height: 110, objectFit: 'contain', opacity: 0.1, pointerEvents: 'none',
        filter: 'saturate(0) brightness(2)',
      }} />
      <img src={ext.logo} alt="" style={{
        position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
        width: 110, height: 110, objectFit: 'contain', opacity: 0.1, pointerEvents: 'none',
        filter: 'saturate(0) brightness(2)',
      }} />
      {/* Overlay sombre bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(0deg, rgba(6,6,8,0.92) 0%, transparent 100%)',
      }} />
      {/* Bord top gradient équipes */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c1}, ${c2})`,
      }} />

      {/* Contenu */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Top — équipes + logos nets */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 14px 0' }}>
          {/* DOM */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <img src={dom.logo} style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }} alt="" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>{dom.trigramme}</span>
          </div>

          {/* Centre */}
          <div style={{ textAlign: 'center', paddingTop: 4, flex: 1 }}>
            {(termine || enCours) && !noSpoil ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                    {dom.score}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>-</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                    {ext.score}
                  </span>
                </div>
                {enCours && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'blink 1.2s infinite', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em' }}>LIVE</span>
                  </div>
                )}
              </>
            ) : noSpoil && termine ? (
              <span style={{ fontSize: 22 }}>🙈</span>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{formaterHeure(match.date)}</div>
                {match.canal && <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginTop: 2 }}>{match.canal}</div>}
              </>
            )}
          </div>

          {/* EXT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <img src={ext.logo} style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }} alt="" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>{ext.trigramme}</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Bas — date/lieu + prono */}
        <div style={{ padding: '0 12px 10px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.05em' }}>
            {match.ville || match.stade || ''}
          </div>

          {/* Boutons prono ou résultat */}
          {aVenir && (
            <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
              {[{ eq: dom, c: c1 }, { eq: ext, c: c2 }].map(({ eq, c }) => {
                const selectionne = pronoLocal === eq.trigramme
                return (
                  <button key={eq.trigramme} onClick={(e) => handleProno(e, eq.trigramme)} style={{
                    flex: 1, padding: '7px 0',
                    background: selectionne ? c : `rgba(255,255,255,0.06)`,
                    border: `1.5px solid ${selectionne ? c : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 3,
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: selectionne ? '#fff' : 'rgba(255,255,255,0.7)',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    boxShadow: selectionne ? `0 0 10px ${c}60` : 'none',
                    transition: 'all 0.15s',
                  }}>{eq.trigramme}</button>
                )
              })}
            </div>
          )}

          {/* Prono posé sur match terminé ou en cours */}
          {pronoLocal && !aVenir && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 8px',
              background: resultatProno === 'correct' ? 'rgba(34,197,94,0.15)' : resultatProno === 'incorrect' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${resultatProno === 'correct' ? '#22c55e' : resultatProno === 'incorrect' ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            }}>
              <span style={{ fontSize: 12 }}>
                {resultatProno === 'correct' ? '✅' : resultatProno === 'incorrect' ? '❌' : '🎯'}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                {pronoLocal}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LabelJour({ dateStr }) {
  const auj = estAujourdhui(dateStr + 'T12:00:00')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      paddingLeft: 16, marginBottom: 8, marginTop: 4,
      flexShrink: 0,
    }}>
      {auj && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', display: 'inline-block' }} />}
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        color: auj ? 'var(--accent)' : 'var(--text-3)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        {auj ? 'AUJOURD\'HUI' : new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
      </span>
    </div>
  )
}

function BandeMatchs({ matchs, userId, onProno, onBadge }) {
  const [pronos, setPronos] = useState({})
  const scrollRef = useRef(null)
  const aujourdhuiRef = useRef(null)

  useEffect(() => {
    const charger = async () => {
      if (!userId || !matchs.length) return
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, resultat, matchs(espn_id)')
        .eq('user_id', userId)
      const idx = {}
      data?.forEach(p => { if (p.matchs) idx[p.matchs.espn_id] = { equipe: p.equipe_choisie, resultat: p.resultat } })
      setPronos(idx)
      const nbAttente = matchs.filter(m =>
        m.statut !== 'STATUS_FINAL' && m.statut !== 'STATUS_IN_PROGRESS' && !idx[m.espn_id]
      ).length
      if (onBadge) onBadge(nbAttente)
    }
    charger()
  }, [userId, matchs])

  // Auto-scroll sur aujourd'hui
  useEffect(() => {
    if (aujourdhuiRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = aujourdhuiRef.current
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
      container.scrollLeft = Math.max(0, offset)
    }
  }, [matchs])

  if (!matchs.length) return null

  const groupes = grouperParJour(matchs)

  return (
    <div
      ref={scrollRef}
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        paddingTop: 8, paddingBottom: 16,
      }}
    >
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', width: 'max-content' }}>
        {groupes.map(([jour, matchsJour]) => {
          const estAujd = matchsJour.some(m => estAujourdhui(m.date))
          return (
            <div key={jour} ref={estAujd ? aujourdhuiRef : null} style={{ marginBottom: 16 }}>
              <LabelJour dateStr={jour} />
              <div style={{ display: 'flex', gap: 10, paddingLeft: 16, paddingRight: 16 }}>
                {matchsJour.map(match => (
                  <CarteMatch
                    key={match.espn_id}
                    match={match}
                    prono={pronos[match.espn_id]?.equipe || null}
                    onProno={onProno}
                    userId={userId}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BandeMatchs
