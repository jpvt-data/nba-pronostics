import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TYPES_SAISON = [
  { value: '',  label: 'Toutes (ligue générale)' },
  { value: '2', label: 'Saison régulière' },
  { value: '3', label: 'Playoffs' },
  { value: '4', label: 'NBA Cup' },
]

const ANNEE_COURANTE = new Date().getFullYear()
const ANNEES = [ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1]

function CreerGroupe({ onSuccess }) {
  const [nom, setNom]             = useState('')
  const [dateFin, setDateFin]     = useState('')
  const [typeSaison, setType]     = useState('')
  const [saison, setSaison]       = useState(String(ANNEE_COURANTE))
  const [erreur, setErreur]       = useState(null)
  const [charg, setCharg]         = useState(false)

  const gererCreation = async () => {
    setCharg(true); setErreur(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('groupes')
      .insert({
        nom,
        admin_id:        user.id,
        date_fin:        dateFin || null,
        code_invitation: null,
        type_saison:     typeSaison ? parseInt(typeSaison) : null,
        saison:          typeSaison ? parseInt(saison) : null,
      })
    if (error) { setErreur('Erreur lors de la création'); setCharg(false); return }
    onSuccess()
    setCharg(false)
  }

  return (
    <div style={S.bloc}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Nouvelle ligue</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        <input
          type="text"
          placeholder="Nom de la ligue (ex: Playoffs 2026)"
          value={nom}
          onChange={e => setNom(e.target.value)}
          style={S.input}
        />

        <div>
          <label style={S.label}>Type de compétition</label>
          <select value={typeSaison} onChange={e => setType(e.target.value)} style={S.input}>
            {TYPES_SAISON.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {typeSaison && (
          <div>
            <label style={S.label}>Saison ESPN</label>
            <select value={saison} onChange={e => setSaison(e.target.value)} style={S.input}>
              {ANNEES.map(a => (
                <option key={a} value={String(a)}>
                  {a - 1}-{String(a).slice(2)} (ESPN {a})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={S.label}>Date de fin (optionnelle)</label>
          <input
            type="date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            style={S.input}
          />
        </div>

        {erreur && <div style={S.erreur}>{erreur}</div>}

        <button
          onClick={gererCreation}
          disabled={charg || !nom.trim()}
          style={{ ...S.btn, opacity: charg || !nom.trim() ? 0.5 : 1 }}
        >
          {charg ? 'Création…' : 'Créer la ligue'}
        </button>
      </div>
    </div>
  )
}

const S = {
  bloc: {
    background: 'var(--bg-1)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-md)', padding: '16px',
  },
  label: {
    fontSize: 11, color: 'var(--text-3)',
    display: 'block', marginBottom: 4,
  },
  input: {
    background: 'var(--bg-2)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)', fontSize: 14, padding: '10px 12px',
    outline: 'none', width: '100%', fontFamily: 'var(--font-body)',
  },
  erreur: {
    fontSize: 13, color: 'var(--danger)', background: 'var(--danger-dim)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  },
  btn: {
    background: 'var(--accent)', borderWidth: 0,
    borderRadius: 'var(--radius-sm)', color: '#fff',
    fontSize: 13, fontWeight: 600, padding: '10px',
    cursor: 'pointer', width: '100%', fontFamily: 'var(--font-body)',
  },
}

export default CreerGroupe