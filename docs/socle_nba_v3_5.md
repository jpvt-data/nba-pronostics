# SWISH LEAGUE — SOCLE v3.5
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
Tagline en cours de validation : **"Pronostique. Performe. Règne."** — "Clashe" jugé trop agressif, "Performe" plus universel. Mise à jour partout (navbar, popup, onboarding) quand validée.

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
- Supabase : https://fcyhieueuskeooakyla.supabase.co

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

- **Scoreboard passé** : utiliser plage `dates=YYYYMMDD-YYYYMMDD` pour récupérer les `notes` — date unique ne retourne pas les notes pour les matchs passés.
- **Headlines pour MatchDetail** : appel scoreboard `J-1 → J` pour couvrir les matchs UTC décalés.
- **Summer League** : endpoint séparé `nba-summer-las-vegas`. Fallback automatique dans `recupererDetailMatch()`.
- **Standings** : `seasontype=1` pré-saison, `=2` régulière, `=3` playoffs.
- **Stats joueur historique** : `?season=YYYY&seasontype=N` — disponible depuis ~2003.

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

"East Finals" / "West Finals" = `playoffs`. Seul "NBA Finals" = `finals`.

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
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `semaines_gagnees` | `messages`

### Table `groupes` — colonnes
`id` | `nom` | `code_invitation` | `admin_id` | `cree_le` | `date_debut` | `date_fin` | `type_saison` | `saison` | `description` | `tag`

### Tables à créer — Système RPG Progression

> ⚠️ Conception validée — DDL complet à rédiger en prochaine session.

**`xp_log`** — historique immuable des gains XP
```
user_id / source ('mission'|'jalon'|'passif'|'admin') / source_id / xp_gagne / meta jsonb / cree_le
```
RLS : SELECT + INSERT propres. Pas d'UPDATE ni DELETE côté client.

**`missions`** — catalogue auto + manuelles admin
```
slug unique / titre / description / type ('quotidienne'|'hebdomadaire'|'evenement'|'permanente')
xp_recompense / badge_slug / condition_type / condition_valeur
actif / date_debut / date_fin / cree_par ('auto'|'admin')
```

**`missions_utilisateurs`** — progression par user × mission × période
```
user_id / mission_id / progression / completee / completee_le
periode ('2026-06-04' quotidienne | '2026-W23' hebdo | null événement)
UNIQUE(user_id, mission_id, periode)
```

**`badges_catalogue`** — référentiel visuel
```
slug PK / nom / description / famille / image_url / xp_bonus
```

**Colonnes à ajouter dans `profils` :**
```sql
ALTER TABLE profils
  ADD COLUMN xp_total integer default 0 not null,
  ADD COLUMN niveau integer default 1 not null,
  ADD COLUMN badges text[] default '{}';
```

**Note :** le niveau est toujours calculé depuis `xp_total` via `XP_BASE`/`XP_COEFFICIENT` dans `config.js`. La colonne `niveau` dans `profils` est un cache recalculé à chaque gain d'XP.

### Autres colonnes à ajouter dans `profils` (Sprint 4 / août 2026)
- `equipe_favorite_id`, `joueur_favori_id`
- `onboarding_done boolean default false` (août 2026)

### Évolution future table `matchs`
- `ALTER TABLE matchs ADD COLUMN tag varchar;`
- Passer `match.tag` dans `faireProno()` → débloque classements par phase

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
  config.js              ← SAISON_ESPN + XP_BASE + XP_COEFFICIENT
  lib/supabase.js
  context/
    NoSpoilContext.jsx
    ProfilContext.jsx
  data/changelog.js
  services/
    espn.js
    points.js
    ligues.js
    xp.js               ← à créer Sprint 4 (niveauDepuisXP, ajouterXP, verifierJalons)
  pages/
    Accueil.jsx
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx
    MatchDetail.jsx
    Calendrier.jsx
    Profil.jsx           ← bloc XP + grille badges + titres saisonniers à ajouter
    Stats.jsx
    H2H.jsx
    QuoiDeNeuf.jsx
    Admin.jsx            ← onglet Missions à ajouter
  components/
    UI.jsx
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Briefing.jsx         ← notifications XP/badge/niveau à ajouter
    BanniereFeed.jsx
    LeVestiaire.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
    MissionsBoard.jsx    ← à créer (bloc Board missions actives)
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
À LA UNE / TIMELINE / TICKER / LIGUE EN COURS / VESTIAIRE / CLASSEMENT NBA / ACTU NBA

### Admin ✅ — v3.4 (3 onglets)
Scanner ESPN (persistant) / Ligues (CRUD complet + remplissage auto depuis scanner) / Modération

### Calendrier ✅ — v3.4
Filtres par phase, Summer League, navigation auto au 1er match du filtre

### MatchDetail ✅ — v3.4
Badge headline ESPN, fallback Summer League, détection Finals fiable, appel scoreboard J-1→J

### BandeMatchs ✅ — v3.4
Tags du jour affichés à droite de la date

### Explorer / Stats ✅ — v3.4
Classements Pré-saison/Régulière/Playoffs, stats joueur historiques par saison + type

### Groupes ✅ — v3.4
Épuré (gestion admin dans Admin), badge tag + description

---

## 10. Décisions produit

### Session 2026-06-04 — Sprint 3.4
- `detecterType()` centralisé dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`
- Notes ESPN absentes en summary et scoreboard date unique — présentes en scoreboard plage
- Gestion ligues déplacée dans Admin uniquement (`CreerGroupe.jsx` supprimé)
- Tagline "Clashe" → "Performe" en cours de validation

---

### Session 2026-06-04 — Conception RPG Progression (⚠️ non implémenté)

#### Philosophie
"Tu démarres tout nu. Tu finis armé." Inspiration RPG — progression narrative sur le long terme.
- **XP cumulatif à vie** (jamais remis à zéro) → niveau de carrière
- **Titre saisonnier** gravé en fin de saison NBA → palmarès permanent
- Les missions sont la principale source d'accélération XP

#### Courbe 100 niveaux
Paramètres dans `config.js` — recalibrables sans toucher la logique ni l'XP existant.
`XP_BASE = 300` / `XP_COEFFICIENT = 1.06`

| Titre | Niveaux | XP cumulé pour entrer |
|---|---|---|
| Rookie | 1-10 | 0 |
| Sixième Homme | 11-20 | ~5 300 |
| Starter | 21-30 | ~17 000 |
| All-Star | 31-40 | ~52 000 |
| MVP | 41-60 | ~160 000 |
| Hall of Fame | 61-80 | ~480 000 |
| GOAT | 81-100 | ~1 400 000 |

Calibrage : très actif (~32 000 XP/saison) → Sixième Homme fin S1, GOAT en ~5-6 saisons. Casual (~5 400 XP/saison) → sort du Rookie en ~2 saisons.

⚠️ Risque plateau MVP (niveaux 40-60) : jalons visuels tous les 5 niveaux à prévoir.

#### Sources XP validées

| Action | XP | Fréquence |
|---|---|---|
| Prono posé | +10 | Par prono |
| Prono correct | +25 | Par prono validé |
| Connexion quotidienne | +5 | 1×/jour |
| Premier prono du jour | +10 | 1×/jour |
| 100% matchs pronostiqués sur une semaine | +50 | Par semaine |
| Premier prono de l'histoire | +75 | 1× à vie |

#### Jalons automatiques

| Jalon | XP | Badge |
|---|---|---|
| 10 pronos posés | +50 | — |
| 50 pronos posés | +150 | 🃏 All-In |
| 100 pronos posés | +300 | — |
| 5 corrects consécutifs | +100 | 🔥 En Feu |
| 10 corrects consécutifs | +250 | 👑 Prophète |
| Win rate 65%+ sur 20 pronos | +200 | 🧠 Analyste |
| Gagner une semaine de ligue | +150 | 🏆 Champion |
| Battre le favori ESPN 10 fois | +200 | 💀 Anti-Fade |
| 5 ratés consécutifs | +0 | 🧊 Cold Turkey (humour) |

#### Badges — 4 familles

**Performance (jalons auto)**
🔥 En Feu / 👑 Prophète / 🧊 Cold Turkey / 🧠 Analyste / 🏆 Champion / 💀 Anti-Fade / 🏃 Marathonien

**Appartenance (identité)**
🏀 OG (saison 1) / 🃏 All-In (50 pronos) / 🩹 Survivant (série cassée après 7+)

**Événements saisonniers (limités, jamais récupérables)**
🎯 Playoff Warrior / 🔮 Finals Oracle / ⭐ All-Star Picker (manuel admin)

**Admin (libres)**
Fondateur, Bêta-Testeur, événements IRL — créés et attribués manuellement depuis `/admin`

Badges non obtenus : **visibles grisés** sur le profil (motivation).
Assets : PNG hexagonaux, Supabase Storage bucket `badges`, nommage `badge_[slug].png`.
Couleurs famille : Performance `#ef4444` / Appartenance `#6366f1` / Événements `#f59e0b` / Admin `#9090b0`.

#### Missions — 4 types

| Type | Reset | Exemples |
|---|---|---|
| Quotidienne | Minuit | Poser 3 pronos (+40), prono chaque conférence (+30) |
| Hebdomadaire | Lundi minuit | 5 corrects cette semaine (+120), 60%+ win rate (+100) |
| Événement | Date de fin | Play-In 8 matchs (+200), All-Star 5 pronos (+100) |
| Permanente | Jamais | One-shots (premier prono, etc.) |

Mêmes missions pour tous — simplicité + effet communautaire.
Missions estivales Summer League : endpoint `nba-summer-las-vegas` déjà supporté, zéro dev supplémentaire.
Catalogue missions = levier éditorial admin à renouveler chaque saison.

#### Titres saisonniers

| Classement final | Titre |
|---|---|
| 1er | 👑 Champion Saison 25-26 |
| 2e-3e | 🥈 Finaliste Saison 25-26 |
| Top 50% | 🏀 Compétiteur Saison 25-26 |

#### UI — 4 surfaces
- **Header Board** : icône niveau + chiffre + "Rookie • Niv. 7" + barre progression fine
- **Bloc Board** (`MissionsBoard.jsx`) : 2-3 missions actives + barre progression
- **Profil** : XP total + barre + grille badges (grisés si non obtenus) + titres saisonniers + historique XP
- **Briefing ticker** : "🔥 En Feu débloqué !" / "⬆️ Starter — Niveau 21 atteint !"

#### Points ouverts avant implémentation
- [ ] DDL Supabase complet (4 tables + colonnes profils)
- [ ] Service `xp.js` (niveauDepuisXP, ajouterXP, verifierJalons, verifierMissions)
- [ ] Catalogue missions quotidiennes complet
- [ ] Outil génération assets badges (Midjourney ? SVG custom ?)
- [ ] Onglet "Missions" dans Admin (création manuelle, activation/désactivation)
- [ ] Roue quotidienne : remplace ou complète le +5 XP connexion ? (Sprint 4, lié collection cartes)

#### Idées notées pour plus tard
- 🎡 Roue quotidienne (Sprint 4) — 1 tour/jour, XP bonus / rien / fragment de carte
- 🏀 Draft Night pronos (post-Sprint 4) — nouveau type de prono, chantier à part
- XP social : +XP sur réaction Vestiaire si réactions ajoutées un jour
- Jalons visuels tous les 5 niveaux pour éviter sentiment de plateau (MVP)

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

---

## 12. Dette technique ouverte

### DETTE-15 — `UI.jsx` contient des composants obsolètes
**Sévérité :** 🟢 Faible

### DETTE-18 — Clé rss2json dans le code front
**Sévérité :** 🟢 Faible pour usage perso.

### DETTE-19 — Table `matchs` sans colonne `tag`
**Sévérité :** 🟡 Moyenne — bloque les classements par phase
**Fix :** `ALTER TABLE matchs ADD COLUMN tag varchar;` + passer `match.tag` dans `faireProno()`

---

## 13. Backlog

### Sprints 1, 2, 2.5, 3, 3.4 ✅ LIVRÉS

### Sprint 3 restant ⏳
```
⏳ Système RPG Progression — conception validée, implémentation à venir
    DDL Supabase (4 tables + colonnes profils)
    Service xp.js
    MissionsBoard.jsx (bloc Board)
    Intégration Profil.jsx (grille badges, barre XP, titres saisonniers)
    Intégration Briefing.jsx (notifications XP/badge/niveau)
    Assets visuels badges
    Onglet Missions dans Admin
```

### Août 2026 — avant recrutement
```
⏳ Onboarding carousel 5 slides (onboarding_done boolean dans profils)
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Tagline — valider "Performe" et mettre à jour partout
⏳ Colonne tag dans matchs → classements par phase (DETTE-19)
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (equipe_favorite_id + joueur_favori_id dans profils)
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes (5 raretés, tirage quotidien, /ma-collection)
Roue quotidienne (1 tour/jour, XP / rien / fragment de carte)
Pronostic écart final (<5 pts / >20 pts → +2 pts bonus, migration pronos requise)
```

### Post-Sprint 4
```
H2H historique équipes saison régulière dans MatchDetail
Enrichissement MatchDetail : cotes bookmakers ESPN
Bracket Summer League dynamique
Classements par phase (nécessite DETTE-19)
Draft Night pronos (nouveau type de prono, chantier à part)
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
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- `XP_BASE` et `XP_COEFFICIENT` depuis `src/config.js` — jamais hardcoder
- Tokens CSS : toujours utiliser les variables, jamais de valeurs brutes
- `TitreSection` défini localement dans chaque fichier
- Pas de `border-radius-lg` sur les blocs de contenu
- Séparateurs `<div style={{ height: 32 }} />` pour les espacements Board
- Commentaires JSX : toujours `{/* */}`, jamais `//` dans le JSX
- `detecterType()` : toute modification répercutée dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`

---

## 15. RGPD & sécurité

Clés Supabase : variables d'environnement, jamais commitées.
Clé rss2json : dans le code front pour usage perso.
Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`.
Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France).
`xp_log` : table immuable — pas d'UPDATE/DELETE autorisé via RLS.

---

## 16. Veille technique

- ESPN API non officielle : surveiller changements de structure des `notes`
- rss2json.com : surveiller quota (10k req/jour)
- Supabase : surveiller free tier + pause inactivité
- Vercel Hobby : usage non-commercial uniquement

---

## 17. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v3_5.md` | Référence technique unique | ✅ Ce document |
| `swish_league_roadmap_v1_8.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_1.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.5 — 2026-06-04*
*Remplace socle_nba_v3_4.md*
