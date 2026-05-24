import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Connexion from './pages/Connexion'
import Inscription from './pages/Inscription'
import Accueil from './pages/Accueil'
import Groupes from './pages/Groupes'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Récupère la session active au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Écoute les changements de session (connexion / déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Chargement initial
  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={!session ? <Connexion /> : <Navigate to="/accueil" />} />
        <Route path="/inscription" element={!session ? <Inscription /> : <Navigate to="/accueil" />} />
        <Route path="/accueil" element={session ? <Accueil /> : <Navigate to="/connexion" />} />
        <Route path="*" element={<Navigate to={session ? '/accueil' : '/connexion'} />} />
        <Route path="/groupes" element={session ? <Groupes /> : <Navigate to="/connexion" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App