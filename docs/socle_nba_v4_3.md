# SWISH LEAGUE — SOCLE v4.3
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-09 (session 4)

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
```

### Règles d'appel ESPN critiques

- **Scoreboard passé** : utiliser plage `dates=YYYYMMDD-YYYYMMDD` pour récupérer les `notes`.
- **Headlines pour MatchDetail** : appel scoreboard `J-1 → J` pour couvrir les matchs UTC décalés.
- **Summer League** : endpoint séparé `nba-summer-las-vegas`. Fallback automatique dans `recupererDetailMatch()`.
- **Standings** : `seasontype=1` pré-saison, `=2` régulière, `=3` playoffs.
- **`recupererGagnant()`** retourne `{ gagnant, type_saison, saison, ecart_final, score_domicile, score_exterieur, tag }`.

### ESPN summary — champs cotes validés terrain

- **`data.odds`** → toujours vide. Ne pas utiliser.
- **`data.pickcenter`** → source principale des cotes ESPN. Peuplé ~J-1/J-2 avant le match.
- **`data.predictor`** → win probability % toujours présent.

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
cree_par text / prerequis_slug text   ← AJOUTÉ session 4
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

### Table `profils` — colonnes à ajouter (Sprint 4)
- `equipe_favorite_id` — équipe favorite
- `joueur_favori_id` — joueur favori
- `onboarding_done boolean default false` (août 2026)

### RLS Supabase — état validé
Identique à v4.2.

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
  services/
    espn.js
    points.js
    ligues.js
    xp.js              ← verifierMissions filtre prerequis_slug
    ecart.js
    tracker.js
  pages/
    Accueil.jsx        ← Header v4.2 + RoueQuotidienne branché
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx      ← label "Stats" dans nav
    MatchDetail.jsx
    Calendrier.jsx
    Profil.jsx
    Stats.jsx
    H2H.jsx
    QuoiDeNeuf.jsx
    Admin.jsx
  components/
    UI.jsx
    Navigation.jsx     ← v4.3 : loupe, hamburger restructuré, pages bientôt
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Briefing.jsx
    BanniereFeed.jsx
    LeVestiaire.jsx
    MissionsPopup.jsx  ← filtre prerequis_slug
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
    RoueQuotidienne.jsx  ← NOUVEAU session 4
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

### Navigation ✅ — v4.3 (session 4)
- Icône Explorer : `TrendingUp` → `Search` (loupe)
- "Mes stats" → "Stats" dans bottom nav + desktop
- Hamburger restructuré : Principal (Ligues, Calendrier, 1v1) / Pages à venir (Collection, Chat) / Secondaire (Quoi de neuf) / Footer (Mentions légales, À propos) / Admin / Déconnexion
- Loupe raccourci Explorer dans l'en-tête du panneau hamburger
- Bloc gauche/droite desktop `minWidth: 200` pour centrage des liens
- Pages à venir : badge "bientôt", `cursor: not-allowed`, `disabled`

### Roue quotidienne ✅ — session 4
- Composant `RoueQuotidienne.jsx` — modal SVG animé
- 5 segments : Rien (30%) / +15 XP (30%) / +30 XP (20%) / +75 XP (15%) / JACKPOT +150 XP (5%)
- Animation CSS `cubic-bezier(0.17, 0.67, 0.12, 0.99)` 3.5s
- XP crédité via `ajouterXP()` — `source = 'roue_quotidienne'`, `source_id = 'roue_YYYY-MM-DD'`
- Missions roue déclenchées via `verifierMissions()` après tirage
- localStorage `swish_roue_{userId}_{date}` — 1 tirage/jour
- Board mis à jour en temps réel via `onGain(xp_total, niveau)`
- Contrainte CHECK `xp_log_source_check` mise à jour pour inclure `'roue_quotidienne'`

### Missions — catalogue étendu (session 4)
- `prerequis_slug` ajouté dans table `missions`
- Missions chaînées : connexion (5→10→30j), série corrects (3→5), roue (5→20→50)
- `verifierMissions()` filtre les missions verrouillées avant d'incrémenter
- `MissionsPopup.jsx` masque les missions dont le prérequis n'est pas complété
- 2 nouvelles missions hebdo : `roue_5_semaine`, `pronos_3_corrects_semaine`
- 3 nouvelles missions permanentes : `roue_5`, `roue_20`, `roue_50`

### Board (Accueil) ✅ — v4.2 (session 3)
- Header redesigné v4.2
- Chip Roue fonctionnel

### MatchDetail ✅ — v4.0
### Admin ✅ — v3.8 (5 onglets)
### Système Missions ✅ — v3.8 + extensions session 4
### Système Tracking events ✅ — v3.8
### MesPronos ✅ — v3.7 + mapping `roue_quotidienne` dans XP_LABELS

---

## 10. Décisions produit

### Session 2026-06-09 (session 4) — Nav + Roue + Missions

#### Navigation restructurée
- Icône Explorer : `Search` (loupe) — plus représentatif que `TrendingUp`
- Explorer retiré du hamburger (déjà en bottom nav + desktop)
- Loupe cliquable dans l'en-tête du panneau
- Pages à venir intégrées (Collection, Chat, Mentions légales, À propos)
- Centrage des liens desktop via `minWidth: 200` sur blocs gauche/droite

#### Roue quotidienne livrée
- SVG animé, 5 segments dégradés, aiguille violet avec glow
- `source = 'roue_quotidienne'` dans xp_log — contrainte CHECK étendue
- Missions roue déclenchées silencieusement après chaque tirage

#### Missions chaînées via `prerequis_slug`
- Masquage UI dans `MissionsPopup` et filtrage dans `verifierMissions`
- Les missions verrouillées ne s'incrémentent pas même si le `condition_type` matche

#### Onboarding tuto décidé
- Bouton "Tuto" dans le header Board, à gauche du bouton Missions
- Carousel 5 slides, sans screenshots (slides épurées texte + icônes + couleurs app)
- `onboarding_done boolean` dans `profils` — une seule fois au premier login, rejouable via le bouton
- Intégré en PRIORITÉ 1 (avant juillet 2026)

### Session 2026-06-09 (session 3) — UI polish + DETTE-19
Voir socle v4.2 pour le détail.

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

### DETTE-20 — `titrDepuisNiveau()` dupliqué
**Sévérité :** 🟢 Faible

### DETTE-21 — `session_start` double déclenchement
**Sévérité :** 🟢 Faible

### DETTE-22 — `semaine_100_pct` dépend d'un login le lundi
**Sévérité :** 🟡 Moyenne — Fix définitif : Edge Functions post-Sprint 4.

### DETTE-23 — Correspondance match ESPN ↔ The Odds API par nom d'équipe
**Sévérité :** 🟢 Faible

### ~~DETTE-24~~ — ✅ SOLDÉE session 4
Label "Stats" uniformisé dans Navigation.jsx.

---

## 13. Backlog — priorités

### Sprints 1→3.8 + Cotes + Sessions 3→4 ✅ LIVRÉS

---

### PRIORITÉ 1 — Avant juillet 2026 (Summer League 9-19 juillet)

```
✅ Nav latérale — restructurée, loupe, pages bientôt
✅ Renommer "Mes stats" → "Stats"
✅ Roue quotidienne — modal SVG + tirage + XP + missions
✅ Missions chaînées (prerequis_slug) + 5 nouvelles missions
⏳ Onboarding tuto — carousel 5 slides, bouton dans header Board
    Style : slides épurées, pas de screenshots, texte + icônes + couleurs app
    Déclenchement : onboarding_done boolean dans profils
    Bouton "Tuto" à gauche de "Missions" dans les chips header
```

---

### PRIORITÉ 2 — Août 2026 (avant recrutement septembre)

```
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Classements par phase (front) — colonne tag déjà en base
```

---

### PRIORITÉ 3 — Sprint 4 — GAMIFICATION & IDENTITÉ

```
Profil fan (equipe_favorite_id + joueur_favori_id dans profils)
Filtrage pronos saison régulière — mécanisme à concevoir
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes (5 raretés, tirage quotidien, /ma-collection)
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
| `socle_nba_v4_3.md` | Référence technique unique | ✅ Ce document |
| `swish_league_roadmap_v2_6.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_2.md` | Cartographie ESPN API | ✅ Actif (inchangé) |

---

*Document v4.3 — 2026-06-09*
*Remplace socle_nba_v4_2.md*
*Ajouts session 4 : Navigation v4.3 (loupe, hamburger, pages bientôt), Roue quotidienne livrée, Missions chaînées (prerequis_slug), contrainte CHECK xp_log étendue, DETTE-24 soldée, onboarding tuto en PRIORITÉ 1*
