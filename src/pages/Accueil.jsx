import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererTimeline } from '../services/espn'
import { recupererLiguesCibles } from '../services/ligues'
import { calculerPoints } from '../services/points'
import { ajouterXP } from '../services/xp'
import Navigation from '../components/Navigation'
import BandeMatchs, { FiltreEquipe } from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import Briefing from '../components/Briefing'
import LeVestiaire from '../components/LeVestiaire'
import StandingsNBA from '../components/StandingsNBA'
import BracketPlayoffs from '../components/BracketPlayoffs'
import NewsNBA from '../components/NewsNBA'
import BanniereFeed from '../components/BanniereFeed'
import { useNavigate } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'
import { SAISON_ESPN } from '../config'

function Accueil() {
  const [matchs, setMatchs]                     = useState([])
  const [user, setUser]                         = useState(null)
  const [pseudo, setPseudo]                     = useState(null)
  const [chargement, setCharg]                  = useState(true)
  const [nbPronosAttente, setNbPronosAttente]   = useState(0)
  const [equipeFiltre, setEquipeFiltre]         = useState(null)
  const [typeSaisonLigues, setTypeSaisonLigues] = useState(null)
  // Article 1 basketusa — remonté depuis NewsNBA via callback
  const [articleUne, setArticleUne]             = useState(null)
  const navigate = useNavigate()
  const { noSpoil } = useNoSpoil()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data: profil } = await supabase
        .from('profils').select('pseudo').eq('id', user.id).single()
      setPseudo(profil?.pseudo || null)

      calculerPoints(user.id).catch(() => {})

      // type_saison max des ligues actives — fallback si ESPN null
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

    // Vérifier si un prono existe déjà sur ce match — anti-doublon XP
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

    // XP uniquement si c'est un nouveau prono (pas un changement d'équipe)
    if (estNouveauProno) {
      await ajouterXP(user.id, 10, 'passif', 'prono_pose')

      const aujourdhui = new Date().toISOString().slice(0, 10)
      const { data: dejaPronoJour } = await supabase
        .from('xp_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_id', 'premier_prono_jour')
        .gte('cree_le', aujourdhui)
        .limit(1)

      if (!dejaPronoJour || dejaPronoJour.length === 0) {
        await ajouterXP(user.id, 10, 'passif', 'premier_prono_jour')
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
        <div style={{ padding: '20px 16px 0 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>Bonjour{' '}</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>{pseudo || ''}</span>
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
    </>
  )
}

export default Accueil
