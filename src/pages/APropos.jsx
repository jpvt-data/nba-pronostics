import Navigation from '../components/Navigation'

// Bandeau oblique titre de page - cf socle section 3
const TitreSection = ({ label, couleur = 'var(--accent)' }) => (
  <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 500 46">
      <polygon points="0,0 260,0 240,46 0,46" fill={couleur} />
    </svg>
    <span style={{
      position: 'absolute', top: '50%', left: 16, transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
  </div>
)

// Sous-titre sobre - cf socle section 3
const SousTitre = ({ label, couleur = 'var(--text-3)' }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: couleur, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
    {label}
  </div>
)

const Paragraphe = ({ children }) => (
  <p style={{
    fontFamily: "'Outfit', system-ui, sans-serif",
    fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)',
    margin: '0 0 18px',
  }}>
    {children}
  </p>
)

const APropos = () => (
  <div>
    <Navigation />
    <div style={{ marginTop: 20 }}>
      <TitreSection label="À PROPOS" />
    </div>

    <div style={{ margin: '20px 16px 32px' }}>

      <div style={{
        fontFamily: "'Teko', system-ui, sans-serif", fontStyle: 'italic', fontWeight: 700,
        fontSize: 22, color: 'var(--text-1)', letterSpacing: '0.01em', marginBottom: 4,
      }}>
        Pronostique. Flambe. Règne.
      </div>

      <SousTitre label="Le projet" couleur="var(--accent)" />
      <Paragraphe>
        Swish League est née d'une envie simple : vivre la saison NBA à fond entre potes,
        sans prise de tête. Pronos, classements, stats, et une bonne dose de progression
        pour pimenter chaque connexion — la compétition amicale comme moteur, la passion
        NBA comme carburant.
      </Paragraphe>

      <SousTitre label="Qui est derrière" couleur="var(--accent)" />
      <Paragraphe>
        Développée, designée et maintenue en solo par JPVT — sans équipe, sans budget,
        juste l'envie de construire quelque chose qui tienne la route pour son groupe
        de potes passionnés de NBA.
      </Paragraphe>

      <SousTitre label="Comment ça marche" couleur="var(--accent)" />
      <Paragraphe>
        Tu pronostiques les matchs NBA, tu gagnes des points selon les règles de ta ligue,
        tu progresses en XP et en niveau, et tu débloques des cartes de collection au fil
        de tes connexions, tes pronos réussis et tes passages de niveau. Le tout en
        comparaison directe avec les autres membres de ta ligue.
      </Paragraphe>

      <SousTitre label="Contact" couleur="var(--accent)" />
      <Paragraphe>
        Une question, un bug, une idée ?{' '}
        {/* TODO JPVT : remplacer par ton email de contact réel */}
        <a href="mailto:contact@swish-league.app" style={{ color: 'var(--accent)' }}>contact@swish-league.app</a>
      </Paragraphe>

    </div>
  </div>
)

export default APropos
