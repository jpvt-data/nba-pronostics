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

const MentionsLegales = () => (
  <div>
    <Navigation />
    <div style={{ marginTop: 20 }}>
      <TitreSection label="MENTIONS LÉGALES" />
    </div>

    <div style={{ margin: '20px 16px 32px' }}>

      <SousTitre label="Éditeur" />
      <Paragraphe>
        Swish League est un projet personnel développé et édité par Jean-Paul Van Tongeren,
        à titre non professionnel et non commercial. Contact :{' '}
        <a href="mailto:contact@prismora.fr" style={{ color: 'var(--accent)' }}>contact@prismora.fr</a>.
      </Paragraphe>

      <SousTitre label="Hébergement" />
      <Paragraphe>
        Application web : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.<br />
        Base de données, authentification et stockage : Supabase Inc.
      </Paragraphe>

      <SousTitre label="Propriété intellectuelle" />
      <Paragraphe>
        Les noms d'équipes, de joueurs et toute référence à la NBA sont utilisés à titre
        purement informatif, dans le cadre d'un usage de passion entre amis. Swish League
        n'est affilié à, ni approuvé par, la NBA ou l'une de ses franchises.
      </Paragraphe>

      <SousTitre label="Données personnelles" />
      <Paragraphe>
        L'utilisation de Swish League implique la collecte des données suivantes : pseudo,
        adresse email (authentification), avatar, et données de jeu (pronos, XP, classement,
        collection de cartes). Ces données sont stockées chez Supabase et ne sont ni vendues,
        ni partagées avec des tiers, ni utilisées à des fins publicitaires.
      </Paragraphe>
      <Paragraphe>
        Aucun cookie de tracking publicitaire n'est utilisé — seul un cookie de session,
        nécessaire à l'authentification, est déposé sur ton navigateur.
      </Paragraphe>
      <Paragraphe>
        Conformément au RGPD, tu peux à tout moment demander la consultation, la rectification
        ou la suppression de tes données en écrivant à l'adresse ci-dessus.
      </Paragraphe>

      <SousTitre label="Responsabilité" />
      <Paragraphe>
        Swish League est un projet de passion, développé et maintenu par une seule personne,
        sans garantie de disponibilité continue ni d'absence d'erreur.
      </Paragraphe>

    </div>
  </div>
)

export default MentionsLegales
