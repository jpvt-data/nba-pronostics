/* Composant Avatar — utilisé dans Navigation, MesPronos, Classement, Profil */

export const couleurAvatar = (pseudo) => {
  const couleurs = ['#6366f1','#f97316','#22c55e','#ef4444','#a855f7','#06b6d4','#f59e0b','#ec4899']
  const idx = (pseudo?.charCodeAt(0) || 0) % couleurs.length
  return couleurs[idx]
}

export function Avatar({ url, pseudo, taille = 40, fontSize = 14 }) {
  if (url) return (
    <img src={url} alt={pseudo} style={{
      width: taille, height: taille, borderRadius: '50%',
      objectFit: 'cover', flexShrink: 0, background: 'var(--bg-2)',
    }} />
  )
  return (
    <div style={{
      width: taille, height: taille, borderRadius: '50%',
      background: couleurAvatar(pseudo),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      {(pseudo || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}
