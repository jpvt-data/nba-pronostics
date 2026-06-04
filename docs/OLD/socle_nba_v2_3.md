# SWISH LEAGUE — SOCLE v2.3
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-05-29

---

## SOMMAIRE

1. [Projet & philosophie](#1-projet--philosophie)
2. [Identité visuelle & design system](#2-identité-visuelle--design-system)
3. [Charte graphique — règles appliquées](#3-charte-graphique--règles-appliquées)
4. [Sources de données ESPN](#4-sources-de-données-espn)
5. [BDD Supabase](#5-bdd-supabase)
6. [Architecture fichiers](#6-architecture-fichiers)
7. [Navigation & routes](#7-navigation--routes)
8. [Fonctionnalités livrées](#8-fonctionnalités-livrées)
9. [Décisions produit — session 2026-05-29](#9-décisions-produit--session-2026-05-29)
10. [Risques ouverts](#10-risques-ouverts)
11. [Dette technique ouverte](#11-dette-technique-ouverte)
12. [Backlog](#12-backlog)
13. [Règles de travail](#13-règles-de-travail)
14. [RGPD & sécurité](#14-rgpd--sécurité)
15. [Veille technique](#15-veille-technique)
16. [Documents de référence complémentaires](#16-documents-de-référence-complémentaires)

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

### Tokens CSS (index.css) — v2.3
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
--gold: #f59e0b        streak / podium / points (NOUVEAU v2.3)
--gold-dim: rgba(245,158,11,0.12)
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #8080a0      texte tertiaire / paragraphes
--radius-sm / md / lg : 6px / 10px / 14px
--shadow-sm: 0 2px 8px rgba(0,0,0,0.4)   (NOUVEAU v2.3)
--shadow-md: 0 4px 16px rgba(0,0,0,0.5)  (NOUVEAU v2.3)
--font-body: Inter
--font-display: Barlow Condensed
```

### Composants réutilisables — `src/components/UI.jsx`
- **LabelSection** — titre de section en dégradé accent→orange, uppercase, letterSpacing 0.1em
- **BanniereImage** — image Unsplash bord à bord, sans border-radius, avec dégradé latéral, bordures accent top/bottom
- **Bloc** — card radius-lg, gradient accent 8% → transparent

### Fond desktop
Body desktop : triple radial-gradient — halos violet aux coins haut-gauche et bas-droit + halo orange coin haut-droit. `background-attachment: fixed`. Mobile : fond `--bg-0` uni.

---

## 3. Charte graphique — règles appliquées

### Typographie

| Élément | Font | Taille | Poids | Token couleur |
|---|---|---|---|---|
| h1 | Barlow Condensed | 26px | 700 | --text-1 |
| h2 | Barlow Condensed | 20px | 700 | --text-1 |
| h3 (labels section) | Inter | 13px | 700 | --text-2, uppercase |
| Scores / chiffres clés | Barlow Condensed | 28-36px | 700 | selon contexte |
| Stats globales (profil) | Barlow Condensed | 32px | 700 | selon sémantique |
| Points classement | Barlow Condensed | 18px | 700 | **--gold** |
| Trigrammes équipes | Barlow Condensed | 16px | 700 | --text-1 / --text-2 |
| Corps | Inter | 13-14px | 400-600 | --text-2 / --text-3 |

### Nom SWISH LEAGUE (navbar)
Barlow Condensed 700, dégradé `linear-gradient(90deg, var(--accent), var(--orange))` avec WebkitBackgroundClip text. Desktop 20px, Mobile 16px.

### Couleurs sémantiques — règles strictes
- **--gold** : points (classement, profil, ligues), médailles top 3, streak futur. **Jamais --accent pour les points.**
- **--accent** : éléments interactifs, prono sélectionné (si couleur ESPN trop sombre), badges, liens
- **--success** : prono correct, W dans forme récente, série positive (W3, W2...)
- **--danger** : prono raté, L dans forme récente, série négative
- **--orange** : second accent NBA — utilisé dans les dégradés LabelSection et bouton CTA principal

### Couleurs ESPN des équipes
`espn.js` expose `color` et `alternateColor` (hex sans #) dans `domicile` et `exterieur` pour les deux fonctions : `recupererMatchs3Jours` et `recupererDetailMatch`.

Logique `estTropSombre(hex)` — luminance perçue (0.299R + 0.587G + 0.114B) < 40 → couleur inutilisable sur fond sombre. Dans ce cas : essayer `alternateColor`, sinon fallback `--accent`.

Utilisée dans : `BandeMatchs.jsx` (card match prono), `MatchDetail.jsx` (CarteEquipe sélectionnée).

### Headers de page — règle unifiée
Toutes les pages ont un header avec `background: linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)` et `padding: 20px 16px`.
- Contenu minimal : accroche 12px --text-3 + h2
- Pas de paragraphes explicatifs longs (inutiles après la 1ère visite)
- Connexion / Inscription : exception — card centrée sans header, pas de navbar

### BanniereImage — règles d'usage
- Bord à bord (aucun margin latéral), pas de border-radius
- Margin vertical : 20-25px haut ET bas (symétrique), géré par le parent
- Rôle : séparateur visuel entre sections, jamais purement décorative
- Image recommandée : arena NBA (photo-1504450758481 Unsplash)
- Ne pas utiliser sur Profil, Groupes (supprimée), Connexion

### Cards matchs (BandeMatchs)
- Largeur 165px, logo 24px, trigramme 16px Barlow
- Prono posé : fond couleur ESPN de l'équipe à 10% + bordure à 40%
- Badge `✓ ÉQUIPE` : pill fond couleur à 13%, texte couleur à 100%

### Classement — règles visuelles
- Médailles emoji 🥇🥈🥉 pour top 3, couleur `--gold`
- Points en Barlow Condensed 18px `--gold` sur toutes les pages (Classement, ClassementRapide, Profil, Groupes, MesPronos)
- Surbrillance "moi" : `rgba(99,102,241,0.08)` fond + `rgba(99,102,241,0.3)` bordure

### Boutons CTA principaux
Dégradé `linear-gradient(90deg, var(--accent), var(--orange))`. Utilisé : bouton "C'est parti" popup changelog, à généraliser aux futurs CTA primaires.

### Forme récente W/L
Cercles 44px, border-radius 50%, W = success-dim + bordure success, L = danger-dim + bordure danger. Taille 15px Barlow bold.

---

## 4. Sources de données ESPN

### Philosophie — source unique ESPN
**Décision : ESPN uniquement.** Les capacités ESPN couvrent l'ensemble des besoins de l'app. Ajouter une source alternative doublerait la complexité de maintenance pour un gain marginal.

Seule limite identifiée : **actus NBA en français** non disponibles via ESPN (qui ne publie qu'en anglais). Noté comme nice-to-have, non bloquant.

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

### Données équipes exposées — v2.3
`espn.js` expose désormais dans `domicile` et `exterieur` (scoreboard ET summary) :
- `color` : couleur primaire ESPN (hex sans #)
- `alternateColor` : couleur secondaire ESPN (hex sans #)

### Saison ESPN — constante dynamique
Fichier `src/config.js` — `SAISON_ESPN` calculé automatiquement :
- Octobre→décembre : `getFullYear() + 1`
- Janvier→septembre : `getFullYear()`

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

## 5. BDD Supabase

### Tables actuelles
Tables : `profils` | `groupes` | `membres_groupe` | `matchs` | `pronos`
RLS activé sur toutes les tables.

### profils
`id` (uuid, FK auth.users) | `pseudo` (text, unique) | `avatar_url` | `description` | `cree_le`

Champs à ajouter — Sprint 4 :
```sql
xp_total INTEGER DEFAULT 0
niveau INTEGER DEFAULT 1
equipe_favorite_id TEXT
equipe_favorite_nom TEXT
joueur_favori_id TEXT
joueur_favori_nom TEXT
avatar_maillot TEXT DEFAULT 'default'
avatar_cadre TEXT DEFAULT 'rookie'
avatar_fond TEXT DEFAULT 'default'
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
score_dom_prono INTEGER
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

## 6. Architecture fichiers

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
    changelog.js
  services/
    espn.js              — color + alternateColor ajoutés (v2.3)
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

## 7. Navigation & routes

### Navigation
- **Desktop :** top navbar fixe 52px
- **Mobile :** barre logo top 40px + bottom nav fixe 60px
- **Hamburger :** panneau droit 260px — contient Profil, Explorer, Ligues, Calendrier, No Spoil, Changelog, Déconnexion
- **Profil accessible depuis hamburger uniquement** (pas dans la nav principale)

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
/profil         privé — accessible hamburger
/stats          privé — Explorer
```

Routes à ajouter :
```
/onboarding              privé — Sprint 2
/duel/:uid1/:uid2/:gid   privé — Sprint 2 (Head-to-Head)
/profil/:userId          privé — Sprint 3 (profil public)
/ma-collection           privé — Sprint 4
```

---

## 8. Fonctionnalités livrées

### Auth ✅
Inscription, connexion, déconnexion, session persistante.

### Board (Accueil) ✅
- Header allégé : accroche + "Bonjour [pseudo]" + toggle No Spoil
- BandeMatchs scrollable 3 jours — cards 165px, couleurs ESPN équipes
- Blocs communautaires en premier : Ligue en cours, Pronos en attente, Runs des potes
- Bannière arène séparatrice avant la section NBA data
- StandingsNBA + BracketPlayoffs (si playoffs) + Actu NBA en bas
- RunsPotes : masqué automatiquement si aucune série en cours

### Explorer (Stats.jsx) ✅
- Header unifié avec les autres pages
- Onglet Classements : toggle Saison régulière / Playoffs, sélecteur historique depuis 2002
- Onglet Équipes : 30 franchises + fiches avec roster trié par PPG
- Onglet Joueurs : ~537 joueurs, filtre équipe + recherche, fiche joueur complète

### Fiche match (MatchDetail) ✅
- Score, quart-temps, stats équipes, leaders, L5, blessés
- Prono intégré avec verrouillage auto
- Prédiction ESPN (predictor) avant/pendant le match
- CarteEquipe : couleurs ESPN de l'équipe pronostiquée (avec fallback si couleur trop sombre)

### Pronos ✅
- Upsert Supabase avec contrainte unique
- Rattachement automatique aux ligues selon type_saison
- Calcul points au chargement Board

### Classement ✅
- Par ligue + classement général
- Médailles top 3, points en --gold, avatar, stats corrects/ratés/%
- ClassementRapide sur Board : aligné visuellement sur la page Classement

### Mes stats (MesPronos) ✅
- Bloc profil avec dégradé identitaire accent→orange
- Stats globales en Barlow Condensed 32px
- Forme récente W/L 44px
- Historique pronos cliquable → MatchDetail
- Accessible en profil public via `?user_id=xxx`

### Profil ✅ — refonte v2.3
- Page privée paramètres uniquement (accessible depuis hamburger, pas nav principale)
- Bloc identité : avatar éditable + pseudo + bio + date membre
- Bloc fan : placeholders équipe favorite + joueur favori (fonctionnels Sprint 4)
- Suppression : stats pronos (dans MesPronos), mes ligues (dans Classement), bannière

### Ligues (Groupes) ✅
- Liste publique, rejoindre/quitter
- Création admin uniquement
- Points en --gold

### Calendrier ✅
- Vues 1j / 3j / Semaine / Mois
- Filtres type + équipe, cache local, No Spoil
- Pas de modifications visuelles prévues

### Mode No Spoil ✅
- Scores masqués sur tous les composants concernés

### Popup Changelog ✅
- Bouton CTA dégradé accent→orange, sans emoji

---

## 9. Décisions produit — session 2026-05-29

### Architecture des pages — rôles clarifiés

| Page | Rôle | Accessible depuis |
|---|---|---|
| Board | Quotidien — matchs, ligue, NBA data | Nav principale |
| Classement | Compétition — qui gagne | Nav principale |
| Mes stats | Identité publique — mes perfs, ma forme, mon historique | Nav principale |
| Explorer | Data NBA — standings, équipes, joueurs | Nav principale |
| Profil | Paramètres privés — avatar, bio, équipe fav | Hamburger |
| Collection | Cartes (Sprint 4) | Route dédiée |

### Page Profil — décision de refonte
- Suppression des stats pronos (redondant avec MesPronos)
- Suppression des mes ligues (redondant avec Classement)
- Suppression de la bannière
- Ajout bloc fan (équipe + joueur favoris) — placeholders actifs, fonctionnels Sprint 4
- **La page MesPronos = profil public** (accessible depuis le classement via `?user_id=xxx`)

### Profil fan — impact Sprint 4
L'équipe favorite personnalise : prochain match mis en avant dans le Board, couleurs de fond de profil, maillot avatar débloqué. Le joueur favori personnalise : carte marquée ⭐, notification perf exceptionnelle. C'est de la personnalisation d'expérience, pas d'affichage public.

### Collection de cartes — page dédiée Sprint 4
`/ma-collection` — grille des cartes obtenues, filtres, compteurs. Accessible depuis le Board ou le Profil. Pas dans la nav principale.

### RunsPotes — comportement
Composant autonome avec son propre `Bloc` + `LabelSection`. Retourne `null` si aucune série ≥ 3 détectée. Le `Bloc` disparaît complètement du Board si vide.

### PronosAttente — comportement
Composant épuré : suppression du `h3` redondant. Chaque ligne cliquable → MatchDetail. État vide affiché proprement.

---

## 10. Risques ouverts

### RISQUE-02 — `calculerPoints` sans verrou → race condition
**Sévérité :** 🟡 Moyenne
Solution long terme : Edge Function Supabase.

### RISQUE-07 — Limite Vercel Hobby ~100 déploiements/jour
**Sévérité :** 🟢 Faible

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute si l'app grandit
**Mitigation :** Cron Vercel Hobby → ping Supabase 1x/semaine.

### RISQUE-B — ESPN API blocage CORS ou changement de structure
**Sévérité :** 🟡 Moyenne
**Mitigation :** Proxy Supabase Edge Function en fallback.

### RISQUE-C — Dépassement quota Supabase free tier
**Sévérité :** 🟡 Moyenne — accru Sprint 4 avec `cartes_collection`
**Mitigation :** Pagination stricte, pas de SELECT * sans LIMIT.

### RISQUE-F — Droits images joueurs (cartes Sprint 4)
**Sévérité :** 🟡 Moyenne en cas de diffusion publique large
**Mitigation :** Utiliser headshotss ESPN uniquement. Pas de photos Getty.

---

## 11. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible — acceptable pour l'instant

### DETTE-12 — Stats.jsx utilise un wrapper `<div>` au lieu de `<main>`
**Sévérité :** ✅ Soldée (v2.3)

---

## 12. Backlog

### Sprints actifs

```
Sprint 1 — RÉTENTION (priorité absolue — inter-saison)
  Streak visible dans le Board (badge 🔥 en --gold, Barlow 32px)
  Dashboard personnel enrichi (MesPronos → win rate, meilleure/pire équipe, etc.)
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

Sprint 4 — GAMIFICATION & IDENTITÉ
  Profil fan (équipe & joueur favoris) — placeholders déjà en place
  Système de niveaux & XP
  Avatar personnalisable
  Collection de cartes joueurs (/ma-collection)
```

### Chantier inter-saison 2026
- **Catalogue cartes** → ~200 entrées initiales `cartes_catalogue` (travail éditorial)
- **SVG avatar** → layers silhouette + 30 maillots + cadres par niveau
- **Audit design polish** → feedbacks émotionnels, animations, micro-interactions (identifiés en session mais non codés)

### Mis de côté
- IA Gemini, News FR RSS, Bonus score exact phase 2 — dépendent Edge Function
- Swish Data — mis de côté indéfiniment

### Backlog hors MVP
- Fantasy league, système de draft, app mobile native, PWA iOS, IA prédictive

---

## 13. Règles de travail

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
- Tokens CSS : toujours utiliser les variables — jamais de valeurs hex hardcodées dans les composants

---

## 14. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar, bio, historique pronos, collection de cartes.
Clés Supabase : variables d'environnement, jamais commitées.
ESPN API : aucune donnée personnelle dans les requêtes.
ADMIN_ID hardcodé côté client — sécurisé RLS côté BDD.
Notifications push : consentement explicite obligatoire, désabonnement dans les paramètres profil.
Mention légale à ajouter dans onboarding + footer : "jeu de pronostics gratuit, aucun argent réel".

---

## 15. Veille technique

- **ESPN API non officielle :** surveiller changements structure ou blocage CORS
- **Supabase :** surveiller évolutions free tier (storage, bande passante, rows)
- **Vercel Hobby :** usage non-commercial uniquement
- **Web Push API :** compatibilité navigateurs mobiles (Safari iOS limité — prévoir fallback)

---

## 16. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v2_3.md` | Référence technique — état de l'app, charte graphique, décisions | ✅ Ce document |
| `swish_league_roadmap_v1_1.md` | Vision produit, fonctionnalités, specs techniques par feature | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie complète des endpoints ESPN — statuts CORS, cas d'usage | ✅ Actif |

### Note sur Swish Data
Mis de côté indéfiniment. Ne pas intégrer dans les sprints Swish League.

---

*Document v2.3 — 2026-05-29*
*Remplace socle_nba_v2_2.md*
