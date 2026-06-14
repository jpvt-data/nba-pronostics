import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Connexion      from './pages/Connexion'
import Inscription    from './pages/Inscription'
import Accueil        from './pages/Accueil'
import Groupes        from './pages/Groupes'
import Classement     from './pages/Classement'
import MesPronos      from './pages/MesPronos'
import MatchDetail    from './pages/MatchDetail'
import Calendrier     from './pages/Calendrier'
import Profil         from './pages/Profil'
import Stats          from './pages/Stats'
import QuoiDeNeuf     from './pages/QuoiDeNeuf'
import PopupChangelog from './components/PopupChangelog'
import PopupActu      from './components/PopupActu'
import NotifGaming    from './components/NotifGaming'
import { NoSpoilProvider }  from './context/NoSpoilContext'
import { ProfilProvider }   from './context/ProfilContext'
import { NotifProvider }    from './context/NotifContext'
import H2H   from './pages/H2H'
import Admin from './pages/Admin'

function App() {
  const [session, setSession]         = useState(undefined)
  const [popupFerme, setPopupFerme]   = useState(false)
  const [actu, setActu]               = useState(null)
  const [actuFermee, setActuFermee]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Charger l'actu active au login
  useEffect(() => {
    if (!session) return
    const chargerActu = async () => {
      const { data } = await supabase
        .from('actu_app')
        .select('*')
        .eq('actif', true)
        .order('cree_le', { ascending: false })
        .limit(1)
      if (!data?.[0]) return
      const a = data[0]
      const dejaVue = localStorage.getItem(`swish_actu_${a.id}`)
      if (!dejaVue) setActu(a)
    }
    chargerActu()
  }, [session])

  // Bloquer scroll : changelog ou actu visibles
  useEffect(() => {
    const bloquer = session && (!popupFerme || (actu && !actuFermee))
    document.body.style.overflow = bloquer ? 'hidden' : ''
  }, [session, popupFerme, actu, actuFermee])

  if (session === undefined) return null

  const prive   = (el) => session ? el : <Navigate to="/connexion" />
  const public_ = (el) => !session ? el : <Navigate to="/accueil" />

  const montrerChangelog = session && !popupFerme
  const montrerActu      = session && popupFerme && actu && !actuFermee

  return (
    <NoSpoilProvider>
      <ProfilProvider>
        <NotifProvider>
          <BrowserRouter>
            {montrerChangelog && <PopupChangelog onFermer={() => setPopupFerme(true)} />}
            {montrerActu && (
              <PopupActu
                actu={actu}
                onClose={() => setActuFermee(true)}
              />
            )}
            {session && <NotifGaming />}
            <Routes>
              <Route path="/connexion"      element={public_(<Connexion />)} />
              <Route path="/inscription"    element={<Inscription />} />
              <Route path="/accueil"        element={prive(<Accueil />)} />
              <Route path="/classement"     element={prive(<Classement />)} />
              <Route path="/mes-pronos"     element={prive(<MesPronos />)} />
              <Route path="/groupes"        element={prive(<Groupes />)} />
              <Route path="/match/:espn_id" element={prive(<MatchDetail />)} />
              <Route path="/calendrier"     element={prive(<Calendrier />)} />
              <Route path="/profil"         element={prive(<Profil />)} />
              <Route path="/stats"          element={prive(<Stats />)} />
              <Route path="/quoi-de-neuf"   element={prive(<QuoiDeNeuf />)} />
              <Route path="/h2h"            element={prive(<H2H />)} />
              <Route path="/admin"          element={prive(<Admin />)} />
              <Route path="*"               element={<Navigate to={session ? '/accueil' : '/connexion'} />} />
            </Routes>
          </BrowserRouter>
        </NotifProvider>
      </ProfilProvider>
    </NoSpoilProvider>
  )
}

export default App
