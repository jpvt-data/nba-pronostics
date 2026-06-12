# SWISH LEAGUE — SOCLE v4.6
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-11 (session 7)

---

## SOMMAIRE

1. [Projet & philosophie](#1-projet--philosophie)
2. [Identité visuelle & design system](#2-identité-visuelle--design-system)
3. [Charte graphique — règles appliquées](#3-charte-graphique--règles-appliquées)
4. [Sources de données ESPN](#4-sources-de-données-espn)
5. [Sources de données tierces](#5-sources-de-données-tierces)
6. [BDD Supabase](#6-bdd-supabase)
7. [Architecture fichiers](#7-architecture-fichiers)
8. [Navigation & routes](#8-navigation--routes)
9. [Fonctionnalités livrées](#9-fonctionnalités-livrées)
10. [Décisions produit](#10-décisions-produit)
11. [Risques ouverts](#11-risques-ouverts)
12. [Dette technique ouverte](#12-dette-technique-ouverte)
13. [Backlog — priorités](#13-backlog--priorités)
14. [Règles de travail](#14-règles-de-travail)
15. [RGPD & sécurité](#15-rgpd--sécurité)
16. [Veille technique](#16-veille-technique)
17. [Documents de référence complémentaires](#17-documents-de-référence-complémentaires)

---

## 1. Projet & philosophie

**App web NBA communautaire** — pronos, stats, scores, classements, système de progression RPG.
Nom de marque : **Swish League**.
Tagline : **"Pronostique. Flambe. Règne."** ✅ active partout (navbar, popup).

Périmètre : app de passion NBA, compétition amicale, passion commune, partage.
**L'objectif principal est la passion NBA, le suivi de la saison, la progression personnelle et la compétition amicale entre potes — pas le chambrage ou la mise en scène.**
Recrutement prévu : **septembre 2026** pour la présaison NBA (octobre).

**Philosophie :** "Les données d'abord, l'interface suit."
Mobile first. Rapide. Lisible. Fun. Sans surcharge.

### Stack technique — 100% gratuit
- **Front :** React + Vite
- **Deploy :** Vercel (Hobby, non-commercial)
- **Back :** Supabase (PostgreSQL + Auth + Storage) — ⚠️ pause après 1 semaine d'inactivité
- **CSS :** pas de framework — tokens CSS centralisés dans `index.css`
- **Icônes :** Lucide React (SVG inline pour cas spécifiques)
- **Fonts :** Outfit (body) + Barlow Condensed (display/scores) + Teko (titres de sections)

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskceooakyla.supabase.co

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE
**Logo :** texte Teko — "SWISH" `var(--nav-text)` + "LEAGUE" `var(--accent)`, tagline dessous
**Tagline :** "Pronostique · Flambe · Règne" — font Outfit, 7.5px, letter-spacing 0.14em, marginTop -1, paddingLeft 4

### Tokens CSS (index.css) — v3.1

```
--bg-0: #0d0d12        fond principal
--bg-1: #12121c        surfaces / blocs sombres
--bg-2: #1a1a2e        fonds secondaires
--border: #1e1e2e      bordures
--border-2: #2a2a3e    bordures secondaires
--accent: #6366f1      violet indigo (principal)
--accent-dim: rgba(99,102,241,0.12)
--accent-border: rgba(99,102,241,0.5)
--orange: #f97316      accent secondaire NBA
--success: #22c55e     correct / victoire
--success-dim: rgba(34,197,94,0.10)
--danger: #ef4444      raté / défaite
--danger-dim: rgba(239,68,68,0.10)
--gold: #f59e0b        streak / podium / XP / badges
--gold-dim: rgba(245,158,11,0.12)
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #8080a0      texte tertiaire / paragraphes
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--shadow-sm: 0 2px 8px rgba(0,0,0,0.4)
--shadow-md: 0 4px 16px rgba(0,0,0,0.5)
--font-body: 'Outfit', system-ui, sans-serif
--font-display: Barlow Condensed
--font-title: Teko
--nav-bg: #ffffff
--nav-border: #e8e8e8
--nav-text: #0d0d12
--nav-text-dim: #888
```

### Navbar mobile — v3.3
Hauteur : **52px**. `padding-top` de `#root` mobile : **52px**.

### Fond desktop — v3.2
4 halos violets symétriques aux 4 coins + box-shadow sur `#root`.

---

## 3. Charte graphique — règles appliquées

### Typographie

| Élément | Font | Taille | Poids | Token couleur |
|---|---|---|---|---|
| Titre page (header) | Teko | 36px | 600 | --text-1 + mot2 accent |
| Titre section | Teko | 24-28px | 600 | --text-1 + mot2 couleur sémantique |
| Scores / chiffres clés | Barlow Condensed | 32-44px | 700 | selon contexte |
| KPIs header Board | Barlow Condensed | clamp(32px,8vw,48px) | 700 | --text-1 / --accent |
| Pseudo header Board | Teko | clamp(26px,6vw,38px) | 700 | --accent |
| Titre RPG header Board | Teko | clamp(20px,4vw,26px) | 600 | --gold |
| Niveau header Board | Barlow Condensed | clamp(13px,2.5vw,16px) | 700 | --text-3 |
| Points classement | Barlow Condensed | 18px | 700 | --gold |
| Corps | Outfit | 12-14px | 400-600 | --text-2 / --text-3 |

### Titres bicolores Teko — règle stricte

```jsx
const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)', taille = 20 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)
```

### Espacement Board — v3.3
Séparateurs `<div style={{ height: 32 }} />` entre chaque section principale.

### Angles vifs — règle stricte
- Pas de `border-radius-lg` sur les blocs de contenu
- `border-radius-sm` (6px) uniquement sur boutons et inputs

### Couleurs sémantiques
- **--gold** : XP, niveaux, badges, streak, CLASSEMENT NBA, points, médailles
- **--accent** : éléments interactifs, TIMELINE, LIGUE EN COURS, ACTU NBA
- **--orange** : À LA UNE, BanniereFeed, EXPLORER
- **--success** : prono correct
- **--danger** : prono raté, blessés, admin

### Médailles classement — texte stylé (plus d'emojis)
```js
const MEDAILLES_STYLE = [
  { label: '#1', color: '#f59e0b' },
  { label: '#2', color: '#9ca3af' },
  { label: '#3', color: '#b45309' },
]
```

### Règle icônes — zéro emoji dans le code
Tous les emojis ont été remplacés par SVG inline Lucide-style ou points colorés.

### Couleurs tags ESPN

| Tag | Couleur |
|---|---|
| preseason | #6366f1 |
| regular | #9090b0 |
| nbacup | #f97316 |
| allstar | #f59e0b |
| playin | #22c55e |
| playoffs | #ef4444 |
| finals | #e11d48 |
| summer_league | #06b6d4 |

---

## 4. Sources de données ESPN

### Endpoints actuellement utilisés

```
Scoreboard NBA     : site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=500
Scoreboard SL      : site.api.espn.com/apis/site/v2/sports/basketball/nba-summer-las-vegas/scoreboard?dates=...
Summary NBA        : site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}
Summary SL         : site.web.api.espn.com/apis/site/v2/sports/basketball/nba-summer-las-vegas/summary?event={id}
Standings          : site.api.espn.com/apis/v2/sports/basketball/nba/standings?season={SAISON_ESPN}&seasontype={1|2|3}
Roster             : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster
Injuries           : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries
Stats joueur       : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats?season={year}&seasontype={1|2|3}
Game log joueur    : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog
Predictor          : sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor
Depth chart        : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/depthcharts
```

### Règles d'appel ESPN critiques

- **Scoreboard passé** : utiliser plage `dates=YYYYMMDD-YYYYMMDD` pour récupérer les `notes`.
- **Headlines pour MatchDetail** : appel scoreboard `J-1 → J` pour couvrir les matchs UTC décalés.
- **Summer League** : endpoint séparé `nba-summer-las-vegas`. Fallback automatique dans `recupererDetailMatch()`.
- **Standings** : `seasontype=1` pré-saison, `=2` régulière, `=3` playoffs.
- **`recupererGagnant()`** retourne `{ gagnant, type_saison, saison, ecart_final, score_domicile, score_exterieur, tag }`.
- **CORS** : l'endpoint `/teams?limit=40` est bloqué CORS depuis le navigateur. Utiliser `standings` pour récupérer les équipes dynamiquement, ou le fichier statique `src/data/equipesNBA.js`.
- **Depth chart** : `depthcharts[0].positions.{pg|sg|sf|pf|c}.athletes` — index 0 = titulaire. Pas de champ `rank` explicite.
- **Roster** : `athletes` est un tableau plat (pas de sous-groupes `items`).

### ESPN summary — champs cotes validés terrain

- **`data.odds`** → toujours vide. Ne pas utiliser.
- **`data.pickcenter`** → source principale des cotes ESPN. Peuplé ~J-1/J-2 avant le match.
- **`data.predictor`** → win probability % toujours présent.

### Assets visuels ESPN/NBA CDN — validés terrain (session 6)

```
Headshot joueur actif  : https://a.espncdn.com/i/headshots/nba/players/full/{espn_id}.png
Headshot légende NBA   : https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_id}.png
Logo équipe ESPN       : https://a.espncdn.com/i/teamlogos/nba/500/{abr}.png
  Exceptions : NOP → "no", UTA → "utah"
```

**Seuil qualité headshot NBA CDN :** < 50kb = placeholder inutilisable.

**Sources bloquées depuis Python :**
- `stats.nba.com` → timeout systématique
- `data.nba.net` → erreur SSL
- `cdn.nba.com/static/json/` → 403
- `nba_api` Python → utilise `stats.nba.com`, donc bloqué aussi
- Wikimedia Commons → 429 rate limit si batch

---

## 5. Sources de données tierces

### Basket USA — actus NBA en français
- **Source :** https://www.basketusa.com/feed/ (RSS WordPress)
- **Proxy :** rss2json.com (clé API — 10 000 req/jour)

### The Odds API — cotes bookmakers ✅ INTÉGRÉ
- **URL :** https://api.the-odds-api.com/v4/sports/basketball_nba/odds
- **Clé API :** `VITE_ODDS_API_KEY`
- **Cache :** table Supabase `cotes_cache`, TTL 6h

---

## 6. BDD Supabase

### Tables actuelles
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `pronos_ecart` | `semaines_gagnees` | `messages` | `xp_log` | `missions` | `missions_utilisateurs` | `badges_catalogue` | `events` | `cotes_cache`

### Tables à créer — collection de cartes (PRIORITÉ 3)
```sql
cartes_catalogue (id, joueur_nom, joueur_espn_id, equipe, equipe_espn_id,
  saison, set_nom, rarete, serie_max, actif)

cartes_collection (id, user_id, carte_id, serie_numero, source, obtenu_le)
```

### Table `matchs` — colonnes
```
id uuid PK / espn_id text / date_match timestamptz / equipe_domicile text /
equipe_exterieur text / score_domicile integer / score_exterieur integer /
statut text / gagnant text / mis_a_jour_le timestamptz / type_saison integer /
saison integer / tag varchar
```

### Table `xp_log` — contrainte CHECK source
```sql
CHECK (source = ANY (ARRAY['mission', 'jalon', 'passif', 'admin', 'roue_quotidienne']))
```
Valeurs autorisées : `mission`, `jalon`, `passif`, `admin`, `roue_quotidienne`.

### Table `missions` — colonnes
```
id uuid PK / slug text / titre text / description text / type text /
xp_recompense integer / badge_slug text / condition_type text /
condition_valeur integer / actif boolean / date_debut / date_fin /
cree_par text / prerequis_slug text
```

### Missions actives — catalogue complet

**Hebdomadaires :**
| slug | titre | condition_type | valeur | XP |
|---|---|---|---|---|
| connexion_5j_semaine | Présent | connexion_semaine | 5 | 40 |
| pronos_5_semaine | Actif | pronos_semaine | 5 | 40 |
| fourchettes_3_semaine | Précision | fourchette_posee | 3 | 30 |
| fourchettes_2_correctes | Tireur d'élite | fourchette_correcte | 2 | 150 |
| roue_5_semaine | Joueur | roue_tiree_semaine | 5 | 50 |
| pronos_3_corrects_semaine | Chaud | pronos_corrects_semaine | 3 | 200 |

**Permanentes chaînées :**
| slug | titre | condition_type | valeur | XP | prerequis_slug |
|---|---|---|---|---|---|
| connexion_5j | Régulier | serie_connexion | 5 | 75 | — |
| connexion_10j | Assidu | serie_connexion | 10 | 200 | connexion_5j |
| connexion_30j | Indéboulonnable | serie_connexion | 30 | 500 | connexion_10j |
| serie_3_corrects | En Rythme | serie_correcte | 3 | 100 | — |
| serie_5_corrects | En Mission | serie_correcte | 5 | 200 | serie_3_corrects |
| roue_5 | Flambeur | roue_tiree | 5 | 50 | — |
| roue_20 | Addict | roue_tiree | 20 | 150 | roue_5 |
| roue_50 | Maniaque | roue_tiree | 50 | 400 | roue_20 |

### Table `cotes_cache` ✅
```
id uuid PK / cle text UNIQUE / data jsonb / fetched_at timestamptz
```

### Table `profils` — colonnes actuelles + ajouts session 5
```
id / pseudo / avatar_url / description / cree_le / badges jsonb /
xp_total / niveau / onboarding_done boolean default false    ← AJOUTÉ session 5
equipes_favorites jsonb default '[]'                         ← AJOUTÉ session 5
```
- `onboarding_done` : SQL `ALTER TABLE profils ADD COLUMN IF NOT EXISTS onboarding_done boolean DEFAULT false;`
- `equipes_favorites` : jsonb tableau de 3 objets `{id, nom, abr, logo}` — 30 équipes dans `src/data/equipesNBA.js`

### Ligues — convention (décidée session 5)
- Chaque phase NBA = une ligue dédiée dans Swish League
- Saison régulière = ligue principale, tout le monde inscrit
- Autres phases (Summer League, Pré-saison, NBA Cup, All-Star, Playoffs, Finals) = ligues bonus
- **Auto-inscription** : comportement cible — déclencher automatiquement au démarrage de chaque phase → à implémenter (backlog PRIORITÉ 2)
- Aujourd'hui : inscription manuelle via `/groupes`

### RLS Supabase — état validé
Identique à v4.3.

### GRANT Supabase
**Vérifier avant le 30 octobre 2026** (obligation grants Postgres Supabase).

---

## 7. Architecture fichiers

```
src/
  App.jsx
  main.jsx
  index.css
  config.js
  lib/supabase.js
  context/
    NoSpoilContext.jsx
    ProfilContext.jsx
  data/
    changelog.js
    badges.js
    equipesNBA.js        ← NOUVEAU session 5 — 30 équipes statiques (CORS /teams bloqué)
  services/
    espn.js
    points.js
    ligues.js
    xp.js
    ecart.js
    tracker.js
  pages/
    Accueil.jsx          ← session 5 : OnboardingTuto intégré, chip Tuto, onboarding_done
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx        ← session 5 : header 3 colonnes, équipes favorites, bio, chips
    MatchDetail.jsx
    Calendrier.jsx
    Profil.jsx           ← session 5 : sélecteur équipes favorites (3 max, logos ESPN)
    Stats.jsx
    H2H.jsx
    QuoiDeNeuf.jsx
    Admin.jsx
  components/
    UI.jsx
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Briefing.jsx
    BanniereFeed.jsx
    LeVestiaire.jsx
    MissionsPopup.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
    RoueQuotidienne.jsx
    OnboardingTuto.jsx   ← NOUVEAU session 5 — carousel 7 slides
```

---

## 8. Navigation & routes

```
/connexion        → Connexion.jsx
/inscription      → public
/accueil          → non protégé
/classement       → privé
/mes-pronos       → privé (label "Stats" dans nav)
/groupes          → privé
/match/:espn_id   → privé
/calendrier       → privé
/profil           → privé
/stats            → privé
/h2h              → privé
/quoi-de-neuf     → privé
/admin            → privé, restreint ADMIN_ID
/ma-collection    → à venir (inactif dans nav)
/chat             → à venir (inactif dans nav)
/mentions-legales → à venir (inactif dans nav)
/a-propos         → à venir (inactif dans nav)
*                 → redirect /accueil
```

---

## 9. Fonctionnalités livrées

### Assets collection de cartes ✅ — session 6

Pipeline Python de collecte et organisation des assets visuels pour la collection de cartes.

**Notebook :** `exploration_espn_assets.ipynb` (local JPVT)

**Sources validées terrain :**
- Headshots actifs : ESPN CDN `full/{espn_id}.png` — 522/537 joueurs OK
- Headshots légendes : NBA CDN `1040x760/{nba_id}.png` — 15 vrais headshots
- Logos équipes : ESPN CDN `teamlogos/nba/500/{abr}.png` — 30/30 OK
- stats.nba.com / data.nba.net / nba_api → bloqués depuis Python
- Wikimedia Commons → 429 rate limit batch

**Assets Google Drive :**
```
Swish League Assets/
├── joueurs/{Prenom_Nom}/{Prenom_Nom}_headshot_espn.png   (522 joueurs)
├── legendes/{Prenom_Nom}/{Prenom_Nom}_headshot_nba.png   (15 légendes)
├── equipes/logos/{abr}.png                               (30 logos)
└── _master.csv                                           (783 lignes)
```

**`_master.csv` — structure :**
```
cle_joueur / prenom / nom / espn_id / nba_id / equipe_nom / equipe_abr /
equipe_espn_id / saison / rarete / actif / headshot_espn_url /
headshot_nba_url / fichier_headshot / source_headshot / notes / rang / poste
```

**Contenu `_master.csv` :**
| Segment | Lignes | Headshot |
|---|---|---|
| Joueurs actifs 2025-26 | 537 | 522 ESPN ✅ |
| Légendes HOF | 245 | 15 NBA CDN ✅ / 15 placeholder ⚠️ |
| Chris Paul (retraité) | 1 | placeholder ⚠️ |

**30 légendes avec nba_id renseigné :**
Jordan(893), Kobe(977), Shaq(406), Duncan(1495), Iverson(947), Nowitzki(1717), Garnett(708), Olajuwon(165), Chamberlain(121), Wade(2548), Anthony(2546), Pierce(1718), Nash(2199), Carter(1713), Allen(252), Pippen(969), Barkley(756), Magic(1471), Bird(1035), Isiah(259), Erving(203), Ewing(272), Malone(285), Stockton(521), Drexler(206), Payton(368), Miller(317), McGrady(1488), Howard(2966), Paul(2779)

**15 légendes sans headshot exploitable (placeholder 12kb) :**
Pippen, Barkley, Magic, Bird, Isiah, Erving, Malone, Stockton, Drexler, Payton, Miller, Ewing, Howard, McGrady, Chris Paul → design carte vintage à décider

**Depth chart ESPN :**
- `depthcharts[0].positions.{poste}.athletes` — index 0 = titulaire (rang=1)
- 109 titulaires identifiés sur 150 théoriques (fin de saison playoffs, rosters incomplets)
- `rang` et `poste` dans `_master.csv` pour tous les joueurs actifs

### Onboarding tuto ✅ — session 5
- Composant `OnboardingTuto.jsx` — carousel 7 slides modal
- Slides : Bienvenue / Une saison des ligues / Ligues principales / Ligues bonus / Pose ton prono / Explore & Compare / Progresse & Flambe
- Déclenchement auto au premier login si `onboarding_done = false`
- Bouton "Tuto" dans les chips header Board (à gauche de Missions)
- Rejouable à tout moment via le bouton
- Fermeture → `onboarding_done = true` dans `profils`
- Dots de navigation cliquables, bouton Suivant / C'est parti

### Profil — équipes favorites ✅ — session 5
- Sélecteur 3 équipes max dans `Profil.jsx`
- 30 équipes statiques dans `src/data/equipesNBA.js` (CORS ESPN `/teams` bloqué)
- Sauvegarde jsonb `equipes_favorites` dans `profils`
- Logos affichés en ligne avec bouton retirer
- Phrase explicative : "Tes 3 équipes de cœur. En saison régulière, tu ne pronostiques que leurs matchs."

### Corrections noSpoil ✅ — session 7
- `BracketPlayoffs.jsx` : noSpoil retiré — scores et séries toujours visibles
- `NewsNBA.jsx` : noSpoil retiré — actus toujours visibles
- `BracketPlayoffs.jsx` : ajout `&limit=500` sur les appels scoreboard

### MesPronos — header v2 ✅ — session 5
- Layout 3 colonnes : Avatar+Pseudo+Titre+BarreXP / Équipes favorites / KPIs
- Barre XP uniquement sous col 1
- Mobile : col 2 masquée, Bio (gauche) + Équipes (droite) en ligne sous barre XP
- KPIs collés à droite (`marginLeft: 'auto'`)
- Chips : Missions / Historique XP / Mon profil / Infos XP
- Bio affichée avec label "Bio", style italic
- Bouton 1v1 toujours visible sur profil public
- `isMobile` state basé sur `window.innerWidth < 640` avec listener resize
- Badges : titre "Badges débloqués" + taille 48px

### Navigation ✅ — v4.3 (session 4)
### Roue quotidienne ✅ — session 4
### Missions chaînées ✅ — session 4
### Board (Accueil) ✅ — v4.2 (session 3)
### MatchDetail ✅ — v4.0
### Admin ✅ — v3.8 (5 onglets)
### Système Missions ✅ — v3.8 + extensions session 4
### Système Tracking events ✅ — v3.8

---

## 10. Décisions produit

### Session 2026-06-11 (session 7)

#### Play Store / PWA — décision
- Déploiement Android via TWA (PWABuilder) envisagé post-recrutement septembre 2026
- Compte Google Play Developer : 25$ une fois
- iOS App Store : 99$/an — pas prioritaire à ce stade
- Prérequis à préparer : mentions légales, politique confidentialité, icônes PWA 192×192 + 512×512, manifest.json complet, assetlinks.json
- Notifications push Android via FCM (Firebase Cloud Messaging) une fois l'app sur le Play Store

#### noSpoil — décision
- Retiré de BracketPlayoffs et NewsNBA — le mode noSpoil ne doit pas masquer des contenus informatifs permanents
- noSpoil reste dans le contexte global pour d'autres usages éventuels

#### Projet Nexgen — concept initié
- Nouveau projet identifié, distinct de Swish League
- Doc concept séparé : `nexgen_concept_v1_0.md`

### Session 2026-06-09 (session 6)

#### Règles de points — CORRECTION IMPORTANTE
- Prono vainqueur correct : **1 pt**
- Fourchette d'écart correcte : **+1 pt** (pas +2 — anciens docs incorrects)
- Match parfait : **3 pts**
- Valable pour **toutes les ligues** sans exception (saison régulière, playoffs, Summer League, etc.)

#### Collection de cartes — spec validée
- Modèle hybride FUT (millésimes) + Pokédex (cases vides visibles)
- 3 raretés au lancement : Common 65% / Rare 30% / Legendary 5%
- ~172 cartes lancement : 150 joueurs actifs (5 majeurs × 30 équipes) + 20 légendes + 2-3 rookies
- 2 mécaniques tirage : connexion quotidienne + prono correct 20%
- Saisons passées jamais fermées (~10% pool)
- Cases vides visibles avec nom — pas d'archive morte style Topps
- 15 légendes sans headshot → design carte vintage à arbitrer
- Marketplace / échange → jamais (économie spéculative)
- Epic et Ultimate (raretés 4 et 5) → post-lancement

#### Assets collection — décisions techniques
- ESPN CDN = source principale headshots actifs (espn_id)
- NBA CDN = source légendes (nba_id) — seuil qualité 50kb
- Logos équipes ESPN : NOP → "no", UTA → "utah"
- `_master.csv` = table de mapping centrale (783 lignes)
- Google Drive = master assets / Supabase Storage = CDN serving app
- Photos action libres de droits : pas de source fiable en masse — décision design à venir

### Session 2026-06-09 (session 5)

#### Philosophie app
- L'objectif est la passion NBA, la compétition amicale, la progression — pas le chambrage ou la mise en scène. À ne pas mentionner comme angle produit dans les textes UI.

#### Onboarding livré
- 7 slides (Bienvenue, ligues, ligues bonus, prono, explorer, progression)
- `onboarding_done boolean` dans `profils`

#### Équipes favorites
- Top 3 équipes (A1 — strict, pas les équipes des autres users)
- Saison régulière : l'user ne pronostique que les matchs de ses 3 équipes
- Données statiques `equipesNBA.js` — mise à jour manuelle si franchise change (rare)
- Joueurs favoris : décision reportée (pas de mécanique derrière aujourd'hui)

#### Ligues = phases NBA
- Summer League / Pré-saison / Saison régulière / NBA Cup / All-Star / Playoffs / Finals
- Saison régulière = ligue principale, tout le monde
- NBA Cup = ligue parallèle sur matchs saison régulière (à préciser)
- Auto-inscription au démarrage de chaque phase → backlog PRIORITÉ 2

#### MesPronos header refactorisé
- 3 colonnes desktop, 2 lignes mobile
- Bio label "Bio" + italic, pleine largeur sous les colonnes desktop / col gauche mobile

---

## 11. Risques ouverts

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute

### RISQUE-B — ESPN API changement de structure
**Sévérité :** 🟡 Moyenne

### RISQUE-F — rss2json.com indisponibilité
**Sévérité :** 🟢 Faible

### RISQUE-G — Missions répétitives après S2
**Sévérité :** 🟡 Moyenne

### RISQUE-H — Volume events Supabase
**Sévérité :** 🟢 Faible à court terme (3 users)

### RISQUE-I — The Odds API quota (500 req/mois)
**Sévérité :** 🟢 Faible — cache TTL 6h.

---

## 12. Dette technique ouverte

### DETTE-15 — `UI.jsx` contient des composants obsolètes
**Sévérité :** 🟢 Faible

### DETTE-18 — Clé rss2json dans le code front
**Sévérité :** 🟢 Faible pour usage perso.

### ~~DETTE-19~~ — ✅ SOLDÉE session 3
### ~~DETTE-24~~ — ✅ SOLDÉE session 4

### DETTE-20 — `titrDepuisNiveau()` dupliqué
**Sévérité :** 🟢 Faible

### DETTE-21 — `session_start` double déclenchement
**Sévérité :** 🟢 Faible

### DETTE-22 — `semaine_100_pct` dépend d'un login le lundi
**Sévérité :** 🟡 Moyenne — Fix définitif : Edge Functions post-Sprint 4.

### DETTE-23 — Correspondance match ESPN ↔ The Odds API par nom d'équipe
**Sévérité :** 🟢 Faible

---

## 13. Backlog — priorités

### Sprints 1→3.8 + Cotes + Sessions 3→6 ✅ LIVRÉS

---

### PRIORITÉ 1 — Avant juillet 2026 (Summer League 9-19 juillet)

```
✅ Nav latérale — restructurée, loupe, pages bientôt
✅ Renommer "Mes stats" → "Stats"
✅ Roue quotidienne — modal SVG + tirage + XP + missions
✅ Missions chaînées (prerequis_slug) + 5 nouvelles missions
✅ Onboarding tuto — carousel 7 slides, bouton Tuto dans header Board
✅ Équipes favorites (Top 3) dans Profil + MesPronos
✅ MesPronos header refactorisé (3 colonnes, bio, chips)
```

**PRIORITÉ 1 — 100% LIVRÉE ✅**

---

### PRIORITÉ 2 — Août 2026 (avant recrutement septembre)

```
⏳ Partage de pick — Canvas API, Story Instagram (décalé à août)
⏳ Classements par phase (front) — colonne tag déjà en base (décalé à août)
⏳ Auto-inscription ligues — au démarrage de chaque phase NBA
```

---

### PRIORITÉ 3 — Sprint 4 — GAMIFICATION & IDENTITÉ

```
Filtrage pronos saison régulière par équipes favorites (Top 3)
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes — assets prêts ✅, prochaines étapes :
  - Upload Google Drive → Supabase Storage
  - BDD : tables cartes_catalogue + cartes_collection
  - Composant carte React (template SVG/CSS par rareté)
  - Mécanique tirage (connexion quotidienne + prono correct 20%)
  - Page /ma-collection (Cartodex)
  - Décision design 15 légendes sans headshot (carte vintage ?)
Edge Functions Supabase (sécurité XP côté serveur)
Titres saisonniers (gravés en fin de saison NBA dans profils)
```

---

### Post-Sprint 4

```
H2H historique équipes saison régulière dans MatchDetail
Bracket Summer League dynamique
Draft Night pronos
Jalons visuels tous les 5 niveaux
XP social : +XP sur réaction Vestiaire
Upgrade The Odds API si > 500 req/mois après recrutement
Joueurs favoris (si mécanique définie)
**Déploiement Play Store (TWA) — post septembre 2026**
  → Mentions légales + politique confidentialité
  → Icônes PWA 192×192 + 512×512
  → manifest.json complet
  → assetlinks.json sur Vercel
  → Notifications push FCM
```

### Mis de côté indéfiniment
- Swish Data pipeline
- Notifications push Web (iOS limité)
- Leaderboard global séparé

---

## 14. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- **Toujours indiquer fichier + bloc + contexte pour toute modification**
- **Une modification à la fois — push + test entre chaque**
- **Fichiers complets en download** à chaque livraison
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- `XP_BASE` et `XP_COEFFICIENT` depuis `src/config.js`
- `SUPABASE_URL` depuis `src/config.js`
- `lundiFin()` exportée depuis `points.js` — toujours importer depuis là
- Tokens CSS : toujours utiliser les variables, jamais de valeurs brutes
- `TitreSection` défini localement dans chaque fichier
- Pas de `border-radius-lg` sur les blocs de contenu
- Séparateurs `<div style={{ height: 32 }} />` pour les espacements Board
- Commentaires JSX : toujours `{/* */}`, jamais `//` dans le JSX
- `detecterType()` : toute modification répercutée dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`
- Timezone : toujours `Europe/Paris` pour les comparaisons de dates quotidiennes XP
- `pronos_ecart` : table indépendante — ne jamais inclure dans les stats/jalons `pronos`
- `tracker.js` : appels toujours silencieux (try/catch), jamais await bloquant dans l'UI
- Clés API tierces : variables d'environnement Vercel uniquement, jamais dans le code
- **Zéro emoji dans le code** — SVG inline ou points colorés CSS uniquement
- `xp_log.source` : toujours vérifier la contrainte CHECK avant d'ajouter une nouvelle source
- `isMobile` : pattern `useState(window.innerWidth < 640)` + listener resize — pattern validé dans MesPronos
- **Règles de points universelles** : 1pt vainqueur / +1pt fourchette / 3pts parfait — toutes ligues

---

## 15. RGPD & sécurité

- Clés Supabase : variables d'environnement (`.env`), jamais commitées
- `SUPABASE_URL` et `anon key` : OK dans le front (protégées par RLS)
- `service_role key` : JAMAIS dans le code front
- Clé rss2json : dans le code front pour usage perso (acceptable)
- Clé The Odds API : `VITE_ODDS_API_KEY` dans Vercel env vars + `.env` local
- Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`
- Cotes bookmakers : affichage informatif uniquement — jamais dans le flow prono (risque légal ANJ France)
- `xp_log` : table immuable — pas d'UPDATE/DELETE autorisé via RLS
- `events` : SELECT restreint à l'admin
- Edge Functions Supabase : noté pour post-Sprint 4

---

## 16. Veille technique

- ESPN API non officielle : surveiller changements de structure des `notes` et `pickcenter`
- rss2json.com : surveiller quota (10k req/jour)
- The Odds API : surveiller quota free tier (500 req/mois) — upgrade si > 50 users actifs
- Supabase : surveiller free tier + pause inactivité + volume table `events`
- Vercel Hobby : usage non-commercial uniquement
- **Obligation grants Postgres Supabase : existants affectés au 30 octobre 2026** — vérifier avant cette date

---

## 17. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v4_6.md` | Référence technique unique | ✅ Ce document |
| `swish_league_roadmap_v2_9.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_2.md` | Cartographie ESPN API | ✅ Actif (inchangé) |
| `nexgen_concept_v1_0.md` | Concept projet Nexgen | ✅ Nouveau |

---

*Document v4.6 — 2026-06-11*
*Remplace socle_nba_v4_5.md*
*Ajouts session 7 : noSpoil retiré de BracketPlayoffs + NewsNBA, limit=500 sur scoreboard bracket, Play Store TWA noté en backlog, projet Nexgen initié*
