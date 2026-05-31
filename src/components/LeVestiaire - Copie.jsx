import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { LabelSection, Bloc } from '../components/UI'
import { Send } from 'lucide-react'

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
        fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>💬</span> {groupe.nom}
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, paddingLeft: 4 }}>
            Aucun message — soyez les premiers à chambrer 🏀
          </p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              padding: '7px 10px',
              background: msg.user_id === userId ? 'var(--accent-dim)' : 'rgba(255,255,255,0.02)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: msg.user_id === userId ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>
                    {msg.profils?.pseudo || '—'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    {msg.contenu}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
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
            background: 'var(--bg-2)',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 10px', color: 'var(--text-1)',
            outline: 'none',
          }}
        />
        <button
          onClick={envoyer}
          disabled={!texte.trim() || envoi}
          style={{
            background: 'var(--accent)', borderWidth: 0,
            borderRadius: 'var(--radius-sm)',
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
    <Bloc>
      <LabelSection>Le Vestiaire</LabelSection>

      {/* Streaks */}
      {evenements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {chargement ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>…</p>
          ) : (
            evenements.map((evt, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{evt.icone}</span>
                <span style={{ fontSize: 13, color: evt.couleur, fontWeight: 500, lineHeight: 1.4 }}>
                  {evt.texte}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chats par ligue */}
      {!chargement && groupes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: evenements.length ? 16 : 10 }}>
          {groupes.length > 1 && evenements.length > 0 && (
            <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)' }} />
          )}
          {groupes.map(groupe => (
            <ChatMiniLigue key={groupe.groupe_id} groupe={groupe} userId={userId} />
          ))}
        </div>
      )}
    </Bloc>
  )
}

export default LeVestiaire