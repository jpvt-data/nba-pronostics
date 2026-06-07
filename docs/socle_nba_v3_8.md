# SWISH LEAGUE — SOCLE v3.8
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-07

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
Tagline actuelle : **"Pronostique. Clashe. Règne."**
Tagline en cours de validation : **"Pronostique. Performe. Règne."** — mise à jour partout (navbar, popup, onboarding) quand validée.

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

---

## 6. BDD Supabase

### Tables actuelles
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `pronos_ecart` | `semaines_gagnees` | `messages` | `xp_log` | `missions` | `missions_utilisateurs` | `badges_catalogue` | `events`

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

### Table `missions` — 9 missions actives ✅
```
id / slug unique / titre / description / type / xp_recompense / condition_type / condition_valeur / actif
```

**Catalogue missions actuel :**

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
- `equipe_favorite_id`, `joueur_favori_id`
- `onboarding_done boolean default false` (août 2026)

### Évolution future table `matchs`
- `ALTER TABLE matchs ADD COLUMN tag varchar;`
- Passer `match.tag` dans `faireProno()` → débloque classements par phase

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
    MatchDetail.jsx      ← tracking page_view + clic_fourchette
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

### Board (Accueil) ✅ — v3.8
- Bouton "🎯 Missions" sous la barre XP → ouvre MissionsPopup

### Admin ✅ — v3.8 (5 onglets)
- **Dashboard** : 8 blocs — vue d'ensemble, pages vues, profil users, actions clés, top users, rétention, XP par user, export/purge CSV
- Scanner ESPN (persistant)
- Ligues (CRUD complet)
- Utilisateurs (attribution badges)
- Modération

### Système Missions ✅ — v3.8
- `verifierMissions()` avec mode `set`/`increment`
- `calculerSerieConnexion()` dans `xp.js`
- 9 missions en base (3 connexion, 2 série corrects, 2 fourchettes, 2 hebdo)
- `MissionsPopup.jsx` — bottom sheet, onglets PERMANENTES/HEBDO, barres de progression
- Briefing enrichi : missions complétées < 24h + missions proches (≥ 50%)
- Déclencheur "Missions →" dans Accueil et MesPronos

### Système Tracking events ✅ — v3.8
- Table `events` + RLS + GRANT
- `tracker.js` — fonction `track()` silencieuse et non-bloquante
- Branché dans 11 pages/composants
- `session_start` enrichi avec snapshot profil complet

### MissionsPopup ✅
- Accessible depuis Board (bouton gold sous barre XP) et MesPronos (lien "Missions →")
- Onglets PERMANENTES / HEBDO
- Carte par mission : titre, description, barre progression, XP reward
- Missions complétées grisées en bas

### MesPronos (Stats) ✅ — v3.7
- Header XP/badges, stats globales + écart, stats ligues dropdown, historique XP
- Lien "Missions →" à côté de "Historique XP →"

### MatchDetail ✅ — v3.6
- Bloc BONUS ÉCART, fallback Summer League, détection Finals fiable

### H2H ✅ — v3.7
- Bilan fourchettes + détail match par match

### Calendrier ✅ — v3.4
### BandeMatchs ✅ — v3.4
### Explorer / Stats ✅ — v3.4
### Groupes ✅ — v3.4
### Briefing ✅ — v3.8 (enrichi missions)

---

## 10. Décisions produit

### Session 2026-06-07 — Sprint 3.7 — Missions + Tracking ✅

#### Système missions
- `verifierMissions()` supporte deux modes : `set` (valeurs absolues pour séries) et `increment` (compteurs cumulatifs)
- Missions permanentes crescendo = jalons éditoriaux one-shot. Missions hebdomadaires = moteur de rétention récurrent.
- `lundiFin()` exportée depuis `points.js` — utilisée comme clé de période hebdomadaire dans `ecart.js` et `ProfilContext.jsx`
- Missions connexion hebdo : comptées via jours distincts dans `xp_log` (mode `set`)
- Missions pronos hebdo : incrémentées à chaque nouveau prono dans `faireProno()` (mode `increment`)

#### Système tracking
- Architecture : table `events` Supabase + service `tracker.js` côté front
- Philosophie : silencieux (try/catch), jamais bloquant pour l'UI
- `session_start` snapshote l'état complet du user (niveau, XP, badges, pronos, ligues)
- `session_start` peut se déclencher en double (ProfilContext + Accueil) — dédupliquer côté dashboard via fenêtre temporelle
- Stats.jsx : pas d'auth directe — `useEffect` dédié au tracking uniquement, indépendant du reste de la page
- Dashboard Admin : RLS `select_admin_xp` sur `xp_log` pour permettre lecture de tous les XP par l'admin

#### Dashboard Admin
- 8 blocs exploitant `events`, `profils`, `pronos`, `xp_log`
- Période sélectionnable 7j / 14j / 30j
- Bloc XP par user : sélecteur par pseudo, historique 100 entrées avec labels lisibles
- Export CSV complet de tous les events + purge manuelle avec confirmation

### Session 2026-06-04 — Sprint 3.4
- `detecterType()` centralisé
- Tagline "Clashe" → "Performe" en cours de validation

### Session 2026-06-05 — Sprint 3.5 — Système RPG ✅
Voir socle v3.7 pour le détail complet.

### Session 2026-06-05 — Sprint 3.6 — Bonus Écart ✅
Voir socle v3.7 pour le détail complet.

---

## 11. Risques ouverts

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute

### RISQUE-B — ESPN API changement de structure
**Sévérité :** 🟡 Moyenne

### RISQUE-F — rss2json.com indisponibilité
**Sévérité :** 🟢 Faible

### RISQUE-G — Missions répétitives après S2
**Sévérité :** 🟡 Moyenne — renouveler le catalogue chaque saison via admin

### RISQUE-H — Volume events Supabase
**Sévérité :** 🟢 Faible à court terme (3 users). Surveiller à partir de 50 users actifs. Purge manuelle via Admin.

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
**Sévérité :** 🟢 Faible — défini dans `xp.js`, `MesPronos.jsx`, `Accueil.jsx`, `Briefing.jsx`, `Admin.jsx`. À centraliser dans `xp.js` et exporter.

### DETTE-21 — `session_start` double déclenchement
**Sévérité :** 🟢 Faible — ProfilContext + Accueil peuvent tous deux déclencher `session_start`. Dédupliquer côté dashboard (fenêtre 5 secondes).

---

## 13. Backlog

### Sprints 1→3.7 ✅ LIVRÉS

### Reste Sprint 3
```
⏳ Audit XP post-Finals — vérifier jalons, semaine_100_pct, prono_correct pour chaque user
⏳ Onglet Missions dans Admin — création/activation/désactivation manuelle
```

### Avant juillet 2026 (Summer League)
```
⏳ Répartition des points — à revoir (actuellement 1 pt prono + 2 pts fourchette)
⏳ Tagline — valider "Performe" et mettre à jour partout
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
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes (5 raretés, tirage quotidien, /ma-collection)
Roue quotidienne (1 tour/jour, XP / rien / fragment de carte) — complète la connexion, ne remplace pas
Edge Functions Supabase (sécurité XP côté serveur)
Titres saisonniers (gravés en fin de saison NBA dans profils)
```

### Post-Sprint 4
```
H2H historique équipes saison régulière dans MatchDetail
Enrichissement MatchDetail : cotes bookmakers ESPN
Bracket Summer League dynamique
Classements par phase (nécessite DETTE-19)
Draft Night pronos (nouveau type de prono, chantier à part)
Jalons visuels tous les 5 niveaux (plateau MVP)
XP social : +XP sur réaction Vestiaire
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

---

## 15. RGPD & sécurité

- Clés Supabase : variables d'environnement (`.env`), jamais commitées
- `SUPABASE_URL` et `anon key` : OK dans le front (protégées par RLS)
- `service_role key` : JAMAIS dans le code front
- Clé rss2json : dans le code front pour usage perso (acceptable)
- Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`
- Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France)
- `xp_log` : table immuable — pas d'UPDATE/DELETE autorisé via RLS
- `events` : SELECT restreint à l'admin — les users ne peuvent pas lire les events des autres
- Edge Functions Supabase : noté pour post-Sprint 4

---

## 16. Veille technique

- ESPN API non officielle : surveiller changements de structure des `notes`
- rss2json.com : surveiller quota (10k req/jour)
- Supabase : surveiller free tier + pause inactivité + volume table `events`
- Vercel Hobby : usage non-commercial uniquement

---

## 17. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v3_8.md` | Référence technique unique | ✅ Ce document |
| `swish_league_roadmap_v2_1.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_1.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.8 — 2026-06-07*
*Remplace socle_nba_v3_7.md*
