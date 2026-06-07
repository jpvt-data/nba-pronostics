import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Send } from 'lucide-react'
import { track } from '../services/tracker'

async function genererEvenements(userId) {
  const evenements = []

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

    const { data: pronos } = await supabase
      .from('pronos')
      .select('resultat')
      .eq('user_id', pote.user_id)
      .in('resultat', ['correct', 'incorrect'])
      .order('cree_le', { ascending: false })
      .limit(20)

    if (!pronos?.length) continue

    const dernier = pronos[0].resultat
    let streak = 0
    for (const p of pronos) {
      if (p.resultat === dernier) streak++
      else break
    }

    // Série en cours ≥ 2
    if (streak >= 2) {
      const feu = dernier === 'correct'
      evenements.push({
        icone: feu ? '🔥' : '❄️',
        texte: feu
          ? `${pseudo} est sur une série de ${streak} pronos réussis !`
          : `${pseudo} est sur une série de ${streak} pronos ratés ! Aïe aïe !`,
        couleur: feu ? 'var(--success)' : 'var(--danger)',
      })
      continue
    }

    // Série cassée — vérifier si avant le dernier prono il y avait une série ≥ 2
    if (pronos.length >= 3) {
      const avantDernier = pronos[1].resultat
      let streakPrecedent = 0
      for (let i = 1; i < pronos.length; i++) {
        if (pronos[i].resultat === avantDernier) streakPrecedent++
        else break
      }

      // Série précédente ≥ 2 correcte, maintenant cassée
      if (streakPrecedent >= 2 && avantDernier === 'correct' && dernier === 'incorrect') {
        evenements.push({
          icone: '💔',
          texte: `${pseudo} vient de briser sa série de ${streakPrecedent} pronos réussis ! Aïe !`,
          couleur: 'var(--orange)',
        })
      }
    }
  }

  return evenements
}

async function chargerMessages(groupeId) {
  const { data } = await supabase
    .from('messages')
    .select('id, contenu, cree_le, user_id, profils(pseudo)')
    .eq('groupe_id', groupeId)
    .order('cree_le', { ascending: false })
    .limit(3)
  return (data || []).reverse()
}

function ChatMiniLigue({ groupe, userId }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const intervalRef = useRef(null)

  const charger = async () => {
    const msgs = await chargerMessages(groupe.groupe_id)
    setMessages(msgs)
  }

  useEffect(() => {
    charger()
    // Polling 30s
    intervalRef.current = setInterval(charger, 30000)
    return () => clearInterval(intervalRef.current)
  }, [groupe.groupe_id])

  const envoyer = async () => {
    const contenu = texte.trim()
    if (!contenu || envoi) return
    setEnvoi(true)
    await supabase.from('messages').insert({
      user_id: userId,
      groupe_id: groupe.groupe_id,
      contenu,
    })
    track(userId, 'clic_vestiaire', '/accueil', { action: 'message', groupe_id: groupe.groupe_id })
    setTexte('')
    await charger()
    setEnvoi(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
  }

  return (
    <div style={{ marginTop: 10 }}>
      {/* En-tête ligue */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#555',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>💬</span> {groupe.nom}
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12, color: '#888', margin: 0, paddingLeft: 4 }}>
            Aucun message — soyez les premiers à chambrer 🏀
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
      </div>

      {/* Input envoi */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Un message..."
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
  const [groupes, setGroupes] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!userId) return

    const init = async () => {
      // Streaks
      const evts = await genererEvenements(userId)
      setEvenements(evts)

      // Ligues en cours de l'user
      const maintenant = new Date().toISOString()
      const { data } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(nom, date_debut, date_fin)')
        .eq('user_id', userId)
        .eq('actif', true)

      const liguesEnCours = (data || []).filter(m => {
        const g = m.groupes
        if (!g) return false
        const debut = g.date_debut ? new Date(g.date_debut) : null
        const fin   = g.date_fin   ? new Date(g.date_fin)   : null
        if (debut && new Date() < debut) return false
        if (fin   && new Date() > fin)   return false
        return true
      }).map(m => ({ groupe_id: m.groupe_id, nom: m.groupes.nom }))

      setGroupes(liguesEnCours)
      setChargement(false)
    }

    init()
  }, [userId])

  const rien = !chargement && !evenements.length && !groupes.length
  if (rien) return null

  return (
    <div style={{ background: '#f0ede8', padding: '12px 16px 14px 16px', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: '#0d0d12', letterSpacing: '0.02em', lineHeight: 1 }}>LE</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: '#6366f1', letterSpacing: '0.02em', lineHeight: 1 }}>VESTIAIRE</span>
      </div>

      {/* Streaks */}
      {evenements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {chargement ? (
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>…</p>
          ) : (
            evenements.map((evt, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                background: 'rgba(0,0,0,0.04)',
                borderLeft: `3px solid ${evt.couleur}`,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{evt.icone}</span>
                <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500, lineHeight: 1.4 }}>
                  {evt.texte}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chats par ligue — encart foncé contrasté */}
      {!chargement && groupes.length > 0 && (
        <div style={{
          background: '#e8e4dc',
          borderRadius: 4,
          padding: '12px 14px',
          marginTop: evenements.length ? 14 : 0,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {groupes.map(groupe => (
            <ChatMiniLigue key={groupe.groupe_id} groupe={groupe} userId={userId} />
          ))}
        </div>
      )}
    </div>
  )
}

export default LeVestiaire