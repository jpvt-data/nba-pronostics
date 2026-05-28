# SWISH DATA — v1.0
## Projet de collecte, stockage et valorisation des données NBA
> Document de référence — v1.0 | 2026-05-28  
> Projet transverse à Swish League — indépendant et réutilisable

---

## SOMMAIRE

1. [Pourquoi ce projet](#1-pourquoi-ce-projet)
2. [Vision & ambitions](#2-vision--ambitions)
3. [Sources de données](#3-sources-de-données)
4. [Architecture de stockage](#4-architecture-de-stockage)
5. [Schéma des données](#5-schéma-des-données)
6. [Pipeline de collecte](#6-pipeline-de-collecte)
7. [Cas d'usage](#7-cas-dusage)
8. [Feuille de route](#8-feuille-de-route)
9. [Contraintes & limites](#9-contraintes--limites)
10. [Stack technique](#10-stack-technique)

---

## 1. Pourquoi ce projet

### Le constat
L'app Swish League fetche les données ESPN en temps réel mais ne les stocke pas. Chaque donnée affichée est jetée après usage. Il n'existe donc aucun historique, aucune base exploitable pour :
- Analyser les tendances sur plusieurs saisons
- Construire des modèles prédictifs
- Générer des visualisations historiques riches
- Comparer des joueurs sur la durée

### L'opportunité
L'API ESPN (et d'autres sources) expose gratuitement des données NBA remontant à 2003. Ces données sont disponibles maintenant mais ne le seront peut-être pas toujours — les APIs non officielles peuvent fermer du jour au lendemain. **Il faut collecter pendant que c'est possible.**

### L'urgence
Les données **temps réel** (lineup du soir, blessés de dernière minute, back-to-back, conditions de match) ne sont pas récupérables a posteriori. Chaque jour sans collecte = features ML perdues définitivement pour la saison en cours.

---

## 2. Vision & ambitions

### Vision court terme
Constituer un dataset NBA structuré, propre et exploitable couvrant :
- L'historique disponible (2003 → aujourd'hui)
- La saison en cours en temps quasi-réel

### Vision moyen terme
- Visualisations historiques dans Swish League (courbes de progression joueurs, comparaisons saisons)
- Modèle de prédiction de résultats de matchs intégrable dans l'app

### Vision long terme
- Dataset NBA indépendant, réutilisable pour d'autres projets
- API de prédiction exposée (FastAPI ou Cloud Functions)
- Potentiel produit à part entière (SaaS data NBA)
- Base pour industrialisation si Swish League devient commercial

### Principes directeurs
- **Données d'abord** — collecter large, filtrer après
- **Indépendance** — le dataset ne dépend pas de Swish League
- **Scalabilité** — architecture pensée pour grandir
- **Réutilisabilité** — utilisable pour n'importe quel projet NBA

---

## 3. Sources de données

### Source primaire — ESPN API (non officielle)
**Statut :** disponible, CORS OK depuis navigateur, gratuite  
**Profondeur historique :** depuis ~2003  
**Référence :** https://github.com/pseudo-r/Public-ESPN-API

Données disponibles :
- Game log joueur saison par saison
- Stats moyennes et splits par saison
- Résultats et scores de tous les matchs
- Rosters équipes par saison
- Standings historiques
- Blessés, transactions
- Play-by-play (matchs récents uniquement)
- Cotes bookmakers (partenaires US)
- Win probability pré-match et live

**Limites :**
- API non officielle — instabilité possible
- Pas de stats avancées (PER, Win Shares, VORP, BPM)
- Pas de shooting charts / tracking data
- Pas de salaires / contrats

---

### Source secondaire — NBA Stats API officielle
**Statut :** 🔴 Bloquée depuis France (CORS)  
**Contournement possible :** proxy serveur (Edge Function ou backend dédié)  
**Intérêt :** stats avancées officielles, tracking data, synergy stats

Données disponibles si proxy :
- Stats avancées (PER, TS%, USG%, ORTG, DRTG...)
- Shooting charts et zones de tir
- Clutch stats, lineup data
- Hustle stats (charges, deflections, screen assists)
- Play-by-play officiel

---

### Source tertiaire — Basketball Reference (scraping légal)
**Statut :** 🟡 Scraping légal possible mais complexe  
**Intérêt :** données historiques profondes, ère pré-digitale (avant 2003)

Données disponibles :
- Stats complètes depuis 1946
- Win Shares, BPM, VORP, PER historiques
- Records de franchise
- Hall of Fame, Awards historiques

**Contraintes :** rate limiting strict, structure HTML à parser, peut changer

---

### Source quaternaire — Odds API / bookmakers
**Statut :** 🟡 Freemium — clé API requise  
**Intérêt :** cotes en temps réel pour features ML (implied probability)

**Note RGPD/légale :** utilisation des cotes à des fins analytiques (pas promotionnelles) — acceptable. À documenter si le projet devient public en France (ANJ).

---

### Source quinquennaire — Données contextuelles
Sources complémentaires pour enrichir le dataset :
- **Météo** (Open-Meteo, gratuit) — conditions météo ville du match (outdoor events)
- **Calendrier NBA officiel** — back-to-back, jours de repos
- **Réseaux sociaux** (limité) — sentiment analysis si API disponible
- **Données démographiques joueurs** — âge, expérience, nationalité

---

### Sourcing transverse — stratégie multi-sources
L'objectif n'est pas de dépendre d'une seule source mais de **croiser les données** pour :
1. **Fiabilité** — valider les données ESPN avec d'autres sources
2. **Complétude** — combler les lacunes d'une source avec une autre
3. **Richesse** — combiner stats officielles + contextuelles + marché

Architecture de sourcing recommandée :
```
ESPN API          → données de base (matchs, scores, rosters, game log)
NBA Stats API     → stats avancées (via proxy)
Basketball Ref    → historique profond + validation
Odds API          → implied probability pour ML
Données contexte  → back-to-back, repos, déplacements
```

---

## 4. Architecture de stockage

### Contraintes
- Budget : 0€ pour démarrer
- Stack actuel : Google Workspace (BigQuery inclus)
- Volume estimé : 450 joueurs × 82 matchs × 20+ saisons = 700 000+ lignes minimum
- Supabase free tier (500 MB) : insuffisant pour l'historique complet

### Solution recommandée — BigQuery (Google Workspace)
**Pourquoi BigQuery :**
- Inclus dans Google Workspace (déjà disponible)
- Free tier : 10 GB stockage + 1 TB requêtes/mois
- SQL natif — pas de nouveau langage à apprendre
- Intégration native avec Google Colab (ML), Looker Studio (viz), Python
- Scalable sans changer d'architecture
- Standard industrie pour la data

**Limites BigQuery free :**
- 10 GB stockage → suffisant pour 3-4 saisons complètes avec toutes les tables
- Au-delà : ~$0.02/GB/mois — négligeable à l'échelle d'un projet perso

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
│         Python (pandas + requests)                  │
│    Script local ou Cloud Function schedulée         │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────┐    ┌──────────────────────────┐
│    BIGQUERY      │    │      SUPABASE             │
│  (historique +   │    │  (données opéra-          │
│   ML dataset)    │    │   tionnelles app)         │
└──────────────────┘    └──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│              VALORISATION                           │
│  Google Colab (ML) | Looker Studio (viz)            │
│  Swish League app | API de prédiction               │
└─────────────────────────────────────────────────────┘
```

### Nommage BigQuery
Dataset : `nba_data`  
Tables : préfixées par domaine (`players_`, `teams_`, `games_`, `odds_`)

---

## 5. Schéma des données

### Table `games_results` — résultats matchs
```sql
game_id          STRING    -- ESPN event ID
date             DATE
season_year      INT       -- année ESPN (ex: 2026)
season_type      INT       -- 1=pré-saison, 2=régulière, 3=playoffs
home_team        STRING    -- trigramme
away_team        STRING    -- trigramme
home_score       INT
away_score       INT
winner           STRING
arena            STRING
city             STRING
attendance       INT
collected_at     TIMESTAMP
```

### Table `players_gamelog` — performance match par match
```sql
game_id          STRING    -- FK games_results
player_id        STRING    -- ESPN athlete ID
player_name      STRING
team             STRING
season_year      INT
date             DATE
home_away        STRING    -- "home" ou "away"
opponent         STRING
result           STRING    -- "W" ou "L"
minutes          FLOAT
points           INT
rebounds         INT
assists          INT
steals           FLOAT
blocks           FLOAT
turnovers        FLOAT
fg_made          INT
fg_attempted     INT
fg_pct           FLOAT
three_made       INT
three_attempted  INT
three_pct        FLOAT
ft_made          INT
ft_attempted     INT
ft_pct           FLOAT
collected_at     TIMESTAMP
```

### Table `players_season_stats` — moyennes par saison
```sql
player_id        STRING
player_name      STRING
team             STRING
season_year      INT
season_type      INT
games_played     INT
avg_points       FLOAT
avg_rebounds     FLOAT
avg_assists      FLOAT
avg_steals       FLOAT
avg_blocks       FLOAT
avg_minutes      FLOAT
avg_turnovers    FLOAT
fg_pct           FLOAT
three_pct        FLOAT
ft_pct           FLOAT
collected_at     TIMESTAMP
```

### Table `players_info` — profil joueur
```sql
player_id        STRING    -- ESPN athlete ID
full_name        STRING
birth_date       DATE
nationality      STRING
position         STRING
height           STRING
weight           STRING
draft_year       INT
draft_pick       INT
college          STRING
active           BOOLEAN
collected_at     TIMESTAMP
```

### Table `teams_info` — franchises
```sql
team_id          STRING
abbreviation     STRING
full_name        STRING
city             STRING
conference       STRING
division         STRING
arena            STRING
founded          INT
collected_at     TIMESTAMP
```

### Table `injuries` — historique blessures
```sql
player_id        STRING
player_name      STRING
team             STRING
date             DATE
status           STRING    -- "Out", "Doubtful", "Questionable"
injury_type      STRING
collected_at     TIMESTAMP
```

### Table `odds` — cotes bookmakers (si source dispo)
```sql
game_id          STRING
bookmaker        STRING
home_odds        FLOAT
away_odds        FLOAT
home_implied_prob FLOAT
away_implied_prob FLOAT
collected_at     TIMESTAMP
```

---

## 6. Pipeline de collecte

### Phase 1 — Collecte historique (one-shot)
Script Python qui tourne une fois pour remplir l'historique disponible.

**Périmètre :**
- Saisons 2003-2026 (toutes les saisons ESPN)
- Tous les joueurs ayant joué en NBA sur cette période
- Game log + stats moyennes + infos joueur + résultats matchs

**Estimation durée collecte :** plusieurs heures (rate limiting ESPN)  
**Stratégie rate limiting :** `time.sleep(0.5)` entre chaque appel, retry automatique sur erreur

```python
# Structure du script de collecte historique
# 1. Récupérer la liste de toutes les saisons disponibles
# 2. Pour chaque saison : récupérer tous les rosters
# 3. Pour chaque joueur : récupérer game log + stats moyennes
# 4. Pour chaque date de saison : récupérer les résultats de matchs
# 5. Écrire en BigQuery par batch (éviter les timeouts)
```

### Phase 2 — Collecte temps réel (ongoing)
Script schedulé qui tourne quotidiennement pour collecter la saison en cours.

**Fréquence recommandée :**
- Résultats matchs : 1x/jour au matin (matchs de la veille)
- Game log joueurs : 1x/jour
- Blessés : 2x/jour (matin + soir)
- Cotes : avant chaque match (si source disponible)

**Options de scheduling :**
- Cloud Scheduler (Google Cloud) — gratuit jusqu'à 3 jobs/mois
- GitHub Actions cron — gratuit sur repo public
- Script local avec cron job si machine allumée

### Phase 3 — Collecte enrichie
Après stabilisation des phases 1 et 2 :
- Stats avancées via proxy NBA Stats API
- Données contextuelles (back-to-back, repos, déplacements)
- Cotes bookmakers

---

## 7. Cas d'usage

### 7.1 Visualisations dans Swish League
- **Courbe de progression joueur** : évolution PPG/RPG/APG saison par saison
- **Comparaison joueurs** : deux joueurs sur les mêmes axes temporels
- **Heatmap forme équipe** : résultats des 20 derniers matchs d'une franchise
- **Trajectoire de carrière** : arc narratif d'un joueur (montée, apogée, déclin)

### 7.2 Modèle de prédiction ML
**Objectif :** prédire le vainqueur d'un match avec une probabilité.

**Features possibles :**
- Forme récente des deux équipes (W/L sur 5, 10 derniers matchs)
- Stats moyennes de la saison (PPG, DRTG, ORTG)
- Back-to-back (équipe en 2e match consécutif)
- Blessés (joueurs clés absents)
- Historique face-à-face (head-to-head)
- Domicile/extérieur
- Jours de repos
- Cotes implied probability (si disponible)

**Approches ML envisageables :**
- Régression logistique (baseline simple)
- Random Forest / XGBoost (robuste, interprétable)
- Réseau de neurones (si volume suffisant)

**Stack ML :**
- Google Colab (entraînement gratuit, GPU disponible)
- scikit-learn / XGBoost / TensorFlow
- BigQuery ML (SQL natif pour modèles simples)
- MLflow ou Weights & Biases (tracking expériences)

### 7.3 Autres projets potentiels
- **Draft assistant** : prédire la valeur d'un joueur drafté selon son profil
- **Trade analyzer** : évaluer l'impact d'un trade sur les deux franchises
- **Fantasy NBA helper** : recommandations de picks basées sur les données
- **Dataset public** : publier le dataset nettoyé sur Kaggle ou Hugging Face

---

## 8. Feuille de route

### Étape 1 — Setup BigQuery (1 session)
- [ ] Vérifier accès BigQuery dans Google Workspace
- [ ] Créer le dataset `nba_data`
- [ ] Créer les tables avec le schéma défini
- [ ] Tester une première insertion Python → BigQuery

### Étape 2 — Script collecte historique (1-2 sessions)
- [ ] Script Python collecte ESPN → BigQuery
- [ ] Gestion rate limiting + retry
- [ ] Collecte saisons 2020-2026 en priorité (5 saisons récentes)
- [ ] Validation données : cohérence, doublons, valeurs manquantes
- [ ] Collecte historique complet 2003-2020 ensuite

### Étape 3 — Pipeline temps réel (1 session)
- [ ] Script quotidien pour la saison en cours
- [ ] Scheduling (GitHub Actions ou Cloud Scheduler)
- [ ] Alertes si collecte échoue

### Étape 4 — Exploration & visualisations (ongoing)
- [ ] Premiers notebooks Colab d'exploration
- [ ] Courbes de progression joueurs
- [ ] Intégration visualisations dans Swish League

### Étape 5 — Modèle ML (après 1 saison de collecte)
- [ ] Feature engineering
- [ ] Baseline model (régression logistique)
- [ ] Évaluation et itération
- [ ] Exposition via API si résultats satisfaisants

---

## 9. Contraintes & limites

### Techniques
- ESPN API non officielle — pas de garantie de stabilité
- Rate limiting ESPN — collecte lente (heures pour l'historique complet)
- BigQuery free tier : 10 GB → suffisant pour démarrer, limité à long terme
- NBA Stats API bloquée depuis France — proxy nécessaire pour stats avancées

### Légales
- ESPN API non officielle : usage personnel/recherche acceptable, commercial à risque
- Basketball Reference : scraping légal pour usage personnel, interdit commercial
- Cotes bookmakers : affichage encadré en France (ANJ) — analytique OK
- RGPD : aucune donnée personnelle dans le dataset NBA (données publiques sur athlètes professionnels)

### Qualité données
- Données ESPN parfois incomplètes pour les saisons anciennes (avant 2010)
- Cohérence entre sources à valider (ESPN vs Basketball Reference)
- Données temps réel (blessés, lineup) non récupérables a posteriori

---

## 10. Stack technique

### Collecte
- **Python 3.10+**
- `requests` — appels API
- `pandas` — manipulation données
- `google-cloud-bigquery` — écriture BigQuery
- `tenacity` — retry automatique sur erreur

### Stockage
- **BigQuery** (Google Workspace) — dataset principal
- **Supabase** — données opérationnelles app uniquement

### ML & Analyse
- **Google Colab** — notebooks, entraînement modèles (gratuit)
- **scikit-learn / XGBoost** — modèles ML
- **BigQuery ML** — modèles SQL natifs (optionnel)
- **Looker Studio** — dashboards visualisation (gratuit, connecté BigQuery)

### Orchestration (phase 3)
- **GitHub Actions** — cron jobs gratuits
- **Google Cloud Scheduler** — alternative si besoin

---

*Document v1.0 — 2026-05-28*  
*Projet Swish Data — transverse à Swish League*  
*Prochaine étape : Setup BigQuery + premier script de collecte*
