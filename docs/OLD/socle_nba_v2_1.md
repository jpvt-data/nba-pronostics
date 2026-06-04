# SWISH LEAGUE — SOCLE v2.1
> Document de référence unique — fusion socle v2.0 + session 2026-05-28  
> Mis à jour le 2026-05-28

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
14. [Projet transverse — Swish Data](#14-projet-transverse--swish-data)

---

## 1. Projet & philosophie

**App web NBA communautaire** — pronos entre amis, stats, scores, classements.  
Nom de marque : **Swish League** (nom de travail initial : NBA Pronostics).  
Périmètre : Planify ecosystem — planificateur sportif de saison.  
Vitrine IA Prismora Solutions.

**Philosophie :** "Les données d'abord, l'interface suit."  
App entre potes : compétition amicale, chambrage, passion basket.  
Mobile first. Rapide. Lisible. Sans surcharge.

### Stack technique — 100% gratuit
- **Front :** React + Vite
- **Deploy :** Vercel (Hobby, non-commercial)
- **Back :** Supabase (PostgreSQL + Auth + Storage) — ⚠️ pause après 1 semaine d'inactivité
- **IA :** Gemini (Google Workspace) — phase 2 uniquement, pas dans le MVP
- **CSS :** pas de framework — tokens CSS centralisés dans `index.css`
- **Icônes :** Lucide React
- **Fonts :** Inter (body) + Barlow Condensed (display/scores) — Google Fonts

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

### Documentation ESPN API — Référence
Source : https://github.com/pseudo-r/Public-ESPN-API  
Doc communautaire complète des endpoints ESPN non officiels.  
⚠️ Consulter en priorité avant tout nouvel appel ESPN inconnu.  
Référence capacités cartographiées : `espn_capacites_v1_0.md`

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

---

## 3. Sources de données ESPN

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

Tables : `profils` | `groupes` | `membres_groupe` | `matchs` | `pronos`  
RLS activé sur toutes les tables.

### profils
`id` (uuid, FK auth.users) | `pseudo` (text, unique) | `avatar_url` | `description` | `cree_le`

### groupes
`id` | `nom` | `admin_id` | `date_fin` | `type_saison` (int, nullable) | `saison` (int)

### membres_groupe
`id` | `user_id` | `groupe_id` | `points` | `actif` (boolean)

### matchs
`id` | `espn_id` (unique) | `date_match` | `equipe_domicile` | `equipe_exterieur` | `statut` | `type_saison` | `saison`

### pronos
`id` | `user_id` | `match_id` | `groupe_id` (nullable) | `equipe_choisie` | `resultat` | `points_gagnes` | `cree_le`  
Contrainte unique : **(user_id, match_id, groupe_id) NULLS NOT DISTINCT**

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
  config.js              — SAISON_ESPN dynamique (nouveau v2.1)
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
    Stats.jsx            — enrichi v2.1 (game log, radars, bracket playoffs)
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
    StandingsNBA.jsx     — SAISON_ESPN dynamique (v2.1)
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
```

---

## 6. Navigation & routes

### Navigation
- **Desktop :** top navbar fixe
- **Mobile :** barre logo top 40px + bottom nav fixe 60px
- **Hamburger :** panneau droit

### Routes
```
/connexion     public
/inscription   public
/accueil       privé — Board
/classement    privé
/mes-pronos    privé
/groupes       privé
/match/:espn_id privé
/calendrier    privé
/profil        privé
/stats         privé — Explorer
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
- **Onglet Classements :**
  - Toggle Saison régulière / Playoffs
  - Saison régulière : standings Est/Ouest, sélecteur historique depuis 2002
  - Playoffs : BracketPlayoffs avec sélecteur de saison
- **Onglet Équipes :** 30 franchises + fiches avec roster trié par PPG
- **Onglet Joueurs :** ~450 joueurs, filtre équipe + recherche textuelle
  - Fiche joueur : stats moyennes saison, deux radars (Scoring + Impact), game log 15 derniers matchs avec colonnes sticky mobile, légende

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

---

## 9. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible

### DETTE-09 — BracketPlayoffs saison dynamique dans Accueil.jsx
**Sévérité :** ✅ Soldée (v2.1) — `saisonActuelle` depuis `matchs[0].saisonNum`

### DETTE-10 — BracketPlayoffs non intégré dans Stats.jsx
**Sévérité :** ✅ Soldée (v2.1) — intégré avec toggle type de saison

### DETTE-11 — Année ESPN hardcodée à 2026
**Sévérité :** ✅ Soldée (v2.1) — `SAISON_ESPN` dynamique dans `src/config.js`  
Fichiers corrigés : `StandingsNBA.jsx`, `Accueil.jsx`, `Stats.jsx`

---

## 10. Backlog

### Phase 5 — Backlog actif

| # | Action | Priorité | Notes |
|---|---|---|---|
| 5.1 | BracketPlayoffs dans Stats.jsx | ✅ Livré v2.1 | |
| 5.2 | Game log joueur | ✅ Livré v2.1 | Endpoint CORS validé, 15 derniers matchs, sticky mobile |
| 5.3 | Splits joueur (dom/ext, conférence, mois) | 🟡 Moyenne | Endpoint CORS validé |
| 5.4 | Dashboard fiche joueur — visualisations | 🟡 Moyenne | Graphique évolution PPG depuis game log |
| 5.5 | Edge Function Supabase — calcul points serveur | 🟢 Basse | Corrige RISQUE-02 |
| 5.6 | Chat par ligue | 🟢 Basse | Supabase Realtime ou polling |
| 5.7 | Badges utilisateurs | 🟢 Basse | Système de récompenses |
| 5.8 | Notifications push | 🟢 Basse | Web Push API |
| 5.9 | Historique carrière joueur | 🟢 Basse | `statisticslog` CORS OK |
| 5.10 | Sélecteur de saison Calendrier | 🟢 Basse | Nice to have |

### Mis de côté
- IA Gemini, News FR RSS, Bonus score exact — dépendent Edge Function

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
- Vercel Hobby : limite ~100 déploiements/jour
- En début de session : uploader uniquement les fichiers modifiés
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année

---

## 12. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar, bio, historique pronos.  
Clés Supabase : variables d'environnement, jamais commitées.  
ESPN API : aucune donnée personnelle dans les requêtes.  
ADMIN_ID hardcodé côté client — sécurisé RLS côté BDD.

---

## 13. Veille technique

- **ESPN API non officielle :** surveiller changements structure ou blocage CORS
- **Supabase :** surveiller évolutions free tier
- **Vercel Hobby :** usage non-commercial uniquement
- **Modèle Claude :** vérifier le modèle disponible à chaque session

---

## 14. Projet transverse — Swish Data

Projet de collecte et stockage de données NBA pour usage analytique et ML.  
**Document de référence dédié :** `swish_data_v1_0.md`

### Contexte
L'app Swish League fetche les données ESPN à la volée sans les stocker. Aucune donnée historique n'est conservée. Pour aller vers un modèle de prédiction ML ou des visualisations historiques riches, un pipeline de collecte dédié est nécessaire.

### Principe
- Projet **séparé** de l'app Swish League
- Données collectées réutilisables pour d'autres projets
- Architecture pensée pour être industrialisable
- Stockage principal envisagé : **BigQuery** (Google Workspace — déjà disponible)

### Prérequis bloquant
**La collecte doit démarrer le plus tôt possible.** Chaque jour sans collecte = données de matchs perdues définitivement pour la saison en cours. L'historique ESPN depuis 2003 est récupérable a posteriori, mais les données temps réel (blessés, back-to-back, lineup du soir) ne le sont pas.

### Lien
Voir `swish_data_v1_0.md` pour le détail complet.

---

*Document v2.1 — 2026-05-28*  
*Remplace socle_nba_v2_0.md*
