import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { verifierJalons } from '../services/xp'
import { track } from '../services/tracker'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'

const MEDAILLES_STYLE = [
  { label: '#1', color: '#f59e0b' },
  { label: '#2', color: '#9ca3af' },
  { label: '#3', color: '#b45309' },
]

const calcTaux = (s) => {
  if (!s) return null
  const total = (s.corrects || 0) + (s.incorrects || 0)
  return total > 0 ? Math.round((s.corrects || 0) / total * 100) : null
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

// Titre section — bandeau oblique identique Accueil
const TitreSection = ({ label, couleur = 'var(--accent)' }) => (
  <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 500 46">
      <polygon points="0,0 260,0 240,46 0,46" fill={couleur} />
      <polygon points="248,0 274,0 254,46 228,46" fill={couleur} />
      <polygon points="282,0 304,0 284,46 262,46" fill={couleur} />
      <polygon points="312,0 330,0 310,46 292,46" fill={couleur} />
      <polygon points="338,0 353,0 333,46 318,46" fill={couleur} />
      <polygon points="361,0 374,0 354,46 341,46" fill={couleur} />
      <polygon points="382,0 393,0 373,46 362,46" fill={couleur} />
      <polygon points="401,0 410,0 390,46 381,46" fill={couleur} />
      <polygon points="418,0 426,0 406,46 398,46" fill={couleur} />
    </svg>
    <span style={{
      position: 'absolute', top: '50%', left: 16, transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
  </div>
)

// Sous-titre de section — sobre, petit, discret
const SousTitre = ({ label, couleur = 'var(--text-3)' }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: couleur, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, padding: '0 16px' }}>
    {label}
  </div>
)

const LigneUser = ({ m, i, statsUser, moi, navigate }) => {
  const estMoi = m.user_id === moi
  const t = calcTaux(statsUser)
  return (
    <div
      onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: estMoi ? 'rgba(99,102,241,0.08)' : 'transparent',
        borderLeft: estMoi ? '3px solid var(--accent)' : '3px solid transparent',
        padding: '10px 12px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{
        fontSize: i < 3 ? 16 : 12,
        fontFamily: 'var(--font-display)', fontWeight: 700,
        color: i < 3 ? 'var(--gold)' : 'var(--text-3)',
        minWidth: 24, textAlign: 'center',
      }}>
        {i < 3 ? MEDAILLES_STYLE[i].label : `#${i + 1}`}
      </span>
      <Avatar url={m.profils?.avatar_url || m.avatar_url} pseudo={m.profils?.pseudo || m.pseudo} taille={32} fontSize={11} />
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {m.profils?.pseudo || m.pseudo || 'Inconnu'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--gold)' : 'var(--text-2)' }}>
          {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
        </span>
        {statsUser && ((statsUser.corrects || 0) + (statsUser.incorrects || 0)) > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--success)' }}>{statsUser.corrects} ✓</span>{' '}
            <span style={{ color: 'var(--danger)' }}>{statsUser.incorrects} ✗</span>
            {t !== null && <span> · {t}%</span>}
          </span>
        )}
      </div>
    </div>
  )
}

function Classement() {
  const navigate = useNavigate()
  const [moi, setMoi]                               = useState(null)
  const [chargement, setCharg]                      = useState(true)

  // Stats globales (filtre période)
  const [filtre, setFiltre]                         = useState('annee')
  const [classementGeneralFiltre, setGeneralFiltre] = useState([])
  const [gagnantsSemPrev, setGagnants]              = useState([])
  const [tousIds, setTousIds]                       = useState(new Set())
  const [tousGroupeIds, setTousGroupeIds]           = useState([])
  const [globMap, setGlobMap]                       = useState({})

  // Classement ligue avec dropdown
  const [toutesLigues, setToutesLigues]             = useState([]) // toutes ligues de l'user
  const [ligueSelectId, setLigueSelectId]           = useState(null)
  const [classementLigue, setClassementLigue]       = useState([])
  const [statsLigue, setStatsLigue]                 = useState({})
  const [chargLigue, setChargLigue]                 = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMoi(user.id)
      track(user.id, 'page_view', '/classement')

      // Toutes les ligues de l'user (actives + passées)
      const { data: mesGroupes } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom, date_debut, date_fin, tag)')
        .eq('user_id', user.id).eq('actif', true)
        .neq('groupe_id', 'aaaaaaaa-0000-0000-0000-000000000001')

      const ligues = (mesGroupes || [])
        .filter(mg => mg.groupes)
        .map(mg => mg.groupes)
        .sort((a, b) => {
          // Actives en premier, puis par date_fin décroissante
          const now = new Date()
          const aActive = !a.date_fin || new Date(a.date_fin) >= now
          const bActive = !b.date_fin || new Date(b.date_fin) >= now
          if (aActive && !bActive) return -1
          if (!aActive && bActive) return 1
          const af = a.date_fin ? new Date(a.date_fin) : new Date()
          const bf = b.date_fin ? new Date(b.date_fin) : new Date()
          return bf - af
        })
      setToutesLigues(ligues)

      // Ligue par défaut : active si existe, sinon dernière clôturée
      const now = new Date()
      const active = ligues.find(g => !g.date_fin || new Date(g.date_fin) >= now)
      const defaut = active || ligues[0] || null
      if (defaut) {
        setLigueSelectId(defaut.id)
        await chargerClassementLigue(defaut.id)
      }

      // Stats globales — tous les groupes confondus
      const ids = new Set()
      const groupeIds = []
      const glob = {}
      for (const mg of (mesGroupes || [])) {
        if (!mg.groupes) continue
        groupeIds.push(mg.groupes.id)
        const { data: membres } = await supabase
          .from('membres_groupe')
          .select('user_id, profils(pseudo, avatar_url)')
          .eq('groupe_id', mg.groupes.id).eq('actif', true)
        membres?.forEach(m => {
          ids.add(m.user_id)
          if (!glob[m.user_id]) glob[m.user_id] = { pseudo: m.profils?.pseudo, avatar_url: m.profils?.avatar_url }
        })
      }
      setTousIds(ids)
      setTousGroupeIds(groupeIds)
      setGlobMap(glob)

      if (ids.size > 0) {
        await chargerGeneralFiltre(ids, groupeIds, glob, 'annee')
        await enregistrerGagnantSemanePrecedente(groupeIds, ids)
        const { data: gagnantsPrev } = await supabase
          .from('semaines_gagnees')
          .select('user_id, points, profils(pseudo, avatar_url)')
          .eq('semaine_iso', semaineISO(plageSemanePrecedente().debut))
        if (gagnantsPrev?.length > 0) setGagnants(gagnantsPrev)
      }

      setCharg(false)
    }
    init()
  }, [])

  const chargerClassementLigue = async (groupeId) => {
    setChargLigue(true)
    const { data: membres } = await supabase
      .from('membres_groupe')
      .select('user_id, points, profils(pseudo, avatar_url)')
      .eq('groupe_id', groupeId).eq('actif', true)
      .order('points', { ascending: false })

    const userIds = (membres || []).map(m => m.user_id)

    const { data: pronos } = await supabase
      .from('pronos')
      .select('user_id, resultat')
      .in('user_id', userIds)
      .eq('groupe_id', groupeId)
      .neq('resultat', 'en_attente')

    const statsMap = {}
    userIds.forEach(id => { statsMap[id] = { corrects: 0, incorrects: 0 } })
    pronos?.forEach(p => {
      if (!statsMap[p.user_id]) return
      if (p.resultat === 'correct')   statsMap[p.user_id].corrects++
      if (p.resultat === 'incorrect') statsMap[p.user_id].incorrects++
    })

    setClassementLigue(membres || [])
    setStatsLigue(statsMap)
    setChargLigue(false)
  }

  const changerLigue = async (id) => {
    setLigueSelectId(id)
    await chargerClassementLigue(id)
  }

  const chargerGeneralFiltre = async (ids, groupeIds, glob, filtreActif) => {
    const debutMap = { semaine: debutSemaineCourante(), mois: debutMoisCourant(), annee: debutAnneeNBA() }
    const debut = debutMap[filtreActif]

    const { data: pronosFiltres } = await supabase
      .from('pronos')
      .select('user_id, match_id, resultat, points_gagnes')
      .in('user_id', [...ids])
      .in('groupe_id', [...groupeIds])
      .neq('resultat', 'en_attente')
      .gte('cree_le', debut.toISOString())

    const seen = new Set()
    const dedup = []
    for (const p of pronosFiltres || []) {
      const cle = `${p.user_id}_${p.match_id}`
      if (seen.has(cle)) continue
      seen.add(cle)
      dedup.push(p)
    }

    const { data: ecartsFiltres } = await supabase
      .from('pronos_ecart')
      .select('user_id, points_gagnes')
      .eq('correct', true)
      .in('user_id', [...ids])
      .gte('cree_le', debut.toISOString())

    const agg = {}
    ids.forEach(id => { agg[id] = { points: 0, corrects: 0, incorrects: 0 } })
    dedup.forEach(p => {
      if (!agg[p.user_id]) return
      if (p.resultat === 'correct')   { agg[p.user_id].points += (p.points_gagnes || 1); agg[p.user_id].corrects++ }
      if (p.resultat === 'incorrect') agg[p.user_id].incorrects++
    })
    ecartsFiltres?.forEach(p => {
      if (agg[p.user_id]) agg[p.user_id].points += (p.points_gagnes || 0)
    })

    setGeneralFiltre([...ids].map(id => ({
      user_id: id, pseudo: glob[id]?.pseudo, avatar_url: glob[id]?.avatar_url, ...agg[id],
    })).sort((a, b) => b.points - a.points))
  }

  const enregistrerGagnantSemanePrecedente = async (groupeIds, ids) => {
    const { debut, fin } = plageSemanePrecedente()
    const iso = semaineISO(debut)
    const { data: pronosSemPrev } = await supabase
      .from('pronos')
      .select('user_id, match_id, groupe_id, resultat, points_gagnes')
      .in('groupe_id', groupeIds)
      .neq('resultat', 'en_attente')
      .gte('cree_le', debut.toISOString())
      .lte('cree_le', fin.toISOString())

    const { data: ecartsSemPrev } = await supabase
      .from('pronos_ecart')
      .select('user_id, points_gagnes')
      .eq('correct', true)
      .in('user_id', [...ids])
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
      ecartsSemPrev?.forEach(p => {
        if (pts[p.user_id] !== undefined) pts[p.user_id] += (p.points_gagnes || 0)
      })

      if (!Object.keys(pts).length) continue
      const entries = Object.entries(pts).sort((a, b) => b[1] - a[1])
      const [gagnantId, maxPts] = entries[0]
      if (maxPts === 0) continue
      if (entries.filter(([, p]) => p === maxPts).length > 1) continue

      await supabase.from('semaines_gagnees').insert({
        user_id: gagnantId, groupe_id: gid, semaine_iso: iso, points: maxPts
      })

      const { count: nbSemaines } = await supabase
        .from('semaines_gagnees')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', gagnantId)

      await verifierJalons(gagnantId, {
        pronos_poses: 0, pronos_corrects: 0,
        serie_correcte: 0, serie_ratee: 0,
        win_rate: 0, semaines_gagnees: nbSemaines || 1,
      })
    }
  }

  const changerFiltre = async (f) => {
    setFiltre(f)
    await chargerGeneralFiltre(tousIds, tousGroupeIds, globMap, f)
  }

  const labelFiltre = { semaine: 'Cette semaine', mois: 'Ce mois', annee: `Saison ${labelAnneeNBA()}` }

  // Ligue sélectionnée infos
  const ligueCourante = toutesLigues.find(g => g.id === ligueSelectId)
  const now = new Date()
  const ligueEstActive = ligueCourante && (!ligueCourante.date_fin || new Date(ligueCourante.date_fin) >= now)

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ position: 'relative', marginTop: 20, marginBottom: 8 }}>
          <TitreSection label="CLASSEMENT" couleur="var(--gold)" />
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '10px 16px 0', lineHeight: 1.6 }}>
            Suis ta progression et celle de tes potes. Chaque prono correct vaut <strong style={{ color: 'var(--accent)' }}>1 point</strong> — la fourchette d'écart en rapporte un de plus.
          </p>
        </div>

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>
        )}

        {!chargement && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 32 }}>

            {/* ── SECTION 1 : Classement ligue ── */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
                <SousTitre label={ligueEstActive ? 'Ligue en cours' : 'Ligue terminée'} couleur={ligueEstActive ? 'var(--accent)' : 'var(--text-3)'} />
                {toutesLigues.length > 0 && (
                  <select value={ligueSelectId || ''} onChange={e => changerLigue(e.target.value)} style={{
                    background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid',
                    borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-2)', fontSize: 12, fontWeight: 600,
                    padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    maxWidth: 160, flexShrink: 0,
                  }}>
                    {toutesLigues.map(g => {
                      const actv = !g.date_fin || new Date(g.date_fin) >= now
                      return <option key={g.id} value={g.id}>{g.nom} {actv ? '●' : '✓'}</option>
                    })}
                  </select>
                )}
              </div>

              {/* Nom ligue + dates */}
              {ligueCourante && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', margin: '10px 16px 6px' }}>
                  {ligueCourante.tag && <span style={{ marginRight: 8, fontWeight: 700, color: 'var(--accent)' }}>[{ligueCourante.tag}]</span>}
                  {ligueCourante.date_debut && new Date(ligueCourante.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  {ligueCourante.date_fin && ` → ${new Date(ligueCourante.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`}
                  {!ligueEstActive && <span style={{ marginLeft: 8, color: 'var(--text-3)', fontStyle: 'italic' }}>· Ligue terminée</span>}
                </div>
              )}

              {chargLigue && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Chargement…</p>}

              {!chargLigue && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {classementLigue.map((m, i) => (
                    <LigneUser key={m.user_id} m={m} i={i} statsUser={statsLigue[m.user_id]} moi={moi} navigate={navigate} />
                  ))}
                  {classementLigue.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '8px 0' }}>Aucun membre.</p>
                  )}
                </div>
              )}

              {toutesLigues.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  Aucune ligue. La prochaine arrive bientôt !
                </p>
              )}
            </div>

            {/* ── SECTION 2 : MVP Semaine précédente ── */}
            {gagnantsSemPrev.length > 0 && (
              <div style={{ margin: '28px 0 0' }}>
                <SousTitre label="MVP de la semaine" couleur="var(--gold)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px' }}>
                  {gagnantsSemPrev.map((g) => (
                    <div
                      key={g.user_id}
                      onClick={() => navigate(`/mes-pronos?user_id=${g.user_id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px',
                        background: 'rgba(245,158,11,0.06)',
                        borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(245,158,11,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M5 20V10l7-6 7 6v10"/></svg>
                      <Avatar url={g.profils?.avatar_url} pseudo={g.profils?.pseudo} taille={32} fontSize={11} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                        {g.profils?.pseudo || 'Inconnu'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--gold)' }}>
                        {g.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECTION 3 : Stats globales ── */}
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
                <SousTitre label={labelFiltre[filtre]} couleur="var(--text-2)" />
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {['semaine', 'mois', 'annee'].map(f => (
                    <button key={f} onClick={() => changerFiltre(f)} style={{
                      padding: '4px 9px',
                      background: filtre === f ? 'var(--accent)' : 'transparent',
                      borderWidth: 1, borderStyle: 'solid',
                      borderColor: filtre === f ? 'var(--accent)' : 'var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: filtre === f ? '#fff' : 'var(--text-3)',
                      fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    }}>
                      {f === 'semaine' ? 'Sem.' : f === 'mois' ? 'Mois' : 'Saison'}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 16px 10px' }}>
                Toutes ligues confondues
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {classementGeneralFiltre.filter(m => m.points > 0).map((m, i) => {
                  const estMoi = m.user_id === moi
                  const t = calcTaux(m)
                  return (
                    <div
                      key={m.user_id}
                      onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: estMoi ? 'rgba(99,102,241,0.08)' : 'transparent',
                        borderLeft: estMoi ? '3px solid var(--accent)' : '3px solid transparent',
                        padding: '10px 12px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        marginLeft: -16,
                      }}
                    >
                      <span style={{
                        fontSize: i < 3 ? 16 : 12,
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: i < 3 ? 'var(--gold)' : 'var(--text-3)',
                        minWidth: 24, textAlign: 'center',
                      }}>
                        {i < 3 ? MEDAILLES_STYLE[i].label : `#${i + 1}`}
                      </span>
                      <Avatar url={m.avatar_url} pseudo={m.pseudo} taille={32} fontSize={11} />
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.pseudo || 'Inconnu'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--gold)' : 'var(--text-2)' }}>
                          {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                        </span>
                        {((m.corrects || 0) + (m.incorrects || 0)) > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--success)' }}>{m.corrects} ✓</span>{' '}
                            <span style={{ color: 'var(--danger)' }}>{m.incorrects} ✗</span>
                            {t !== null && <span> · {t}%</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {classementGeneralFiltre.filter(m => m.points > 0).length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '8px 0' }}>Aucun point sur cette période.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </>
  )
}

export default Classement
