import { useState, useEffect, useRef } from 'react'
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
import StandingsNBA from '../components/StandingsNBA'
import BracketPlayoffs from '../components/BracketPlayoffs'
import NewsNBA from '../components/NewsNBA'
import BanniereFeed from '../components/BanniereFeed'
import MissionsPopup from '../components/MissionsPopup'
import RoueQuotidienne from '../components/RoueQuotidienne'
import PopupOuvertureBooster from '../components/PopupOuvertureBooster'
import { donnerCartes, recupererCartesNonRevelees, marquerCartesRevelees } from '../services/cartes'
import OnboardingTuto from '../components/OnboardingTuto'
import PopupActu from '../components/PopupActu'
import { track } from '../services/tracker'
import { useNavigate } from 'react-router-dom'
import { Calendar, Target, RefreshCw, Info, Newspaper, Clock, Trophy, MessageSquare, BarChart2, Rss, Send, ChevronDown, ChevronUp, LayoutGrid, Gamepad2 } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { useNoSpoil } from '../context/NoSpoilContext'
import { useNotif } from '../context/NotifContext'
import { SAISON_ESPN } from '../config'

// Titre section — barres obliques pleines espacées progressivement
const TitreSection = ({ label, couleur = 'var(--accent)' }) => (
  <div style={{
    width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative',
    height: 'clamp(38px, 6vw, 46px)',
    overflow: 'hidden',
  }}>
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      preserveAspectRatio="none"
      viewBox="0 0 500 46"
    >
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
      position: 'absolute', top: '50%', left: 16,
      transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1,
      fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
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

const GROUPE_GENERAL_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

const JALON_BADGE_MAP = {
  jalon_serie_5:        { nom: 'En Feu' },
  jalon_serie_10:       { nom: 'Prophète' },
  jalon_50_pronos:      { nom: 'All-In' },
  jalon_100_pronos:     { nom: 'Marathonien' },
  jalon_winrate_65:     { nom: 'Analyste' },
  jalon_semaine:        { nom: 'Champion' },
  jalon_10_fourchettes: { nom: "Tireur d'Élite" },
}

async function genererEvenements(userId) {
  const il_y_a_7j = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: membres } = await supabase.from('membres_groupe').select('groupe_id').eq('user_id', userId).eq('actif', true)
  if (!membres?.length) return []
  const groupeIds = membres.map(m => m.groupe_id)
  const { data: potes } = await supabase.from('membres_groupe').select('user_id, profils(pseudo)').in('groupe_id', groupeIds).eq('actif', true).neq('user_id', userId)
  if (!potes?.length) return []
  const potesUniques = [...new Map(potes.map(p => [p.user_id, p])).values()]

  // Un pote = un bloc de 4 requêtes indépendantes, lancées en parallèle.
  // Tous les potes sont eux-mêmes traités en parallèle.
  const parPote = await Promise.all(potesUniques.map(async (pote) => {
    const pseudo = pote.profils?.pseudo || 'Un pote'
    const evts = []

    const [{ data: pronos }, { data: fourchettes }, { data: missions }, { data: jalons }] = await Promise.all([
      supabase.from('pronos').select('resultat, cree_le').eq('user_id', pote.user_id).in('resultat', ['correct', 'incorrect']).gte('cree_le', il_y_a_7j).order('cree_le', { ascending: false }).limit(20),
      supabase.from('pronos_ecart').select('correct').eq('user_id', pote.user_id).eq('correct', true).gte('cree_le', il_y_a_7j).limit(5),
      supabase.from('missions_utilisateurs').select('missions(titre)').eq('user_id', pote.user_id).eq('completee', true).gte('completee_le', il_y_a_7j),
      supabase.from('xp_log').select('source_id').eq('user_id', pote.user_id).eq('source', 'jalon').in('source_id', Object.keys(JALON_BADGE_MAP)).gte('cree_le', il_y_a_7j),
    ])

    if (pronos?.length) {
      const dernier = pronos[0].resultat
      let streak = 0
      for (const p of pronos) { if (p.resultat === dernier) streak++; else break }
      if (streak >= 2) evts.push({ texte: dernier === 'correct' ? `${pseudo} enchaîne ${streak} pronos réussis !` : `${pseudo} enchaîne ${streak} pronos ratés !`, couleur: dernier === 'correct' ? 'var(--success)' : 'var(--danger)' })
    }
    if (fourchettes?.length >= 2) evts.push({ texte: `${pseudo} enchaîne ${fourchettes.length} fourchettes correctes !`, couleur: 'var(--gold)' })
    for (const mu of (missions || [])) { if (mu.missions?.titre) evts.push({ texte: `${pseudo} a accompli la mission "${mu.missions.titre}" !`, couleur: 'var(--accent)' }) }
    for (const j of (jalons || [])) { const info = JALON_BADGE_MAP[j.source_id]; if (info) evts.push({ texte: `${pseudo} a obtenu le badge "${info.nom}" !`, couleur: 'var(--gold)' }) }

    return { pseudo, evts }
  }))

  // Ordre stable : par pseudo, peu importe l'ordre de réponse réseau
  parPote.sort((a, b) => a.pseudo.localeCompare(b.pseudo))
  return parPote.flatMap(p => p.evts)
}

function ChatGeneral({ userId }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const messagesEndRef = useRef(null)

  const charger = async () => {
    const { data } = await supabase.from('messages').select('id, contenu, cree_le, user_id, profils(pseudo)').eq('groupe_id', GROUPE_GENERAL_ID).order('cree_le', { ascending: false }).limit(50)
    setMessages((data || []).reverse())
  }

  useEffect(() => { charger(); const t = setInterval(charger, 30000); return () => clearInterval(t) }, [])
  useEffect(() => { if (messagesEndRef.current) { const c = messagesEndRef.current.parentElement; if (c) c.scrollTop = c.scrollHeight } }, [messages])

  const envoyer = async () => {
    const contenu = texte.trim()
    if (!contenu || envoi) return
    setEnvoi(true)
    await supabase.from('messages').insert({ user_id: userId, groupe_id: GROUPE_GENERAL_ID, contenu })
    setTexte('')
    await charger()
    setEnvoi(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Aucun message — soyez les premiers !</p>
        ) : messages.map(msg => (
          <div key={msg.id} style={{
            padding: '7px 10px',
            background: msg.user_id === userId ? 'var(--accent-dim)' : 'var(--bg-2)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: msg.user_id === userId ? 'var(--accent-border)' : 'var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>{msg.profils?.pseudo || '—'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{msg.contenu}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {new Date(msg.cree_le + 'Z').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input type="text" value={texte} onChange={e => setTexte(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyer()} placeholder="Un message…" maxLength={500}
          style={{ flex: 1, fontSize: 12, background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--text-1)', outline: 'none', fontFamily: 'var(--font-body)' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button onClick={envoyer} disabled={!texte.trim() || envoi} style={{ background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: !texte.trim() || envoi ? 0.4 : 1 }}>
          <Send size={14} color="#fff" />
        </button>
      </div>
    </div>
  )
}

function Accueil() {
  const [matchs, setMatchs]                     = useState([])
  const [isMobile, setIsMobile]                 = useState(window.innerWidth < 640)
  const [matchsAffichables, setMatchsAffichables] = useState([])
  const [prochainMatch, setProchainMatch]       = useState(null)
  const [user, setUser]                         = useState(null)
  const [pseudo, setPseudo]                     = useState(null)
  const [avatarUrl, setAvatarUrl]               = useState(null)
  const [chargement, setCharg]                  = useState(true)
  const [nbPronosAttente, setNbPronosAttente]   = useState(0)
  const [equipeFiltre, setEquipeFiltre]         = useState(null)
  const [typeSaisonLigues, setTypeSaisonLigues] = useState(null)
  const [articleUne, setArticleUne]             = useState(null)
  const [xpData, setXpData]                     = useState({ xp_total: 0, niveau: 1 })
  const [kpis, setKpis]                         = useState({ total: 0, pct: 0, nbCartes: 0 })
  const [equipesFav, setEquipesFav]             = useState([])
  const [evenements, setEvenements]             = useState([])
  const [actusOuvertes, setActusOuvertes]       = useState(false)
  const [missionsOpen, setMissionsOpen]         = useState(false)
  const [roueOpen, setRoueOpen]                 = useState(false)
  const [roueDispo, setRoueDispo]               = useState(false)
  const [boosterOuverture, setBoosterOuverture]  = useState(null)
  const [onboardingOpen, setOnboardingOpen]     = useState(false)
  const [actu, setActu]                         = useState(null)
  const [actuOpen, setActuOpen]                 = useState(false)
  const [actusApp, setActusApp]                 = useState([])
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()
  const { pushNotifs } = useNotif()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Subscribe Realtime sur cartes_collection - se declenche des qu'un INSERT
  // arrive pour cet user (booster admin, prono/fourchette resolus en arriere-plan)
  // sans avoir a recharger la page
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`cartes_user_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cartes_collection', filter: `user_id=eq.${user.id}` },
        async () => {
          // Un INSERT detecte : recuperer toutes les cartes non revelees et ouvrir la popup
          const enAttente = await recupererCartesNonRevelees(user.id)
          if (enAttente.length > 0) setBoosterOuverture(enAttente)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    window.scrollTo(0, 0)
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

      // Tout ce qui ne dépend ni du profil ni l'un de l'autre part en même temps.
      const [
        { data: profil },
        evts,
        { data: pronosKpi },
        { data: dejaConnexion },
        { data: dejaRoue },
        { data: actus },
        { data: liguesUser },
        m,
        { count: nbCartes },
      ] = await Promise.all([
        supabase.from('profils').select('pseudo, avatar_url, badges, xp_total, niveau, onboarding_done, equipes_favorites').eq('id', user.id).single(),
        genererEvenements(user.id),
        supabase.from('pronos').select('resultat').eq('user_id', user.id).in('resultat', ['correct', 'incorrect']),
        supabase.from('xp_log').select('id').eq('user_id', user.id).eq('source_id', 'connexion_quotidienne').eq('date_jour', jourParis).limit(1),
        supabase.from('xp_log').select('id').eq('user_id', user.id).eq('source', 'roue_quotidienne').eq('date_jour', jourParis).limit(1),
        supabase.from('actu_app').select('*').eq('actif', true).order('cree_le', { ascending: false }),
        supabase.from('membres_groupe').select('groupes(type_saison, date_fin)').eq('user_id', user.id).eq('actif', true),
        recupererTimeline(15, 15),
        supabase.from('cartes_collection').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      // Tracking — utilise le profil déjà chargé, pas besoin d'un 2e appel
      track(user.id, 'session_start', '/accueil', {
        niveau:   profil?.niveau   || 1,
        xp_total: profil?.xp_total || 0,
      })
      track(user.id, 'page_view', '/accueil')

      setPseudo(profil?.pseudo || null)
      setAvatarUrl(profil?.avatar_url || null)
      setEquipesFav(profil?.equipes_favorites || [])
      setEvenements(evts)

      const niveauAvant = profil?.niveau || 1
      const xpAvant     = profil?.xp_total || 0
      const titreAvant  = titrDepuisNiveau(niveauAvant)
      setXpData({ xp_total: xpAvant, niveau: niveauAvant })

      // Onboarding auto au premier login
      if (profil && !profil.onboarding_done) setOnboardingOpen(true)

      const total    = pronosKpi?.length || 0
      const corrects = pronosKpi?.filter(p => p.resultat === 'correct').length || 0
      const pct      = total > 0 ? Math.round(corrects / total * 100) : 0
      setKpis({ total, pct, nbCartes: nbCartes || 0 })

      // ── Connexion quotidienne (dépend de dejaConnexion ci-dessus) ───────────
      const notifs = []

      console.log('[connexion] dejaConnexion:', dejaConnexion, 'jourParis:', jourParis)
      if (!dejaConnexion?.length) {
        // donnerCartes separe du Promise.all : evite qu'une erreur interne soit
        // avalee silencieusement, et permet de capturer les cartes pour le popup
        const [resConnexion, missionsConnexion, missionsConnexionPerm] = await Promise.all([
          ajouterXP(user.id, 5, 'passif', 'connexion_quotidienne'),
          verifierMissions(user.id, 'connexion_semaine', 1, lundiFin(), 'increment'),
          verifierMissions(user.id, 'serie_connexion', 1, null, 'increment'),
        ])
        try {
          const cartesConnexion = await donnerCartes(user.id, 3, 'connexion')
          if (cartesConnexion?.length > 0) setBoosterOuverture(cartesConnexion)
        } catch (e) {
          console.error('[connexion] donnerCartes échoué:', e.message)
        }

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

      // ── Cartes en attente de revelation (tous triggers confondus) ───────────
      // Tourne a chaque chargement, pas seulement le jour de connexion : une carte
      // peut avoir ete attribuee en arriere-plan (prono/fourchette resolus par le
      // scan calculerPoints d'un autre user) depuis la derniere visite.
      const cartesEnAttente = await recupererCartesNonRevelees(user.id)
      if (cartesEnAttente.length > 0) setBoosterOuverture(cartesEnAttente)

      // ── Roue quotidienne dispo ? (déjà chargé en parallèle ci-dessus) ───────
      setRoueDispo(!dejaRoue?.length)

      // ── Actus actives (déjà chargées en parallèle ci-dessus) ────────────────
      const toutesActus = actus || []
      setActusApp(toutesActus)
      // Popup auto : actus non encore vues par cet user
      const nonVues = toutesActus.filter(a => !localStorage.getItem(`swish_actu_${a.id}`))
      if (nonVues.length > 0) {
        setActu(nonVues)
        setActuOpen(true)
      }

      // ── Type de saison ligues (déjà chargé en parallèle ci-dessus) ──────────
      const aujourd_hui = new Date().toISOString().split('T')[0]
      const maxTypeSaison = liguesUser
        ?.map(lg => lg.groupes)
        .filter(g => g && (!g.date_fin || g.date_fin >= aujourd_hui))
        .map(g => g.type_saison)
        .filter(Boolean)
        .reduce((max, v) => Math.max(max, v), 0) || null
      setTypeSaisonLigues(maxTypeSaison)

      // ── Timeline matchs (déjà chargée en parallèle ci-dessus) ────────────────
      setMatchs(m)

      // Filtrage : matchs < 3 jours passés + futurs
      const maintenant = new Date()
      const il_y_a_3j = new Date(maintenant - 3 * 24 * 3600 * 1000)
      const affichables = m.filter(match => {
        const d = new Date(match.date)
        return d >= il_y_a_3j
      })
      setMatchsAffichables(affichables)

      // Si aucun affichable, chercher le prochain match au-delà
      if (affichables.length === 0) {
        const futur = m.filter(match => new Date(match.date) > maintenant)
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
        setProchainMatch(futur || null)
      }
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

  const typeSaisonActuel   = matchsAffichables[0]?.typeSaisonNum ?? null
  const typeSaisonEffectif = typeSaisonActuel ?? typeSaisonLigues
  const saisonActuelle     = matchsAffichables[0]?.saisonNum ?? SAISON_ESPN

  return (
    <>
      <Navigation nbPronosAttente={nbPronosAttente} onOpenOnboarding={() => setOnboardingOpen(true)} />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 16px 14px 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />

          {/* Ligne 1 : avatar + pseudo/titre/niv | KPIs droite */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 8 : 12 }}>

            {/* Gauche : avatar + pseudo + titre + niv + barre XP */}
            <div style={{ display: 'flex', gap: isMobile ? 10 : 14, alignItems: 'center', minWidth: 0, flex: 1 }}>
              <div onClick={() => navigate('/profil')} style={{ cursor: 'pointer', flexShrink: 0 }}>
                <Avatar url={avatarUrl} pseudo={pseudo} taille={isMobile ? 44 : 60} fontSize={isMobile ? 15 : 20} />
              </div>
              <div onClick={() => navigate('/mes-pronos')} style={{ cursor: 'pointer', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 5 : 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: isMobile ? 26 : 'clamp(28px, 5vw, 46px)', color: 'var(--accent)', letterSpacing: '-0.01em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pseudo || ''}
                  </span>
                  <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: isMobile ? 18 : 'clamp(20px, 3.5vw, 28px)', color: 'var(--gold)', letterSpacing: '0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {titrDepuisNiveau(xpData.niveau)}
                  </span>
                  {!isMobile && (
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      Niv. {xpData.niveau}
                    </span>
                  )}
                </div>
                {/* Niv + Barre XP */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  {isMobile && (
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
                      Niv. {xpData.niveau}
                    </span>
                  )}
                  <div style={{ width: isMobile ? 70 : 160, height: 4, background: 'var(--bg-2)', overflow: 'hidden', borderRadius: 3, flexShrink: 0 }}>
                    <div style={{
                      height: '100%',
                      width: `${xpData.niveau >= 100 ? 100 : Math.min(100, Math.round((xpData.xp_total - xpPourNiveau(xpData.niveau)) / (xpPourNiveau(xpData.niveau + 1) - xpPourNiveau(xpData.niveau)) * 100))}%`,
                      background: 'var(--gold)', transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-display)', fontWeight: 600, flexShrink: 0 }}>
                    {xpData.xp_total.toLocaleString('fr-FR')} XP
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Ligne 2 : Mes équipes (gauche, avec label) | KPIs agrandis (droite) */}
          {(equipesFav.length > 0 || kpis.total > 0) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: isMobile ? 10 : 16, marginTop: isMobile ? 14 : 18, width: '100%' }}>

              {/* Mes équipes — gauche, alignée sous l'avatar */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {equipesFav.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
                      {equipesFav.map(eq => (
                        <img key={eq.id} src={eq.logo} alt={eq.nom}
                          style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, objectFit: 'contain', opacity: 0.9 }}
                          onError={e => { e.target.style.opacity = '0.15' }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
                      Mes équipes
                    </div>
                  </>
                )}
              </div>

              {/* KPIs — droite, agrandis */}
              {kpis.total > 0 && (
                <div style={{ display: 'flex', gap: isMobile ? 14 : 20, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 40 : 'clamp(36px, 7vw, 58px)', color: 'var(--text-1)', lineHeight: 1 }}>{kpis.total}</div>
                    <div style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em' }}>PRONOS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 40 : 'clamp(36px, 7vw, 58px)', color: 'var(--accent)', lineHeight: 1 }}>{kpis.pct}%</div>
                    <div style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em' }}>RÉUSSITE</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 40 : 'clamp(36px, 7vw, 58px)', color: 'var(--gold)', lineHeight: 1 }}>{kpis.nbCartes}</div>
                    <div style={{ fontSize: 8, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em' }}>CARTES</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BLOC ACTIONS — Roue / Missions / Collection / Arcade ── */}
        {user && (
          <div style={{ margin: '14px 16px 0', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: isMobile ? 10 : 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? 6 : 8 }}>
              <button onClick={() => { if (roueDispo) setRoueOpen(true) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: isMobile ? '8px 4px' : '10px 6px', cursor: roueDispo ? 'pointer' : 'default', opacity: roueDispo ? 1 : 0.4 }}>
                <RefreshCw size={16} strokeWidth={2} color="var(--accent)" />
                <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{roueDispo ? 'Roue' : 'Jouée'}</span>
              </button>
              <button onClick={() => setMissionsOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: isMobile ? '8px 4px' : '10px 6px', cursor: 'pointer' }}>
                <Target size={16} strokeWidth={2} color="var(--accent)" />
                <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.03em' }}>Missions</span>
              </button>
              <button onClick={() => navigate('/ma-collection')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: isMobile ? '8px 4px' : '10px 6px', cursor: 'pointer' }}>
                <LayoutGrid size={16} strokeWidth={2} color="var(--gold)" />
                <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.03em' }}>Collection</span>
              </button>
              <button onClick={() => navigate('/arcade')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: isMobile ? '8px 4px' : '10px 6px', cursor: 'pointer' }}>
                <Gamepad2 size={16} strokeWidth={2} color="var(--orange)" />
                <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.03em' }}>Arcade</span>
              </button>
            </div>
          </div>
        )}

        {/* ── À LA UNE ── */}
        <div className="anim-fade-up" style={{ paddingTop: 28 }}>
          <TitreSection label="À LA UNE" couleur="var(--orange)" />
        </div>

        {/* Briefing ticker — juste sous le bandeau, aligné marges intérieures */}
        {!chargement && user && (
          <div style={{ marginTop: 10, marginBottom: 0, padding: '0 16px' }}>
            <Briefing userId={user.id} nbPronosAttente={nbPronosAttente} matchs={matchs} />
          </div>
        )}

        {/* Carousel actus app */}
        {actusApp.length > 0 && (
          <div style={{ display: 'flex', gap: 10, padding: '10px 16px' }}>
            {actusApp.map(a => (
              <div key={a.id} onClick={() => { setActu([a]); setActuOpen(true) }}
                style={{
                  flex: 1,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer',
                }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  {a.type === 'cloture_ligue' ? 'Fin de ligue' : a.type === 'ouverture_ligue' ? 'Nouvelle ligue' : 'Actu'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3, marginBottom: 4 }}>{a.titre}</div>
                {a.message && <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.message}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Une Basket USA */}
        <div style={{ padding: '0 16px' }}>
          <BanniereFeed article={articleUne} />
        </div>

        {/* Autres actus NBA — dépliables, NewsNBA toujours monté pour articleUne */}
        {!chargement && user && (
          <div style={{ background: '#f0ede8', margin: '0 16px' }}>
            <button
              onClick={() => setActusOuvertes(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', background: 'none', borderWidth: 0,
                cursor: 'pointer', borderTop: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Autres actus NBA
              </span>
              {actusOuvertes ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
            </button>
            <div style={{
              maxHeight: actusOuvertes ? 2000 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
              padding: actusOuvertes ? '0 16px 16px' : '0 16px',
            }}>
              <NewsNBA onFeedCharge={setArticleUne} />
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── TIMELINE ── */}
        <div className="anim-fade-up anim-delay-1" style={{ marginTop: 8 }}>
          <TitreSection label="TIMELINE" couleur="var(--accent)" />

          {/* Barre contexte + boutons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 0', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {matchsAffichables.length > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#fff',
                  textTransform: 'uppercase', padding: '2px 7px', borderRadius: 2,
                  background: typeSaisonEffectif === 3 ? 'var(--danger)' : typeSaisonEffectif === 5 ? 'var(--success)' : 'var(--text-3)',
                }}>
                  {typeSaisonEffectif === 3 ? 'Playoffs' : typeSaisonEffectif === 5 ? 'Play-In' : typeSaisonEffectif === 4 ? 'Pré-saison' : 'Saison rég.'}
                </span>
              )}
              {matchsAffichables.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{matchsAffichables.length} match{matchsAffichables.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiltreEquipe equipeFiltre={equipeFiltre} onSelect={setEquipeFiltre} />
              <button onClick={() => navigate('/calendrier')} className="btn-tap" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                cursor: 'pointer', fontSize: 11, color: 'var(--accent)',
                fontWeight: 700, letterSpacing: '0.04em', fontFamily: 'var(--font-body)',
              }}>
                <Calendar size={11} strokeWidth={2} /> Calendrier
              </button>
            </div>
          </div>
        </div>

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>Chargement…</p>
        )}

        {!chargement && (
          <div style={{ marginTop: 10 }}>
            {matchsAffichables.length === 0 ? (
              <div style={{ margin: '0 16px', padding: '24px 20px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderTop: '3px solid var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M4.93 4.93C6.5 8 8 10 12 12s5.5 4 7.07 7.07"/>
                  <path d="M19.07 4.93C17.5 8 16 10 12 12S6.5 16 4.93 19.07"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                </svg>
                {prochainMatch ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                      Prochain match
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                      {prochainMatch.domicile?.nom || prochainMatch.domicile?.trigramme} vs {prochainMatch.exterieur?.nom || prochainMatch.exterieur?.trigramme}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {new Date(prochainMatch.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    Pas de match NBA prévu pour l'instant —<br />surveillez l'actu !
                  </div>
                )}
                <button onClick={() => navigate('/calendrier')} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)',
                  padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff',
                }}>
                  <Calendar size={13} strokeWidth={2} /> Voir le calendrier
                </button>
              </div>
            ) : (
              <BandeMatchs matchs={matchsAffichables} userId={user?.id} onProno={faireProno} onBadge={setNbPronosAttente} equipeFiltre={equipeFiltre} onFiltreChange={setEquipeFiltre} />
            )}
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── CLASSEMENT LIGUE ── */}
        {!chargement && user && (
          <div className="anim-fade-up anim-delay-2" style={{ marginTop: 8 }}>
            <TitreSection label="CLASSEMENT LIGUE" couleur="var(--accent)" />

            {/* Événements ligue — streaks potes */}
            {evenements.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 16px 4px' }}>
                {evenements.map((evt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-2)', borderLeft: `3px solid ${evt.couleur}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: evt.couleur, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{evt.texte}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: '12px 16px 16px' }}>
              <ClassementRapide userId={user.id} />
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── CLASSEMENT NBA ── */}
        {!chargement && (
          <div className="anim-fade-up anim-delay-3" style={{ marginTop: 8 }}>
            <TitreSection label="CLASSEMENT NBA" couleur="var(--gold)" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 16px' }}>
              <button onClick={() => navigate('/stats')} className="btn-tap" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', padding: 0, letterSpacing: '0.03em' }}>complet →</button>
            </div>
            <StandingsNBA typeSaison={typeSaisonEffectif} />
            {typeSaisonEffectif === 3 && <BracketPlayoffs saison={saisonActuelle} />}
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* ── DISCUSSION ── */}
        {user && (
          <div className="anim-fade-up anim-delay-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 12px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <MessageSquare size={14} strokeWidth={1.5} color="var(--text-3)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discussion</span>
            </div>
            <div style={{ padding: '0 16px 24px' }}>
              <ChatGeneral userId={user.id} />
            </div>
          </div>
        )}

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
          onGainCarte={(carteObtenue) => setBoosterOuverture([carteObtenue])}
        />
      )}

      {/* ── Popup ouverture booster (connexion / level up / roue) ── */}
      {boosterOuverture && (
        <PopupOuvertureBooster
          cartes={boosterOuverture}
          onFermer={() => {
            setBoosterOuverture(null)
            marquerCartesRevelees(user.id).catch(() => {})
          }}
        />
      )}

      {/* ── Popup Actu ── */}
      {actuOpen && actu && (
        <PopupActu actus={Array.isArray(actu) ? actu : [actu]} onClose={() => setActuOpen(false)} />
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
