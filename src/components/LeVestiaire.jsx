import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Send } from 'lucide-react'
import { track } from '../services/tracker'

// Titre section — bandeau oblique identique Accueil
const TitreSection = ({ label, couleur = '#6366f1' }) => (
  <div style={{ width: '100%', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
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

// ID du groupe "Général" créé en base — fixe
const GROUPE_GENERAL_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

// Map jalon → badge pour retrouver la date d'obtention via xp_log
const JALON_BADGE_MAP = {
  jalon_serie_5:       { badge: 'en_feu',       nom: 'En Feu' },
  jalon_serie_10:      { badge: 'prophete',      nom: 'Prophète' },
  jalon_50_pronos:     { badge: 'all_in',        nom: 'All-In' },
  jalon_100_pronos:    { badge: 'marathonien',   nom: 'Marathonien' },
  jalon_winrate_65:    { badge: 'analyste',      nom: 'Analyste' },
  jalon_semaine:       { badge: 'champion',      nom: 'Champion' },
  jalon_10_fourchettes:{ badge: 'tireur_d_elite',nom: "Tireur d'Élite" },
}

// Génère les événements streaks des 7 derniers jours
async function genererEvenements(userId) {
  const evenements = []
  const maintenant = new Date()
  const il_y_a_7j  = new Date(maintenant - 7 * 24 * 3600 * 1000).toISOString()

  const { data: membres } = await supabase
    .from('membres_groupe')
    .select('groupe_id')
    .eq('user_id', userId)
    .eq('actif', true)
  if (!membres?.length) return []

  const groupeIds = membres.map(m => m.groupe_id)

  const { data: potes } = await supabase
    .from('membres_groupe')
    .select('user_id, profils(pseudo)')
    .in('groupe_id', groupeIds)
    .eq('actif', true)
    .neq('user_id', userId)
  if (!potes?.length) return []

  const potesUniques = [...new Map(potes.map(p => [p.user_id, p])).values()]

  for (const pote of potesUniques) {
    const pseudo = pote.profils?.pseudo || 'Un pote'

    // ── Pronos streak (7 derniers jours) ──
    const { data: pronos } = await supabase
      .from('pronos')
      .select('resultat, cree_le')
      .eq('user_id', pote.user_id)
      .in('resultat', ['correct', 'incorrect'])
      .gte('cree_le', il_y_a_7j)
      .order('cree_le', { ascending: false })
      .limit(20)

    if (pronos?.length) {
      const dernier = pronos[0].resultat
      let streak = 0
      for (const p of pronos) {
        if (p.resultat === dernier) streak++
        else break
      }

      if (streak >= 2) {
        const feu = dernier === 'correct'
        evenements.push({
          texte: feu
            ? `${pseudo} est sur une série de ${streak} pronos réussis !`
            : `${pseudo} est sur une série de ${streak} pronos ratés !`,
          couleur: feu ? 'var(--success)' : 'var(--danger)',
        })
      } else if (pronos.length >= 3) {
        const avantDernier = pronos[1].resultat
        let streakPrecedent = 0
        for (let i = 1; i < pronos.length; i++) {
          if (pronos[i].resultat === avantDernier) streakPrecedent++
          else break
        }
        if (streakPrecedent >= 2 && avantDernier === 'correct' && dernier === 'incorrect') {
          evenements.push({
            texte: `${pseudo} vient de briser sa série de ${streakPrecedent} pronos réussis !`,
            couleur: 'var(--orange)',
          })
        }
      }
    }

    // ── Fourchettes récentes (7 jours) ──
    const { data: fourchettes } = await supabase
      .from('pronos_ecart')
      .select('correct, cree_le')
      .eq('user_id', pote.user_id)
      .eq('correct', true)
      .gte('cree_le', il_y_a_7j)
      .order('cree_le', { ascending: false })
      .limit(5)

    if (fourchettes?.length >= 2) {
      evenements.push({
        texte: `${pseudo} enchaîne ${fourchettes.length} fourchettes correctes !`,
        couleur: 'var(--gold)',
      })
    } else if (fourchettes?.length === 1) {
      evenements.push({
        texte: `${pseudo} a réussi sa fourchette d'écart !`,
        couleur: 'var(--gold)',
      })
    }

    // ── Missions complétées (7 jours) ──
    const { data: missionsComp } = await supabase
      .from('missions_utilisateurs')
      .select('completee_le, missions(titre)')
      .eq('user_id', pote.user_id)
      .eq('completee', true)
      .gte('completee_le', il_y_a_7j)

    for (const mu of (missionsComp || [])) {
      const titre = mu.missions?.titre
      if (!titre) continue
      evenements.push({
        texte: `${pseudo} a accompli la mission "${titre}" !`,
        couleur: 'var(--accent)',
      })
    }

    // ── Badges obtenus (7 jours) ──
    const jalonsSlug = Object.keys(JALON_BADGE_MAP)
    const { data: jalonsRecents } = await supabase
      .from('xp_log')
      .select('source_id, cree_le')
      .eq('user_id', pote.user_id)
      .eq('source', 'jalon')
      .in('source_id', jalonsSlug)
      .gte('cree_le', il_y_a_7j)

    for (const j of (jalonsRecents || [])) {
      const info = JALON_BADGE_MAP[j.source_id]
      if (!info) continue
      evenements.push({
        texte: `${pseudo} a obtenu le badge "${info.nom}" !`,
        couleur: 'var(--gold)',
      })
    }
  }

  return evenements
}

async function chargerMessages() {
  const { data } = await supabase
    .from('messages')
    .select('id, contenu, cree_le, user_id, profils(pseudo)')
    .eq('groupe_id', GROUPE_GENERAL_ID)
    .order('cree_le', { ascending: false })
    .limit(50)
  return (data || []).reverse()
}

function ChatGeneral({ userId }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const intervalRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollBas = () => {
    const el = messagesEndRef.current
    if (!el) return
    const container = el.parentElement
    if (container) container.scrollTop = container.scrollHeight
  }

  const charger = async () => {
    const msgs = await chargerMessages()
    setMessages(msgs)
  }

  useEffect(() => {
    charger()
    intervalRef.current = setInterval(charger, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => { scrollBas() }, [messages])

  const envoyer = async () => {
    const contenu = texte.trim()
    if (!contenu || envoi) return
    setEnvoi(true)
    await supabase.from('messages').insert({
      user_id: userId,
      groupe_id: GROUPE_GENERAL_ID,
      contenu,
    })
    track(userId, 'clic_vestiaire', '/accueil', { action: 'message', groupe_id: GROUPE_GENERAL_ID })
    setTexte('')
    await charger()
    setEnvoi(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
  }

  return (
    <div style={{ marginTop: 10 }}>
      {/* Messages */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        marginBottom: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 2,
      }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12, color: '#888', margin: 0, paddingLeft: 4 }}>
            Aucun message — soyez les premiers à en laisser un.
          </p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              padding: '7px 10px',
              background: msg.user_id === userId ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.05)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: msg.user_id === userId ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.1)',
              borderRadius: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>
                    {msg.profils?.pseudo || '—'}
                  </span>
                  <span style={{ fontSize: 12, color: '#1a1a2e', lineHeight: 1.4 }}>
                    {msg.contenu}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#888', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {(() => {
                    const d = new Date(msg.cree_le + 'Z')
                    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  })()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input envoi */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Un message…"
          maxLength={500}
          style={{
            flex: 1, fontSize: 12,
            background: '#f0ede8',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(0,0,0,0.15)',
            borderRadius: 4,
            padding: '7px 10px', color: '#1a1a2e',
            outline: 'none',
          }}
        />
        <button
          onClick={envoyer}
          disabled={!texte.trim() || envoi}
          style={{
            background: 'var(--accent)', borderWidth: 0,
            borderRadius: 4,
            padding: '7px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            opacity: !texte.trim() || envoi ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <Send size={14} color="#fff" />
        </button>
      </div>
    </div>
  )
}

function LeVestiaire({ userId }) {
  const [evenements, setEvenements] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!userId) return
    const init = async () => {
      const evts = await genererEvenements(userId)
      setEvenements(evts)
      setChargement(false)
    }
    init()
  }, [userId])

  return (
    <div style={{ background: '#f0ede8', marginBottom: 4 }}>
      {/* Titre bandeau */}
      <TitreSection label="LE VESTIAIRE" couleur="#6366f1" />

      <div style={{ padding: '12px 16px 14px 16px' }}>

      {/* Streaks 7 jours */}
      {!chargement && evenements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {evenements.map((evt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              background: 'rgba(0,0,0,0.04)',
              borderLeft: `3px solid ${evt.couleur}`,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: evt.couleur, display: 'inline-block',
              }} />
              <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500, lineHeight: 1.4 }}>
                {evt.texte}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chat général */}
      <div style={{ background: '#e8e4dc', borderRadius: 4, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#555', flexShrink: 0 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chat général
        </div>
        {userId && <ChatGeneral userId={userId} />}
      </div>
      </div>
    </div>
  )
}

export default LeVestiaire
