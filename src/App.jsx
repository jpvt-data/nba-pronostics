import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Connexion    from './pages/Connexion'
import Inscription  from './pages/Inscription'
import Accueil      from './pages/Accueil'
import Groupes      from './pages/Groupes'
import Classement   from './pages/Classement'
import MesPronos    from './pages/MesPronos'
import MatchDetail  from './pages/MatchDetail'
import Calendrier   from './pages/Calendrier'
import Profil       from './pages/Profil'
import PopupChangelog from './components/PopupChangelog'
import { NoSpoilProvider } from './context/NoSpoilContext'
import { ProfilProvider } from './context/ProfilContext'
import Stats from './pages/Stats'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  const prive   = (el) => session ? el : <Navigate to="/connexion" />
  const public_ = (el) => !session ? el : <Navigate to="/accueil" />

  return (
    <NoSpoilProvider>
      <ProfilProvider>
      <BrowserRouter>
        {session && <PopupChangelog />}
        <Routes>
          <Route path="/connexion"       element={public_(<Connexion />)} />
          <Route path="/inscription"     element={public_(<Inscription />)} />
          <Route path="/accueil"         element={prive(<Accueil />)} />
          <Route path="/classement"      element={prive(<Classement />)} />
          <Route path="/mes-pronos"      element={prive(<MesPronos />)} />
          <Route path="/groupes"         element={prive(<Groupes />)} />
          <Route path="/match/:espn_id"  element={prive(<MatchDetail />)} />
          <Route path="/calendrier"      element={prive(<Calendrier />)} />
          <Route path="/profil"          element={prive(<Profil />)} />
          <Route path="/stats"           element={prive(<Stats />)} />
          <Route path="*"                element={<Navigate to={session ? '/accueil' : '/connexion'} />} />
        </Routes>
      </BrowserRouter>
      </ProfilProvider>
    </NoSpoilProvider>
  )
}

export default App
