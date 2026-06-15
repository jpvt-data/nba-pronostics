import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererTimeline } from '../services/espn'
import { recupererLiguesCibles } from '../services/ligues'
import { calculerPoints, lundiFin } from '../services/points'
import { ajouterXP, xpPourNiveau, verifierMissions, verifierJalons, niveauDepuisXP } from '../services/xp'
import { BADGES_CATALOGUE } from '../data/badges'
import Navigation from '../components/Navigation'
import BandeMatchs, { FiltreEquipe } from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import Briefing from '../components/Briefing'
import LeVestiaire from '../components/LeVestiaire'
import StandingsNBA from '../components/StandingsNBA'
import BracketPlayoffs from '../components/BracketPlayoffs'
import NewsNBA from '../components/NewsNBA'
import BanniereFeed from '../components/BanniereFeed'
import MissionsPopup from '../components/MissionsPopup'
import RoueQuotidienne from '../components/RoueQuotidienne'
import OnboardingTuto from '../components/OnboardingTuto'
import PopupActu from '../components/PopupActu'
import { track } from '../services/tracker'
import { useNavigate } from 'react-router-dom'
import { Calendar, Target, RefreshCw, Info } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { useNoSpoil } from '../context/NoSpoilContext'
import { useNotif } from '../context/NotifContext'
import { SAISON_ESPN } from '../config'

const titrDepuisNiveau = (n) => {
  if (n <= 10) return 'Rookie'
  if (n <= 20) return 'Sixième Homme'
  if (n <= 30) return 'Starter'
  if (n <= 40) return 'All-Star'
  if (n <= 60) return 'MVP'
  if (n <= 80) return 'Hall of Fame'
  return 'GOAT'
}

function Accueil() {
  const [matchs, setMatchs]                     = useState([])
  const [user, setUser]                         = useState(null)
  const [pseudo, setPseudo]                     = useState(null)
  const [avatarUrl, setAvatarUrl]               = useState(null)
  const [chargement, setCharg]                  = useState(true)
  const [nbPronosAttente, setNbPronosAttente]   = useState(0)
  const [equipeFiltre, setEquipeFiltre]         = useState(null)
  const [typeSaisonLigues, setTypeSaisonLigues] = useState(null)
  const [articleUne, setArticleUne]             = useState(null)
  const [xpData, setXpData]                     = useState({ xp_total: 0, niveau: 1 })
  const [kpis, setKpis]                         = useState({ total: 0, pct: 0 })
  const [equipesFav, setEquipesFav]             = useState([])
  const [missionsOpen, setMissionsOpen]         = useState(false)
  const [roueOpen, setRoueOpen]                 = useState(false)
  const [roueDispo, setRoueDispo]               = useState(false)
  const [onboardingOpen, setOnboardingOpen]     = useState(false)
  const [actu, setActu]                         = useState(null)
  const [actuOpen, setActuOpen]                 = useState(false)
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()
  const { pushNotifs } = useNotif()

  useEffect(() => {
    window.scrollTo(0, 0)
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // Tracking
      const { data: profilTrack } = await supabase
        .from('profils').select('niveau, xp_total').eq('id', user.id).single()
      track(user.id, 'session_start', '/accueil', {
        niveau:   profilTrack?.niveau   || 1,
        xp_total: profilTrack?.xp_total || 0,
      })
      track(user.id, 'page_view', '/accueil')

      const { data: profil } = await supabase
        .from('profils')
        .select('pseudo, avatar_url, badges, xp_total, niveau, onboarding_done, equipes_favorites')
        .eq('id', user.id).single()
      setPseudo(profil?.pseudo || null)
      setAvatarUrl(profil?.avatar_url || null)
      setEquipesFav(profil?.equipes_favorites || [])

      const niveauAvant = profil?.niveau || 1
      const xpAvant     = profil?.xp_total || 0
      const titreAvant  = titrDepuisNiveau(niveauAvant)
      setXpData({ xp_total: xpAvant, niveau: niveauAvant })

      // Onboarding auto au premier login
      if (profil && !profil.onboarding_done) setOnboardingOpen(true)

      const { data: pronosKpi } = await supabase
        .from('pronos')
        .select('resultat')
        .eq('user_id', user.id)
        .in('resultat', ['correct', 'incorrect'])
      const total    = pronosKpi?.length || 0
      const corrects = pronosKpi?.filter(p => p.resultat === 'correct').length || 0
      const pct      = total > 0 ? Math.round(corrects / total * 100) : 0
      setKpis({ total, pct })

      // ── Connexion quotidienne ──────────────────────────────────────────────
      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      const { data: dejaConnexion } = await supabase
        .from('xp_log').select('id')
        .eq('user_id', user.id)
        .eq('source_id', 'connexion_quotidienne')
        .eq('date_jour', jourParis)
        .limit(1)

      const notifs = []

      if (!dejaConnexion?.length) {
        const resConnexion = await ajouterXP(user.id, 5, 'passif', 'connexion_quotidienne')
        const missionsConnexion = await verifierMissions(user.id, 'connexion_semaine', 1, lundiFin(), 'increment')
        const missionsConnexionPerm = await verifierMissions(user.id, 'serie_connexion', 1, null, 'increment')

        // Notif XP connexion
        notifs.push({
          id:      `connexion_${jourParis}`,
          type:    'xp',
          titre:   '+5 XP — Connexion du jour',
          message: `${(resConnexion?.xp_total || xpAvant + 5).toLocaleString('fr-FR')} XP au total`,
        })

        // Notif niveau / titre si changement
        if (resConnexion) {
          const niveauAprès = resConnexion.niveau
          if (niveauAprès > niveauAvant) {
            notifs.push({
              id:      `niveau_${niveauAprès}`,
              type:    'niveau',
              titre:   `Niveau ${niveauAprès} atteint !`,
              message: `Tu progresses bien, continue comme ça.`,
            })
            const titreAprès = titrDepuisNiveau(niveauAprès)
            if (titreAprès !== titreAvant) {
              notifs.push({
                id:      `titre_${titreAprès}`,
                type:    'titre',
                titre:   `Nouveau titre : ${titreAprès} !`,
                message: `Tu n'es plus ${titreAvant}. Bienvenue au niveau supérieur.`,
              })
            }
          }
          setXpData({ xp_total: resConnexion.xp_total, niveau: resConnexion.niveau })
        }

        // Notifs missions déclenchées par la connexion
        for (const m of [...(missionsConnexion || []), ...(missionsConnexionPerm || [])]) {
          notifs.push({
            id:      `mission_${m.id}_${jourParis}`,
            type:    'mission',
            titre:   `Mission accomplie : ${m.titre} !`,
            message: `+${m.xp_recompense} XP`,
          })
        }
      }

      // ── Badges non vus ─────────────────────────────────────────────────────
      const badgesActuels = profil?.badges || []
      const clé = `swish_badges_vus_${user.id}`
      const badgesVus = JSON.parse(localStorage.getItem(clé) || '[]')
      const nouveauxBadges = badgesActuels
        .filter(s => !badgesVus.includes(s))
        .map(s => BADGES_CATALOGUE.find(b => b.slug === s))
        .filter(Boolean)

      if (nouveauxBadges.length > 0) {
        localStorage.setItem(clé, JSON.stringify(badgesActuels))
        for (const badge of nouveauxBadges) {
          notifs.push({
            id:      `badge_${badge.slug}`,
            type:    'badge',
            titre:   `Badge débloqué : ${badge.nom} !`,
            message: badge.description,
          })
        }
      }

      // ── Matchs terminés avec pronos non vus ────────────────────────────────
      // const { data: pronosNonVus } = await supabase
      //  .from('pronos')
      //  .select('id, matchs(statut)')
      //  .eq('user_id', user.id)
      //  .eq('vu', false)
      //  .not('matchs', 'is', null)

      //const nbNonVus = pronosNonVus?.filter(p => p.matchs?.statut === 'termine').length || 0
      //if (nbNonVus > 0) {
      //  notifs.push({
      //    id:      `matchs_termines_${jourParis}`,
      //    type:    'matchs',
      //    titre:   `${nbNonVus} résultat${nbNonVus > 1 ? 's' : ''} à découvrir !`,
      //    message: 'Va voir tes pronos pour connaître le verdict.',
      //  })
      // }

      // Priorité : niveau/titre > mission > badge > matchs > xp passif
      // L'ordre dans notifs[] est déjà correct — on push dans l'ordre voulu
      if (notifs.length > 0) pushNotifs(notifs)

      // ── Calcul points (résolution matchs) ──────────────────────────────────
      calculerPoints(user.id).catch(() => {})

      // ── Roue quotidienne dispo ? ────────────────────────────────────────────
      const { data: dejaRoue } = await supabase
        .from('xp_log').select('id')
        .eq('user_id', user.id)
        .eq('source', 'roue_quotidienne')
        .eq('date_jour', jourParis)
        .limit(1)
      setRoueDispo(!dejaRoue?.length)

      // ── Actu active ────────────────────────────────────────────────────────
      const { data: actus } = await supabase
        .from('actu_app').select('*').eq('actif', true)
        .order('cree_le', { ascending: false }).limit(1)
      if (actus?.[0]) setActu(actus[0])

      const { data: liguesUser } = await supabase
        .from('membres_groupe')
        .select('groupes(type_saison, date_fin)')
        .eq('user_id', user.id)
        .eq('actif', true)

      const aujourd_hui = new Date().toISOString().split('T')[0]
      const maxTypeSaison = liguesUser
        ?.map(m => m.groupes)
        .filter(g => g && (!g.date_fin || g.date_fin >= aujourd_hui))
        .map(g => g.type_saison)
        .filter(Boolean)
        .reduce((max, v) => Math.max(max, v), 0) || null
      setTypeSaisonLigues(maxTypeSaison)

      const m = await recupererTimeline(15, 15)
      setMatchs(m)
      setCharg(false)
    }
    init()
  }, [])

  const faireProno = async (match, equipeChoisie) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id:          match.espn_id,
        date_match:       match.date,
        equipe_domicile:  match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut:           match.statut,
        type_saison:      match.typeSaisonNum ?? null,
        saison:           match.saisonNum ?? null,
      }, { onConflict: 'espn_id' })
      .select().single()
    if (!matchDB) return

    const { data: pronoExistant } = await supabase
      .from('pronos').select('id')
      .eq('user_id', user.id)
      .eq('match_id', matchDB.id)
      .limit(1)
    const estNouveauProno = !pronoExistant || pronoExistant.length === 0

    const liguesCibles = await recupererLiguesCibles(user.id, match.typeSaisonNum ?? null)

    if (liguesCibles.length > 0) {
      await Promise.all(liguesCibles.map(m =>
        supabase.from('pronos').upsert({
          user_id: user.id, match_id: matchDB.id,
          equipe_choisie: equipeChoisie, resultat: 'en_attente', groupe_id: m.groupe_id,
        }, { onConflict: 'user_id,match_id,groupe_id' })
      ))
    } else {
      await supabase.from('pronos').upsert({
        user_id: user.id, match_id: matchDB.id,
        equipe_choisie: equipeChoisie, resultat: 'en_attente', groupe_id: null,
      }, { onConflict: 'user_id,match_id,groupe_id' })
    }

    track(user.id, 'clic_prono', '/accueil', { equipe: equipeChoisie, espn_id: match.espn_id, tag: match.tag })

    if (estNouveauProno) {
      await ajouterXP(user.id, 10, 'passif', 'prono_pose')
      await verifierMissions(user.id, 'pronos_semaine', 1, lundiFin(), 'increment')

      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      const { data: dejaPronoJour } = await supabase
        .from('xp_log').select('date_jour')
        .eq('user_id', user.id)
        .eq('source_id', 'premier_prono_jour')
        .order('date_jour', { ascending: false })
        .limit(1)
      if (dejaPronoJour?.[0]?.date_jour?.slice(0, 10) !== jourParis) {
        await ajouterXP(user.id, 10, 'passif', 'premier_prono_jour')
      }

      const { data: dejaHistoire } = await supabase
        .from('xp_log').select('id')
        .eq('user_id', user.id)
        .eq('source_id', 'premier_prono_histoire')
        .limit(1)
      if (!dejaHistoire || dejaHistoire.length === 0) {
        await ajouterXP(user.id, 75, 'jalon', 'premier_prono_histoire')
      }
    }
  }

  const typeSaisonActuel   = matchs[0]?.typeSaisonNum ?? null
  const typeSaisonEffectif = typeSaisonActuel ?? typeSaisonLigues
  const saisonActuelle     = matchs[0]?.saisonNum ?? SAISON_ESPN

  return (
    <>
      <Navigation nbPronosAttente={nbPronosAttente} onOpenOnboarding={() => setOnboardingOpen(true)} />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />

          {/* Ligne 1 : avatar + user + KPIs */}
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 12 }}>

            {/* Bloc gauche — avatar + pseudo + titre + XP */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexShrink: 1, minWidth: 0 }}>
              {/* Avatar cliquable → profil */}
              <div onClick={() => navigate('/profil')} style={{ cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
                <Avatar url={avatarUrl} pseudo={pseudo} taille={44} fontSize={16} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div
                  onClick={() => navigate('/mes-pronos')}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer', flexWrap: 'wrap' }}
                >
                  <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 'clamp(26px, 6vw, 38px)', color: 'var(--accent)', letterSpacing: '-0.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pseudo || ''}
                  </span>
                  <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 'clamp(20px, 4vw, 26px)', color: 'var(--gold)', letterSpacing: '0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {titrDepuisNiveau(xpData.niveau)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(13px, 2.5vw, 16px)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    Niv. {xpData.niveau}
                  </span>
                </div>

                {/* Barre XP */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 120, height: 4, background: 'var(--bg-2)', overflow: 'hidden', borderRadius: 3, flexShrink: 0 }}>
                    <div style={{
                      height: '100%',
                      width: `${xpData.niveau >= 100 ? 100 : Math.min(100, Math.round(
                        (xpData.xp_total - xpPourNiveau(xpData.niveau)) /
                        (xpPourNiveau(xpData.niveau + 1) - xpPourNiveau(xpData.niveau)) * 100
                      ))}%`,
                      background: 'var(--gold)', transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-display)', fontWeight: 600, flexShrink: 0 }}>
                    {xpData.xp_total.toLocaleString('fr-FR')} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Bloc centre — équipes favorites (desktop uniquement) */}
            {equipesFav.length > 0 && (
              <div className="equipes-desktop" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mes équipes</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {equipesFav.map(eq => (
                    <img key={eq.id} src={eq.logo} alt={eq.nom}
                      style={{ width: 40, height: 40, objectFit: 'contain', opacity: 0.9 }}
                      onError={e => { e.target.style.opacity = '0.15' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bloc droit — KPIs */}
            {kpis.total > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(32px, 8vw, 48px)', color: 'var(--text-1)', lineHeight: 1 }}>
                      {kpis.total}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.04em' }}>PRONOS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(32px, 8vw, 48px)', color: 'var(--accent)', lineHeight: 1 }}>
                      {kpis.pct}%
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.04em' }}>RÉUSSITE</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ligne 2 : chips gamification — Actu / Roue / Missions (Tuto supprimé → bouton Info nav) */}
          {user && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {actu && (
                <button
                  onClick={() => setActuOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--accent)', border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-sm)', padding: '5px 11px',
                    cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff',
                    letterSpacing: '0.03em',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Actu
                </button>
              )}

              <button
                onClick={() => { if (roueDispo) setRoueOpen(true) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 11px',
                  cursor: roueDispo ? 'pointer' : 'default',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                  letterSpacing: '0.03em', opacity: roueDispo ? 1 : 0.4,
                }}
              >
                <RefreshCw size={12} strokeWidth={2} color="var(--accent)" />
                {roueDispo ? 'Roue' : 'Roue jouée'}
              </button>

              <button
                onClick={() => setMissionsOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 11px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                  letterSpacing: '0.03em',
                }}
              >
                <Target size={12} strokeWidth={2} color="var(--accent)" />
                Missions
              </button>
            </div>
          )}
        </div>

        {/* ── À LA UNE ── */}
        <div className="anim-fade-up" style={{ paddingLeft: 16, paddingTop: 28, paddingBottom: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="teko-title" style={{ fontSize: 28, color: 'var(--text-1)' }}>À LA</span>
          <span className="teko-title" style={{ fontSize: 28, color: 'var(--orange)' }}>UNE</span>
        </div>
        <BanniereFeed article={articleUne} />

        <div style={{ height: 32 }} />

        {/* ── TIMELINE ── */}
        <div className="anim-fade-up anim-delay-1" style={{ marginTop: 8, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="teko-title" style={{ fontSize: 28, color: 'var(--text-1)' }}>TIME</span>
            <span className="teko-title" style={{ fontSize: 28, color: 'var(--accent)' }}>LINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiltreEquipe equipeFiltre={equipeFiltre} onSelect={setEquipeFiltre} />
            <button
              onClick={() => navigate('/calendrier')}
              className="btn-tap"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '4px 8px',
                cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
              }}
            >
              <Calendar size={12} strokeWidth={1.5} /> Calendrier
            </button>
          </div>
        </div>

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Chargement…</p>
        )}

        {!chargement && (
          <div style={{ marginTop: 10 }}>
            {matchs.length === 0 ? (
              <div className="card" style={{
                margin: '8px 16px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  Pas de match NBA sur cette période. Consulte le calendrier complet.
                </span>
                <button
                  onClick={() => navigate('/calendrier')}
                  className="btn-tap"
                  style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 600,
                    color: 'var(--accent)', background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px', cursor: 'pointer',
                  }}
                >
                  Calendrier
                </button>
              </div>
            ) : (
              <BandeMatchs
                matchs={matchs}
                userId={user?.id}
                onProno={faireProno}
                onBadge={setNbPronosAttente}
                equipeFiltre={equipeFiltre}
                onFiltreChange={setEquipeFiltre}
              />
            )}
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── Ticker Briefing ── */}
        {!chargement && user && (
          <div className="anim-fade-up anim-delay-2" style={{ marginTop: 8 }}>
            <Briefing userId={user.id} nbPronosAttente={nbPronosAttente} matchs={matchs} />
          </div>
        )}

        {/* ── LIGUE EN COURS ── */}
        {!chargement && user && (
          <div className="anim-fade-up anim-delay-2" style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px 16px 16px', marginTop: 32, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 10 }}>
              <span className="teko-title" style={{ fontSize: 28, color: 'var(--text-1)' }}>CLASSE</span>
              <span className="teko-title" style={{ fontSize: 28, color: 'var(--accent)' }}>MENT LIGUE</span>
            </div>
            <ClassementRapide userId={user.id} />
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── LE VESTIAIRE ── */}
        {!chargement && user && (
          <div className="anim-fade-up anim-delay-3" style={{ marginTop: 8 }}>
            <LeVestiaire userId={user.id} />
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── CLASSEMENT NBA ── */}
        {!chargement && (
          <div className="anim-fade-up anim-delay-3" style={{ marginTop: 8 }}>
            <div style={{
              paddingLeft: 16, paddingRight: 16, marginBottom: 12,
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="teko-title" style={{ fontSize: 28, color: 'var(--gold)' }}>CLASSEMENT</span>
                <span className="teko-title" style={{ fontSize: 28, color: 'var(--text-1)' }}>NBA</span>
              </div>
              <button
                onClick={() => navigate('/stats')}
                className="btn-tap"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
                  padding: 0, letterSpacing: '0.03em',
                }}
              >
                complet →
              </button>
            </div>
            <StandingsNBA typeSaison={typeSaisonEffectif} />
            {typeSaisonEffectif === 3 && <BracketPlayoffs saison={saisonActuelle} />}
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── ACTU NBA ── */}
        {!chargement && user && (
          <div className="anim-fade-up anim-delay-4" style={{ marginTop: 8, borderLeft: '3px solid var(--orange)', background: 'rgba(249,115,22,0.04)' }}>
            <div style={{ padding: '14px 16px 0 16px', display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span className="teko-title" style={{ fontSize: 28, color: 'var(--text-1)' }}>ACTU</span>
              <span className="teko-title" style={{ fontSize: 28, color: 'var(--accent)' }}>NBA</span>
            </div>
            <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}>
              <NewsNBA onFeedCharge={setArticleUne} />
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />

      </main>

      {/* ── Popup missions ── */}
      {missionsOpen && user && (
        <MissionsPopup userId={user.id} onClose={() => {
          setMissionsOpen(false)
          if (document.activeElement) document.activeElement.blur()
          window.scrollTo(0, 0)
        }} />
      )}

      {/* ── Roue quotidienne ── */}
      {roueOpen && user && (
        <RoueQuotidienne
          userId={user.id}
          onClose={() => setRoueOpen(false)}
          onGain={(xpTotal, niveau) => {
            setRoueDispo(false)
            if (xpTotal > 0) setXpData(prev => ({
              xp_total: niveau ? xpTotal : prev.xp_total + xpTotal,
              niveau:   niveau ?? prev.niveau,
            }))
          }}
        />
      )}

      {/* ── Popup Actu ── */}
      {actuOpen && actu && (
        <PopupActu actu={actu} onClose={() => setActuOpen(false)} />
      )}

      {/* ── Onboarding tuto ── */}
      {onboardingOpen && user && (
        <OnboardingTuto
          userId={user.id}
          onClose={() => setOnboardingOpen(false)}
        />
      )}
    </>
  )
}

export default Accueil
