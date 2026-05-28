# SWISH DATA — v1.1
## Référentiel NBA — Collecte, stockage et valorisation de données
> Document de référence — v1.1 | 2026-05-28
> Projet transverse à Swish League — indépendant et réutilisable

---

## SOMMAIRE

1. [Pourquoi ce projet](#1-pourquoi-ce-projet)
2. [Vision & ambitions](#2-vision--ambitions)
3. [Philosophie de la donnée](#3-philosophie-de-la-donnée)
4. [Sources de données](#4-sources-de-données)
5. [Architecture de stockage](#5-architecture-de-stockage)
6. [Schéma des données](#6-schéma-des-données)
7. [Pipeline de collecte](#7-pipeline-de-collecte)
8. [Cas d'usage](#8-cas-dusage)
9. [Feuille de route](#9-feuille-de-route)
10. [Contraintes & limites](#10-contraintes--limites)
11. [Stack technique](#11-stack-technique)
12. [Documents de référence](#12-documents-de-référence)

---

## 1. Pourquoi ce projet

### Le constat
L'app Swish League fetche les données ESPN en temps réel mais ne les stocke pas. Chaque donnée affichée est jetée après usage. Il n'existe donc aucun historique, aucune base exploitable pour :
- Analyser les tendances sur plusieurs saisons
- Construire des modèles prédictifs
- Générer des visualisations historiques riches
- Comparer des joueurs sur la durée

### L'opportunité
Plusieurs sources exposent gratuitement des données NBA remontant à 2003, voire avant. Ces données sont disponibles maintenant mais ne le seront peut-être pas toujours. **Il faut collecter pendant que c'est possible.**

### L'urgence
Les données **temps réel** (lineup du soir, blessés de dernière minute, back-to-back, conditions de match) ne sont pas récupérables a posteriori. Chaque jour sans collecte = features ML perdues définitivement pour la saison en cours.

---

## 2. Vision & ambitions

### Vision court terme
Constituer un référentiel NBA structuré, propre et exploitable couvrant :
- L'historique disponible (2003 → aujourd'hui)
- La saison en cours en temps quasi-réel

### Vision moyen terme
- Visualisations historiques dans Swish League (courbes de progression joueurs, comparaisons saisons)
- Modèle de prédiction de résultats de matchs intégrable dans l'app

### Vision long terme
- Dataset NBA indépendant, réutilisable pour d'autres projets
- API de prédiction exposée (FastAPI ou Cloud Functions)
- Potentiel produit à part entière (SaaS data NBA)
- Dataset public (Kaggle, Hugging Face) si le projet le justifie
- Base pour industrialisation si Swish League devient commercial

### Principes directeurs
- **Données d'abord** — collecter large, filtrer après
- **Référentiel, pas juste un dataset** — chaque entité a une identité canonique, les sources se croisent et se valident
- **Indépendance** — le projet ne dépend pas de Swish League
- **Scalabilité** — architecture pensée pour grandir sans tout recasser
- **Réutilisabilité** — utilisable pour n'importe quel projet NBA

---

## 3. Philosophie de la donnée

Swish Data n'est pas un simple script de collecte. C'est un **référentiel NBA** — un Master Data Management (MDM) appliqué au basket.

### Le principe central
Chaque entité (joueur, équipe, match, saison) a **une identité canonique** dans le système, et cette identité agrège tous les identifiants externes (ESPN ID, NBA Stats ID, Basketball Reference slug...) et toutes les données disponibles, toutes sources confondues.

- Quand deux sources disent la même chose → on valide
- Quand elles divergent → on arbitre et on documente
- Quand une source a une info exclusive → on l'ajoute

### Ce qu'on veut capturer — absolument tout
Sur chaque entité, on veut le maximum :

**Joueur** : biographie complète, carrière, stats par saison et par match, stats avancées, awards, sélections, Hall of Fame, blessures, records, identifiants cross-sources.

**Équipe / Franchise** : identité actuelle et historique (noms/villes successifs), palmarès, records franchise, coaches par saison, stats par saison.

**Match** : résultat, contexte pré-match (back-to-back, jours de repos, blessés), scores par quart-temps, stats équipes et joueurs, arbitres, diffusion, cotes.

**Saison** : structure temporelle, champion, awards de la saison, leaders stats, bracket playoffs.

---

## 4. Sources de données

### Source primaire — ESPN API (non officielle)
**Statut :** disponible, CORS OK depuis navigateur, gratuite
**Profondeur historique :** depuis ~2003
**Référence :** `espn_capacites_v1_0.md`

Données disponibles : matchs, scores, rosters, game log joueurs, standings, blessés, transactions, cotes partenaires US, win probability.

**Limites :** API non officielle (instabilité possible), pas de stats avancées, pas de shooting charts, pas de salaires.

---

### Source secondaire — NBA Stats API officielle
**Statut :** bloquée depuis France (CORS) — proxy serveur nécessaire
**Intérêt :** stats avancées officielles (PER, TS%, USG%, ORTG, DRTG), tracking data, clutch stats, lineup data, hustle stats, play-by-play officiel.

---

### Source tertiaire — Basketball Reference
**Statut :** scraping légal possible, complexe
**Intérêt :** données historiques profondes (depuis 1946), Win Shares, BPM, VORP, PER historiques, records de franchise, Hall of Fame, Awards historiques.

**Contraintes :** rate limiting strict, structure HTML à parser.

---

### Source quaternaire — Odds API / bookmakers
**Statut :** freemium, clé API requise
**Intérêt :** cotes en temps réel pour features ML (implied probability).

**Note légale :** utilisation à des fins analytiques acceptable. À documenter si le projet devient public en France (ANJ).

---

### Sources contextuelles (phase ultérieure)
- **Météo** (Open-Meteo, gratuit) — conditions météo ville du match
- **Données démographiques joueurs** — âge, expérience, nationalité

---

### Stratégie multi-sources
```
ESPN API          → données de base (matchs, scores, rosters, game log)
NBA Stats API     → stats avancées (via proxy)
Basketball Ref    → historique profond + validation + stats avancées historiques
Odds API          → implied probability pour ML
Données contexte  → back-to-back, repos (calculables depuis les matchs)
```

---

## 5. Architecture de stockage

### Décision retenue — SQLite local + BigQuery (futur)

**SQLite en local** — le laboratoire
- Zéro configuration, zéro coût
- Schéma modifiable pendant la phase d'exploration
- Portable (un fichier `.db`)
- Python natif (module `sqlite3` inclus — zéro install supplémentaire)
- Stocké sur Google Drive → sauvegarde automatique + accès depuis Colab

**BigQuery** — la destination analytique (phase ultérieure)
- Inclus dans Google Workspace
- Free tier : 10 GB stockage + 1 TB requêtes/mois
- SQL natif, intégration Looker Studio, Colab, Python
- Migration SQLite → BigQuery triviale quand le schéma est stabilisé

**Supabase** — données opérationnelles Swish League uniquement
- Subset curé des données pertinentes pour l'app
- Swish Data → Supabase = pipeline de push sélectif (phase ultérieure)

### Architecture cible
```
┌─────────────────────────────────────────────────────┐
│                   SOURCES                           │
│  ESPN API | NBA Stats | Basketball Ref | Odds API   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              PIPELINE DE COLLECTE                   │
│              Python (pandas + requests)             │
│         Scripts locaux ou GitHub Actions            │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴────────────┬─────────────────┐
           ▼                        ▼                  ▼
┌──────────────────┐   ┌─────────────────┐  ┌────────────────┐
│  SQLite (local)  │   │    BIGQUERY     │  │   SUPABASE     │
│  Laboratoire,    │   │  Analytique,    │  │  App Swish     │
│  exploration,    │   │  ML dataset,    │  │  League        │
│  historique      │   │  Looker Studio  │  │  (subset)      │
└──────────────────┘   └─────────────────┘  └────────────────┘
```

### Organisation des fichiers
```
swish-data/               ← repo GitHub privé
  ├── .gitignore
  ├── README.md
  ├── schema/
  │     ├── creation_schema.sql
  │     └── swish_data_schema_v1_0.md
  ├── scripts/
  │     └── (scripts de collecte à venir)
  └── data/               ← ignoré par Git (*.db)

Google Drive swish-data/
  └── swish_data.db       ← jamais sur GitHub
```

---

## 6. Schéma des données

Le schéma complet est documenté dans `swish_data_schema_v1_0.md` — **document de référence dédié**.

### Tables — vue d'ensemble

| Catégorie | Tables |
|---|---|
| Dimensions | `joueurs`, `equipes`, `arenes`, `saisons`, `coaches` |
| Historiques | `franchises_historique`, `joueurs_equipes`, `coaches_equipes` |
| Matchs | `matchs`, `matchs_arbitres`, `matchs_diffusion`, `cotes` |
| Stats | `joueurs_stats_saison`, `joueurs_gamelog`, `equipes_stats_saison` |
| Palmarès | `palmares_equipes`, `awards_joueurs`, `selections_joueurs` |
| Records | `records_joueurs`, `records_equipes` |
| Événements | `transactions`, `blessures` |

**Total : 22 tables.**

### Principes du schéma
- Chaque entité porte ses identifiants cross-sources (`espn_id`, `nba_stats_id`, `bbref_slug`)
- Stats avancées nullables dans `joueurs_stats_saison` — remplies progressivement selon les sources disponibles
- Contexte ML intégré dans `matchs` (back-to-back, jours de repos)
- Tout est traçable : chaque ligne porte `source` et `collecte_le`

---

## 7. Pipeline de collecte

### Phase 1 — Collecte historique (one-shot)
Script Python qui tourne une fois pour remplir l'historique disponible.

**Périmètre prioritaire :** saisons 2020-2026 (5 saisons récentes)
**Périmètre complet :** saisons 2003-2026

**Stratégie rate limiting :** `time.sleep(0.5)` entre chaque appel, retry automatique sur erreur (`tenacity`).

**Ordre de collecte :**
1. Saisons (bornes temporelles)
2. Équipes (dimensions stables)
3. Joueurs (registre canonique)
4. Matchs par date (résultats)
5. Game log par joueur par saison (stats match par match)
6. Stats moyennes par joueur par saison
7. Awards, palmarès, transactions (enrichissement)

### Phase 2 — Collecte temps réel (ongoing)
Script schedulé quotidiennement pour la saison en cours.

**Fréquence :**
- Résultats matchs : 1x/jour au matin
- Game log joueurs : 1x/jour
- Blessés : 2x/jour (matin + soir)
- Cotes : avant chaque match (si source disponible)

**Scheduling :** GitHub Actions cron (gratuit sur repo privé dans les limites du free tier).

### Phase 3 — Collecte enrichie
Après stabilisation des phases 1 et 2 :
- Stats avancées via proxy NBA Stats API
- Basketball Reference (historique profond + validation)
- Odds API (cotes temps réel)

---

## 8. Cas d'usage

### Visualisations dans Swish League
- Courbe de progression joueur (PPG/RPG/APG saison par saison)
- Comparaison joueurs sur les mêmes axes temporels
- Heatmap forme équipe (résultats des 20 derniers matchs)
- Trajectoire de carrière (arc narratif montée/apogée/déclin)

### Modèle de prédiction ML
**Objectif :** prédire le vainqueur d'un match avec une probabilité.

**Features clés :** forme récente, stats moyennes saison, back-to-back, blessés, head-to-head, domicile/extérieur, jours de repos, cotes implied probability.

**Approches envisagées :** régression logistique (baseline) → Random Forest / XGBoost → réseau de neurones.

### Autres projets potentiels
- Dataset public (Kaggle, Hugging Face)
- API de prédiction exposée
- Fantasy NBA helper
- Draft / trade analyzer

---

## 9. Feuille de route

| Étape | Description | Statut |
|---|---|---|
| 1 | Schéma SQLite — modélisation complète | ✅ Fait |
| 2 | Setup environnement (SQLite, VS Code, GitHub, Drive) | ✅ Fait |
| 3 | Création de la BDD (`swish_data.db`) | 🔲 Suivant |
| 4 | Script collecte historique ESPN (saisons 2020-2026) | 🔲 |
| 5 | Validation données : cohérence, doublons | 🔲 |
| 6 | Collecte historique complet 2003-2020 | 🔲 |
| 7 | Pipeline temps réel + scheduling GitHub Actions | 🔲 |
| 8 | Exploration Colab — premiers notebooks | 🔲 |
| 9 | Intégration visualisations Swish League | 🔲 |
| 10 | Modèle ML baseline | 🔲 |

---

## 10. Contraintes & limites

### Techniques
- ESPN API non officielle — instabilité possible
- Rate limiting ESPN — collecte lente (plusieurs heures pour l'historique complet)
- NBA Stats API bloquée depuis France — proxy nécessaire pour stats avancées
- SQLite : pas accessible depuis une app web en prod (usage local uniquement)

### Légales
- ESPN API non officielle : usage personnel/recherche acceptable, commercial à risque
- Basketball Reference : scraping légal pour usage personnel, interdit commercial
- Cotes bookmakers : affichage encadré en France (ANJ) — analytique OK
- RGPD : aucune donnée personnelle dans le dataset (données publiques sur athlètes professionnels)

### Qualité données
- Données ESPN parfois incomplètes pour les saisons anciennes (avant 2010)
- Cohérence entre sources à valider (ESPN vs Basketball Reference)
- Données temps réel (blessés, lineup) non récupérables a posteriori

---

## 11. Stack technique

### Environnement de travail
- **VS Code** — éditeur principal
- **GitHub** (repo privé `swish-data`) — versioning des scripts
- **Google Drive** — stockage de la BDD (`.db`)

### Collecte
- **Python 3.10+**
- `requests` — appels API
- `pandas` — manipulation données
- `sqlite3` — écriture BDD (module natif Python)
- `tenacity` — retry automatique sur erreur

### Stockage
- **SQLite** (local / Google Drive) — référentiel principal, laboratoire
- **BigQuery** (Google Workspace) — destination analytique (phase ultérieure)
- **Supabase** — données opérationnelles Swish League uniquement

### ML & Analyse
- **Google Colab** — notebooks, entraînement modèles (gratuit, accès Drive natif)
- **scikit-learn / XGBoost** — modèles ML
- **Looker Studio** — dashboards (gratuit, connecté BigQuery)

### Orchestration (phase 2)
- **GitHub Actions** — cron jobs (collecte quotidienne automatisée)

---

## 12. Documents de référence

| Fichier | Description | Emplacement |
|---|---|---|
| `swish_data_v1_1.md` | Ce document — référence projet Swish Data | Projet Claude + `schema/` |
| `swish_data_schema_v1_0.md` | Schéma complet des 22 tables SQLite | Projet Claude + `schema/` |
| `creation_schema.sql` | Script SQL de création de la BDD | `schema/` |
| `espn_capacites_v1_0.md` | Cartographie ESPN API | Projet Claude |
| `socle_nba_v2_1.md` | Référence Swish League (projet parent) | Projet Claude |

### Hiérarchie des documents
```
socle_nba_v2_1.md          → référence Swish League
swish_data_v1_1.md         → référence Swish Data (ce document)
swish_data_schema_v1_0.md  → détail schéma BDD
espn_capacites_v1_0.md     → cartographie sources ESPN
```

---

*Document v1.1 — 2026-05-28*
*Swish Data — Référentiel NBA*
*Remplace swish_data_v1_0.md*
*Prochaine étape : création de la BDD + premier script de collecte*
