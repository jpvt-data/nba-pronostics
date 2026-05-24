import { useState } from 'react'
import { supabase } from '../lib/supabase'

function RejoindreGroupe({ onSuccess }) {
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  const gererRejoindre = async (e) => {
    e.preventDefault()
    setChargement(true)
    setErreur(null)

    const { data: { user } } = await supabase.auth.getUser()

    // Recherche du groupe par code
    const { data: groupe, error } = await supabase
      .from('groupes')
      .select('id, nom')
      .eq('code_invitation', code.toUpperCase())
      .single()

    if (error || !groupe) {
      setErreur('Code invalide')
      setChargement(false)
      return
    }

    // Vérifie si déjà membre (même inactif)
    const { data: existant } = await supabase
      .from('membres_groupe')
      .select('id, actif')
      .eq('groupe_id', groupe.id)
      .eq('user_id', user.id)
      .single()

    if (existant) {
      if (existant.actif) {
        setErreur('Tu es déjà dans ce groupe')
      } else {
        // Réactivation
        await supabase
          .from('membres_groupe')
          .update({ actif: true })
          .eq('id', existant.id)
        onSuccess()
      }
      setChargement(false)
      return
    }

    // Nouveau membre
    await supabase
      .from('membres_groupe')
      .insert({ groupe_id: groupe.id, user_id: user.id })

    onSuccess()
    setChargement(false)
  }

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #444', borderRadius: 8 }}>
      <h3>Rejoindre un groupe</h3>
      <form onSubmit={gererRejoindre}>
        <input
          type="text"
          placeholder="Code d'invitation (ex: NBA-X7K2)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
        <button type="submit" disabled={chargement}>
          {chargement ? 'Recherche...' : 'Rejoindre'}
        </button>
      </form>
    </div>
  )
}

export default RejoindreGroupe