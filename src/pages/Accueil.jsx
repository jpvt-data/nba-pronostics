import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererTimeline } from '../services/espn'
import { recupererLiguesCibles } from '../services/ligues'
import { calculerPoints, lundiFin } from '../services/points'
import { ajouterXP, xpPourNiveau, verifierMissions } from '../services/xp'
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
import { track } from '../services/tracker'
import { useNavigate } from 'react-router-dom'
import { Calendar, Target, RefreshCw } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'
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

const PopupObtentionBadge = ({ badge, onClose, onSuivant, restants }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, marginBottom: 16 }}>
        Bravo ! Tu as obtenu le badge
      </p>

      <img
        src={badge.image}
        alt={badge.nom}
        style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 16px' }}
        onError={e => { e.target.style.opacity = '0' }}
      />

      <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 22, color: 'var(--gold)', letterSpacing: '0.02em', marginBottom: 8 }}>
        {badge.nom}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 20 }}>
        {badge.description}
      </p>

      {restants > 0 ? (
        <button onClick={onSuivant} style={{
          width: '100%', padding: '12px',
          background: 'var(--gold)', borderWidth: 0,
          color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
        }}>
          Suivant ({restants} badge{restants > 1 ? 's' : ''} restant{restants > 1 ? 's' : ''})
        </button>
      ) : (
        <button onClick={onClose} style={{
          width: '100%', padding: '12px',
          background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid',
          borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Super !</button>
      )}
    </div>
  </div>
)

function Accueil() {
  const [matchs, setMatchs]                     = useState([])
  const [user, setUser]                         = useState(null)
  const [pseudo, setPseudo]                     = useState(null)
  const [chargement, setCharg]                  = useState(true)
  const [nbPronosAttente, setNbPronosAttente]   = useState(0)
  const [equipeFiltre, setEquipeFiltre]         = useState(null)
  const [typeSaisonLigues, setTypeSaisonLigues] = useState(null)
  const [articleUne, setArticleUne]             = useState(null)
  const [xpData, setXpData]                     = useState({ xp_total: 0, niveau: 1 })
  const [kpis, setKpis]                         = useState({ total: 0, pct: 0 })
  const [filesBadges, setFilesBadges]           = useState([])
  const [missionsOpen, setMissionsOpen]         = useState(false)
  const [roueDispo, setRoueDispo]               = useState(false)
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()

  useEffect(() => {
    window.scrollTo(0, 0)
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // Tracking — session_start + page_view accueil
      const { data: profilTrack } = await supabase
        .from('profils').select('niveau, xp_total').eq('id', user.id).single()
      track(user.id, 'session_start', '/accueil', {
        niveau:   profilTrack?.niveau   || 1,
        xp_total: profilTrack?.xp_total || 0,
      })
      track(user.id, 'page_view', '/accueil')

      const { data: profil } = await supabase
        .from('profils')
        .select('pseudo, badges, xp_total, niveau')
        .eq('id', user.id).single()
      setPseudo(profil?.pseudo || null)
      setXpData({ xp_total: profil?.xp_total || 0, niveau: profil?.niveau || 1 })

      const { data: pronosKpi } = await supabase
        .from('pronos')
        .select('resultat')
        .eq('user_id', user.id)
        .in('resultat', ['correct', 'incorrect'])
      const total    = pronosKpi?.length || 0
      const corrects = pronosKpi?.filter(p => p.resultat === 'correct').length || 0
      const pct      = total > 0 ? Math.round(corrects / total * 100) : 0
      setKpis({ total, pct })

      const badgesActuels = profil?.badges || []
      const clé = `swish_badges_vus_${user.id}`
      const badgesVus = JSON.parse(localStorage.getItem(clé) || '[]')
      const nouveaux = badgesActuels.filter(s => !badgesVus.includes(s))
      if (nouveaux.length > 0) {
        const objetsNouveaux = nouveaux
          .map(s => BADGES_CATALOGUE.find(b => b.slug === s))
          .filter(Boolean)
        setFilesBadges(objetsNouveaux)
        localStorage.setItem(clé, JSON.stringify(badgesActuels))
      }

      calculerPoints(user.id).catch(() => {})

      // Vérif roue quotidienne — dispo si pas jouée aujourd'hui
      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      const cléRoue = `swish_roue_${user.id}_${jourParis}`
      setRoueDispo(!localStorage.getItem(cléRoue))

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
      console.log('matchs timeline:', m.map(x => ({ id: x.espn_id, tag: x.tag, headline: x.headline, date: x.date?.slice(0,10) })))
      setCharg(false)
    }
    init()
  }, [])

  const fermerBadge = () => {
    setFilesBadges([])
    if (document.activeElement) document.activeElement.blur()
    window.scrollTo(0, 0)
  }
  const suivantBadge = () => setFilesBadges(prev => prev.slice(1))

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
      .from('pronos')
      .select('id')
      .eq('user_id', user.id)
      .eq('match_id', matchDB.id)
      .limit(1)
    const estNouveauProno = !pronoExistant || pronoExistant.length === 0

    const liguesCibles = await recupererLiguesCibles(user.id, match.typeSaisonNum ?? null)

    if (liguesCibles.length > 0) {
      await Promise.all(liguesCibles.map(m =>
        supabase.from('pronos').upsert({
          user_id:        user.id,
          match_id:       matchDB.id,
          equipe_choisie: equipeChoisie,
          resultat:       'en_attente',
          groupe_id:      m.groupe_id,
        }, { onConflict: 'user_id,match_id,groupe_id' })
      ))
    } else {
      await supabase.from('pronos').upsert({
        user_id:        user.id,
        match_id:       matchDB.id,
        equipe_choisie: equipeChoisie,
        resultat:       'en_attente',
        groupe_id:      null,
      }, { onConflict: 'user_id,match_id,groupe_id' })
    }

    track(user.id, 'clic_prono', '/accueil', { equipe: equipeChoisie, espn_id: match.espn_id, tag: match.tag })

    if (estNouveauProno) {
      await ajouterXP(user.id, 10, 'passif', 'prono_pose')
      await verifierMissions(user.id, 'pronos_semaine', 1, lundiFin(), 'increment')

      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      const { data: dejaPronoJour } = await supabase
        .from('xp_log')
        .select('date_jour')
        .eq('user_id', user.id)
        .eq('source_id', 'premier_prono_jour')
        .order('date_jour', { ascending: false })
        .limit(1)
      const dernierPronoJour = dejaPronoJour?.[0]?.date_jour?.slice(0, 10)
      if (dernierPronoJour !== jourParis) {
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
      <Navigation nbPronosAttente={nbPronosAttente} />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />

          {/* Ligne 1 : Bonjour + KPIs */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, flexShrink: 1, minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>Bonjour{' '}</span>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pseudo || ''}</span>
            </div>

            {/* KPIs */}
            {kpis.total > 0 && (
              <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 32px)', color: 'var(--text-1)', lineHeight: 1 }}>
                    {kpis.total}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.04em' }}>PRONOS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 32px)', color: 'var(--accent)', lineHeight: 1 }}>
                    {kpis.pct}%
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.04em' }}>RÉUSSITE</div>
                </div>
              </div>
            )}
          </div>

          {/* Ligne 2 : Titre RPG + barre XP + liens */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--gold)', letterSpacing: '0.02em', lineHeight: 1 }}>
                {titrDepuisNiveau(xpData.niveau)}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-3)' }}>
                Niv. {xpData.niveau}
              </span>
            </div>
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <button
                onClick={() => navigate('/mes-pronos')}
                style={{
                  background: 'none', borderWidth: 0, cursor: 'pointer',
                  fontSize: 10, color: 'var(--text-3)', padding: 0,
                  fontWeight: 600, letterSpacing: '0.03em', flexShrink: 0,
                }}
              >
                Mes stats →
              </button>
            </div>

            {/* ── Barre chips gamification ── */}
            {user && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>

                {/* Chip Missions */}
                <button
                  onClick={() => setMissionsOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 11px',
                    cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                    letterSpacing: '0.03em',
                  }}
                >
                  <Target size={12} strokeWidth={2} color="var(--accent)" />
                  Missions
                </button>

                {/* Chip Roue */}
                <button
                  onClick={() => {/* TODO : ouvrir modal roue */}}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: roueDispo ? 'var(--accent-dim)' : 'var(--bg-2)',
                    border: `1px solid ${roueDispo ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 11px',
                    cursor: roueDispo ? 'pointer' : 'default',
                    fontSize: 11, fontWeight: 700,
                    color: roueDispo ? 'var(--accent)' : 'var(--text-3)',
                    letterSpacing: '0.03em',
                    opacity: roueDispo ? 1 : 0.5,
                  }}
                >
                  <RefreshCw size={12} strokeWidth={2} />
                  {roueDispo ? 'Roue dispo' : 'Roue jouée'}
                </button>

              </div>
            )}
          </div>
        </div>

        {/* ── À LA UNE ── */}
        <div style={{ paddingLeft: 16, paddingTop: 28, paddingBottom: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>À LA</span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--orange)', letterSpacing: '0.02em', lineHeight: 1 }}>UNE</span>
        </div>
        <BanniereFeed article={articleUne} />

        <div style={{ height: 25 }} />

        {/* ── TIMELINE ── */}
        <div style={{ marginTop: 32, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>TIME</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>LINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiltreEquipe equipeFiltre={equipeFiltre} onSelect={setEquipeFiltre} />
            <button
              onClick={() => navigate('/calendrier')}
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
              <div style={{
                margin: '8px 16px', padding: '14px 16px',
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  Pas de match NBA sur cette période. Consulte le calendrier complet 👀
                </span>
                <button
                  onClick={() => navigate('/calendrier')}
                  style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 600,
                    color: 'var(--accent)', background: 'var(--accent-dim)',
                    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)',
                    borderRadius: 'var(--radius-sm)',
                    paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 10,
                    cursor: 'pointer',
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

        <div style={{ height: 25 }} />

        {/* ── Ticker Briefing ── */}
        {!chargement && user && (
          <div style={{ marginTop: 16 }}>
            <Briefing userId={user.id} nbPronosAttente={nbPronosAttente} matchs={matchs} />
          </div>
        )}

        {/* ── LIGUE EN COURS ── */}
        {!chargement && user && (
          <div style={{ borderLeft: '3px solid var(--accent)', padding: '12px 16px 16px 16px', marginTop: 32, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>LIGUE</span>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>EN COURS</span>
            </div>
            <ClassementRapide userId={user.id} />
          </div>
        )}

        <div style={{ height: 25 }} />

        {/* ── LE VESTIAIRE ── */}
        {!chargement && user && (
          <div style={{ marginTop: 32 }}>
            <LeVestiaire userId={user.id} />
          </div>
        )}

        <div style={{ height: 25 }} />

        {/* ── CLASSEMENT NBA ── */}
        {!chargement && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              paddingLeft: 16, paddingRight: 16, marginBottom: 12,
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--gold)', letterSpacing: '0.02em', lineHeight: 1 }}>CLASSEMENT</span>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>NBA</span>
              </div>
              <button
                onClick={() => navigate('/stats')}
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

        <div style={{ height: 25 }} />

        {/* ── ACTU NBA ── */}
        {!chargement && user && (
          <div style={{ background: '#f0ede8', marginTop: 32, borderLeft: '3px solid var(--accent)' }}>
            <div style={{ padding: '14px 16px 0 16px', display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: '#1a1a2e', letterSpacing: '0.02em', lineHeight: 1 }}>ACTU</span>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>NBA</span>
            </div>
            <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}>
              <NewsNBA onFeedCharge={setArticleUne} />
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />

      </main>

      {/* ── Popup obtention badge ── */}
      {filesBadges.length > 0 && (
        <PopupObtentionBadge
          badge={filesBadges[0]}
          onClose={fermerBadge}
          onSuivant={suivantBadge}
          restants={filesBadges.length - 1}
        />
      )}

      {/* ── Popup missions ── */}
      {missionsOpen && user && (
        <MissionsPopup userId={user.id} onClose={() => {
          setMissionsOpen(false)
          if (document.activeElement) document.activeElement.blur()
          window.scrollTo(0, 0)
        }} />
      )}
    </>
  )
}

export default Accueil
