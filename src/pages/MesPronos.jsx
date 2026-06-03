import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'

const formaterDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function calculerStreaks(terminesTries) {
  let courant = 0, dernierResultat = null, max = 0
  for (const p of terminesTries) {
    if (dernierResultat === null) { dernierResultat = p.resultat; courant = 1 }
    else if (p.resultat === dernierResultat) { courant++ }
    else { if (dernierResultat === 'correct') max = Math.max(max, courant); courant = 1; dernierResultat = p.resultat }
  }
  if (dernierResultat === 'correct') max = Math.max(max, courant)
  let streak = 0
  for (const p of terminesTries) { if (p.resultat === 'correct') streak++; else break }
  return { actuel: streak, max }
}

function calculerEquipes(termines) {
  const map = {}
  termines.forEach(p => {
    const eq = p.equipe_choisie
    if (!eq) return
    if (!map[eq]) map[eq] = { corrects: 0, total: 0 }
    map[eq].total++
    if (p.resultat === 'correct') map[eq].corrects++
  })
  const liste = Object.entries(map)
    .filter(([, v]) => v.total >= 3)
    .map(([nom, v]) => ({ nom, taux: Math.round(v.corrects / v.total * 100), ...v }))
    .sort((a, b) => b.taux - a.taux)
  return { meilleure: liste[0] || null, pire: liste[liste.length - 1] || null }
}

// Titre bicolore — mot1 blanc, mot2 couleur accent
// Pour mots composés : mot1="FORME " mot2="RÉCENTE" (espace dans mot1)
// Pour mots simples : mot1="SÉRIES" mot2="" ou couleur identique
const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)', taille = 24 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

function MesPronos() {
  const [pronos, setPronos]        = useState([])
  const [stats, setStats]          = useState({ total: 0, corrects: 0, incorrects: 0 })
  const [statsLigues, setStatsLig] = useState([])
  const [profil, setProfil]        = useState(null)
  const [formeRecente, setForme]   = useState([])
  const [streaks, setStreaks]       = useState({ actuel: 0, max: 0 })
  const [equipes, setEquipes]       = useState({ meilleure: null, pire: null })
  const [charg, setCharg]          = useState(true)
  const [estMoi, setEstMoi]        = useState(true)
  const navigate                   = useNavigate()
  const location                   = useLocation()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const params   = new URLSearchParams(location.search)
      const cibleId  = params.get('user_id') || user.id
      const vuParMoi = cibleId === user.id
      setEstMoi(vuParMoi)

      const { data: p } = await supabase
        .from('profils').select('pseudo, avatar_url, description').eq('id', cibleId).single()
      setProfil(p)

      let query = supabase
        .from('pronos')
        .select('equipe_choisie, resultat, points_gagnes, cree_le, groupe_id, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur, statut)')
        .eq('user_id', cibleId)
        .order('cree_le', { ascending: false })
      if (!vuParMoi) query = query.neq('resultat', 'en_attente')
      const { data } = await query
      setPronos(data || [])

      const termines   = data?.filter(p => p.resultat !== 'en_attente') || []
      const corrects   = termines.filter(p => p.resultat === 'correct').length
      const incorrects = termines.filter(p => p.resultat === 'incorrect').length
      setStats({ total: termines.length, corrects, incorrects })

      const terminesTries = [...termines].sort((a, b) => new Date(b.matchs?.date_match) - new Date(a.matchs?.date_match))
      setForme(terminesTries.slice(0, 10))
      setStreaks(calculerStreaks(terminesTries))
      setEquipes(calculerEquipes(termines))

      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('points, groupe_id, groupes(id, nom)')
        .eq('user_id', cibleId).eq('actif', true)

      if (membres?.length > 0) {
        const groupeIds = membres.map(m => m.groupes.id)
        const { data: pronosLigues } = await supabase
          .from('pronos')
          .select('groupe_id, resultat')
          .eq('user_id', cibleId)
          .in('groupe_id', groupeIds)
          .neq('resultat', 'en_attente')
        const ligueStats = {}
        membres.forEach(m => { ligueStats[m.groupes.id] = { nom: m.groupes.nom, points: m.points, corrects: 0, incorrects: 0 } })
        pronosLigues?.forEach(p => {
          if (!ligueStats[p.groupe_id]) return
          if (p.resultat === 'correct')   ligueStats[p.groupe_id].corrects++
          if (p.resultat === 'incorrect') ligueStats[p.groupe_id].incorrects++
        })
        setStatsLig(Object.values(ligueStats).sort((a, b) => b.points - a.points))
      }

      setCharg(false)
    }
    init()
  }, [location.search])

  const taux = (c, i) => (c + i) > 0 ? Math.round(c / (c + i) * 100) : 0

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header profil — sombre + barre accent ── */}
        <div style={{ background: 'var(--bg-1)', padding: '20px 16px', position: 'relative', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={56} fontSize={18} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Pseudo tout en blanc — pas de découpe aléatoire */}
              <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 32, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>
                {profil?.pseudo || '—'}
              </div>
              {!estMoi && (
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
                  Profil public · pronos en attente masqués
                </div>
              )}
              {profil?.description && (
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>{profil.description}</p>
              )}
              {!estMoi && (
                <button
                  onClick={() => navigate(`/h2h?user2=${new URLSearchParams(location.search).get('user_id')}`)}
                  style={{
                    marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px',
                    background: 'var(--accent)',
                    borderWidth: 0, borderRadius: 0,
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ⚔️ 1v1 — me comparer à {profil?.pseudo}
                </button>
              )}
            </div>
          </div>
        </div>

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}
        
        {!charg && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 32 }}>
            <div style={{ height: 25 }} />
            {/* ── Stats globales — bg-0 + barre accent ── */}
            <div style={{ background: 'var(--bg-0)', padding: '16px 16px 20px', borderLeft: '3px solid var(--accent)' }}>
              <TitreSection mot1="STATS" mot2="GLOBALES" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Total',    val: stats.total,      color: 'var(--text-1)'  },
                  { label: 'Corrects', val: stats.corrects,   color: 'var(--success)' },
                  { label: 'Ratés',    val: stats.incorrects, color: 'var(--danger)'  },
                  { label: 'Réussite', val: `${taux(stats.corrects, stats.incorrects)}%`, color: 'var(--accent)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 25 }} />
            {/* ── Séries — bg-1 + barre gold ── */}
            {stats.total > 0 && (
              <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--gold)' }}>
                <TitreSection mot1="SÉRIES" couleur2="var(--gold)" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{
                    padding: '12px 14px',
                    background: streaks.actuel > 0 ? 'rgba(245,158,11,0.08)' : 'var(--bg-2)',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: streaks.actuel > 0 ? 'rgba(245,158,11,0.25)' : 'var(--border)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.05em' }}>SÉRIE EN COURS</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {streaks.actuel > 0 && <span style={{ fontSize: 18 }}>🔥</span>}
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: streaks.actuel > 0 ? 'var(--gold)' : 'var(--text-3)', lineHeight: 1 }}>
                        {streaks.actuel}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>corrects</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 14px', background: 'var(--bg-2)',
                    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.05em' }}>MEILLEURE SÉRIE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>
                        {streaks.max}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>corrects</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ height: 25 }} />
            {/* ── Forme récente — bg-0 ── */}
            {formeRecente.length > 0 && (
              <div style={{ background: 'var(--bg-0)', padding: '16px 16px 20px' }}>
                <TitreSection mot1="FORME" mot2="RÉCENTE" couleur2="var(--accent)" />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {formeRecente.slice().reverse().map((p, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{
                        width: 40, height: 40,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: p.resultat === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        borderWidth: 1, borderStyle: 'solid',
                        borderColor: p.resultat === 'correct' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
                        fontSize: 13, fontWeight: 700,
                        color: p.resultat === 'correct' ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {p.resultat === 'correct' ? 'W' : 'L'}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'center', maxWidth: 40, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.equipe_choisie}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ height: 25 }} />
            {/* ── Équipes + Stats ligues — bg-1 + barre orange ── */}
            {((equipes.meilleure || equipes.pire) || statsLigues.length > 0) && (
              <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--orange)' }}>

                {(equipes.meilleure || equipes.pire) && equipes.meilleure !== equipes.pire && (
                  <>
                    <TitreSection mot1="ÉQUIPES" couleur2="var(--orange)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: statsLigues.length > 0 ? 20 : 0 }}>
                      {equipes.meilleure && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(34,197,94,0.06)',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(34,197,94,0.2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>✅</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{equipes.meilleure.nom}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{equipes.meilleure.corrects}/{equipes.meilleure.total} pronos</div>
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--success)' }}>
                            {equipes.meilleure.taux}%
                          </span>
                        </div>
                      )}
                      {equipes.pire && equipes.pire.nom !== equipes.meilleure?.nom && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(239,68,68,0.06)',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>❌</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{equipes.pire.nom}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{equipes.pire.corrects}/{equipes.pire.total} pronos</div>
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--danger)' }}>
                            {equipes.pire.taux}%
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {statsLigues.length > 0 && (
                  <>
                    <TitreSection mot1="STATS" mot2="LIGUES" couleur2="var(--orange)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {statsLigues.map((l, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {l.nom}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                              <span style={{ color: 'var(--success)' }}>{l.corrects}✓</span>{' '}
                              <span style={{ color: 'var(--danger)' }}>{l.incorrects}✗</span>
                              {(l.corrects + l.incorrects) > 0 && <span> · {taux(l.corrects, l.incorrects)}%</span>}
                            </span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>
                              {l.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div style={{ height: 25 }} />
            {/* ── Historique — bg-0 + barre colorée par résultat ── */}
            <div style={{ background: 'var(--bg-0)', padding: '16px 16px 20px', borderLeft: '3px solid var(--border-2)' }}>
              <TitreSection mot1="HISTORIQUE" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pronos.map((p, i) => {
                  const m = p.matchs
                  const cliquable = estMoi && !!m?.espn_id
                  const couleur = p.resultat === 'correct'
                    ? { barre: 'var(--success)', txt: 'var(--success)' }
                    : p.resultat === 'incorrect'
                    ? { barre: 'var(--danger)', txt: 'var(--danger)' }
                    : { barre: 'var(--border)', txt: 'var(--text-3)' }
                  return (
                    <div
                      key={i}
                      onClick={() => cliquable && navigate(`/match/${m.espn_id}`)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px',
                        borderLeft: `3px solid ${couleur.barre}`,
                        borderBottom: '1px solid var(--border)',
                        marginLeft: -16,
                        cursor: cliquable ? 'pointer' : 'default',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                          {m?.equipe_exterieur} @ {m?.equipe_domicile}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          {m ? formaterDate(m.date_match) : ''} · → {p.equipe_choisie}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: couleur.txt }}>
                          {p.resultat === 'correct'    && `+${p.points_gagnes} pt`}
                          {p.resultat === 'incorrect'  && 'Raté'}
                          {p.resultat === 'en_attente' && 'En attente'}
                        </span>
                        {cliquable && <span style={{ fontSize: 14, color: 'var(--text-3)' }}>›</span>}
                      </div>
                    </div>
                  )
                })}
                {pronos.length === 0 && (
                  <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '8px 0' }}>Aucun prono terminé pour l'instant.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </>
  )
}

export default MesPronos