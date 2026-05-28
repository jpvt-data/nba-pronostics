-- ============================================================
-- SWISH DATA — Schéma SQLite complet
-- v1.0 | 2026-05-28
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- ENTITÉS DE RÉFÉRENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS joueurs (
    joueur_id           TEXT PRIMARY KEY,
    prenom              TEXT,
    nom                 TEXT,
    nom_complet         TEXT,
    surnom              TEXT,
    date_naissance      TEXT,
    ville_naissance     TEXT,
    pays_naissance      TEXT,
    nationalite         TEXT,
    taille_cm           INTEGER,
    poids_kg            REAL,
    main_dominante      TEXT,
    photo_url           TEXT,
    lycee               TEXT,
    universite          TEXT,
    pays_formation      TEXT,
    annees_college      INTEGER,
    statut              TEXT,           -- "actif", "retraite", "free_agent"
    annee_debut_nba     INTEGER,
    annee_retraite      INTEGER,
    hall_of_fame        INTEGER DEFAULT 0,  -- 0/1
    hof_annee           INTEGER,
    hof_categorie       TEXT,           -- "joueur", "contributeur", "arbitre"
    espn_id             TEXT,
    nba_stats_id        TEXT,
    bbref_slug          TEXT,
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS equipes (
    equipe_id           TEXT PRIMARY KEY,
    nom_complet         TEXT,
    ville               TEXT,
    trigramme           TEXT,
    conference          TEXT,
    division            TEXT,
    couleur_principale  TEXT,           -- hex sans #
    couleur_secondaire  TEXT,
    logo_url            TEXT,
    annee_fondation     INTEGER,
    espn_id             TEXT,
    nba_stats_id        TEXT,
    bbref_slug          TEXT,
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS arenes (
    arene_id            TEXT PRIMARY KEY,
    nom                 TEXT,
    ville               TEXT,
    capacite            INTEGER,
    annee_ouverture     INTEGER,
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS saisons (
    saison_id               TEXT PRIMARY KEY,   -- ex: "2025-26"
    annee_espn              INTEGER,             -- ex: 2026
    date_debut_pre          TEXT,
    date_debut_reg          TEXT,
    date_fin_reg            TEXT,
    date_debut_playoffs     TEXT,
    date_fin_playoffs       TEXT,
    champion_equipe_id      TEXT REFERENCES equipes(equipe_id),
    finaliste_equipe_id     TEXT REFERENCES equipes(equipe_id),
    mvp_finales_id          TEXT REFERENCES joueurs(joueur_id),
    contexte                TEXT,               -- "lockout", "bulle COVID", etc.
    collecte_le             TEXT
);

CREATE TABLE IF NOT EXISTS coaches (
    coach_id            TEXT PRIMARY KEY,
    prenom              TEXT,
    nom                 TEXT,
    date_naissance      TEXT,
    nationalite         TEXT,
    collecte_le         TEXT
);

-- ============================================================
-- HISTORIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS franchises_historique (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    nom_complet         TEXT,
    ville               TEXT,
    trigramme           TEXT,
    date_debut          TEXT,
    date_fin            TEXT,
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS joueurs_equipes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    date_debut          TEXT,
    date_fin            TEXT,
    type_arrivee        TEXT,           -- "draft", "trade", "free_agent", "waiver"
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS coaches_equipes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id            TEXT REFERENCES coaches(coach_id),
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    date_debut          TEXT,
    date_fin            TEXT,
    bilan_victoires     INTEGER,
    bilan_defaites      INTEGER,
    collecte_le         TEXT
);

-- ============================================================
-- MATCHS
-- ============================================================

CREATE TABLE IF NOT EXISTS matchs (
    match_id            TEXT PRIMARY KEY,
    espn_id             TEXT,
    nba_stats_id        TEXT,
    saison_id           TEXT REFERENCES saisons(saison_id),
    type_saison         INTEGER,        -- 1=pré, 2=régulière, 3=playoffs
    date                TEXT,
    heure               TEXT,
    equipe_dom_id       TEXT REFERENCES equipes(equipe_id),
    equipe_ext_id       TEXT REFERENCES equipes(equipe_id),
    score_dom           INTEGER,
    score_ext           INTEGER,
    gagnant_id          TEXT REFERENCES equipes(equipe_id),
    arene_id            TEXT REFERENCES arenes(arene_id),
    affluence           INTEGER,
    -- Contexte ML
    dom_back_to_back    INTEGER DEFAULT 0,
    ext_back_to_back    INTEGER DEFAULT 0,
    dom_jours_repos     INTEGER,
    ext_jours_repos     INTEGER,
    -- Quart-temps
    dom_q1              INTEGER,
    dom_q2              INTEGER,
    dom_q3              INTEGER,
    dom_q4              INTEGER,
    dom_ot              INTEGER,
    ext_q1              INTEGER,
    ext_q2              INTEGER,
    ext_q3              INTEGER,
    ext_q4              INTEGER,
    ext_ot              INTEGER,
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS matchs_arbitres (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id            TEXT REFERENCES matchs(match_id),
    arbitre_nom         TEXT,
    role                TEXT,           -- "referee", "umpire"
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS matchs_diffusion (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id            TEXT REFERENCES matchs(match_id),
    chaine              TEXT,
    marche              TEXT,           -- "national", "local_dom", "local_ext"
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS cotes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id            TEXT REFERENCES matchs(match_id),
    bookmaker           TEXT,
    cote_dom            REAL,
    cote_ext            REAL,
    prob_implicite_dom  REAL,
    prob_implicite_ext  REAL,
    collecte_le         TEXT
);

-- ============================================================
-- STATS
-- ============================================================

CREATE TABLE IF NOT EXISTS joueurs_stats_saison (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    type_saison         INTEGER,
    matchs_joues        INTEGER,
    matchs_titulaire    INTEGER,
    moy_minutes         REAL,
    moy_points          REAL,
    moy_rebonds         REAL,
    moy_passes          REAL,
    moy_interceptions   REAL,
    moy_contres         REAL,
    moy_ballons_perdus  REAL,
    moy_fautes          REAL,
    fg_tentes           REAL,
    fg_reussis          REAL,
    fg_pct              REAL,
    trois_pts_tentes    REAL,
    trois_pts_reussis   REAL,
    trois_pts_pct       REAL,
    lf_tentes           REAL,
    lf_reussis          REAL,
    lf_pct              REAL,
    ts_pct              REAL,
    efg_pct             REAL,
    -- Stats avancées (nullables — remplies si source disponible)
    per                 REAL,
    win_shares          REAL,
    win_shares_48       REAL,
    bpm                 REAL,
    vorp                REAL,
    usg_pct             REAL,
    ortg                REAL,
    drtg                REAL,
    source              TEXT,           -- "espn", "nba_stats", "bbref"
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS joueurs_gamelog (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    match_id            TEXT REFERENCES matchs(match_id),
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    adversaire_id       TEXT REFERENCES equipes(equipe_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    domicile_exterieur  TEXT,           -- "domicile", "exterieur"
    resultat            TEXT,           -- "V", "D"
    minutes             REAL,
    points              INTEGER,
    rebonds             INTEGER,
    passes              INTEGER,
    interceptions       REAL,
    contres             REAL,
    ballons_perdus      REAL,
    fautes              REAL,
    fg_reussis          INTEGER,
    fg_tentes           INTEGER,
    fg_pct              REAL,
    trois_pts_reussis   INTEGER,
    trois_pts_tentes    INTEGER,
    trois_pts_pct       REAL,
    lf_reussis          INTEGER,
    lf_tentes           INTEGER,
    lf_pct              REAL,
    plus_minus          INTEGER,
    source              TEXT,
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS equipes_stats_saison (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    type_saison         INTEGER,
    victoires           INTEGER,
    defaites            INTEGER,
    victoires_dom       INTEGER,
    defaites_dom        INTEGER,
    victoires_ext       INTEGER,
    defaites_ext        INTEGER,
    rang_conference     INTEGER,
    rang_division       INTEGER,
    moy_points_marques  REAL,
    moy_points_encaisses REAL,
    pace                REAL,
    ortg                REAL,
    drtg                REAL,
    net_rtg             REAL,
    source              TEXT,
    collecte_le         TEXT
);

-- ============================================================
-- PALMARÈS & DISTINCTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS palmares_equipes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    type_titre          TEXT,   -- "champion_nba", "finaliste", "champion_conference", "champion_division"
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS awards_joueurs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    type_award          TEXT,   -- "mvp", "dpoy", "roy", "mip", "6moy", "mvp_finales", "mvp_allstar"
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS selections_joueurs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    saison_id           TEXT REFERENCES saisons(saison_id),
    type_selection      TEXT,   -- "all_nba", "all_defensive", "all_rookie", "all_star"
    rang                INTEGER, -- 1, 2 ou 3
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS records_joueurs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    equipe_id           TEXT REFERENCES equipes(equipe_id),  -- nullable
    type_record         TEXT,
    valeur              REAL,
    match_id            TEXT REFERENCES matchs(match_id),    -- nullable
    saison_id           TEXT REFERENCES saisons(saison_id),  -- nullable
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS records_equipes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    type_record         TEXT,
    valeur              REAL,
    saison_id           TEXT REFERENCES saisons(saison_id),  -- nullable
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    equipe_depart_id    TEXT REFERENCES equipes(equipe_id),  -- nullable
    equipe_arrivee_id   TEXT REFERENCES equipes(equipe_id),
    date                TEXT,
    type                TEXT,   -- "trade", "waiver", "free_agent", "draft", "extension"
    details             TEXT,   -- JSON si besoin
    collecte_le         TEXT
);

CREATE TABLE IF NOT EXISTS blessures (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    joueur_id           TEXT REFERENCES joueurs(joueur_id),
    equipe_id           TEXT REFERENCES equipes(equipe_id),
    date_debut          TEXT,
    date_retour         TEXT,   -- nullable
    statut              TEXT,   -- "Out", "Doubtful", "Questionable"
    type_blessure       TEXT,
    collecte_le         TEXT
);

-- ============================================================
-- INDEX — performances de requête
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_joueurs_espn_id         ON joueurs(espn_id);
CREATE INDEX IF NOT EXISTS idx_joueurs_bbref_slug       ON joueurs(bbref_slug);
CREATE INDEX IF NOT EXISTS idx_matchs_espn_id           ON matchs(espn_id);
CREATE INDEX IF NOT EXISTS idx_matchs_saison            ON matchs(saison_id);
CREATE INDEX IF NOT EXISTS idx_matchs_date              ON matchs(date);
CREATE INDEX IF NOT EXISTS idx_gamelog_joueur           ON joueurs_gamelog(joueur_id);
CREATE INDEX IF NOT EXISTS idx_gamelog_match            ON joueurs_gamelog(match_id);
CREATE INDEX IF NOT EXISTS idx_stats_saison_joueur      ON joueurs_stats_saison(joueur_id, saison_id);
CREATE INDEX IF NOT EXISTS idx_joueurs_equipes_joueur   ON joueurs_equipes(joueur_id);
CREATE INDEX IF NOT EXISTS idx_blessures_joueur         ON blessures(joueur_id);
CREATE INDEX IF NOT EXISTS idx_awards_joueur            ON awards_joueurs(joueur_id);
