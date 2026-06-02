import { useState, useEffect } from 'react'
import { useNoSpoil } from '../context/NoSpoilContext'
import { EyeOff } from 'lucide-react'
import { fetchFeedBasketUSA } from './BanniereFeed'

export default function NewsNBA({ onFeedCharge }) {
  const [news, setNews]             = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState(false)
  const { noSpoil }                 = useNoSpoil()

  useEffect(() => {
    fetchFeedBasketUSA()
      .then(articles => {
        // Article 0 = bannière (géré dans Accueil) — on passe au parent via callback
        if (onFeedCharge) onFeedCharge(articles[0] || null)
        // Articles 1 à 5 ici
        setNews(articles.slice(1, 6))
        setChargement(false)
      })
      .catch(() => {
        setErreur(true)
        setChargement(false)
      })
  }, [])

  if (erreur || (!chargement && news.length === 0)) return null

  return (
    <div style={{ borderLeft: '3px solid var(--orange)', padding: '0 16px 12px 16px' }}>
      {noSpoil ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 12, padding: '10px 12px',
          background: 'rgba(99,102,241,0.06)',
          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.15)',
        }}>
          <EyeOff size={14} color="var(--text-3)" />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Actus masquées — mode No Spoil activé
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 12 }}>
          {chargement ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Chargement…</p>
          ) : (
            news.map((article, i) => (
              <a
                key={i}
                href={article.lien || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '9px 0',
                  borderBottomWidth: i < news.length - 1 ? 1 : 0,
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--border)',
                  textDecoration: 'none',
                }}
              >
                {/* Thumbnail */}
                {article.image && (
                  <img
                    src={article.image}
                    alt=""
                    style={{ width: 56, height: 42, objectFit: 'cover', flexShrink: 0, borderRadius: 2 }}
                  />
                )}
                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-1)',
                    lineHeight: 1.35, display: 'block',
                  }}>
                    {article.titre}
                  </span>
                  {article.resume && (
                    <span style={{
                      fontSize: 11, color: 'var(--text-3)', lineHeight: 1.35,
                      display: 'block', marginTop: 2,
                    }}>
                      {article.resume}…
                    </span>
                  )}
                </div>
              </a>
            ))
          )}
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '10px 0 0' }}>
        Source :{' '}
        <a href="https://www.basketusa.com" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-3)', textDecoration: 'underline' }}>
          Basket USA
        </a>
      </p>
    </div>
  )
}
