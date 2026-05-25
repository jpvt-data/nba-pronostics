import { useState } from 'react'
import { supabase } from '../lib/supabase'

const genererCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return 'NBA-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function CreerGroupe({ onSuccess }) {
  const [nom, setNom]        = useState('')
  const [erreur, setErreur]  = useState(null)
  const [charg, setCharg]    = useState(false)

  const gererCreation = async (e) => {
    e.preventDefault()
    setCharg(true); setErreur(null)
    const { data: { user } } = await supabase.auth.getUser()
    const code = genererCode()
    const { data: groupe, error } = await supabase
      .from('groupes').insert({ nom, code_invitation: code, admin_id: user.id })
      .select().single()
    if (error) { setErreur('Erreur lors de la création'); setCharg(false); return }
    await supabase.from('membres_groupe').insert({ groupe_id: groupe.id, user_id: user.id })
    onSuccess()
    setCharg(false)
  }

  return (
    <div style={S.bloc}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Créer un groupe</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="Nom du groupe"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
          style={S.input}
        />
        {erreur && <div style={S.erreur}>{erreur}</div>}
        <button
          onClick={gererCreation}
          disabled={charg || !nom.trim()}
          style={{ ...S.btn, opacity: charg || !nom.trim() ? 0.5 : 1 }}
        >
          {charg ? 'Création…' : 'Créer le groupe'}
        </button>
      </div>
    </div>
  )
}

const S = {
  bloc: {
    background: 'var(--bg-1)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-md)', padding: '16px',
  },
  input: {
    background: 'var(--bg-2)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)', fontSize: 14, padding: '10px 12px',
    outline: 'none', width: '100%', fontFamily: 'var(--font-body)',
  },
  erreur: {
    fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  },
  btn: {
    background: 'var(--accent)', borderWidth: 0,
    borderRadius: 'var(--radius-sm)', color: '#fff',
    fontSize: 13, fontWeight: 600, padding: '10px',
    cursor: 'pointer', width: '100%', fontFamily: 'var(--font-body)',
  },
}

export default CreerGroupe