import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'
import { LabelSection, BanniereImage, Bloc } from '../components/UI'

const MEDAILLES = ['🥇', '🥈', '🥉']

const calcTaux = (s) => {
  if (!s) return null
  const total = s.corrects + s.incorrects
  return total > 0 ? Math.round(s.corrects / total * 100) : null
}

function semaineISO(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const semaine1 = new Date(d.getFullYear(), 0, 4)
  const num = 1 + Math.round(((d - semaine1) / 86400000 - 3 + ((semaine1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(num).padStart(2, '0')}`
}

function debutSemaineCourante() {
  const d = new Date()
  const jour = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - jour)
  d.setHours(0, 0, 0, 0)
  return d
}

function debutMoisCourant() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function debutAnneeNBA() {
  const d = new Date()
  const annee = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
  return new Date(`${annee}-09-01T00:00:00`)
}

function labelAnneeNBA() {
  const d = new Date()
  const a = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
  return `${String(a).slice(2)}-${String(a + 1).slice(2)}`
}

function plageSemanePrecedente() {
  const debutCourante = debutSemaineCourante()
  const fin   = new Date(debutCourante); fin.setSeconds(-1)
  const debut = new Date(debutCourante); debut.setDate(debut.getDate() - 7)
  return { debut, fin }
}

const Separateur = () => (
  <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', margin: '8px 0' }} />
)

const LigneUser = ({ m, i, statsUser, moi, navigate }) => {
  const estMoi = m.user_id === moi
  const t = calcTaux(statsUser)
  return (
    <div
      onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: estMoi ? 'rgba(99,102,241,0.08)' : 'var(--bg-2)',
        borderWidth: 1, borderStyle: 'solid',
        borderColor: estMoi ? 'rgba(99,102,241,0.3)' : 'var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer',
      }}
    >
      <span style={{
        fontSize: i < 3 ? 16 : 13, fontFamily: 'var(--font-display)', fontWeight: 700,
        color: i < 3 ? 'var(--gold)' : 'var(--text-3)', minWidth: 24, textAlign: 'center',
      }}>
        {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
      </span>
      <Avatar url={m.profils?.avatar_url || m.avatar_url} pseudo={m.profils?.pseudo || m.pseudo} taille={32} fontSize={11} />
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {m.profils?.pseudo || m.pseudo || 'Inconnu'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--gold)' : 'var(--text-2)' }}>
          {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
        </span>
        {statsUser && (statsUser.corrects + statsUser.incorrects) > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--success)' }}>{statsUser.corrects}✓</span>{' '}
            <span style={{ color: 'var(--danger)' }}>{statsUser.incorrects}✗</span>
            {t !== null && <span> · {t}%</span>}
          </span>
        )}
      </div>
    </div>
  )
}

function Classement() {
  const [searchParams]                 = useSearchParams()
  const ligueParam                     = searchParams.get('ligue')
  const [groupes, setGroupes]          = useState([])
  const [classements, setClassements]  = useState({})
  const [statsParLigue, setStatsLigue] = useState({})
  const [classementGeneralFiltre, setGeneralFiltre] = useState([])
  const [gagnantsSemPrev, setGagnants] = useState([])
  const [filtre, setFiltre]            = useState('semaine') // 'semaine' | 'mois' | 'annee'
  const [chargement, setCharg]         = useState(true)
  const [moi, setMoi]                  = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMoi(user.id)

      const maintenant = new Date()

      // Ligues de l'user
      const { data: mesGroupes } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom, date_debut, date_fin)')
        .eq('user_id', user.id).eq('actif', true)

      // Filtrer : si ligueParam → uniquement cette ligue, sinon ligues en cours
      const groupesFiltres = (mesGroupes || []).filter(mg => {
        if (ligueParam) return mg.groupes.id === ligueParam
        const g = mg.groupes
        const apresDebut = !g.date_debut || new Date(g.date_debut) <= maintenant
        const avantFin   = !g.date_fin   || new Date(g.date_fin)   >= maintenant
        return apresDebut && avantFin
      })
      setGroupes(groupesFiltres)

      const tousClassements = {}
      const tousIds         = new Set()
      const tousGroupeIds   = []

      for (const mg of groupesFiltres) {
        const { data } = await supabase
          .from('membres_groupe')
          .select('points, user_id, profils(pseudo, avatar_url)')
          .eq('groupe_id', mg.groupes.id).eq('actif', true)
          .order('points', { ascending: false })
        tousClassements[mg.groupes.id] = data || []
        data?.forEach(m => tousIds.add(m.user_id))
        tousGroupeIds.push(mg.groupes.id)
      }
      setClassements(tousClassements)

      if (tousIds.size === 0) { setCharg(false); return }

      // Stats par ligue
      const { data: pronos } = await supabase
        .from('pronos')
        .select('user_id, groupe_id, resultat')
        .in('user_id', [...tousIds])
        .in('groupe_id', tousGroupeIds)
        .neq('resultat', 'en_attente')

      const parLigue = {}
      tousGroupeIds.forEach(gid => { parLigue[gid] = {} })
      pronos?.forEach(p => {
        if (!parLigue[p.groupe_id]) return
        if (!parLigue[p.groupe_id][p.user_id]) parLigue[p.groupe_id][p.user_id] = { corrects: 0, incorrects: 0 }
        if (p.resultat === 'correct')   parLigue[p.groupe_id][p.user_id].corrects++
        if (p.resultat === 'incorrect') parLigue[p.groupe_id][p.user_id].incorrects++
      })
      setStatsLigue(parLigue)

      // Profils map
      const glob = {}
      tousIds.forEach(id => { glob[id] = { pseudo: null, avatar_url: null } })
      Object.values(tousClassements).forEach(liste => {
        liste.forEach(m => {
          if (glob[m.user_id]) {
            glob[m.user_id].pseudo     = m.profils?.pseudo
            glob[m.user_id].avatar_url = m.profils?.avatar_url
          }
        })
      })

      // Classement général filtré (recalculé selon filtre actif)
      await chargerGeneralFiltre(tousIds, tousGroupeIds, glob, filtre)

      // MVP semaine précédente
      await enregistrerGagnantSemanePrecedente(tousGroupeIds)
      const { data: gagnantsPrev } = await supabase
        .from('semaines_gagnees')
        .select('user_id, points, profils(pseudo, avatar_url)')
        .eq('semaine_iso', semaineISO(plageSemanePrecedente().debut))
      if (gagnantsPrev?.length > 0) {
        const maxPts = Math.max(...gagnantsPrev.map(g => g.points))
        setGagnants(gagnantsPrev.filter(g => g.points === maxPts))
      }

      setCharg(false)
    }
    init()
  }, [ligueParam])

  const chargerGeneralFiltre = async (tousIds, tousGroupeIds, glob, filtreActif) => {
    const debutMap = { semaine: debutSemaineCourante(), mois: debutMoisCourant(), annee: debutAnneeNBA() }
    const debut = debutMap[filtreActif]

    const { data: pronosFiltres } = await supabase
      .from('pronos')
      .select('user_id, match_id, resultat, points_gagnes')
      .in('user_id', [...tousIds])
      .in('groupe_id', [...tousGroupeIds])
      .neq('resultat', 'en_attente')
      .gte('cree_le', debut.toISOString())

    // Déduplication par (user_id, match_id)
    const seen = new Set()
    const dedup = []
    for (const p of pronosFiltres || []) {
      const cle = `${p.user_id}_${p.match_id}`
      if (seen.has(cle)) continue
      seen.add(cle)
      dedup.push(p)
    }

    const agg = {}
    tousIds.forEach(id => { agg[id] = { points: 0, corrects: 0, incorrects: 0 } })
    dedup.forEach(p => {
      if (!agg[p.user_id]) return
      if (p.resultat === 'correct')   { agg[p.user_id].points += (p.points_gagnes || 1); agg[p.user_id].corrects++ }
      if (p.resultat === 'incorrect') agg[p.user_id].incorrects++
    })

    setGeneralFiltre([...tousIds].map(id => ({
      user_id: id, pseudo: glob[id]?.pseudo, avatar_url: glob[id]?.avatar_url, ...agg[id],
    })).sort((a, b) => b.points - a.points))
  }

  const enregistrerGagnantSemanePrecedente = async (groupeIds) => {
    const { debut, fin } = plageSemanePrecedente()
    const iso = semaineISO(debut)
    const { data: pronosSemPrev } = await supabase
      .from('pronos')
      .select('user_id, match_id, groupe_id, resultat, points_gagnes')
      .in('groupe_id', groupeIds)
      .neq('resultat', 'en_attente')
      .gte('cree_le', debut.toISOString())
      .lte('cree_le', fin.toISOString())

    const seenPrev = new Set()
    const dedup = []
    for (const p of pronosSemPrev || []) {
      const cle = `${p.user_id}_${p.match_id}`
      if (seenPrev.has(cle)) continue
      seenPrev.add(cle)
      dedup.push(p)
    }

    for (const gid of groupeIds) {
      const { data: dejaEnr } = await supabase
        .from('semaines_gagnees').select('id')
        .eq('groupe_id', gid).eq('semaine_iso', iso).maybeSingle()
      if (dejaEnr) continue
      const pts = {}
      dedup.filter(p => p.groupe_id === gid).forEach(p => {
        if (!pts[p.user_id]) pts[p.user_id] = 0
        if (p.resultat === 'correct') pts[p.user_id] += (p.points_gagnes || 1)
      })
      if (!Object.keys(pts).length) continue
      const [gagnantId, maxPts] = Object.entries(pts).sort((a, b) => b[1] - a[1])[0]
      if (maxPts === 0) continue
      await supabase.from('semaines_gagnees').insert({ user_id: gagnantId, groupe_id: gid, semaine_iso: iso, points: maxPts })
    }
  }

  // Recharger le général quand filtre change
  const changerFiltre = async (f) => {
    setFiltre(f)
    // Reconstruire depuis les données déjà fetchées — on a besoin des IDs
    const tousIds = new Set()
    const tousGroupeIds = []
    Object.entries(classements).forEach(([gid, liste]) => {
      tousGroupeIds.push(gid)
      liste.forEach(m => tousIds.add(m.user_id))
    })
    const glob = {}
    tousIds.forEach(id => { glob[id] = { pseudo: null, avatar_url: null } })
    Object.values(classements).forEach(liste => {
      liste.forEach(m => { if (glob[m.user_id]) { glob[m.user_id].pseudo = m.profils?.pseudo; glob[m.user_id].avatar_url = m.profils?.avatar_url } })
    })
    await chargerGeneralFiltre(tousIds, tousGroupeIds, glob, f)
  }

  const labelFiltre = { semaine: 'Cette semaine', mois: 'Ce mois', annee: `Saison ${labelAnneeNBA()}` }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        <div style={{
          padding: '20px 16px',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}>
          <h2 style={{ margin: '0 0 8px' }}>
            {ligueParam ? (groupes[0]?.groupes?.nom || 'Classement') : 'Classement'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
            Ligues, semaine en cours, palmarès. Chaque prono correct rapporte{' '}
            <strong style={{ color: 'var(--accent)' }}>1 point</strong>.
          </p>
        </div>

        <div style={{ margin: '25px 0' }}>
          <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" />
        </div>

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>
        )}

        {!chargement && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 24px' }}>

            {/* ── Classements par ligue ── */}
            {groupes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, marginBottom: 32 }}>
                {groupes.map(mg => {
                  const gid   = mg.groupes.id
                  const liste = classements[gid] || []
                  const stats = statsParLigue[gid] || {}
                  return (
                    <Bloc key={gid}>
                      <LabelSection>{mg.groupes.nom}</LabelSection>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                        {liste.map((m, i) => (
                          <LigneUser key={m.user_id} m={m} i={i} statsUser={stats[m.user_id]} moi={moi} navigate={navigate} />
                        ))}
                        {liste.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun membre.</p>}
                      </div>
                    </Bloc>
                  )
                })}
              </div>
            )}

            {groupes.length > 0 && <Separateur />}

            {/* ── MVP Semaine précédente ── */}
            {gagnantsSemPrev.length > 0 && (
              <>
                <div style={{ marginTop: 28, marginBottom: 32 }}>
                  <Bloc>
                    <LabelSection>MVP Semaine précédente</LabelSection>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                      {gagnantsSemPrev.map((g) => (
                        <div
                          key={g.user_id}
                          onClick={() => navigate(`/mes-pronos?user_id=${g.user_id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px',
                            background: 'rgba(245,158,11,0.06)',
                            borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(245,158,11,0.25)',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: 22 }}>👑</span>
                          <Avatar url={g.profils?.avatar_url} pseudo={g.profils?.pseudo} taille={32} fontSize={11} />
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                            {g.profils?.pseudo || 'Inconnu'}
                            {gagnantsSemPrev.length > 1 && (
                              <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>ex-aequo</span>
                            )}
                          </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--gold)' }}>
                            {g.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </Bloc>
                </div>
                <Separateur />
              </>
            )}

            {/* ── Classement général avec toggle ── */}
            <div style={{ marginTop: 28 }}>
              <Bloc>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <LabelSection>Classement général</LabelSection>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['semaine', 'mois', 'annee'].map(f => (
                      <button key={f} onClick={() => changerFiltre(f)} style={{
                        padding: '4px 10px',
                        background: filtre === f ? 'var(--accent)' : 'var(--bg-2)',
                        borderWidth: 1, borderStyle: 'solid',
                        borderColor: filtre === f ? 'var(--accent)' : 'var(--border)',
                        borderRadius: 99, color: filtre === f ? '#fff' : 'var(--text-3)',
                        fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      }}>
                        {f === 'semaine' ? 'Semaine' : f === 'mois' ? 'Mois' : 'Saison'}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 12px' }}>
                  {labelFiltre[filtre]} — toutes ligues
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {classementGeneralFiltre.filter(m => m.points > 0).map((m, i) => {
                    const estMoi = m.user_id === moi
                    const t = calcTaux(m)
                    return (
                      <div
                        key={m.user_id}
                        onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: estMoi ? 'rgba(99,102,241,0.08)' : 'var(--bg-2)',
                          borderWidth: 1, borderStyle: 'solid',
                          borderColor: estMoi ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                          borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer',
                        }}
                      >
                        <span style={{
                          fontSize: i < 3 ? 16 : 13, fontFamily: 'var(--font-display)', fontWeight: 700,
                          color: i < 3 ? 'var(--gold)' : 'var(--text-3)', minWidth: 24, textAlign: 'center',
                        }}>
                          {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
                        </span>
                        <Avatar url={m.avatar_url} pseudo={m.pseudo} taille={32} fontSize={11} />
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.pseudo || 'Inconnu'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--gold)' : 'var(--text-2)' }}>
                            {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                          </span>
                          {(m.corrects + m.incorrects) > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                              <span style={{ color: 'var(--success)' }}>{m.corrects}✓</span>{' '}
                              <span style={{ color: 'var(--danger)' }}>{m.incorrects}✗</span>
                              {t !== null && <span> · {t}%</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {classementGeneralFiltre.filter(m => m.points > 0).length === 0 && (
                    <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun point sur cette période.</p>
                  )}
                </div>
              </Bloc>
            </div>

            {groupes.length === 0 && !ligueParam && (
              <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
                Aucune ligue en cours. Rejoins une ligue depuis le menu Ligues.
              </p>
            )}

          </div>
        )}

      </main>
    </>
  )
}

export default Classement