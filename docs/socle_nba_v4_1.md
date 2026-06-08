# SWISH LEAGUE — SOCLE v4.0
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-08 (session 2)

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
13. [Backlog](#13-backlog)
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
- **Icônes :** Lucide React
- **Fonts :** Inter (body) + Barlow Condensed (display/scores) + Teko (titres de sections)

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskceooakyla.supabase.co ← URL corrigée (c dans le nom)

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE
**Logo :** texte Teko — "SWISH" `var(--text-1)` + "LEAGUE" `var(--accent)`, pas d'image logo
**Accroche :** "Pronostique · Clashe · Règne" (à mettre à jour quand tagline validée)

### Tokens CSS (index.css) — v3.0

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
--font-body: Inter
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
| KPIs header | Barlow Condensed | clamp(20px,5vw,32px) | 700 | --text-1 / --accent |
| Points classement | Barlow Condensed | 18px | 700 | --gold |
| Corps | Inter | 12-14px | 400-600 | --text-2 / --text-3 |

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
- **Stats joueur historique** : `?season=YYYY&seasontype=N` — disponible depuis ~2003.
- **`recupererGagnant()`** retourne `{ gagnant, type_saison, saison, ecart_final }` — `ecart_final` utilisé pour le calcul des fourchettes d'écart.

### ESPN summary — champs cotes validés terrain (Session 2026-06-08)

- **`data.odds`** → toujours vide (pré-match et post-match). Ne pas utiliser.
- **`data.pickcenter`** → source principale des cotes ESPN. Contient : spread, over/under, moneyline US, open vs close. Peuplé ~J-1/J-2 avant le match uniquement (absent pour matchs trop lointains).
- **`data.predictor`** → win probability % dans le summary (identique au endpoint core API). Toujours présent.
- **`data.winprobability`** → courbe live uniquement. Vide pré-match.
- **`data.againstTheSpread`** → records ATS des équipes. `records` vide en fin de saison.

**Structure `pickcenter[0]` utile :**
```js
pc.details           // "NY -2.5" — spread texte
pc.overUnder         // 215.5 — total points
pc.pointSpread.home.close.line  // "-2.5"
pc.pointSpread.home.open.line   // "-1.5" — mouvement de ligne
pc.homeTeamOdds.moneyLine       // -130 (format US)
pc.awayTeamOdds.moneyLine       // +110 (format US)
pc.total.over.close.line        // "o215.5"
pc.total.under.close.odds       // "-105"
```

**Conversion moneyline US → décimal :**
```js
const mlEnDecimal = (ml) => ml > 0
  ? parseFloat((ml / 100 + 1).toFixed(2))
  : parseFloat((100 / Math.abs(ml) + 1).toFixed(2))
```

### Détection des types de matchs — `detecterType()`

Fonction partagée identique dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`.

| Condition | Tag retourné |
|---|---|
| `season.type = 1` | `preseason` |
| `season.type = 5` | `playin` |
| `season.type = 3` + headline "nba finals" ou "the finals" | `finals` |
| `season.type = 3` (autre) | `playoffs` |
| `comp.type = ALLSTAR` ou headline "all-star" | `allstar` |
| `season.type = 2` + headline "nba cup" / "in-season tournament" | `nbacup` |
| `season.type = 2` + headline "play-in" | `playin` |
| slug `nba-summer-las-vegas` | `summer_league` |
| Tout le reste | `regular` |

### `TAG_CONFIG` — exporté depuis `espn.js`
Tags avec badge enrichi dans MatchDetail : `nbacup`, `allstar`, `playin`, `playoffs`, `finals`.

---

## 5. Sources de données tierces

### Basket USA — actus NBA en français
- **Source :** https://www.basketusa.com/feed/ (RSS WordPress)
- **Proxy :** rss2json.com (clé API — 10 000 req/jour)
- **Usage :** BanniereFeed (article 1) + NewsNBA (articles 2 à 6)

### The Odds API — cotes bookmakers ✅ INTÉGRÉ (Session 2026-06-08)
- **URL :** https://api.the-odds-api.com/v4/sports/basketball_nba/odds
- **Clé API :** variable d'environnement Vercel `VITE_ODDS_API_KEY` (free tier 500 req/mois)
- **Paramètres :** `regions=eu,us&markets=h2h,spreads,totals&oddsFormat=decimal`
- **Bookmakers FR disponibles :** `betclic_fr`, `unibet_fr`, `winamax_fr`, `pmu_fr`
- **Bookmakers US/référence :** `draftkings`, `fanduel`, `betmgm`, `pinnacle`
- **Pinnacle** = book sharp de référence pour spread et total (ligne la plus fiable)
- **Cache :** table Supabase `cotes_cache`, TTL 6h, clé `odds_nba_YYYYMMDD` — 1 appel API max par tranche de 6h quelle que soit l'activité
- **Marchés free tier :** `h2h` (résultat), `spreads` (handicap), `totals` (over/under). Props joueurs et marchés alternatifs hors free tier.
- **Bookmakers FR :** uniquement `h2h` dispo. Spreads et totals via bookmakers US (DraftKings/Pinnacle).
- **Note légale ANJ :** affichage à titre informatif uniquement — jamais intégré dans le flow prono.

---

## 6. BDD Supabase

### Tables actuelles
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `pronos_ecart` | `semaines_gagnees` | `messages` | `xp_log` | `missions` | `missions_utilisateurs` | `badges_catalogue` | `events` | `cotes_cache`

### Table `cotes_cache` ✅ CRÉÉE (Session 2026-06-08)
```
id uuid PK / cle text UNIQUE / data jsonb / fetched_at timestamptz
```
- Clé : `odds_nba_YYYYMMDD` (1 row par jour)
- TTL applicatif : 6h (vérifié côté front avant tout appel The Odds API)
- RLS : SELECT/INSERT/UPDATE `auth.role() = 'authenticated'`
- GRANT : `SELECT, INSERT, UPDATE ON cotes_cache TO authenticated`

### Table `events` ✅ CRÉÉE (Session 2026-06-07)
```
id uuid PK / user_id uuid (ref profils) / event_type text / page text / meta jsonb / cree_le timestamptz
```
- Index : `idx_events_user_id`, `idx_events_type`, `idx_events_cree_le`
- RLS : INSERT `auth.uid() = user_id` / SELECT admin uniquement (`auth.uid() = 'fa55d016-...'`)
- GRANT : `INSERT, SELECT ON events TO authenticated`
- RLS `xp_log` admin : policy `select_admin_xp` — admin peut lire tous les xp_log

### Events trackés

| Event | Page | Meta |
|---|---|---|
| `session_start` | `/accueil` | `{ niveau, xp_total, nb_badges, nb_pronos, nb_ligues }` |
| `page_view` | toutes pages | `{ espn_id?, est_moi?, cible_id? }` |
| `clic_prono` | `/accueil` | `{ equipe, espn_id, tag }` |
| `clic_fourchette` | `/match` | `{ fourchette, espn_id }` |
| `clic_nav` | destination | `{ destination }` |
| `clic_vestiaire` | `/accueil` | `{ action: 'message', groupe_id }` |
| `clic_missions` | — | — |

Pages trackées : `/accueil`, `/mes-pronos`, `/match`, `/classement`, `/calendrier`, `/h2h`, `/stats`, `/groupes`, `/profil`.
Pages non trackées : `QuoiDeNeuf` (changelog statique), `Stats` (pas d'auth directe — useEffect dédié ajouté).

### Purge events
Manuelle via Admin — export CSV avant purge. Sélecteur 30/60/90/180 jours avec confirmation.

### Table `groupes` — colonnes
`id` | `nom` | `code_invitation` | `admin_id` | `cree_le` | `date_debut` | `date_fin` | `type_saison` | `saison` | `description` | `tag`

### Table `profils` — colonnes ajoutées (Sprint 3.5)
```sql
ALTER TABLE profils
  ADD COLUMN xp_total integer default 0 not null,
  ADD COLUMN niveau integer default 1 not null,
  ADD COLUMN badges text[] default '{}';
```

### Table `pronos_ecart` ✅ CRÉÉE (Sprint 3.6)
```
id / user_id / match_id / fourchette_choisie varchar(20) / fourchette_reelle varchar(20)
correct boolean / points_gagnes smallint / cree_le
UNIQUE(user_id, match_id)
```
- Valeurs fourchette : `serre` (1-5 pts) | `modere` (6-10) | `net` (11-20) | `large` (21-30) | `domination` (31+)

### Table `xp_log` — historique immuable des gains XP ✅
```
id / user_id / source / source_id / xp_gagne / meta jsonb / date_jour date / cree_le
```
- `date_jour` : date Paris — utilisée pour les checks quotidiens
- RLS admin : `select_admin_xp` — permet à l'admin de lire tous les xp_log

### Table `missions` — 9 missions actives + catalogue à créer ✅

**Missions existantes :**

| Slug | Titre | Type | XP | condition_type | condition_valeur |
|---|---|---|---|---|---|
| `connexion_5j` | Régulier | permanente | 75 | serie_connexion | 5 |
| `connexion_10j` | Assidu | permanente | 200 | serie_connexion | 10 |
| `connexion_30j` | Indéboulonnable | permanente | 500 | serie_connexion | 30 |
| `serie_3_corrects` | En Rythme | permanente | 100 | serie_correcte | 3 |
| `serie_5_corrects` | En Mission | permanente | 200 | serie_correcte | 5 |
| `fourchettes_3_semaine` | Précision | hebdomadaire | 75 | fourchette_posee | 3 |
| `fourchettes_2_correctes` | Tireur d'élite | hebdomadaire | 150 | fourchette_correcte | 2 |
| `connexion_5j_semaine` | Présent | hebdomadaire | 40 | connexion_semaine | 5 |
| `pronos_5_semaine` | Actif | hebdomadaire | 40 | pronos_semaine | 5 |

**Missions à créer via Admin (catalogue validé session 2026-06-08) :**

| Slug | Titre | Type | XP | condition_type | condition_valeur |
|---|---|---|---|---|---|
| `connexion_20j` | Fidèle | permanente | 350 | serie_connexion | 20 |
| `fourchettes_10_correctes` | Analyste | permanente | 300 | fourchette_correcte | 10 |
| `fourchettes_20_correctes` | Scout NBA | permanente | 500 | fourchette_correcte | 20 |
| `pronos_3_semaine` | Débutant | hebdomadaire | 20 | pronos_semaine | 3 |
| `pronos_7_semaine` | Plein Régime | hebdomadaire | 60 | pronos_semaine | 7 |
| `fourchettes_5_semaine` | Stratège | hebdomadaire | 60 | fourchette_posee | 5 |
| `fourchettes_3_correctes` | Tireur Confirmé | hebdomadaire | 200 | fourchette_correcte | 3 |
| `connexion_7j_semaine` | Parfait | hebdomadaire | 80 | connexion_semaine | 7 |

**Modes `verifierMissions()` :**
- `set` : remplace la progression par la valeur absolue (connexion, série correcte)
- `increment` : ajoute à la progression (fourchettes, pronos hebdo)

### Table `missions_utilisateurs` — progression ✅
```
id / user_id / mission_id / progression / completee / completee_le / periode
UNIQUE(user_id, mission_id, periode)
```

### Table `badges_catalogue` ✅
```
slug PK / nom / description / famille / image_url / xp_bonus
```

### Colonnes à ajouter dans `profils` (Sprint 4 / août 2026)
- `equipe_favorite_id` — équipe favorite (Sprint 4)
- `joueur_favori_id` — joueur favori (Sprint 4)
- `onboarding_done boolean default false` (août 2026)

### Évolution future table `matchs`
- `ALTER TABLE matchs ADD COLUMN tag varchar;`
- Passer `match.tag` dans `faireProno()` → débloque classements par phase

### Table `matchs` — colonnes ajoutées (Session 2026-06-07)
- `score_domicile integer` et `score_exterieur integer` — stockés via `calculerPoints()` lors de la résolution

### RLS Supabase — état validé
- `pronos` SELECT : `auth.role() = 'authenticated'`
- `pronos` INSERT/UPDATE : `auth.uid() = user_id`
- `profils` INSERT/UPDATE : `auth.uid() = id`
- `profils` UPDATE admin : policy dédiée `auth.uid() = 'fa55d016-...'`
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `semaines_gagnees` SELECT : `auth.role() = 'authenticated'`
- `groupes` INSERT : restreint à `admin_id = 'fa55d016-...'`
- `messages` DELETE : `auth.uid() = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'`
- `xp_log` SELECT/INSERT : propres + policy admin `select_admin_xp`
- `badges_catalogue` SELECT : `auth.role() = 'authenticated'`
- `missions` SELECT : `auth.role() = 'authenticated'`
- `missions_utilisateurs` SELECT/INSERT/UPDATE : propres
- `pronos_ecart` SELECT/INSERT/UPDATE : propres
- `events` INSERT : `auth.uid() = user_id` / SELECT : admin uniquement
- `cotes_cache` SELECT/INSERT/UPDATE : `auth.role() = 'authenticated'`

### GRANT Supabase
```sql
GRANT SELECT, INSERT ON xp_log TO authenticated;
GRANT SELECT ON badges_catalogue TO authenticated;
GRANT SELECT ON missions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON missions_utilisateurs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pronos_ecart TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT INSERT, SELECT ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON cotes_cache TO authenticated;
```

---

## 7. Architecture fichiers

```
src/
  App.jsx
  main.jsx
  index.css
  config.js              ← SAISON_ESPN + XP_BASE (300) + XP_COEFFICIENT (1.06) + SUPABASE_URL
  lib/supabase.js
  context/
    NoSpoilContext.jsx
    ProfilContext.jsx     ← XP connexion quotidienne + missions connexion + session_start tracking
  data/
    changelog.js
    badges.js            ← BADGES_CATALOGUE — source de vérité badges (14 badges)
  services/
    espn.js              ← recupererGagnant() retourne ecart_final
    points.js            ← calculerPoints() + lundiFin() exportée + verifierMissions branchée
    ligues.js
    xp.js                ← niveauDepuisXP, xpPourNiveau, ajouterXP, verifierJalons, verifierMissions, calculerSerieConnexion
    ecart.js             ← recupererFourchetteEcart(), poserFourchetteEcart() + missions fourchette
    tracker.js           ← track(userId, eventType, page, meta) — silencieux, non-bloquant
  pages/
    Accueil.jsx          ← bouton Missions, tracking page_view + clic_prono
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx          ← tracking page_view
    Classement.jsx       ← tracking page_view
    MesPronos.jsx        ← lien Missions, tracking page_view
    MatchDetail.jsx      ← tracking + BlocCotes (ESPN pickcenter + The Odds API)
    Calendrier.jsx       ← tracking page_view
    Profil.jsx           ← tracking page_view
    Stats.jsx            ← tracking page_view (useEffect dédié)
    H2H.jsx              ← tracking page_view
    QuoiDeNeuf.jsx
    Admin.jsx            ← 5 onglets : Dashboard / Scanner / Ligues / Utilisateurs / Modération
  components/
    UI.jsx
    Navigation.jsx       ← tracking clic_nav
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Briefing.jsx         ← missions complétées + missions proches dans ticker
    BanniereFeed.jsx
    LeVestiaire.jsx      ← tracking clic_vestiaire
    MissionsPopup.jsx    ← popup missions avec barres de progression, onglets PERMANENTES/HEBDO
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
```

---

## 8. Navigation & routes

```
/connexion        → Connexion.jsx
/inscription      → public
/accueil          → non protégé
/classement       → privé, supporte ?ligue=X
/mes-pronos       → privé, supporte ?user_id=X
/groupes          → privé
/match/:espn_id   → privé
/calendrier       → privé
/profil           → privé
/stats            → privé
/h2h              → privé
/quoi-de-neuf     → privé
/admin            → privé, restreint ADMIN_ID
*                 → redirect /accueil
```

---

## 9. Fonctionnalités livrées

### MatchDetail ✅ — v4.0
- Bloc **CONTEXTE COTES** (pré-match uniquement) :
  - Section 1 : 2 barres de probabilité — Algorithme ESPN vs Consensus marché (moyenne normalisée tous books)
  - Section 2 : Bookmakers FR (Betclic, Unibet, Winamax, PMU) — camembert SVG + % par équipe
  - Section 3 : Bookmakers US/référence (DraftKings, FanDuel, BetMGM, Pinnacle) — camembert SVG + %
  - Section 4 : Prédictions marché — Écart de points + Total points (source Pinnacle, fallback ESPN)
  - Modal "?" explicatif — probabilité implicite, écart de points, total points
  - Fallback complet : si The Odds API indisponible → ESPN pickcenter seul ; si pickcenter absent → predictor seul

### Board (Accueil) ✅ — v3.9
- Bouton "🎯 Missions" sous la barre XP → ouvre MissionsPopup

### BandeMatchs ✅ — v3.9
- Flèches navigation desktop, masquées mobile, centrage initial sur prochain match

### Admin ✅ — v3.8 (5 onglets)
- Dashboard, Scanner ESPN, Ligues, Utilisateurs, Modération

### Système Missions ✅ — v3.8
### Système Tracking events ✅ — v3.8
### MissionsPopup ✅
### MesPronos (Stats) ✅ — v3.7
### H2H ✅ — v3.7
### Calendrier ✅ — v3.4
### Explorer / Stats ✅ — v3.4
### Groupes ✅ — v3.4
### Briefing ✅ — v3.8 (enrichi missions)

---

## 10. Décisions produit

### Session 2026-06-08 — Bloc CONTEXTE COTES ✅

#### Architecture cotes
- `data.odds` ESPN toujours vide → abandonné. `data.pickcenter` = source ESPN réelle.
- `pickcenter` disponible ~J-1/J-2 uniquement → fallback obligatoire sur les matchs lointains.
- The Odds API (theoddsapi.com) free tier 500 req/mois — suffisant avec cache Supabase TTL 6h.
- 1 appel The Odds API = tous les matchs NBA à venir → pas d'appel par match.
- Cache `cotes_cache` : upsert quotidien, clé `odds_nba_YYYYMMDD`. Premier user de la tranche déclenche le refresh.
- Clé API stockée dans variable d'environnement Vercel `VITE_ODDS_API_KEY` (pas dans GitHub).

#### Affichage
- Probabilités en % (pas en cotes décimales) — plus lisible pour les users FR.
- Conversion : `1/cote` normalisé sur la somme → élimine la marge du bookmaker.
- Camembert SVG par bookmaker (sections 2 et 3) — compact, visuel, pas de barre redondante.
- Barres de progression conservées uniquement section 1 (vue globale ESPN vs marché).
- Spread affiché comme "Écart de points" — lien direct avec le Bonus Écart.
- Bookmakers FR uniquement `h2h`. Spread + total via Pinnacle (sharp reference).
- Bloc masqué sur les matchs terminés.

### Session 2026-06-07 — Sprint 3.8 — Bugfixes & stabilisation ✅
- `recupererGagnant()` retourne `score_domicile` + `score_exterieur`
- `semaine_100_pct` : attribution lundi heure Paris uniquement
- Fourchette d'écart : résolution immédiate si match déjà terminé
- `BandeMatchs` : flèches desktop, masquées mobile
- `Briefing` : ticker plein au démarrage, libellés missions contextualisés

### Session 2026-06-07 — Sprint 3.7 — Missions + Tracking ✅
- `verifierMissions()` modes `set`/`increment`
- `lundiFin()` exportée depuis `points.js`
- Dashboard Admin 8 blocs, export CSV + purge

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
**Sévérité :** 🟢 Faible — cache TTL 6h limite à ~120 appels/mois max en usage intensif. À surveiller après recrutement septembre (50+ users).

---

## 12. Dette technique ouverte

### DETTE-15 — `UI.jsx` contient des composants obsolètes
**Sévérité :** 🟢 Faible

### DETTE-18 — Clé rss2json dans le code front
**Sévérité :** 🟢 Faible pour usage perso.

### DETTE-19 — Table `matchs` sans colonne `tag`
**Sévérité :** 🟡 Moyenne — bloque les classements par phase
**Fix :** `ALTER TABLE matchs ADD COLUMN tag varchar;` + passer `match.tag` dans `faireProno()`

### DETTE-20 — `titrDepuisNiveau()` dupliqué
**Sévérité :** 🟢 Faible

### DETTE-21 — `session_start` double déclenchement
**Sévérité :** 🟢 Faible

### DETTE-22 — `semaine_100_pct` dépend d'un login le lundi
**Sévérité :** 🟡 Moyenne — Fix définitif : Edge Functions post-Sprint 4.

### DETTE-23 — Correspondance match ESPN ↔ The Odds API par nom d'équipe
**Sévérité :** 🟢 Faible — matching par trigramme + nom complet, peut planter sur noms atypiques. À surveiller en saison régulière.

---

## 13. Backlog

### Sprints 1→3.8 + Cotes ✅ LIVRÉS

### Reste Sprint 3
```
✅ Audit XP post-Finals — clôturé, doublons corrigés
✅ Onglet Missions dans Admin — CRUD complet livré (créer/modifier/supprimer + guide conditions)
```

### Avant juillet 2026 (Summer League)
```
✅ Répartition des points Summer League — confirmée : 1 pt prono + 2 pts fourchette (identique saison régulière)
✅ Tagline — "Pronostique. Flambe. Règne." active partout
⏳ Nouvelles missions à créer manuellement via Admin (catalogue ci-dessous)
```

### Août 2026 — avant recrutement septembre
```
⏳ Onboarding carousel 5 slides (onboarding_done boolean dans profils)
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Colonne tag dans matchs → classements par phase (DETTE-19)
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (equipe_favorite_id + joueur_favori_id dans profils)
Filtrage pronos saison régulière — mécanisme à concevoir
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes (5 raretés, tirage quotidien, /ma-collection)
Roue quotidienne (1 tour/jour, XP / rien / fragment de carte)
Edge Functions Supabase (sécurité XP côté serveur)
Titres saisonniers (gravés en fin de saison NBA dans profils)
```

### Post-Sprint 4
```
H2H historique équipes saison régulière dans MatchDetail
Bracket Summer League dynamique
Classements par phase (nécessite DETTE-19)
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

---

## 15. RGPD & sécurité

- Clés Supabase : variables d'environnement (`.env`), jamais commitées
- `SUPABASE_URL` et `anon key` : OK dans le front (protégées par RLS)
- `service_role key` : JAMAIS dans le code front
- Clé rss2json : dans le code front pour usage perso (acceptable)
- Clé The Odds API : `VITE_ODDS_API_KEY` dans Vercel env vars + `.env` local (jamais dans GitHub)
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
| `socle_nba_v4_0.md` | Référence technique unique | ✅ Ce document |
| `swish_league_roadmap_v2_3.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_2.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v4.0 — 2026-06-08*
*Remplace socle_nba_v3_9.md*
