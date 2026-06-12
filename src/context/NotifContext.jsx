// src/context/NotifContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [queue, setQueue] = useState([])

  // Ajoute une notif à la file — ignorée si même id déjà présent
  const pushNotif = useCallback((notif) => {
    if (!notif?.id) return
    setQueue(prev => {
      if (prev.some(n => n.id === notif.id)) return prev
      return [...prev, notif]
    })
  }, [])

  // Ajoute plusieurs notifs d'un coup (dédupliquées)
  const pushNotifs = useCallback((notifs) => {
    if (!notifs?.length) return
    setQueue(prev => {
      const existants = new Set(prev.map(n => n.id))
      const nouvelles = notifs.filter(n => n?.id && !existants.has(n.id))
      return [...prev, ...nouvelles]
    })
  }, [])

  // Dépile la première notif
  const depilerNotif = useCallback(() => {
    setQueue(prev => prev.slice(1))
  }, [])

  return (
    <NotifContext.Provider value={{ queue, pushNotif, pushNotifs, depilerNotif }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotif() {
  return useContext(NotifContext)
}
