# SWISH LEAGUE — SOCLE v3.4
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-04

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

**App web NBA communautaire** — pronos, stats, scores, classements, collection de cartes joueurs.
Nom de marque : **Swish League**.
Tagline actuelle : **"Pronostique. Clashe. Règne."**
Tagline en cours de validation : **"Pronostique. Performe. Règne."** — "Clashe" jugé trop agressif, "Performe" plus universel et aligné avec l'esprit compétition amicale + passion NBA. Mise à jour partout (navbar, popup, onboarding) quand validée.

Périmètre : app de passion NBA, compétition amicale, passion commune, partage — pas du "clashe" agressif.
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
- Supabase : https://fcyhieueuskeooakyla.supabase.co

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE
**Logo :** texte Teko — "SWISH" `var(--text-1)` + "LEAGUE" `var(--accent)`, pas d'image logo
**Accroche :** "Pronostique · Clashe · Règne" (sous le logo en navbar — à mettre à jour quand tagline validée)

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
--gold: #f59e0b        streak / podium / points
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
- **--gold** : CLASSEMENT NBA, points, médailles, streak, MVP
- **--accent** : éléments interactifs, TIMELINE, LIGUE EN COURS, ACTU NBA
- **--orange** : À LA UNE, BanniereFeed, EXPLORER
- **--success** : prono correct
- **--danger** : prono raté, blessés, admin

### Couleurs tags ESPN (partagées Admin / Calendrier / BandeMatchs / MatchDetail)

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

- **Scoreboard passé** : utiliser plage `dates=YYYYMMDD-YYYYMMDD` (même date répétée) pour récupérer les `notes` — l'appel date unique ne retourne pas les notes pour les matchs passés.
- **Headlines pour MatchDetail** : appel scoreboard `J-1 → J` pour couvrir les matchs UTC décalés (ex: match 23h UTC = lendemain Paris).
- **Summer League** : endpoint séparé `nba-summer-las-vegas`. Fallback automatique dans `recupererDetailMatch()` si NBA échoue.
- **Standings pré-saison** : `seasontype=1`, standings saison régulière : `seasontype=2`, playoffs : `seasontype=3` (BracketPlayoffs utilisé à la place).
- **Stats joueur historique** : `?season=YYYY&seasontype=N` — disponible depuis ~2003.

### Détection des types de matchs — `detecterType()`

Fonction partagée identique dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`.

| Condition | Tag retourné |
|---|---|
| `season.type = 1` | `preseason` |
| `season.type = 5` | `playin` |
| `season.type = 3` + headline contient "nba finals" ou "the finals" | `finals` |
| `season.type = 3` (autre) | `playoffs` |
| `comp.type = ALLSTAR` ou headline "all-star" | `allstar` |
| `season.type = 2` + headline "nba cup" / "in-season tournament" / "nba cup championship" | `nbacup` |
| `season.type = 2` + headline "play-in" | `playin` |
| slug `nba-summer-las-vegas` | `summer_league` |
| Tout le reste | `regular` |

**Important :** "East Finals" / "West Finals" = `playoffs`, pas `finals`. Seul "NBA Finals" déclenche le tag `finals`.

### `TAG_CONFIG` — exporté depuis `espn.js`
Utilisé dans `MatchDetail.jsx` pour les badges enrichis. Contient uniquement les tags avec badge enrichi : `nbacup`, `allstar`, `playin`, `playoffs`, `finals`. Les tags `preseason`, `regular`, `summer_league` ne génèrent pas de badge enrichi (déjà couverts par `typeSaison`).

---

## 5. Sources de données tierces

### Basket USA — actus NBA en français
- **Source :** https://www.basketusa.com/feed/ (flux RSS WordPress)
- **Proxy :** rss2json.com (clé API — 10 000 req/jour)
- **Usage :** BanniereFeed (article 1) + NewsNBA (articles 2 à 6)
- **Clé stockée :** dans `BanniereFeed.jsx` — à déplacer en variable d'env si app publique.

---

## 6. BDD Supabase

### Tables actuelles
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `semaines_gagnees` | `messages`

### Table `groupes` — colonnes
`id` | `nom` | `code_invitation` | `admin_id` | `cree_le` | `date_debut` | `date_fin` | `type_saison` | `saison` | `description` | `tag`

Les colonnes `description` (text) et `tag` (varchar) sont actives. `tag` correspond aux tags ESPN (`nbacup`, `playoffs`, `finals`...).

### Tables à créer (Sprint 4)
- `xp_log` — historique XP par action
- Colonnes à ajouter dans `profils` : `xp_total`, `niveau`, `equipe_favorite_id`, `joueur_favori_id`
- Colonne à ajouter dans `profils` : `onboarding_done boolean default false` (à créer en août 2026)

### Évolution future table `matchs`
- Ajouter colonne `tag varchar` → permet les classements par phase (NBA Cup, Summer League, pré-saison)
- Migration : `ALTER TABLE matchs ADD COLUMN tag varchar;`
- Dans `faireProno()` (Accueil.jsx) : passer `match.tag` au moment de l'upsert
- Débloque : classements et stats filtrés par phase dans ClassementRapide et Classement.jsx

### RLS Supabase — état validé
- `pronos` SELECT : `auth.role() = 'authenticated'`
- `pronos` INSERT/UPDATE : `auth.uid() = user_id`
- `profils` INSERT/UPDATE : `auth.uid() = id`
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `semaines_gagnees` SELECT : `auth.role() = 'authenticated'`
- `groupes` INSERT : restreint à `admin_id = 'fa55d016-...'`
- `messages` DELETE : `auth.uid() = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'`

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
  data/changelog.js
  services/
    espn.js              ← detecterType(), TAG_CONFIG, recupererDetailMatch() avec fallback SL
    points.js
    ligues.js
  pages/
    Accueil.jsx
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx          ← épuré (sans gestion admin), badge tag + description
    Classement.jsx
    MesPronos.jsx
    MatchDetail.jsx      ← badge enrichi headline ESPN
    Calendrier.jsx       ← filtres par tag, Summer League, navigation auto
    Profil.jsx
    Stats.jsx            ← Explorer : classements pré-saison/régulière/playoffs, stats joueur par saison+type
    H2H.jsx
    QuoiDeNeuf.jsx
    Admin.jsx            ← 3 onglets : Scanner ESPN (persistant), Ligues, Modération
  components/
    UI.jsx               ← composants obsolètes, fichier conservé
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx      ← tags du jour affichés à droite de la date
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Briefing.jsx
    BanniereFeed.jsx
    LeVestiaire.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx     ← seasontype dynamique (1/2), masqué si playoffs
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
    ← CreerGroupe.jsx supprimé (logique intégrée dans Admin.jsx)
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

### Board (Accueil) ✅ — v3.3
1. **Header** — "Bonjour JPVT"
2. **À LA UNE** + BanniereFeed
3. **TIMELINE** + BandeMatchs (avec tags du jour)
4. **Ticker Briefing**
5. **LIGUE EN COURS** + ClassementRapide
6. **LE VESTIAIRE**
7. **CLASSEMENT NBA** + StandingsNBA + BracketPlayoffs si playoffs
8. **ACTU NBA** + NewsNBA

### Scanner ESPN ✅ — v3.4 (Admin)
- Scan complet juillet → juin (12 mois), Summer League incluse (juillet + août via `nba-summer-las-vegas`)
- Détection 8 types : preseason / regular / nbacup / allstar / playin / playoffs / finals / summer_league
- Synthèse avec types obligatoires vs optionnels, dates min/max, nb matchs, exemples headlines
- Tableau détail par type (notes ESPN, source NBA/SL)
- **State persistant entre onglets** — changer d'onglet Admin ne réinitialise plus le scan
- Saisons configurées : 2023-24 → 2029-30

### Admin ✅ — v3.4 (3 onglets)
- **Scanner ESPN** : voir ci-dessus
- **Ligues** : Créer / Modifier / Supprimer les ligues. Formulaire complet (nom, phase ESPN, saison, dates, description). Bouton "Remplir depuis scanner ESPN" qui pré-remplit automatiquement depuis les données scannées.
- **Modération** : suppression messages Le Vestiaire

### Calendrier ✅ — v3.4
- Filtres par type : Tous / Pré-saison / Saison régulière / NBA Cup / All-Star / Play-In / Playoffs / Finals / Summer League
- Summer League : appel parallèle `nba-summer-las-vegas` sur juillet + août automatiquement
- Navigation auto au 1er match du filtre sélectionné (si en cache)
- Index `{ tag → dateMin }` mis à jour à chaque appel ESPN

### MatchDetail ✅ — v3.4
- Badge enrichi : headline ESPN affichée si présente (NBA Cup - Quarter Final, NBA Abu Dhabi Game...)
- Fallback Summer League : essai NBA d'abord, puis `nba-summer-las-vegas` si échec
- Correction `TYPE_SAISON` : `5 → 'Play-In'` (était 'International')
- Appel scoreboard `J-1 → J` pour récupérer les notes sur matchs passés
- Finals correctement détectés via `seasonseries[playoff].description`

### BandeMatchs ✅ — v3.4
- Tags du jour affichés à droite de la date (NBA Cup, Playoffs, Finals...)
- `recupererTimeline()` enrichi avec `tag` et `headline` sur chaque match

### Explorer / Stats ✅ — v3.4
- **Classements** : toggle Pré-saison / Saison régulière / Playoffs. Pré-saison affiche standings ESPN `seasontype=1`.
- **Joueurs / FicheJoueur** : sélecteur saison historique (2002-03 → saison courante) + toggle Saison régulière / Playoffs / Pré-saison. Stats et radar rechargés dynamiquement.
- **StandingsNBA** : `seasontype` dynamique. Pré-saison affiche standings régulière avec label "Référence". Playoffs → masqué (BracketPlayoffs prend le relais).

### Groupes ✅ — v3.4
- Épuré : plus de gestion admin dans la page utilisateur
- Enrichi : badge tag coloré par phase ESPN + description de la ligue

---

## 10. Décisions produit

### Session 2026-06-04 — Sprint 3 suite (v3.4)

**Système de tags ESPN :**
- `detecterType()` est la fonction centrale partagée entre tous les composants
- 8 tags définis : preseason, regular, nbacup, allstar, playin, playoffs, finals, summer_league
- "East Finals" / "West Finals" = `playoffs` — seul "NBA Finals" = `finals`
- Pattern `'finals - game'` supprimé car trop générique

**ESPN — leçons apprises sur les notes :**
- Notes ESPN (`comp.notes[0].headline`) absentes dans le `summary`
- Notes absentes dans le scoreboard avec date unique (`dates=YYYYMMDD`)
- Notes **présentes** dans le scoreboard avec plage (`dates=YYYYMMDD-YYYYMMDD`)
- Solution : appel scoreboard `J-1 → J` dans `recupererDetailMatch()` pour récupérer les headlines

**Classements par phase (NBA Cup, Summer League, pré-saison) :**
- ESPN ne propose pas de standings dédiés pour ces phases
- Solution future : ajouter colonne `tag` dans table `matchs` Supabase → filtrer les pronos par phase
- Priorité : Sprint 4 ou après selon recrutement

**Gestion des ligues :**
- Création / modification / suppression déplacée dans Admin uniquement
- `CreerGroupe.jsx` supprimé
- Bouton "Remplir depuis scanner ESPN" : pré-remplit nom, dates, saison, description depuis les données scannées de la session

**Tagline :**
- "Clashe" → "Performe" en cours de validation
- Mise à jour à faire : navbar, popup changelog, onboarding

**Onboarding — reporté à août 2026 :**
- Format : overlay carousel 5 slides
- Déclenchement : `onboarding_done boolean` dans `profils` (colonne à créer en août)

---

## 11. Risques ouverts

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute

### RISQUE-B — ESPN API changement de structure
**Sévérité :** 🟡 Moyenne — les notes ESPN peuvent changer de format ou d'emplacement selon les saisons

### RISQUE-F — rss2json.com indisponibilité
**Sévérité :** 🟢 Faible

---

## 12. Dette technique ouverte

### DETTE-15 — `UI.jsx` contient des composants obsolètes
**Sévérité :** 🟢 Faible

### DETTE-18 — Clé rss2json dans le code front
**Sévérité :** 🟢 Faible pour usage perso.

### DETTE-19 — Table `matchs` sans colonne `tag`
**Sévérité :** 🟡 Moyenne — bloque les classements par phase (NBA Cup, Summer League, pré-saison)
**Fix :** `ALTER TABLE matchs ADD COLUMN tag varchar;` + passer `match.tag` dans `faireProno()`

---

## 13. Backlog

### Sprints 1, 2, 2.5, 3, 3.4 ✅ LIVRÉS

### Sprint 3 restant ⏳
```
⏳ XP / niveaux / badges — chantier principal suivant
    Tables : xp_log, colonnes xp_total/niveau dans profils
    7 niveaux : Rookie → Role Player → Starter → All-Star → MVP → Hall of Famer → GOAT
    Badges déclenchés par actions (streak, MVP semaine, premier prono...)
    Affichage : profil + Briefing ticker + Vestiaire
```

### Août 2026 — avant recrutement
```
⏳ Onboarding carousel 5 slides
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Tagline — valider "Performe" et mettre à jour partout (navbar, popup, onboarding)
⏳ Colonne tag dans matchs → classements par phase (NBA Cup, Summer League, pré-saison)
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (équipe & joueur favoris)
    Champs equipe_favorite_id + joueur_favori_id dans profils.

Système de niveaux & XP
    Tables xp_log + champs xp_total/niveau dans profils.
    7 niveaux : Rookie → Role Player → Starter → All-Star → MVP → Hall of Famer → GOAT.

Avatar personnalisable
    SVG layers. Maillots 30 équipes, cadres par niveau. Tout gagné, rien acheté.

Collection de cartes joueurs
    Catalogue ~200 cartes. 5 raretés : Common / Rare / Epic / Legendary / Ultimate.
    Tirage quotidien. Page /ma-collection.

Pronostic écart final
    Victoire serrée (<5 pts) ou large (>20 pts) → +2 pts bonus.
    Migration table pronos requise.
```

### Post-Sprint 4
```
H2H historique équipes saison régulière dans MatchDetail
Enrichissement MatchDetail : cotes bookmakers ESPN (sports.core.api.espn.com/odds)
Bracket Summer League dynamique (phases Semi / Final depuis headlines ESPN nba-summer-las-vegas)
Classements par phase (NBA Cup, pré-saison, Summer League) — nécessite DETTE-19 résolue
```

### Mis de côté indéfiniment
- Swish Data pipeline
- Notifications push Web (iOS limité)
- Score exact en bonus (impossible au basket)
- Leaderboard global séparé (inutile à l'échelle actuelle)

---

## 14. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- **Toujours indiquer fichier + bloc + contexte pour toute modification**
- **Une modification à la fois — push + test entre chaque**
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- Tokens CSS : toujours utiliser les variables, jamais de valeurs brutes
- `TitreSection` défini localement dans chaque fichier
- Pas de `border-radius-lg` sur les blocs de contenu
- Séparateurs `<div style={{ height: 32 }} />` pour les espacements Board
- Commentaires JSX : toujours `{/* */}`, jamais `//` dans le JSX
- `detecterType()` : fonction partagée — toute modification doit être répercutée dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`

---

## 15. RGPD & sécurité

Clés Supabase : variables d'environnement, jamais commitées.
Clé rss2json : dans le code front pour usage perso — à passer en variable d'env si app publique.
Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`.
Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France).

---

## 16. Veille technique

- ESPN API non officielle : surveiller changements de structure des `notes` par saison
- rss2json.com : surveiller quota (10k req/jour)
- Supabase : surveiller free tier + pause inactivité
- Vercel Hobby : usage non-commercial uniquement

---

## 17. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v3_4.md` | Référence technique | ✅ Ce document |
| `swish_league_roadmap_v1_7.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.4 — 2026-06-04*
*Remplace socle_nba_v3_3.md*
