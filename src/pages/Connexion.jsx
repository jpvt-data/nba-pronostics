import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const navigate = useNavigate()

  const gererConnexion = async (e) => {
    e.preventDefault()
    setChargement(true)
    setErreur(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })

    if (error) {
      setErreur('Email ou mot de passe incorrect')
    } else {
      navigate('/accueil')
    }
    setChargement(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 1rem' }}>
      <h1>Connexion</h1>
      <form onSubmit={gererConnexion}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
        </div>
        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
        <button type="submit" disabled={chargement}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p>Pas encore de compte ? <Link to="/inscription">S'inscrire</Link></p>
    </div>
  )
}

export default Connexion