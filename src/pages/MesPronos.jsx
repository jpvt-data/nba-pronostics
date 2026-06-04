import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { xpPourNiveau } from '../services/xp'
import { BADGES_CATALOGUE } from '../data/badges'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'

const formaterDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const formaterDateComplete = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

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

const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)', taille = 24 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

const titrDepuisNiveau = (n) => {
  if (n <= 10) return 'Rookie'
  if (n <= 20) return 'Sixième Homme'
  if (n <= 30) return 'Starter'
  if (n <= 40) return 'All-Star'
  if (n <= 60) return 'MVP'
  if (n <= 80) return 'Hall of Fame'
  return 'GOAT'
}

// Popup visualisation badge (clic sur badge obtenu)
const PopupBadge = ({ badge, dateObtention, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', maxWidth: 320,
        background: 'var(--bg-1)', borderTop: '3px solid var(--gold)',
        padding: '24px 20px 28px', position: 'relative',
        textAlign: 'center',
      }}
    >
      <button onClick={onClose} style={{
        position: 'absolute', top: 10, right: 12,
        background: 'none', borderWidth: 0, cursor: 'pointer',
        fontSize: 18, color: 'var(--text-3)', lineHeight: 1, padding: 4,
      }}>✕</button>

      {dateObtention && (
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16, fontStyle: 'italic' }}>
          Tu as débloqué ce badge le {formaterDateComplete(dateObtention)}
        </p>
      )}

      <img
        src={badge.image}
        alt={badge.nom}
        style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 16px' }}
        onError={e => { e.target.style.opacity = '0' }}
      />

      <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 22, color: 'var(--gold)', letterSpacing: '0.02em', marginBottom: 8 }}>
        {badge.nom}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
        {badge.description}
      </p>
    </div>
  </div>
)

// Dictionnaire source_id → label lisible
const XP_LABELS = {
  connexion_quotidienne:  { label: 'Connexion quotidienne',        icon: '📅' },
  prono_pose:             { label: 'Prono posé',                   icon: '🎯' },
  premier_prono_jour:     { label: 'Premier prono du jour',        icon: '⚡' },
  prono_correct:          { label: 'Prono correct',                icon: '✅' },
  semaine_100_pct:        { label: 'Semaine 100% pronostiquée',    icon: '💯' },
  premier_prono_histoire: { label: 'Premier prono de l\'histoire', icon: '🏆' },
  jalon_10_pronos:        { label: 'Jalon — 10 pronos posés',      icon: '🎖️' },
  jalon_50_pronos:        { label: 'Jalon — 50 pronos + Badge All-In', icon: '🃏' },
  jalon_100_pronos:       { label: 'Jalon — 100 pronos + Badge Marathonien', icon: '🏃' },
  jalon_serie_5:          { label: 'Jalon — 5 corrects d\'affilée + Badge En Feu', icon: '🔥' },
  jalon_serie_10:         { label: 'Jalon — 10 corrects d\'affilée + Badge Prophète', icon: '👑' },
  jalon_winrate_65:       { label: 'Jalon — 65% réussite + Badge Analyste', icon: '🧠' },
  jalon_semaine:          { label: 'Jalon — Semaine gagnée + Badge Champion', icon: '🏆' },
  jalon_serie_ratee_5:    { label: 'Badge En Hibernation débloqué', icon: '🧊' },
}

const formaterDateHeure = (dateStr) =>
  new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  })

// Modal historique XP
const ModalHistoriqueXP = ({ userId, onClose }) => {
  const [logs, setLogs]   = useState([])
  const [charg, setCharg] = useState(true)

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from('xp_log')
        .select('source_id, xp_gagne, cree_le')
        .eq('user_id', userId)
        .order('cree_le', { ascending: false })
        .limit(100)
      setLogs(data || [])
      setCharg(false)
    }
    charger()
  }, [userId])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
          background: 'var(--bg-1)', borderTop: '3px solid var(--gold)',
          padding: '20px 16px 24px', position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', borderWidth: 0, cursor: 'pointer',
          fontSize: 18, color: 'var(--text-3)', lineHeight: 1, padding: 4,
        }}>✕</button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16, paddingRight: 32 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>HISTORIQUE</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--gold)', letterSpacing: '0.02em' }}>XP</span>
        </div>

        {charg && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Chargement…</p>}

        {!charg && logs.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Aucun gain XP pour l'instant.</p>
        )}

        {!charg && logs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((l, i) => {
              const info = XP_LABELS[l.source_id] || { label: l.source_id, icon: '⚙️' }
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '9px 12px',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: '3px solid var(--gold)',
                  marginLeft: -16,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{info.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                        {formaterDateHeure(l.cree_le)}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gold)', flexShrink: 0 }}>
                    +{l.xp_gagne} XP
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <button onClick={onClose} style={{
          marginTop: 20, width: '100%', padding: '12px',
          background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid',
          borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Fermer</button>
      </div>
    </div>
  )
}

// Modal info XP
const ModalInfo = ({ onClose }) => {
  const [onglet, setOnglet] = useState('xp')
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
          background: 'var(--bg-1)', borderTop: '3px solid var(--accent)',
          padding: '20px 16px 24px', position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', borderWidth: 0, cursor: 'pointer',
          fontSize: 18, color: 'var(--text-3)', lineHeight: 1, padding: 4,
        }}>✕</button>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, paddingRight: 32 }}>
          {[
            { id: 'xp',       label: 'XP & Niveaux' },
            { id: 'badges',   label: 'Badges' },
            { id: 'missions', label: 'Missions' },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: onglet === o.id ? 'var(--accent)' : 'transparent',
              color: onglet === o.id ? '#fff' : 'var(--text-3)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: onglet === o.id ? 'var(--accent)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>{o.label}</button>
          ))}
        </div>

        {onglet === 'xp' && (
          <div>
            <TitreSection mot1="COMMENT" mot2="GAGNER DE L'XP" taille={18} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { action: 'Connexion quotidienne',        xp: '+5 XP',  note: '1×/jour' },
                { action: 'Prono posé',                   xp: '+10 XP', note: 'par prono' },
                { action: 'Premier prono du jour',        xp: '+10 XP', note: '1×/jour' },
                { action: 'Prono correct',                xp: '+25 XP', note: 'par prono validé' },
                { action: 'Semaine 100% pronostiquée',    xp: '+50 XP', note: '1×/semaine' },
                { action: "Premier prono de l'histoire",  xp: '+75 XP', note: '1× à vie' },
              ].map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-2)',
                  borderLeft: '3px solid var(--accent)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{r.action}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{r.note}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>{r.xp}</span>
                </div>
              ))}
            </div>
            <TitreSection mot1="LES" mot2="7 TITRES" taille={18} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { titre: 'Rookie',        niveaux: '1 → 10' },
                { titre: 'Sixième Homme', niveaux: '11 → 20' },
                { titre: 'Starter',       niveaux: '21 → 30' },
                { titre: 'All-Star',      niveaux: '31 → 40' },
                { titre: 'MVP',           niveaux: '41 → 60' },
                { titre: 'Hall of Fame',  niveaux: '61 → 80' },
                { titre: 'GOAT',          niveaux: '81 → 100' },
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 12px', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.titre}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>Niv. {t.niveaux}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === 'badges' && (
          <div>
            <TitreSection mot1="LES" mot2="BADGES" taille={18} />
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
              Des badges se débloquent au fil de ton parcours sur Swish League. Certains récompensent la régularité, d'autres l'audace ou la persévérance. Continue à pronostiquer, à jouer, à revenir — et tu finiras par les trouver.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, marginTop: 12, fontStyle: 'italic' }}>
              Les conditions d'obtention ne sont pas toutes révélées. C'est voulu.
            </p>
          </div>
        )}

        {onglet === 'missions' && (
          <div>
            <TitreSection mot1="LES" mot2="MISSIONS" taille={18} />
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Des missions quotidiennes, hebdomadaires et événementielles permettent d'accélérer ta progression XP. Consulte le Board pour voir les missions actives.
            </p>
          </div>
        )}

        <button onClick={onClose} style={{
          marginTop: 24, width: '100%', padding: '12px',
          background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid',
          borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Fermer</button>
      </div>
    </div>
  )
}

function MesPronos() {
  const [pronos, setPronos]              = useState([])
  const [stats, setStats]                = useState({ total: 0, corrects: 0, incorrects: 0 })
  const [statsLigues, setStatsLig]       = useState([])
  const [profil, setProfil]              = useState(null)
  const [formeRecente, setForme]         = useState([])
  const [streaks, setStreaks]             = useState({ actuel: 0, max: 0 })
  const [equipes, setEquipes]             = useState({ meilleure: null, pire: null })
  const [xpData, setXpData]              = useState({ xp_total: 0, niveau: 1, badges: [] })
  const [badgeDatesMap, setBadgeDates]   = useState({}) // slug → date obtention
  const [badgePopup, setBadgePopup]      = useState(null)
  const [modalInfo, setModalInfo]        = useState(false)
  const [modalHistorique, setModalHistorique] = useState(false)
  const [profilId, setProfilId]          = useState(null)
  const [charg, setCharg]                = useState(true)
  const [estMoi, setEstMoi]              = useState(true)
  const navigate                         = useNavigate()
  const location                         = useLocation()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const params   = new URLSearchParams(location.search)
      const cibleId  = params.get('user_id') || user.id
      const vuParMoi = cibleId === user.id
      setEstMoi(vuParMoi)
      setProfilId(cibleId)

      const { data: p } = await supabase
        .from('profils')
        .select('pseudo, avatar_url, description, xp_total, niveau, badges')
        .eq('id', cibleId).single()
      setProfil(p)
      const badgesSlugs = p?.badges || []
      setXpData({ xp_total: p?.xp_total || 0, niveau: p?.niveau || 1, badges: badgesSlugs })

      // Récupérer les dates d'obtention depuis xp_log pour chaque badge
      if (badgesSlugs.length > 0) {
        const { data: logsJalons } = await supabase
          .from('xp_log')
          .select('source_id, cree_le')
          .eq('user_id', cibleId)
          .eq('source', 'jalon')
          .order('cree_le', { ascending: true })

        // Mapper slug badge → date via le jalon correspondant
        const jalon2badge = {
          'jalon_50_pronos':    'all_in',
          'jalon_100_pronos':   'marathonien',
          'jalon_serie_5':      'en_feu',
          'jalon_serie_10':     'prophete',
          'jalon_winrate_65':   'analyste',
          'jalon_semaine':      'champion',
          'jalon_serie_ratee_5':'en_hibernation',
        }
        const datesMap = {}
        logsJalons?.forEach(l => {
          const badgeSlug = jalon2badge[l.source_id]
          if (badgeSlug && !datesMap[badgeSlug]) {
            datesMap[badgeSlug] = l.cree_le
          }
        })
        setBadgeDates(datesMap)
      }

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

  const niveau     = xpData.niveau
  const xpActuel   = xpData.xp_total
  const xpDebutNiv = xpPourNiveau(niveau)
  const xpFinNiv   = xpPourNiveau(niveau + 1)
  const xpDansNiv  = xpActuel - xpDebutNiv
  const xpNivTotal = xpFinNiv - xpDebutNiv
  const xpRestant  = xpFinNiv - xpActuel
  const pctBarre   = niveau >= 100 ? 100 : Math.min(100, Math.round(xpDansNiv / xpNivTotal * 100))
  const titreRPG   = titrDepuisNiveau(niveau)

  // Badges obtenus seulement, dans l'ordre du catalogue
  const badgesObtenusSlugs = new Set(xpData.badges || [])
  const badgesObtenus = BADGES_CATALOGUE.filter(b => badgesObtenusSlugs.has(b.slug))

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header fusionné : Profil + XP ── */}
        <div style={{ background: 'var(--bg-1)', padding: '20px 16px 20px', borderLeft: '3px solid var(--gold)' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={56} fontSize={18} />
            <div style={{ flex: 1, minWidth: 0 }}>
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
                    padding: '7px 14px', background: 'var(--accent)',
                    borderWidth: 0, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >⚔️ 1v1 — me comparer à {profil?.pseudo}</button>
              )}
            </div>
            <button
              onClick={() => setModalInfo(true)}
              style={{ background: 'none', borderWidth: 0, cursor: 'pointer', fontSize: 16, color: 'var(--text-3)', padding: 4, flexShrink: 0 }}
            >ℹ️</button>
          </div>

          {/* Titre RPG + niveau + Historique XP sur la même ligne */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 34 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 22, color: 'var(--gold)', letterSpacing: '0.02em', lineHeight: 1 }}>{titreRPG}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-3)' }}>Niv. {niveau}</span>
            </div>
            {estMoi && (
              <button
                onClick={() => setModalHistorique(true)}
                style={{
                  background: 'none', borderWidth: 0, cursor: 'pointer',
                  fontSize: 10, color: 'var(--text-3)', padding: 0,
                  fontWeight: 600, letterSpacing: '0.03em',
                }}
              >
                Historique XP →
              </button>
            )}
          </div>

          {/* Barre XP */}
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 5, background: 'var(--bg-2)', overflow: 'hidden', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${pctBarre}%`, background: 'var(--gold)', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {xpActuel.toLocaleString('fr-FR')} XP
              </span>
              {niveau < 100 && (
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>
                  encore {xpRestant.toLocaleString('fr-FR')} XP
                </span>
              )}
            </div>
          </div>

          {/* Badges obtenus seulement — alignés à gauche, cliquables */}
          {badgesObtenus.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              {badgesObtenus.map(b => (
                <button
                  key={b.slug}
                  onClick={() => setBadgePopup(b)}
                  title={b.nom}
                  style={{
                    width: 56, height: 56, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', borderWidth: 0, cursor: 'pointer',
                  }}
                >
                  <img
                    src={b.image}
                    alt={b.nom}
                    style={{ width: 56, height: 56, objectFit: 'contain' }}
                    onError={e => { e.target.style.opacity = '0' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}

        {!charg && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 32 }}>
            <div style={{ height: 25 }} />

            {/* ── Stats globales ── */}
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

            {/* ── Séries ── */}
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

            {/* ── Forme récente ── */}
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
                        fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)',
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

            {/* ── Équipes + Stats ligues ── */}
            {((equipes.meilleure || equipes.pire) || statsLigues.length > 0) && (
              <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--orange)' }}>
                {(equipes.meilleure || equipes.pire) && equipes.meilleure !== equipes.pire && (
                  <>
                    <TitreSection mot1="ÉQUIPES" couleur2="var(--orange)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: statsLigues.length > 0 ? 20 : 0 }}>
                      {equipes.meilleure && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'rgba(34,197,94,0.06)',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(34,197,94,0.2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>✅</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{equipes.meilleure.nom}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{equipes.meilleure.corrects}/{equipes.meilleure.total} pronos</div>
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--success)' }}>{equipes.meilleure.taux}%</span>
                        </div>
                      )}
                      {equipes.pire && equipes.pire.nom !== equipes.meilleure?.nom && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'rgba(239,68,68,0.06)',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>❌</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{equipes.pire.nom}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{equipes.pire.corrects}/{equipes.pire.total} pronos</div>
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--danger)' }}>{equipes.pire.taux}%</span>
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

            {/* ── Historique ── */}
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
                  <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '8px 0' }}>Aucun prono pour l'instant.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Popup visualisation badge */}
      {badgePopup && (
        <PopupBadge
          badge={badgePopup}
          dateObtention={badgeDatesMap[badgePopup.slug] || null}
          onClose={() => setBadgePopup(null)}
        />
      )}

      {/* Modal historique XP */}
      {modalHistorique && estMoi && (
        <ModalHistoriqueXP userId={profilId} onClose={() => setModalHistorique(false)} />
      )}

      {/* Modal info */}
      {modalInfo && <ModalInfo onClose={() => setModalInfo(false)} />}
    </>
  )
}

export default MesPronos
