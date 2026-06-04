import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ajouterXP } from '../services/xp'

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

      // XP — connexion quotidienne (+5, 1×/jour) — comparaison via date_jour (Paris)
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
