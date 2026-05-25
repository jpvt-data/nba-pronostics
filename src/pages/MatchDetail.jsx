import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { recupererDetailMatch } from '../services/espn'
import Navigation from '../components/Navigation'
import { ChevronLeft } from 'lucide-react'

const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL' || statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

const STATS_LABELS = [
  { key: 'pts', label: 'PPG' },
  { key: 'fg',  label: 'FG%' },
  { key: 'tp',  label: '3P%' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'blk', label: 'BLK' },
  { key: 'stl', label: 'STL' },
  { key: 'to',  label: 'TO'  },
]

function MatchDetail() {
  const { espn_id } = useParams()
  const navigate    = useNavigate()
  const [match, setMatch]  = useState(null)
  const [user, setUser]    = useState(null)
  const [prono, setProno]  = useState(null)
  const [resultat, setRes] = useState(null)
  const [charg, setCharg]  = useState(true)
  const [erreur, setErr]   = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const detail = await recupererDetailMatch(espn_id)
      if (!detail) { setErr(true); setCharg(false); return }
      setMatch(detail)
      const { data: tousLesPronos } = await supabase
        .from('pronos')
        .select('equipe_choisie, resultat, matchs(espn_id)')
        .eq('user_id', user.id)
      const found = tousLesPronos?.find(p => p.matchs?.espn_id === espn_id)
      if (found) { setProno(found.equipe_choisie); setRes(found.resultat) }
      setCharg(false)
    }
    init()
  }, [espn_id])

  const faireProno = async (equipe) => {
    if (!match || estVerrouille(match.date, match.statut)) return
    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id: match.espn_id, date_match: match.date,
        equipe_domicile: match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut: match.statut,
      }, { onConflict: 'espn_id' }).select().single()
    if (!matchDB) return
    await supabase.from('pronos').upsert({
      user_id: user.id, match_id: matchDB.id,
      equipe_choisie: equipe, resultat: 'en_attente',
    }, { onConflict: 'user_id,match_id' })
    setProno(equipe); setRes('en_attente')
  }

  if (charg) return (
    <><Navigation />
    <main style={{ flex:1, padding:'20px 16px' }}>
      <p style={{ color:'var(--text-3)', fontSize:13 }}>Chargement…</p>
    </main></>
  )

  if (erreur || !match) return (
    <><Navigation />
    <main style={{ flex:1, padding:'20px 16px' }}>
      <button onClick={() => navigate(-1)} style={S.retour}><ChevronLeft size={16} /> Board</button>
      <p style={{ color:'var(--danger)', fontSize:13, marginTop:20 }}>Impossible de charger ce match.</p>
    </main></>
  )

  const { domicile: dom, exterieur: ext } = match
  const verrou  = estVerrouille(match.date, match.statut)
  const termine = match.statut === 'STATUS_FINAL'
  const enCours = match.statut === 'STATUS_IN_PROGRESS'
  const dateStr  = new Date(match.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const heureStr = new Date(match.date).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
  const nbPeriodes = Math.max(dom.periodes?.length || 0, ext.periodes?.length || 0, 0)

  // Carte équipe cliquable ou statique selon contexte
  const CarteEquipe = ({ eq, align }) => {
    const selec    = prono === eq.trigramme
    const gagnant  = termine && eq.winner
    const perdant  = termine && !eq.winner && (dom.score != null || ext.score != null)
    const cliquable = !verrou

    return (
      <button
        onClick={() => cliquable && faireProno(eq.trigramme)}
        disabled={!cliquable}
        style={{
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          padding:'16px 8px',
          background: selec ? 'var(--accent-dim)' : 'transparent',
          borderWidth: selec ? 1 : 0, borderStyle:'solid',
          borderColor: selec ? 'var(--accent-border)' : 'transparent',
          borderRadius:'var(--radius-md)',
          cursor: cliquable ? 'pointer' : 'default',
          flex:1,
          opacity: perdant ? 0.45 : 1,
          transition:'all 0.15s',
        }}
      >
        {eq.logo
          ? <img src={eq.logo} alt={eq.trigramme} style={{ width:68, height:68, objectFit:'contain' }} />
          : <div style={{ width:68, height:68, borderRadius:'50%', background:'var(--bg-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--text-3)' }}>{eq.trigramme}</div>
        }
        <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:22,
          color: selec ? 'var(--accent)' : gagnant ? 'var(--text-1)' : 'var(--text-1)',
          letterSpacing:'0.04em',
        }}>{eq.trigramme}</span>
        <span style={{ fontSize:11, color:'var(--text-3)', textAlign:'center' }}>{eq.nom}</span>
        <span style={{ fontSize:10, color:'var(--text-3)' }}>{align === 'ext' ? 'Extérieur' : 'Domicile'}</span>

        {/* Indicateur prono / résultat */}
        {selec && !termine && (
          <span style={{ fontSize:11, color:'var(--accent)', fontWeight:600, marginTop:2 }}>✓ Mon prono</span>
        )}
        {selec && termine && (
          <span style={{
            fontSize:11, fontWeight:700, marginTop:2,
            color: resultat==='correct' ? 'var(--success)' : resultat==='incorrect' ? 'var(--danger)' : 'var(--text-3)',
          }}>
            {resultat==='correct' ? '✓ Correct' : resultat==='incorrect' ? '✗ Raté' : '⏳'}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <Navigation />
      <main style={{ flex:1, padding:'16px 16px 40px' }}>

        {/* Retour */}
        <button onClick={() => navigate(-1)} style={S.retour}>
          <ChevronLeft size={16} /> Board
        </button>

        {/* Badges */}
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {match.saison     && <span style={S.badge}>{match.saison}</span>}
          {match.typeSaison && <span style={{ ...S.badge, background:'var(--accent-dim)', color:'var(--accent)', borderColor:'var(--accent-border)' }}>{match.typeSaison}</span>}
          {enCours && <span style={{ ...S.badge, background:'rgba(34,197,94,0.1)', color:'var(--success)', borderColor:'rgba(34,197,94,0.3)' }}>● Live — Q{match.periode} {match.clock}</span>}
        </div>

        {/* Série */}
        {match.serie?.summary && (
          <div style={{ textAlign:'center', fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:12 }}>
            {match.serie.description && (
              <span style={{ color:'var(--text-3)', fontWeight:400, marginRight:6 }}>{match.serie.description} ·</span>
            )}
            {match.serie.summary}
          </div>
        )}

        {/* ── AFFICHE PRINCIPALE ── */}
        <div style={S.card}>

          {/* Hint prono si match pas commencé */}
          {!verrou && !prono && (
            <div style={{ textAlign:'center', fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
              Clique sur une équipe pour pronostiquer
            </div>
          )}
          {!verrou && prono && (
          <div style={{ textAlign:'center', fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
              Tu peux encore changer d'avis !
          </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:4 }}>
            <CarteEquipe eq={ext} align="ext" />

            {/* Centre : score ou VS + heure */}
            <div style={{ textAlign:'center', minWidth:72, padding:'0 4px' }}>
              {(termine || enCours) && ext.score != null
                ? <>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:36, color:'var(--text-1)', lineHeight:1, whiteSpace:'nowrap' }}>
                      {ext.score}–{dom.score}
                    </div>
                    <div style={{ fontSize:10, marginTop:4, fontWeight: enCours ? 600 : 400,
                      color: enCours ? 'var(--success)' : 'var(--text-3)' }}>
                      {enCours ? `Q${match.periode} ${match.clock}` : 'Final'}
                    </div>
                  </>
                : <>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--text-3)' }}>VS</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>{heureStr}</div>
                  </>
              }
            </div>

            <CarteEquipe eq={dom} align="dom" />
          </div>

          {/* Scores par période */}
          {nbPeriodes > 0 && (
            <div style={{ marginTop:16, borderTopWidth:1, borderTopStyle:'solid', borderTopColor:'var(--border)', paddingTop:12, overflowX:'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:`72px repeat(${nbPeriodes}, 1fr)`, gap:4, fontSize:11, textAlign:'center' }}>
                <div />
                {Array.from({ length: nbPeriodes }, (_, i) => (
                  <div key={i} style={{ color:'var(--text-3)' }}>{i < 4 ? `Q${i+1}` : `OT${i-3}`}</div>
                ))}
                {[ext, dom].map(eq => (
                  <>
                    <div key={eq.trigramme+'-l'} style={{ color:'var(--text-2)', fontWeight:600, textAlign:'left' }}>{eq.trigramme}</div>
                    {Array.from({ length: nbPeriodes }, (_, i) => (
                      <div key={i} style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, color:'var(--text-1)' }}>
                        {eq.periodes?.[i] ?? '–'}
                      </div>
                    ))}
                  </>
                ))}
              </div>
            </div>
          )}

          {/* Match en cours sans prono */}
          {enCours && !prono && (
            <div style={{ textAlign:'center', fontSize:12, color:'var(--text-3)', marginTop:12, paddingTop:12, borderTopWidth:1, borderTopStyle:'solid', borderTopColor:'var(--border)' }}>
              🔒 Match en cours — pronos fermés
            </div>
          )}
        </div>

        {/* Lieu + date */}
        <div style={{ fontSize:12, color:'var(--text-3)', textAlign:'center', margin:'10px 0 14px', lineHeight:1.7 }}>
          {dateStr} à {heureStr}
          {match.stade && <><br />{match.stade}{match.ville ? ` · ${match.ville}` : ''}</>}
        </div>

        {/* Forme L5 */}
        {(ext.l5?.length > 0 || dom.l5?.length > 0) && (
        <div style={S.card}>
            <h3 style={{ marginBottom:12 }}>Forme récente</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[ext, dom].map(eq => (
                <div key={eq.trigramme} style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:16 }}>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, minWidth:28 }}>{eq.trigramme}</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {eq.l5?.map((j, i) => (
                    <div key={i} style={{
                        width:26, height:26, borderRadius:4,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--font-display)', fontWeight:700, fontSize:13,
                        background: j.resultat==='W' ? 'var(--success-dim)' : 'var(--danger-dim)',
                        color: j.resultat==='W' ? 'var(--success)' : 'var(--danger)',
                        borderWidth:1, borderStyle:'solid',
                        borderColor: j.resultat==='W' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                    }}>{j.resultat}</div>
                    ))}
                </div>
                </div>
            ))}
            </div>
        </div>
        )}

        {/* Stats */}
        {(dom.stats?.fg || ext.stats?.fg) && (
          <div style={S.card}>
            <h3 style={{ marginBottom:12 }}>Stats (moyennes saison)</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {STATS_LABELS.map(({ key, label }) => {
                const vE = ext.stats?.[key]
                const vD = dom.stats?.[key]
                if (!vE && !vD) return null
                return (
                  <div key={key} style={{ display:'grid', gridTemplateColumns:'1fr 40px 1fr', alignItems:'center', gap:8 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--text-1)', textAlign:'right' }}>{vE ?? '–'}</div>
                    <div style={{ fontSize:10, color:'var(--text-3)', textAlign:'center', fontWeight:600 }}>{label}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--text-1)', textAlign:'left' }}>{vD ?? '–'}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 40px 1fr', marginTop:10 }}>
              <div style={{ fontSize:11, color:'var(--text-3)', textAlign:'right' }}>{ext.trigramme}</div>
              <div />
              <div style={{ fontSize:11, color:'var(--text-3)', textAlign:'left' }}>{dom.trigramme}</div>
            </div>
          </div>
        )}

        {/* Leaders */}
        {(dom.leaders?.length > 0 || ext.leaders?.length > 0) && (
        <div style={S.card}>
            <h3 style={{ marginBottom:12 }}>Leaders</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[ext, dom].map(eq => (
                <div key={eq.trigramme}>
                <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8, fontWeight:600 }}>{eq.trigramme} — {eq.nom}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, paddingLeft:16 }}>
                {eq.leaders?.map((l, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {l.photo && (
                        <img src={l.photo} alt={l.joueur||''} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', flexShrink:0, background:'var(--bg-2)' }} />
                        )}
                        <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.joueur}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>
                            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--accent)' }}>{l.valeur}</span>
                            {' '}{l.categorie}
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

        {/* Blessés */}
        {(dom.blessés?.length > 0 || ext.blessés?.length > 0) && (
          <div style={S.card}>
            <h3 style={{ marginBottom:12 }}>Blessés / Absents</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[ext, dom].map(eq => (
                <div key={eq.trigramme}>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8, fontWeight:600 }}>{eq.trigramme}</div>
                  {!eq.blessés?.length
                    ? <div style={{ fontSize:12, color:'var(--text-3)' }}>RAS</div>
                    : eq.blessés.map((b, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        {b.photo && <img src={b.photo} alt={b.joueur||''} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', background:'var(--bg-2)', flexShrink:0 }} />}
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-1)' }}>{b.joueur}</div>
                          <div style={{ fontSize:10, color:'var(--danger)' }}>{b.statut}{b.type ? ` · ${b.type}` : ''}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  )
}

const S = {
  retour: {
    display:'flex', alignItems:'center', gap:4,
    background:'none', borderWidth:0,
    color:'var(--text-3)', fontSize:13, cursor:'pointer',
    marginBottom:16, paddingLeft:0,
  },
  card: {
    background:'var(--bg-1)',
    borderWidth:1, borderStyle:'solid', borderColor:'var(--border)',
    borderRadius:'var(--radius-md)',
    padding:'16px', marginBottom:12,
  },
  badge: {
    fontSize:11, fontWeight:600,
    padding:'3px 8px', borderRadius:4,
    background:'var(--bg-2)', color:'var(--text-3)',
    borderWidth:1, borderStyle:'solid', borderColor:'var(--border)',
  },
}

export default MatchDetail