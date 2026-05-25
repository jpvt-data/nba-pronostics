import { useState } from 'react'
import { supabase } from '../lib/supabase'

function RejoindreGroupe({ onSuccess }) {
  const [code, setCode]      = useState('')
  const [erreur, setErreur]  = useState(null)
  const [charg, setCharg]    = useState(false)

  const gererRejoindre = async (e) => {
    e.preventDefault()
    setCharg(true); setErreur(null)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: groupe, error } = await supabase
      .from('groupes').select('id, nom')
      .eq('code_invitation', code.toUpperCase().trim()).single()
    if (error || !groupe) { setErreur('Code invalide'); setCharg(false); return }

    const { data: existant } = await supabase
      .from('membres_groupe').select('id, actif')
      .eq('groupe_id', groupe.id).eq('user_id', user.id).single()

    if (existant) {
      if (existant.actif) { setErreur('Tu es déjà dans ce groupe'); setCharg(false); return }
      await supabase.from('membres_groupe').update({ actif: true }).eq('id', existant.id)
    } else {
      await supabase.from('membres_groupe').insert({ groupe_id: groupe.id, user_id: user.id })
    }
    onSuccess()
    setCharg(false)
  }

  return (
    <div style={S.bloc}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Rejoindre un groupe</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="Code d'invitation (ex: NBA-X7K2)"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          style={{ ...S.input, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', fontSize: 15 }}
        />
        {erreur && <div style={S.erreur}>{erreur}</div>}
        <button
          onClick={gererRejoindre}
          disabled={charg || !code.trim()}
          style={{ ...S.btn, opacity: charg || !code.trim() ? 0.5 : 1 }}
        >
          {charg ? 'Recherche…' : 'Rejoindre'}
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

export default RejoindreGroupe