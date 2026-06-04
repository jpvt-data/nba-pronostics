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

      // XP — connexion quotidienne (+5, 1×/jour)
      const maintenant = new Date()
      const debutJourParis = new Date(maintenant.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) + 'T00:00:00+02:00')
      const aujourdhui = debutJourParis.toISOString()
      const { data: dejaConnecte } = await supabase
        .from('xp_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_id', 'connexion_quotidienne')
        .gte('cree_le', aujourdhui)
        .limit(1)

      if (!dejaConnecte || dejaConnecte.length === 0) {
        await ajouterXP(user.id, 5, 'passif', 'connexion_quotidienne')
      }
    }
    charger()

    // Rafraîchir si l'avatar/pseudo change (ex. après édition dans Profil)
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
