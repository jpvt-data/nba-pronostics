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

  const termine = match.statut === 'STATUS_FINAL'
  const enCours = match.statut === 'STATUS_IN_PROGRESS'
  const aVenir  = !termine && !enCours

  // Convention NBA : EXT à gauche, DOM à droite
  const ext = match.exterieur
  const dom = match.domicile
  const c1  = getCouleur(ext) // gauche = ext
  const c2  = getCouleur(dom) // droite = dom

  const handleProno = async (e, equipe) => {
    e.stopPropagation()
    if (!userId || loading) return
    setLoading(true)
    await onProno(match, equipe)
    setPronoLocal(equipe)
    setLoading(false)
  }

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
        width: '80vw',
        maxWidth: 320,
        minWidth: 260,
        height: 200,
        flexShrink: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: noSpoil && termine ? 0.6 : 1,
      }}
    >
      {/* Fond gradient : ext gauche, dom droite */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(105deg, ${c1}55 0%, #0d0d12 42%, #0d0d12 58%, ${c2}55 100%)`,
      }} />

      {/* Logo EXT — watermark fond gauche, déborde largement */}
      <img src={ext.logo} alt="" style={{
        position: 'absolute', left: -30, top: '50%', transform: 'translateY(-50%)',
        width: 200, height: 200, objectFit: 'contain',
        opacity: 0.13, pointerEvents: 'none',
        filter: 'saturate(0.4) brightness(1.4)',
      }} />
      {/* Logo DOM — watermark fond droite, déborde largement */}
      <img src={dom.logo} alt="" style={{
        position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)',
        width: 200, height: 200, objectFit: 'contain',
        opacity: 0.13, pointerEvents: 'none',
        filter: 'saturate(0.4) brightness(1.4)',
      }} />

      {/* Overlay sombre bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(0deg, rgba(6,6,8,0.95) 0%, transparent 100%)',
      }} />
      {/* Bord top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c1}, ${c2})`,
      }} />

      {/* Contenu */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Haut — logos nets + trigrammes */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 8px 0' }}>
          {/* EXT gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <img src={ext.logo} style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))', marginTop: -8, marginLeft: -4 }} alt="" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>{ext.trigramme}</span>
          </div>

          {/* Centre — score ou heure */}
          <div style={{ textAlign: 'center', flex: 1, paddingTop: 6 }}>
            {(termine || enCours) && !noSpoil ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {ext.score}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}>–</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {dom.score}
                  </span>
                </div>
                {enCours && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'blink 1.2s infinite', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#22c55e', fontWeight: 700, letterSpacing: '0.12em' }}>LIVE</span>
                  </div>
                )}
              </>
            ) : noSpoil && termine ? (
              <span style={{ fontSize: 24 }}>🙈</span>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{formaterHeure(match.date)}</div>
                {match.canal && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginTop: 2 }}>{match.canal}</div>}
              </>
            )}
          </div>

          {/* DOM droite */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <img src={dom.logo} style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))', marginTop: -8, marginRight: -4 }} alt="" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>{dom.trigramme}</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Bas — stade + prono */}
        <div style={{ padding: '0 10px 10px' }}>
          {match.stade && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', marginBottom: 5, letterSpacing: '0.06em', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.stade}
            </div>
          )}

          {/* Boutons prono */}
          {aVenir && (
            <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
              {[{ eq: ext, c: c1 }, { eq: dom, c: c2 }].map(({ eq, c }) => {
                const sel = pronoLocal === eq.trigramme
                return (
                  <button key={eq.trigramme} onClick={(e) => handleProno(e, eq.trigramme)} style={{
                    flex: 1, padding: '6px 0',
                    background: sel ? c : 'rgba(255,255,255,0.07)',
                    border: `1.5px solid ${sel ? c : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 2,
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: sel ? '#fff' : 'rgba(255,255,255,0.65)',
                    letterSpacing: '0.08em', cursor: 'pointer',
                    boxShadow: sel ? `0 0 10px ${c}60` : 'none',
                    transition: 'all 0.15s',
                  }}>{eq.trigramme}</button>
                )
              })}
            </div>
          )}

          {/* Prono posé sur match non à venir */}
          {pronoLocal && !aVenir && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 8px',
              background: resultatProno === 'correct' ? 'rgba(34,197,94,0.15)' : resultatProno === 'incorrect' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
              borderLeft: `3px solid ${resultatProno === 'correct' ? '#22c55e' : resultatProno === 'incorrect' ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            }}>
              <span style={{ fontSize: 11 }}>
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

function GroupeJour({ jour, matchs, pronos, onProno, userId, refEl }) {
  const aujd = estAujourdhui(jour)
  return (
    <div ref={refEl} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Label jour */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        paddingLeft: 4, marginBottom: 8,
      }}>
        {aujd && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', flexShrink: 0, display: 'inline-block' }} />}
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
          color: aujd ? 'var(--accent)' : 'var(--text-3)',
          letterSpacing: '0.16em',
        }}>
          {aujd ? "AUJOURD'HUI" : formaterJourLong(jour)}
        </span>
      </div>
      {/* Matchs du jour en ligne */}
      <div style={{ display: 'flex', gap: 8 }}>
        {matchs.map(match => (
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
}

function BandeMatchs({ matchs, userId, onProno, onBadge }) {
  const [pronos, setPronos] = useState({})
  const scrollRef     = useRef(null)
  const cibleScrollRef = useRef(null)

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

  // Auto-scroll sur aujourd'hui ou dernier match passé
  useEffect(() => {
    if (!cibleScrollRef.current || !scrollRef.current) return
    const container = scrollRef.current
    const el = cibleScrollRef.current
    setTimeout(() => {
      container.scrollLeft = Math.max(0, el.offsetLeft - 16)
    }, 100)
  }, [matchs])

  if (!matchs.length) return null

  const groupes = grouperParJour(matchs)
  const aujourdhui = new Date().toISOString().slice(0, 10)

  // Trouver le groupe cible : aujourd'hui ou le plus récent avant aujourd'hui
  let jourCible = groupes.find(([j]) => j === aujourdhui)?.[0]
  if (!jourCible) {
    const passes = groupes.filter(([j]) => j < aujourdhui)
    jourCible = passes.length ? passes[passes.length - 1][0] : groupes[0][0]
  }

  return (
    <div
      ref={scrollRef}
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        paddingTop: 10,
        paddingBottom: 16,
      }}
    >
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      {/* Scroll horizontal — groupes par jour côte à côte */}
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
  )
}

export default BandeMatchs
