# SWISH LEAGUE — SOCLE v2.2
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-05-29

---

## SOMMAIRE

1. [Projet & philosophie](#1-projet--philosophie)
2. [Identité visuelle & design system](#2-identité-visuelle--design-system)
3. [Sources de données ESPN](#3-sources-de-données-espn)
4. [BDD Supabase](#4-bdd-supabase)
5. [Architecture fichiers](#5-architecture-fichiers)
6. [Navigation & routes](#6-navigation--routes)
7. [Fonctionnalités livrées](#7-fonctionnalités-livrées)
8. [Risques ouverts](#8-risques-ouverts)
9. [Dette technique ouverte](#9-dette-technique-ouverte)
10. [Backlog](#10-backlog)
11. [Règles de travail](#11-règles-de-travail)
12. [RGPD & sécurité](#12-rgpd--sécurité)
13. [Veille technique](#13-veille-technique)
14. [Documents de référence complémentaires](#14-documents-de-référence-complémentaires)

---

## 1. Projet & philosophie

**App web NBA communautaire** — pronos entre amis, stats, scores, classements, collection de cartes joueurs.
Nom de marque : **Swish League**.
Périmètre : app de passion NBA, pensée pour un usage entre amis avec une vraie dimension sociale et de gamification.

**Philosophie :** "Les données d'abord, l'interface suit."
App entre potes : compétition amicale, chambrage, passion basket.
Mobile first. Rapide. Lisible. Fun. Sans surcharge.

### Stack technique — 100% gratuit
- **Front :** React + Vite
- **Deploy :** Vercel (Hobby, non-commercial)
- **Back :** Supabase (PostgreSQL + Auth + Storage) — ⚠️ pause après 1 semaine d'inactivité
- **CSS :** pas de framework — tokens CSS centralisés dans `index.css`
- **Icônes :** Lucide React
- **Fonts :** Inter (body) + Barlow Condensed (display/scores) — Google Fonts

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE
**Logo :** `src/assets/swish_league_logo.png` (bouclier basket, rouge/bleu marine)
**Accroche :** "Pronostique. Clashe. Règne."

### Tokens CSS (index.css)
```
--bg-0: #0d0d12        fond principal
--bg-1: #12121c        cartes / surfaces
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
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #8080a0      texte tertiaire / paragraphes
--font-body: Inter
--font-display: Barlow Condensed
--radius-sm / md / lg : 6px / 10px / 14px
```

### Composants réutilisables — `src/components/UI.jsx`
**LabelSection** — titre de section en dégradé accent→orange
**BanniereImage** — bande image Unsplash hauteur 110px
**Bloc** — card arrondie radius-lg, gradient accent

### Règle headers
- Accueil, Classement, Calendrier, Groupes, Stats : header plein bord
- Profil, MesPronos : header en Bloc arrondi
- Connexion / Inscription : pas de header, card centrée avec logo

### Audit design — chantier inter-saison
L'app est propre mais manque d'énergie et de personnalité pour une app communautaire NBA.
Chantier prévu pendant l'inter-saison 2026.
**Document dédié :** `audit_design_v1_0.md` — à créer lors d'une session dédiée avec partage des écrans.

Axes identifiés à ce stade :
- Feedbacks émotionnels (prono correct/raté) trop discrets — doivent être des moments visuels
- Typographie des scores et chiffres clés à affirmer davantage
- Animations d'entrée et micro-interactions manquantes
- Ton visuel global à pousser vers plus de fun et de caractère NBA

---

## 3. Sources de données ESPN

### Philosophie — source unique ESPN
**Décision : ESPN uniquement.** Les capacités ESPN couvrent l'ensemble des besoins de l'app. Ajouter une source alternative doublerait la complexité de maintenance pour un gain marginal.

Seule limite identifiée : **actus NBA en français** non disponibles via ESPN (qui ne publie qu'en anglais). Noté comme nice-to-have, non bloquant pour la roadmap actuelle.

Référence complète des capacités ESPN : `espn_capacites_v1_0.md`

### Domaines — statuts CORS validés terrain (2026-05-28)

| Domaine | Statut CORS | Notes |
|---|---|---|
| `site.api.espn.com` | ✅ OK | Sauf `/leaders` et `/athletes/{id}` |
| `site.web.api.espn.com` | ✅ OK | |
| `sports.core.api.espn.com` | ✅ OK | Validé 2026-05-28 |
| `site.api.espn.com/leaders` | 🔴 BLOQUÉ | Proxy requis |
| `site.api.espn.com/athletes/{id}` | 🔴 BLOQUÉ (404) | Utiliser données roster |
| `site.api.espn.com/teams?limit=30` | 🔴 BLOQUÉ | Extraire depuis standings |

### Endpoints actuellement utilisés
```
Scoreboard      : site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
Summary         : site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}
Standings       : site.api.espn.com/apis/v2/sports/basketball/nba/standings?season={SAISON_ESPN}&seasontype=2
News            : site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=5
Roster          : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster
Injuries        : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries
Stats joueur    : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats?season={SAISON_ESPN}&seasontype=2
Game log joueur : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog
Predictor       : sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor
Bracket playoffs: site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates={plage7j}
```

### Saison ESPN — constante dynamique
Fichier `src/config.js` — `SAISON_ESPN` calculé automatiquement :
- Octobre→décembre : `getFullYear() + 1`
- Janvier→septembre : `getFullYear()`
- Ex: mai 2026 → ESPN 2026 (saison 2025-26) | oct 2026 → ESPN 2027 (saison 2026-27)

### Structure game log ESPN — validée terrain (2026-05-28)
```
data.labels[]        : ["MIN","FG","FG%","3PT","3P%","FT","FT%","REB","AST","BLK","STL","PF","TO","PTS"]
data.seasonTypes[]   : [{displayName, categories[{events[{eventId, stats[]}]}]}]
data.events{}        : dict eventId → {gameDate, atVs, gameResult, score, opponent{abbreviation}}
```
⚠️ Les stats `ev.stats[]` correspondent à l'ordre de `data.labels[]` — utiliser `labels.indexOf(nom)` pour indexer.
⚠️ `seasonTypes[0]` = saison la plus récente (Postseason si playoffs en cours) — ne pas filtrer sur "regular".

### Types de saison ESPN — validés terrain
- `1` = Pré-saison | `2` = Saison régulière | `3` = Playoffs | `5` = International

### ⚠️ Bracket Playoffs — stratégie de fetch
- Endpoint : `scoreboard?dates={plage}` **SANS** `seasontype=3`
- Plages de 7 jours sur avril-juin (fonction `plagesPlayoffs`)
- Déduplication par clé `typeId-idEquipe1-idEquipe2` triés

---

## 4. BDD Supabase

### Tables actuelles
Tables : `profils` | `groupes` | `membres_groupe` | `matchs` | `pronos`
RLS activé sur toutes les tables.

### profils
`id` (uuid, FK auth.users) | `pseudo` (text, unique) | `avatar_url` | `description` | `cree_le`

Champs à ajouter — Sprint 4 :
```sql
-- Niveaux & XP
xp_total INTEGER DEFAULT 0
niveau INTEGER DEFAULT 1

-- Profil fan
equipe_favorite_id TEXT
equipe_favorite_nom TEXT
joueur_favori_id TEXT
joueur_favori_nom TEXT

-- Avatar
avatar_maillot TEXT DEFAULT 'default'
avatar_cadre TEXT DEFAULT 'rookie'
avatar_fond TEXT DEFAULT 'default'

-- Onboarding
onboarding_done BOOLEAN DEFAULT FALSE
```

### groupes
`id` | `nom` | `admin_id` | `date_fin` | `type_saison` (int, nullable) | `saison` (int)

### membres_groupe
`id` | `user_id` | `groupe_id` | `points` | `actif` (boolean)

### matchs
`id` | `espn_id` (unique) | `date_match` | `equipe_domicile` | `equipe_exterieur` | `statut` | `type_saison` | `saison`

### pronos
`id` | `user_id` | `match_id` | `groupe_id` (nullable) | `equipe_choisie` | `resultat` | `points_gagnes` | `cree_le`
Contrainte unique : **(user_id, match_id, groupe_id) NULLS NOT DISTINCT**

Champs à ajouter — Sprint 2 :
```sql
score_dom_prono INTEGER   -- optionnel, pour le mode score exact
score_ext_prono INTEGER
```

### Tables à créer — Sprints 1-4

```sql
-- Sprint 1 — Notifications push
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  cree_le TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Sprint 3 — Chat par ligue
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  groupe_id UUID REFERENCES groupes(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matchs(id) ON DELETE SET NULL,
  contenu TEXT NOT NULL CHECK (char_length(contenu) <= 500),
  cree_le TIMESTAMP DEFAULT NOW()
);

-- Sprint 3 — Badges
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  obtenu_le TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Sprint 4 — XP log
CREATE TABLE xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  montant INTEGER NOT NULL,
  cree_le TIMESTAMP DEFAULT NOW()
);

-- Sprint 4 — Catalogue cartes
CREATE TABLE cartes_catalogue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  joueur_nom TEXT NOT NULL,
  joueur_espn_id TEXT,
  equipe TEXT NOT NULL,
  equipe_espn_id TEXT,
  saison TEXT,
  set_nom TEXT NOT NULL,
  rarete TEXT NOT NULL CHECK (rarete IN ('common','rare','epic','legendary','ultimate')),
  serie_max INTEGER,
  description TEXT,
  actif BOOLEAN DEFAULT TRUE
);

-- Sprint 4 — Collection utilisateur
CREATE TABLE cartes_collection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  carte_id UUID REFERENCES cartes_catalogue(id),
  serie_numero INTEGER,
  obtenu_le TIMESTAMP DEFAULT NOW(),
  source TEXT NOT NULL
);

-- Sprint 4 — Déblocages avatar
CREATE TABLE avatar_deblockages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  cle TEXT NOT NULL,
  obtenu_le TIMESTAMP DEFAULT NOW(),
  source TEXT NOT NULL
);
```

### RLS Supabase — état validé
- `groupes` INSERT : restreint à l'UUID admin en BDD
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `profils` INSERT/UPDATE : `auth.uid() = id`
- `pronos` INSERT/UPDATE : `auth.uid() = user_id`

### Storage Supabase
Bucket `avatars` (public) — fichiers nommés `{user_id}.{ext}`, upsert activé

---

## 5. Architecture fichiers

```
src/
  App.jsx
  main.jsx
  index.css
  config.js              — SAISON_ESPN dynamique
  assets/
    swish_league_logo.png
  lib/
    supabase.js
  context/
    NoSpoilContext.jsx
    ProfilContext.jsx
  data/
    changelog.js         — CHANGELOG[] + VERSION_COURANTE (v1.2)
  services/
    espn.js
    points.js
    ligues.js
  pages/
    Accueil.jsx
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx
    MatchDetail.jsx
    Calendrier.jsx
    Profil.jsx
    Stats.jsx
  components/
    UI.jsx
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    RunsPotes.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
```

Fichiers à créer — prochains sprints :
```
pages/
  Onboarding.jsx         — Sprint 2
  Collection.jsx         — Sprint 4
components/
  ChatLigue.jsx          — Sprint 3
  CarteJoueur.jsx        — Sprint 4
  BarreXP.jsx            — Sprint 4
  AvatarEditeur.jsx      — Sprint 4
```

---

## 6. Navigation & routes

### Navigation
- **Desktop :** top navbar fixe
- **Mobile :** barre logo top 40px + bottom nav fixe 60px
- **Hamburger :** panneau droit

### Routes actuelles
```
/connexion      public
/inscription    public
/accueil        privé — Board
/classement     privé
/mes-pronos     privé
/groupes        privé
/match/:espn_id privé
/calendrier     privé
/profil         privé
/stats          privé — Explorer
```

Routes à ajouter :
```
/onboarding              privé — Sprint 2 (redirect 1ère connexion)
/duel/:uid1/:uid2/:gid   privé — Sprint 2 (Head-to-Head)
/profil/:userId          privé — Sprint 3 (profil public)
/ma-collection           privé — Sprint 4
```

---

## 7. Fonctionnalités livrées

### Auth ✅
Inscription, connexion, déconnexion, session persistante.

### Board (Accueil) ✅
- Header + toggle No Spoil
- BandeMatchs scrollable 3 jours
- StandingsNBA Top 5 Est/Ouest (saison régulière uniquement)
- BracketPlayoffs visuel complet (si playoffs en cours) — saison dynamique
- NewsNBA 5 actus ESPN
- Blocs : Ligue en cours, Pronos en attente, Runs des potes

### Explorer (Stats.jsx) ✅
- Onglet Classements : toggle Saison régulière / Playoffs, sélecteur historique depuis 2002
- Onglet Équipes : 30 franchises + fiches avec roster trié par PPG
- Onglet Joueurs : ~450 joueurs, filtre équipe + recherche
  - Fiche joueur : stats moyennes saison, deux radars (Scoring + Impact), game log 15 derniers matchs

### Fiche match (MatchDetail) ✅
- Score, quart-temps, stats équipes, leaders, L5, blessés
- Prono intégré avec verrouillage auto
- Prédiction ESPN (predictor) avant/pendant le match

### Pronos ✅
- Upsert Supabase avec contrainte unique
- Rattachement automatique aux ligues selon type_saison
- Calcul points au chargement Board

### Classement ✅
- Par ligue + classement général
- Stats enrichies : points / corrects / ratés / %

### Mes stats / Profil public ✅
- Stats globales + par ligue + forme récente

### Ligues ✅
- Liste publique, rejoindre/quitter
- Création admin uniquement

### Calendrier ✅
- Vues 1j / 3j / Semaine / Mois
- Filtres type + équipe, cache local, No Spoil

### Mode No Spoil ✅
- Scores masqués sur tous les composants concernés

---

## 8. Risques ouverts

### RISQUE-02 — `calculerPoints` sans verrou → race condition
**Sévérité :** 🟡 Moyenne
Solution long terme : Edge Function Supabase (backlog 5.5).

### RISQUE-07 — Limite Vercel Hobby ~100 déploiements/jour
**Sévérité :** 🟢 Faible

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute si l'app grandit
**Mitigation :** Cron Vercel Hobby (1 autorisé) → ping Supabase 1x/semaine.

### RISQUE-B — ESPN API blocage CORS ou changement de structure
**Sévérité :** 🟡 Moyenne
**Mitigation :** Proxy Supabase Edge Function en fallback. Documenter dans `espn_capacites_v1_0.md`.

### RISQUE-C — Dépassement quota Supabase free tier
**Sévérité :** 🟡 Moyenne — accru au Sprint 4 avec `cartes_collection`
**Mitigation :** Pagination stricte, pas de SELECT * sans LIMIT.

### RISQUE-F — Droits images joueurs (cartes Sprint 4)
**Sévérité :** 🟡 Moyenne en cas de diffusion publique large
**Mitigation :** Utiliser headshotss ESPN (même usage que l'app actuelle). Pas de photos Getty.

---

## 9. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible

### DETTE-11 — Année ESPN hardcodée à 2026
**Sévérité :** ✅ Soldée (v2.1) — `SAISON_ESPN` dynamique dans `src/config.js`

---

## 10. Backlog

### Sprints actifs — référence roadmap

Se référer à `swish_league_roadmap_v1_1.md` pour le détail complet de chaque fonctionnalité, l'ordre d'exécution et les specs techniques.

```
Sprint 1 — RÉTENTION (priorité absolue — démarrer en inter-saison)
  Streak visible dans le Board
  Dashboard personnel enrichi
  Notifications push

Sprint 2 — ENGAGEMENT SOCIAL
  Head-to-Head entre membres
  Score exact en bonus
  Classement hebdomadaire
  Onboarding guidé

Sprint 3 — PROFONDEUR & POLISH
  Chat / réactions par ligue
  Badges / achievements
  Profil public enrichi
  Preview match enrichi
  Leaderboard global
  Partage de pick

Sprint 4 — GAMIFICATION & IDENTITÉ (chantier inter-saison en parallèle)
  Profil fan (équipe & joueur favoris)
  Système de niveaux & XP
  Avatar personnalisable
  Collection de cartes joueurs
```

### Chantier inter-saison 2026 (parallèle aux sprints)
- **Audit design** → voir `audit_design_v1_0.md` (à créer)
- **Catalogue cartes** → constituer les ~200 entrées initiales de `cartes_catalogue` (travail éditorial)
- **SVG avatar** → créer les layers de base (silhouette + 30 maillots équipes + cadres par niveau)

### Mis de côté
- IA Gemini, News FR RSS, Bonus score exact phase 2 — dépendent Edge Function
- Swish Data — voir section 14

### Backlog hors MVP
- Fantasy league, système de draft, app mobile native, PWA iOS, IA prédictive

---

## 11. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- **Toujours indiquer fichier + ligne ou bloc + contexte pour toute modification**
- Jamais border shorthand + longhand sur le même élément
- **Une modification à la fois — push + test entre chaque**
- **Toujours réécrire les fichiers complets**
- Vercel Hobby : limite ~100 déploiements/jour — grouper les commits
- En début de session : uploader uniquement les fichiers modifiés
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année

---

## 12. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar, bio, historique pronos, collection de cartes (données non personnelles).
Clés Supabase : variables d'environnement, jamais commitées.
ESPN API : aucune donnée personnelle dans les requêtes.
ADMIN_ID hardcodé côté client — sécurisé RLS côté BDD.
Notifications push : consentement explicite obligatoire, désabonnement dans les paramètres profil.
Mention légale à ajouter dans onboarding + footer : "jeu de pronostics gratuit, aucun argent réel".

---

## 13. Veille technique

- **ESPN API non officielle :** surveiller changements structure ou blocage CORS
- **Supabase :** surveiller évolutions free tier (storage, bande passante, rows)
- **Vercel Hobby :** usage non-commercial uniquement
- **Web Push API :** compatibilité navigateurs mobiles (Safari iOS limité — prévoir fallback)

---

## 14. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v2_2.md` | Référence technique — état de l'app, stack, BDD, règles de travail | ✅ Ce document |
| `swish_league_roadmap_v1_1.md` | Vision produit, fonctionnalités, priorisation, specs techniques par feature | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie complète des endpoints ESPN — statuts CORS, cas d'usage | ✅ Actif |
| `audit_design_v1_0.md` | Audit écran par écran, axes d'amélioration, préconisations visuelles | 🔴 À créer (session dédiée inter-saison) |

### Note sur Swish Data
Projet de pipeline de collecte de données NBA initialement envisagé en parallèle de Swish League. **Mis de côté indéfiniment.** Pas de cas d'usage immédiat identifié, profil data engineer requis pour le mener sérieusement. À reprendre si le contexte change — ne pas l'intégrer dans les sprints Swish League.

---

*Document v2.2 — 2026-05-29*
*Remplace socle_nba_v2_1.md*
