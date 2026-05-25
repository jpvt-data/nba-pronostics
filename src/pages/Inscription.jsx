import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

function Inscription() {
  const [pseudo, setPseudo]       = useState('')
  const [email, setEmail]         = useState('')
  const [motDePasse, setMdp]      = useState('')
  const [erreur, setErreur]       = useState(null)
  const [chargement, setCharg]    = useState(false)
  const navigate = useNavigate()

  const gererInscription = async (e) => {
    e.preventDefault()
    setCharg(true)
    setErreur(null)

    const { data, error } = await supabase.auth.signUp({ email, password: motDePasse })
    if (error) { setErreur(error.message); setCharg(false); return }

    const { error: errProfil } = await supabase
      .from('profils').insert({ id: data.user.id, pseudo })
    if (errProfil) { setErreur('Ce pseudo est déjà pris'); setCharg(false); return }

    navigate('/accueil')
    setCharg(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={S.logoDot} />
          NBA PRONOS
        </div>
        <p style={S.sub}>Crée ton compte et rejoins la ligue 🏀</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Pseudo', type: 'text',     val: pseudo,    set: setPseudo, ph: 'MonPseudo' },
            { label: 'Email',  type: 'email',    val: email,     set: setEmail,  ph: 'ton@email.com' },
            { label: 'Mot de passe', type: 'password', val: motDePasse, set: setMdp, ph: '••••••••' },
          ].map(({ label, type, val, set, ph }) => (
            <div key={label} style={S.champ}>
              <label style={S.label}>{label}</label>
              <input
                type={type}
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={ph}
                required
                minLength={type === 'password' ? 6 : undefined}
                style={S.input}
              />
            </div>
          ))}
        </div>

        {erreur && <div style={S.erreur}>{erreur}</div>}

        <button
          onClick={gererInscription}
          disabled={chargement}
          style={{ ...S.btn, opacity: chargement ? 0.6 : 1 }}
        >
          {chargement ? 'Inscription…' : "S'inscrire"}
        </button>

        <p style={S.lien}>
          Déjà un compte ?{' '}
          <Link to="/connexion" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

/* styles partagés — identiques à Connexion */
const S = {
  page: {
    minHeight: '100svh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem', background: 'var(--bg-0)',
  },
  card: {
    width: '100%', maxWidth: 380,
    background: 'var(--bg-1)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
    letterSpacing: '0.08em', color: '#fff',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logoDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'var(--accent)', display: 'inline-block',
  },
  sub:   { fontSize: 14, color: 'var(--text-3)', marginTop: -8 },
  champ: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text-2)' },
  input: {
    background: 'var(--bg-2)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)', fontSize: 14, padding: '10px 12px',
    outline: 'none', width: '100%', fontFamily: 'var(--font-body)',
  },
  erreur: {
    fontSize: 13, color: 'var(--danger)',
    background: 'var(--danger-dim)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  },
  btn: {
    background: 'var(--accent)', borderWidth: 0,
    borderRadius: 'var(--radius-sm)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    padding: '12px', cursor: 'pointer', width: '100%',
    fontFamily: 'var(--font-body)',
  },
  lien: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center' },
}

export default Inscription