import { createContext, useContext, useState } from 'react'

const NoSpoilContext = createContext()

export function NoSpoilProvider({ children }) {
  const [noSpoil, setNoSpoil] = useState(
    () => localStorage.getItem('mode_no_spoil') === 'false'
  )

  const toggleNoSpoil = () => {
    setNoSpoil(v => {
      localStorage.setItem('mode_no_spoil', String(!v))
      return !v
    })
  }

  return (
    <NoSpoilContext.Provider value={{ noSpoil, toggleNoSpoil }}>
      {children}
    </NoSpoilContext.Provider>
  )
}

export const useNoSpoil = () => useContext(NoSpoilContext)