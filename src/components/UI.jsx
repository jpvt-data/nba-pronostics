// Composants UI partagés — modifier ici applique partout

export const LabelSection = ({ children }) => (
  <h3 style={{
    display: 'inline-block',
    background: 'linear-gradient(90deg, var(--accent), var(--orange))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: '0.1em', fontSize: 13, fontWeight: 700, margin: 0,
  }}>{children}</h3>
)

export const BanniereImage = ({ url, hauteur = 110 }) => (
  <div style={{
    margin: '25px 0 25px', height: hauteur,
    backgroundImage: `linear-gradient(to right, rgba(13,13,18,0.75), rgba(13,13,18,0.35), rgba(13,13,18,0.75)), url(${url})`,
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(99,102,241,0.2)',
    borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(99,102,241,0.2)',
  }} />
)

export const Bloc = ({ children, style = {} }) => (
  <div style={{
    borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
    padding: '16px',
    ...style,
  }}>
    {children}
  </div>
)