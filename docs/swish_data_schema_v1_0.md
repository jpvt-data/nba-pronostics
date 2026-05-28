# SWISH DATA — SCHÉMA DE RÉFÉRENCE
## Référentiel NBA — Structure SQLite
> v1.0 | 2026-05-28

---

## TABLES — VUE D'ENSEMBLE

| Table | Type | Description |
|---|---|---|
| `joueurs` | Dimension | Registre canonique des joueurs |
| `equipes` | Dimension | Franchises NBA |
| `arenes` | Dimension | Salles de match |
| `saisons` | Dimension | Saisons NBA |
| `coaches` | Dimension | Entraîneurs |
| `franchises_historique` | Historique | Noms/villes successifs des franchises |
| `joueurs_equipes` | Historique | Carrière joueur (toutes les équipes) |
| `coaches_equipes` | Historique | Coaches par équipe par saison |
| `matchs` | Fait | Résultats et contexte des matchs |
| `matchs_arbitres` | Détail | Arbitres par match |
| `matchs_diffusion` | Détail | Chaînes TV par match |
| `cotes` | Détail | Cotes bookmakers par match |
| `joueurs_stats_saison` | Fait | Stats joueur par saison |
| `joueurs_gamelog` | Fait | Stats joueur par match |
| `equipes_stats_saison` | Fait | Stats équipe par saison |
| `palmares_equipes` | Distinction | Titres par équipe par saison |
| `awards_joueurs` | Distinction | Awards individuels |
| `selections_joueurs` | Distinction | All-NBA, All-Star, All-Defensive... |
| `records_joueurs` | Record | Records personnels et franchise |
| `records_equipes` | Record | Records franchise |
| `transactions` | Événement | Trades, free agents, waivers |
| `blessures` | Événement | Historique blessures |

---

## ENTITÉS DE RÉFÉRENCE

### `joueurs`
```
joueur_id           TEXT PK      -- ID interne (basé ESPN ID)
prenom              TEXT
nom                 TEXT
nom_complet         TEXT
surnom              TEXT
date_naissance      TEXT
ville_naissance     TEXT
pays_naissance      TEXT
nationalite         TEXT
taille_cm           INTEGER
poids_kg            REAL
main_dominante      TEXT
photo_url           TEXT
lycee               TEXT
universite          TEXT
pays_formation      TEXT
annees_college      INTEGER
statut              TEXT         -- "actif", "retraite", "free_agent"
annee_debut_nba     INTEGER
annee_retraite      INTEGER
hall_of_fame        INTEGER      -- 0/1
hof_annee           INTEGER
hof_categorie       TEXT         -- "joueur", "contributeur", "arbitre"
espn_id             TEXT
nba_stats_id        TEXT
bbref_slug          TEXT
collecte_le         TEXT
```

### `equipes`
```
equipe_id           TEXT PK
nom_complet         TEXT
ville               TEXT
trigramme           TEXT
conference          TEXT
division            TEXT
couleur_principale  TEXT         -- hex sans #
couleur_secondaire  TEXT
logo_url            TEXT
annee_fondation     INTEGER
espn_id             TEXT
nba_stats_id        TEXT
bbref_slug          TEXT
collecte_le         TEXT
```

### `arenes`
```
arene_id            TEXT PK
nom                 TEXT
ville               TEXT
capacite            INTEGER
annee_ouverture     INTEGER
equipe_id           TEXT FK equipes
collecte_le         TEXT
```

### `saisons`
```
saison_id               TEXT PK      -- ex: "2025-26"
annee_espn              INTEGER      -- ex: 2026
date_debut_pre          TEXT
date_debut_reg          TEXT
date_fin_reg            TEXT
date_debut_playoffs     TEXT
date_fin_playoffs       TEXT
champion_equipe_id      TEXT FK equipes
finaliste_equipe_id     TEXT FK equipes
mvp_finales_id          TEXT FK joueurs
contexte                TEXT
collecte_le             TEXT
```

### `coaches`
```
coach_id            TEXT PK
prenom              TEXT
nom                 TEXT
date_naissance      TEXT
nationalite         TEXT
collecte_le         TEXT
```

---

## HISTORIQUES

### `franchises_historique`
Trace tous les noms/villes successifs d'une franchise (ex: Seattle SuperSonics → OKC Thunder).
```
id, equipe_id FK, nom_complet, ville, trigramme, date_debut, date_fin, collecte_le
```

### `joueurs_equipes`
Carrière complète d'un joueur — toutes les équipes avec dates.
```
id, joueur_id FK, equipe_id FK, saison_id FK, date_debut, date_fin, type_arrivee, collecte_le
type_arrivee : "draft", "trade", "free_agent", "waiver"
```

### `coaches_equipes`
```
id, coach_id FK, equipe_id FK, saison_id FK, date_debut, date_fin, bilan_victoires, bilan_defaites, collecte_le
```

---

## MATCHS

### `matchs`
```
match_id            TEXT PK
espn_id             TEXT
nba_stats_id        TEXT
saison_id           TEXT FK
type_saison         INTEGER      -- 1=pré, 2=régulière, 3=playoffs
date                TEXT
heure               TEXT
equipe_dom_id       TEXT FK equipes
equipe_ext_id       TEXT FK equipes
score_dom           INTEGER
score_ext           INTEGER
gagnant_id          TEXT FK equipes
arene_id            TEXT FK arenes
affluence           INTEGER
dom_back_to_back    INTEGER      -- 0/1
ext_back_to_back    INTEGER      -- 0/1
dom_jours_repos     INTEGER
ext_jours_repos     INTEGER
dom_q1..q4, dom_ot  INTEGER      -- scores par quart-temps
ext_q1..q4, ext_ot  INTEGER
collecte_le         TEXT
```

### `matchs_arbitres`
```
id, match_id FK, arbitre_nom, role, collecte_le
role : "referee", "umpire"
```

### `matchs_diffusion`
```
id, match_id FK, chaine, marche, collecte_le
marche : "national", "local_dom", "local_ext"
```

### `cotes`
```
id, match_id FK, bookmaker, cote_dom, cote_ext, prob_implicite_dom, prob_implicite_ext, collecte_le
```

---

## STATS

### `joueurs_stats_saison`
Stats de base + stats avancées (nullables si source non disponible).
```
id, joueur_id FK, equipe_id FK, saison_id FK, type_saison
matchs_joues, matchs_titulaire, moy_minutes
moy_points, moy_rebonds, moy_passes, moy_interceptions, moy_contres
moy_ballons_perdus, moy_fautes
fg_tentes, fg_reussis, fg_pct
trois_pts_tentes, trois_pts_reussis, trois_pts_pct
lf_tentes, lf_reussis, lf_pct
ts_pct, efg_pct
-- Avancées (nullables)
per, win_shares, win_shares_48, bpm, vorp, usg_pct, ortg, drtg
source, collecte_le
```

### `joueurs_gamelog`
Une ligne par joueur par match.
```
id, joueur_id FK, match_id FK, equipe_id FK, adversaire_id FK, saison_id FK
domicile_exterieur, resultat
minutes, points, rebonds, passes, interceptions, contres, ballons_perdus, fautes
fg_reussis, fg_tentes, fg_pct
trois_pts_reussis, trois_pts_tentes, trois_pts_pct
lf_reussis, lf_tentes, lf_pct
plus_minus, source, collecte_le
```

### `equipes_stats_saison`
```
id, equipe_id FK, saison_id FK, type_saison
victoires, defaites
victoires_dom, defaites_dom, victoires_ext, defaites_ext
rang_conference, rang_division
moy_points_marques, moy_points_encaisses
pace, ortg, drtg, net_rtg
source, collecte_le
```

---

## PALMARÈS & DISTINCTIONS

### `palmares_equipes`
```
id, equipe_id FK, saison_id FK, type_titre, collecte_le
type_titre : "champion_nba", "finaliste", "champion_conference", "champion_division"
```

### `awards_joueurs`
```
id, joueur_id FK, saison_id FK, type_award, collecte_le
type_award : "mvp", "dpoy", "roy", "mip", "6moy", "mvp_finales", "mvp_allstar"
```

### `selections_joueurs`
```
id, joueur_id FK, saison_id FK, type_selection, rang, collecte_le
type_selection : "all_nba", "all_defensive", "all_rookie", "all_star"
rang : 1, 2 ou 3
```

### `records_joueurs`
```
id, joueur_id FK, equipe_id FK (nullable), type_record, valeur
match_id FK (nullable), saison_id FK (nullable), collecte_le
```

### `records_equipes`
```
id, equipe_id FK, type_record, valeur, saison_id FK (nullable), collecte_le
```

### `transactions`
```
id, joueur_id FK, equipe_depart_id FK (nullable), equipe_arrivee_id FK
date, type, details (JSON), collecte_le
type : "trade", "waiver", "free_agent", "draft", "extension"
```

### `blessures`
```
id, joueur_id FK, equipe_id FK
date_debut, date_retour (nullable), statut, type_blessure, collecte_le
statut : "Out", "Doubtful", "Questionable"
```

---

## RELATIONS

```
joueurs ──< joueurs_equipes >── equipes
joueurs ──< joueurs_stats_saison >── saisons
joueurs ──< joueurs_gamelog >── matchs
joueurs ──< awards_joueurs >── saisons
joueurs ──< selections_joueurs >── saisons
joueurs ──< records_joueurs
joueurs ──< blessures
joueurs ──< transactions >── equipes

equipes ──< matchs (dom + ext)
equipes ──< equipes_stats_saison >── saisons
equipes ──< palmares_equipes >── saisons
equipes ──< records_equipes
equipes ──< franchises_historique
equipes ──< coaches_equipes >── coaches

matchs ──< joueurs_gamelog
matchs ──< cotes
matchs ──< matchs_arbitres
matchs ──< matchs_diffusion

saisons ──< matchs
```

---

## SOURCES PAR TABLE

| Table | ESPN | NBA Stats | BBRef | Odds API |
|---|---|---|---|---|
| joueurs | ✅ base | ✅ IDs | ✅ slug + avancées | — |
| equipes | ✅ | ✅ | ✅ | — |
| matchs | ✅ | ✅ | ✅ | — |
| joueurs_stats_saison | ✅ base | ✅ avancées | ✅ avancées | — |
| joueurs_gamelog | ✅ | 🟡 | 🟡 | — |
| cotes | — | — | — | ✅ |
| blessures | ✅ | — | — | — |
| transactions | ✅ | — | — | — |
| awards_joueurs | ✅ | — | ✅ | — |
| palmares_equipes | ✅ | — | ✅ | — |

---

## INDEXATION

```sql
idx_joueurs_espn_id         ON joueurs(espn_id)
idx_joueurs_bbref_slug       ON joueurs(bbref_slug)
idx_matchs_espn_id           ON matchs(espn_id)
idx_matchs_saison            ON matchs(saison_id)
idx_matchs_date              ON matchs(date)
idx_gamelog_joueur           ON joueurs_gamelog(joueur_id)
idx_gamelog_match            ON joueurs_gamelog(match_id)
idx_stats_saison_joueur      ON joueurs_stats_saison(joueur_id, saison_id)
idx_joueurs_equipes_joueur   ON joueurs_equipes(joueur_id)
idx_blessures_joueur         ON blessures(joueur_id)
idx_awards_joueur            ON awards_joueurs(joueur_id)
```

---

## FICHIERS DU PROJET

| Fichier | Description |
|---|---|
| `creation_schema.sql` | Script de création complet de la BDD |
| `swish_data_schema_v1_0.md` | Ce document |
| `swish_data_v1_0.md` | Document de référence projet Swish Data |

---

*Document v1.0 — 2026-05-28*
*Swish Data — Référentiel NBA SQLite*
*Prochaine étape : installation SQLite + création de la BDD*
