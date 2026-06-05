# SWISH LEAGUE — SOCLE v3.7
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-05

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
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `pronos_ecart` | `semaines_gagnees` | `messages` | `xp_log` | `missions` | `missions_utilisateurs` | `badges_catalogue`

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
- RLS : SELECT `auth.role() = 'authenticated'` / INSERT `auth.uid() = user_id` / UPDATE `auth.uid() = user_id`
- GRANT : `SELECT, INSERT, UPDATE ON pronos_ecart TO authenticated`

### Table `xp_log` — historique immuable des gains XP ✅ CRÉÉE
```
id / user_id / source ('mission'|'jalon'|'passif'|'admin') / source_id / xp_gagne / meta jsonb / date_jour date / cree_le
```
- `date_jour` : date Paris (`toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })`) — utilisée pour les checks quotidiens sans problème timezone
- Index unique : `xp_log_connexion_unique` sur `(user_id, source_id, date_jour)` WHERE `source_id = 'connexion_quotidienne'` — anti race condition
- RLS : SELECT + INSERT propres. Pas d'UPDATE ni DELETE côté client.

### Table `missions` — catalogue ✅ CRÉÉE
```
id / slug unique / titre / description / type ('quotidienne'|'hebdomadaire'|'evenement'|'permanente')
xp_recompense / badge_slug / condition_type / condition_valeur
actif / date_debut / date_fin / cree_par ('auto'|'admin')
```

### Table `missions_utilisateurs` — progression ✅ CRÉÉE
```
id / user_id / mission_id / progression / completee / completee_le
periode ('YYYY-MM-DD' quotidienne | 'YYYY-WNN' hebdo | null événement)
UNIQUE(user_id, mission_id, periode)
```

### Table `badges_catalogue` — référentiel visuel ✅ CRÉÉE
```
slug PK / nom / description / famille / image_url / xp_bonus
```
Note : le catalogue live est dans `src/data/badges.js` (source de vérité front). La table Supabase est un référentiel complémentaire.

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
- `profils` UPDATE admin : policy dédiée `auth.uid() = 'fa55d016-...'` (pour attribution badges)
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `semaines_gagnees` SELECT : `auth.role() = 'authenticated'`
- `groupes` INSERT : restreint à `admin_id = 'fa55d016-...'`
- `messages` DELETE : `auth.uid() = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'`
- `xp_log` SELECT/INSERT : propres. Pas d'UPDATE/DELETE.
- `badges_catalogue` SELECT : `auth.role() = 'authenticated'`
- `missions` SELECT : `auth.role() = 'authenticated'`
- `missions_utilisateurs` SELECT/INSERT/UPDATE : propres.
- `pronos_ecart` SELECT/INSERT/UPDATE : propres.

### GRANT Supabase
```sql
GRANT SELECT, INSERT ON xp_log TO authenticated;
GRANT SELECT ON badges_catalogue TO authenticated;
GRANT SELECT ON missions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON missions_utilisateurs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pronos_ecart TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
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
    ProfilContext.jsx     ← XP connexion quotidienne (+5) au chargement
  data/
    changelog.js
    badges.js            ← BADGES_CATALOGUE + badgeImageUrl() — source de vérité badges (14 badges)
  services/
    espn.js              ← recupererGagnant() retourne ecart_final
    points.js            ← calculerPoints() + pronos_ecart validation + jalon tireur_d_elite
    ligues.js
    xp.js                ← niveauDepuisXP, xpPourNiveau, ajouterXP, verifierJalons, verifierMissions
    ecart.js             ← recupererFourchetteEcart(), poserFourchetteEcart() + XP +5
  pages/
    Accueil.jsx          ← header enrichi KPIs + XP + popup badge obtention
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx       ← verifierJalons branché sur semaine gagnée
    MesPronos.jsx        ← header XP/badges, stats globales+écart, stats ligues dropdown, historique XP
    MatchDetail.jsx      ← bloc BONUS ÉCART, XP anti-doublon branché
    Calendrier.jsx
    Profil.jsx
    Stats.jsx
    H2H.jsx              ← enrichi fourchettes : bilan écart + détail match par match
    QuoiDeNeuf.jsx
    Admin.jsx            ← 4 onglets : Scanner / Ligues / Utilisateurs / Modération
  components/
    UI.jsx
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Briefing.jsx         ← enrichi : jalons XP, badges, niveaux, titres RPG
    BanniereFeed.jsx
    LeVestiaire.jsx
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

### Board (Accueil) ✅ — v3.5
- À LA UNE / TIMELINE / TICKER / LIGUE EN COURS / VESTIAIRE / CLASSEMENT NBA / ACTU NBA
- Header enrichi : KPIs (Total pronos + % réussite) à droite, Titre RPG + barre XP courte + lien "Mes stats →"
- Popup obtention badge au chargement (nouveaux badges depuis dernière visite, un par un)

### Admin ✅ — v3.5 (4 onglets)
- Scanner ESPN (persistant)
- Ligues (CRUD complet + remplissage auto depuis scanner)
- **Utilisateurs** : select dropdown alphabétique, attribution/retrait badges manuels avec feedback
- Modération

### MesPronos (Stats) ✅ — v3.7
- Header fusionné profil + XP : titre RPG, niveau, barre progression, XP actuel, XP restant, lien Historique XP
- Badges obtenus affichés en brut (sans cadre), cliquables → popup visualisation avec date d'obtention
- Modal ℹ️ : 3 onglets (XP & Niveaux / Badges mystérieux / Missions) — inclut fourchette d'écart
- Modal Historique XP : 100 derniers gains triés par date, labels lisibles
- **FORME RÉCENTE** déplacée juste sous le header
- **SÉRIES** avant STATS GLOBALES
- **STATS GLOBALES** : 2 sections — Pronos match (4 KPIs 32px) + Fourchette d'écart (4 KPIs 32px, masquée si 0)
- **STATS LIGUES** : dropdown sélecteur, nom ligue affiché, 2 lignes (PRONOS MATCH + FOURCHETTE ÉCART) + TOTAL, filtre ligues sans pronos
- **HISTORIQUE** : fourchette posée affichée par match (en attente / ✓ / ✗ avec fourchette réelle)

### MatchDetail ✅ — v3.6
- Badge headline ESPN, fallback Summer League, détection Finals fiable, appel scoreboard J-1→J
- **Bloc BONUS ÉCART** : apparaît après prono vainqueur posé, 5 boutons fourchette, highlight gold, message "tu peux changer", résultat après match
- Espace `height: 30` entre BONUS ÉCART et PRÉDICTION ESPN

### H2H ✅ — v3.7
- Bilan fourchettes correctes (toi vs pote) sous le verdict
- Détail match par match : fourchette choisie + ✓/✗ pour chaque joueur si posée

### Calendrier ✅ — v3.4
Filtres par phase, Summer League, navigation auto au 1er match du filtre

### BandeMatchs ✅ — v3.4
Tags du jour affichés à droite de la date

### Explorer / Stats ✅ — v3.4
Classements Pré-saison/Régulière/Playoffs, stats joueur historiques par saison + type

### Groupes ✅ — v3.4
Épuré (gestion admin dans Admin), badge tag + description

### Briefing ✅ — v3.5 (enrichi)
Nouvelles notifications : jalons XP < 24h, badges récemment obtenus, changement de niveau, changement de titre RPG.

---

## 10. Décisions produit

### Session 2026-06-04 — Sprint 3.4
- `detecterType()` centralisé dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`
- Notes ESPN absentes en summary et scoreboard date unique — présentes en scoreboard plage
- Gestion ligues déplacée dans Admin uniquement (`CreerGroupe.jsx` supprimé)
- Tagline "Clashe" → "Performe" en cours de validation

### Session 2026-06-05 — Sprint 3.5 — Système RPG Progression ✅ IMPLÉMENTÉ

#### Philosophie
"Tu démarres tout nu. Tu finis armé." Inspiration RPG — progression narrative sur le long terme.
- **XP cumulatif à vie** (jamais remis à zéro) → niveau de carrière
- **Titre saisonnier** gravé en fin de saison NBA → palmarès permanent (à implémenter en fin de saison)
- Les missions sont la principale source d'accélération XP (catalogue à remplir)

#### Courbe 100 niveaux
`XP_BASE = 300` / `XP_COEFFICIENT = 1.06` dans `config.js`

| Titre | Niveaux | XP cumulé pour entrer |
|---|---|---|
| Rookie | 1-10 | 0 |
| Sixième Homme | 11-20 | ~3 954 |
| Starter | 21-30 | ~11 035 |
| All-Star | 31-40 | ~23 719 |
| MVP | 41-60 | ~46 429 |
| Hall of Fame | 61-80 | ~159 940 |
| GOAT | 81-100 | ~523 980 |

#### Sources XP — toutes branchées ✅

| Action | XP | Fréquence | Fichier |
|---|---|---|---|
| Prono posé | +10 | Par prono | `Accueil.jsx` + `MatchDetail.jsx` |
| Premier prono du jour | +10 | 1×/jour | `Accueil.jsx` + `MatchDetail.jsx` |
| Prono correct | +25 | Par prono validé | `points.js` |
| Connexion quotidienne | +5 | 1×/jour | `ProfilContext.jsx` |
| Semaine 100% pronostiquée | +50 | 1×/semaine | `points.js` |
| Premier prono de l'histoire | +75 | 1× à vie | `Accueil.jsx` + `MatchDetail.jsx` |
| Fourchette d'écart posée | +5 | 1× par match | `ecart.js` |
| Fourchette d'écart correcte | +30 | Par fourchette validée | `points.js` |

#### Jalons automatiques — tous branchés ✅

| Jalon | XP | Badge | source_id |
|---|---|---|---|
| 10 pronos posés | +50 | — | `jalon_10_pronos` |
| 50 pronos posés | +150 | All-In | `jalon_50_pronos` |
| 100 pronos posés | +300 | Marathonien | `jalon_100_pronos` |
| 5 corrects consécutifs | +100 | En Feu | `jalon_serie_5` |
| 10 corrects consécutifs | +250 | Prophète | `jalon_serie_10` |
| Win rate 65%+ sur 20 pronos | +200 | Analyste | `jalon_winrate_65` |
| Gagner une semaine de ligue | +150 | Champion | `jalon_semaine` |
| 5 ratés consécutifs | +0 | En Hibernation | `jalon_serie_ratee_5` |
| 10 fourchettes correctes cumulatives | +200 | Tireur d'Élite | `jalon_10_fourchettes` |

#### Timezone — règle critique
Toutes les comparaisons de dates quotidiennes utilisent `toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })` et la colonne `date_jour` de `xp_log`. Jamais `toISOString().slice(0,10)` pour les checks quotidiens.

#### Badges — catalogue définitif dans `src/data/badges.js` (14 badges)

| Slug | Nom | Famille | Attribution |
|---|---|---|---|
| `original_gangster` | Original Gangster | appartenance | Manuel admin |
| `all_in` | All-In | performance | Auto (50 pronos) |
| `en_hibernation` | En Hibernation | performance | Auto (5 ratés consécutifs) |
| `en_feu` | En Feu | performance | Auto (5 corrects consécutifs) |
| `champion` | Champion | performance | Auto (semaine gagnée) |
| `marathonien` | Marathonien | performance | Auto (100 pronos) |
| `analyste` | Analyste | performance | Auto (65% sur 20) |
| `prophete` | Prophète | performance | Auto (10 corrects consécutifs) |
| `tireur_d_elite` | Tireur d'Élite | performance | Auto (10 fourchettes correctes cumulatives) |
| `echauffement` | L'Échauffement | evenement | Manuel admin (fin pré-saison) |
| `ete_brulant` | Été Brûlant | evenement | Manuel admin (fin Summer League) |
| `la_longue_marche` | La Longue Marche | evenement | Manuel admin (fin saison régulière) |
| `jusqu_au_bout` | Jusqu'au Bout | evenement | Manuel admin (fin playoffs) |
| `le_sacre` | Le Sacre | evenement | Manuel admin (fin Finals) |

**Assets :** WebP 400×400px dans Supabase Storage bucket `badges`, nommage `badge_[slug].webp`.
**URL pattern :** `https://fcyhieueuskceooakyla.supabase.co/storage/v1/object/public/badges/badge_[slug].webp`
**`SUPABASE_URL`** exporté depuis `config.js` (import.meta.env.VITE_SUPABASE_URL).

**Badges manuels dans Admin :** filtrés par `famille === 'appartenance' || famille === 'evenement'`.
Badges `performance` = automatiques uniquement.

#### Pronostic fourchette d'écart — système complet ✅ (Sprint 3.6)

**Table `pronos_ecart`** — indépendante de `pronos` (stats/jalons non impactés).
**5 fourchettes :** Serré (1-5) / Modéré (6-10) / Net (11-20) / Large (21-30) / Domination (31+)
**Récompenses :** +2 pts classement ligue si correct / +5 XP à la pose / +30 XP si correcte
**Jalon :** 10 fourchettes correctes cumulatives → +200 XP + badge Tireur d'Élite
**Anti-doublon :** UNIQUE(user_id, match_id) en DB + vérification JS avant XP pose
**UI :** bloc BONUS ÉCART dans MatchDetail (après prono vainqueur posé), résultat après match
**Stats :** STATS GLOBALES + STATS LIGUES dans MesPronos, détail dans H2H

#### Anti-doublon XP — règles
- Vérification `pronoExistant` avant tout gain XP dans `faireProno()` — si prono existe déjà sur ce match, pas de XP
- Jalons vérifiés via `xp_log` (source_id) — impossible de déclencher deux fois
- Connexion quotidienne : index unique DB sur `(user_id, source_id, date_jour)` + vérification JS
- Fourchette posée : vérification existence ligne `pronos_ecart` avant +5 XP

#### Popup obtention badge (Accueil)
- Au chargement, diff entre `profils.badges` et `localStorage('swish_badges_vus_{userId}')`
- Nouveaux badges affichés un par un avec bouton "Suivant" ou "Super !"
- `localStorage` mis à jour immédiatement au chargement (pas au fermer)
- Pour forcer le popup sur son propre profil après attribution admin : `localStorage.removeItem('swish_badges_vus_{userId}')`

#### Edge Functions Supabase
Noté pour post-Sprint 4 — sécuriser l'attribution XP côté serveur pour éviter les manipulations.

#### Répartition des points
À revoir avant juillet 2026 (Summer League).
- Prono vainqueur correct : **1 pt**
- Fourchette d'écart correcte : **+2 pts** (bonus indépendant)
- Match parfait : **3 pts**

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

### DETTE-20 — `titrDepuisNiveau()` dupliqué
**Sévérité :** 🟢 Faible — défini dans `xp.js`, `MesPronos.jsx`, `Accueil.jsx`, `Briefing.jsx`. À centraliser dans `xp.js` et exporter.

---

## 13. Backlog

### Sprints 1, 2, 2.5, 3, 3.4, 3.5, 3.6 ✅ LIVRÉS

### Reste Sprint 3
```
⏳ MissionsBoard.jsx — bloc Board missions actives (catalogue missions à remplir d'abord)
⏳ Catalogue missions quotidiennes/hebdo — à rédiger et insérer en SQL
⏳ Onglet Missions dans Admin — création/activation/désactivation manuelle
⏳ Audit XP post-Finals — vérifier jalons, semaine_100_pct, prono_correct pour chaque user
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
- **Fichiers complets en download** à chaque livraison (jamais de partial sans download)
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- `XP_BASE` et `XP_COEFFICIENT` depuis `src/config.js` — jamais hardcoder
- `SUPABASE_URL` depuis `src/config.js` (import.meta.env.VITE_SUPABASE_URL)
- Tokens CSS : toujours utiliser les variables, jamais de valeurs brutes
- `TitreSection` défini localement dans chaque fichier
- Pas de `border-radius-lg` sur les blocs de contenu
- Séparateurs `<div style={{ height: 32 }} />` pour les espacements Board
- Commentaires JSX : toujours `{/* */}`, jamais `//` dans le JSX
- `detecterType()` : toute modification répercutée dans `espn.js`, `Admin.jsx`, `Calendrier.jsx`
- Timezone : toujours `Europe/Paris` pour les comparaisons de dates quotidiennes XP
- `pronos_ecart` : table indépendante — ne jamais inclure dans les stats/jalons `pronos`

---

## 15. RGPD & sécurité

- Clés Supabase : variables d'environnement (`.env`), jamais commitées
- `SUPABASE_URL` et `anon key` : OK dans le front (publiques par nature, protégées par RLS)
- `service_role key` : JAMAIS dans le code front
- Clé rss2json : dans le code front pour usage perso (acceptable)
- Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`
- Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France)
- `xp_log` : table immuable — pas d'UPDATE/DELETE autorisé via RLS
- Edge Functions Supabase : noté pour post-Sprint 4 (sécuriser XP côté serveur)

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
| `socle_nba_v3_7.md` | Référence technique unique | ✅ Ce document |
| `swish_league_roadmap_v2_0.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_1.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.7 — 2026-06-05*
*Remplace socle_nba_v3_6.md*
