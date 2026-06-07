// src/context/ProfilContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ajouterXP, calculerSerieConnexion, verifierMissions } from '../services/xp'
import { lundiFin } from '../services/points'
import { track } from '../services/tracker'

const ProfilContext = createContext(null)

export function ProfilProvider({ children }) {
  const [profil, setProfil] = useState(null)

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profils')
        .select('pseudo, avatar_url')
        .eq('id', user.id)
        .single()
      setProfil(data)

      // XP connexion quotidienne (+5, 1×/jour)
      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      const { data: dejaConnecte } = await supabase
        .from('xp_log')
        .select('date_jour')
        .eq('user_id', user.id)
        .eq('source_id', 'connexion_quotidienne')
        .order('date_jour', { ascending: false })
        .limit(1)

      const derniereConnexion = dejaConnecte?.[0]?.date_jour?.slice(0, 10)
      if (derniereConnexion !== jourParis) {
        await ajouterXP(user.id, 5, 'passif', 'connexion_quotidienne')
      }

      // Tracking session_start avec snapshot profil enrichi
      const { data: snap } = await supabase
        .from('profils').select('niveau, xp_total, badges').eq('id', user.id).single()
      const { count: nbPronos } = await supabase
        .from('pronos').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).neq('resultat', 'en_attente')
      const { count: nbLigues } = await supabase
        .from('membres_groupe').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('actif', true)
      track(user.id, 'session_start', '/accueil', {
        niveau:    snap?.niveau   || 1,
        xp_total:  snap?.xp_total || 0,
        nb_badges: snap?.badges?.length || 0,
        nb_pronos: nbPronos || 0,
        nb_ligues: nbLigues || 0,
      })

      // Missions série connexion consécutive — mode set (valeur absolue)
      const serie = await calculerSerieConnexion(user.id)
      await verifierMissions(user.id, 'serie_connexion', serie, null, 'set')

      // Mission connexion hebdo — jours distincts cette semaine (mode set)
      const { data: connexionsSemaine } = await supabase
        .from('xp_log')
        .select('date_jour')
        .eq('user_id', user.id)
        .eq('source_id', 'connexion_quotidienne')
        .gte('date_jour', lundiFin())
      const joursDistincts = new Set(connexionsSemaine?.map(r => r.date_jour.slice(0, 10)) || []).size
      await verifierMissions(user.id, 'connexion_semaine', joursDistincts, lundiFin(), 'set')
    }

    charger()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) charger()
      else setProfil(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <ProfilContext.Provider value={{ profil, setProfil }}>
      {children}
    </ProfilContext.Provider>
  )
}

export const useProfil = () => useContext(ProfilContext)
