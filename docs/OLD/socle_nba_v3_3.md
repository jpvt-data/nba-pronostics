# SWISH LEAGUE — SOCLE v3.3
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
Hauteur : **52px** (était 40px). `padding-top` de `#root` mobile : **52px**.

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
Séparateurs `<div style={{ height: 32 }} />` entre chaque section principale. Ne pas compter sur les margins des composants enfants — ils s'annulent ou se cumulent imprévisiblement.

### Angles vifs — règle stricte
- Pas de `border-radius-lg` sur les blocs de contenu
- `border-radius-sm` (6px) uniquement sur boutons et inputs

### Couleurs sémantiques
- **--gold** : CLASSEMENT NBA (titre), points, médailles, streak, MVP
- **--accent** : éléments interactifs, TIMELINE, LIGUE EN COURS, ACTU NBA
- **--orange** : À LA UNE, BanniereFeed
- **--success** : prono correct
- **--danger** : prono raté, blessés, admin

---

## 4. Sources de données ESPN

### Endpoints actuellement utilisés

```
Scoreboard      : site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
Summary         : site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}
Standings       : site.api.espn.com/apis/v2/sports/basketball/nba/standings?season={SAISON_ESPN}&seasontype=2
Roster          : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster
Injuries        : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries
Stats joueur    : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats
Game log joueur : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog
Predictor       : sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor
```

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

### Tables à créer (Sprint 4)
- `xp_log` — historique XP par action
- Colonnes à ajouter dans `profils` : `xp_total`, `niveau`, `equipe_favorite_id`, `joueur_favori_id`
- Colonne à ajouter dans `profils` : `onboarding_done boolean default false` (à créer en août 2026)

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
    H2H.jsx
    QuoiDeNeuf.jsx
    Admin.jsx
  components/
    UI.jsx                  ← composants obsolètes, fichier conservé
    Navigation.jsx          ← navbar mobile 52px v3.3
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Focus.jsx               ← archivé, remplacé par Briefing.jsx
    Briefing.jsx            ← ticker horizontal v3.3
    BanniereFeed.jsx
    LeVestiaire.jsx
    CreerGroupe.jsx
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

### Board (Accueil) ✅ — v3.3
Ordre des blocs :

1. **Header** — "Bonjour JPVT" (Teko 36px, barre accent gauche)
2. **À LA UNE** (label orange 28px) + **BanniereFeed**
3. **TIMELINE** (label accent 28px) + **BandeMatchs**
4. **Ticker Briefing** — bandeau beige horizontal, défilement gauche→droite continu
5. **LIGUE EN COURS** (label accent 28px) + **ClassementRapide**
6. **LE VESTIAIRE** — streaks potes + chat ligues
7. **CLASSEMENT NBA** (label gold 24px) + StandingsNBA + BracketPlayoffs si playoffs
8. **ACTU NBA** (label accent 28px) + **NewsNBA**

Séparateurs `<div style={{ height: 32 }} />` entre chaque section.

### Briefing.jsx ✅ — v3.3 (ticker horizontal)
- Bandeau beige `#f0ede8`, hauteur 44px
- Défilement continu gauche→droite, animation CSS `linear infinite`
- Pause au hover (`animation-play-state: paused`)
- Messages séparés par `|`
- Croix dismiss sur messages dismissable
- Liste dupliquée 4× pour boucle seamless sans blanc
- Vitesse : `dureeTotal = 6s × nb_messages`
- Conditionné sur `!chargement && user` dans Accueil

### Navbar mobile ✅ — v3.3
- Hauteur 52px (était 40px)
- `padding-top` #root mobile : 52px

### CLASSEMENT NBA ✅ — v3.3
- Wrapper dans Accueil autour de StandingsNBA + BracketPlayoffs
- Titre CLASSEMENT en gold + NBA en blanc, fontSize 24
- Lien "complet →" vers /stats

---

## 10. Décisions produit

### Session 2026-06-04 — Sprint 3 suite (v3.3)

**Board — restructuration :**
- AVANT MATCH supprimé — remplacé par le ticker Briefing sans label
- Inversion TIMELINE / AVANT MATCH — ordre retenu : À LA UNE → TIMELINE → TICKER → LIGUE EN COURS
- Ticker Briefing positionné entre TIMELINE et LIGUE EN COURS
- Bloc CLASSEMENT NBA créé comme wrapper unifié de StandingsNBA + BracketPlayoffs

**Ticker Briefing :**
- Carousel vertical (crossfade) abandonné — trop brutal
- Ticker horizontal CSS `linear infinite` retenu — smooth, continu
- Défilement gauche→droite (texte entre par la gauche, sort par la droite)
- Pas de "Suivant →" — défilement auto uniquement
- Croix dismiss conservée

**Tagline :**
- "Clashe" jugé trop agressif — en cours de remplacement par "Performe"
- "Pronostique. Performe. Règne." en cours de validation

**Positionnement app :**
- Pas "entre potes" ni "clashe" — compétition amicale, passion commune, partage
- Recrutement septembre 2026, présaison NBA octobre

**Onboarding — reporté à août 2026 :**
- Format retenu : overlay carousel 5 slides
  1. Pitch app — "Pronostique chaque match NBA. Construis ton palmarès. Règne sur le classement."
  2. Les pronos (Board + BandeMatchs)
  3. Le classement
  4. Explorer
  5. Action — premier prono
- Navigation : points + "Suivant →" + skip
- Déclenchement : champ `onboarding_done boolean default false` dans `profils` (colonne à créer en août)
- Pas de step notifications (PWA, iOS limité, Web Push non configuré)

**Leaderboard global :**
- Non nécessaire — app fermée à quelques amis, tous dans les mêmes ligues
- `Classement.jsx` section "TOTAL" est déjà le leaderboard de facto
- À reconsidérer si l'app s'ouvre à plus d'utilisateurs

**Partage de pick :**
- Reporté à août 2026 avec l'onboarding
- Canvas API, format Story Instagram

### Features futures notées (post-Sprint 4)
- H2H historique équipes en saison régulière dans MatchDetail
- Enrichissement MatchDetail : cotes bookmakers ESPN
- Pronostic écart final : victoire serrée (<5 pts) ou large (>20 pts) → +2 pts bonus

---

## 11. Risques ouverts

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute

### RISQUE-B — ESPN API blocage CORS
**Sévérité :** 🟡 Moyenne

### RISQUE-F — rss2json.com indisponibilité
**Sévérité :** 🟢 Faible

---

## 12. Dette technique ouverte

### DETTE-15 — `UI.jsx` contient des composants obsolètes
**Sévérité :** 🟢 Faible

### DETTE-18 — Clé rss2json dans le code front
**Sévérité :** 🟢 Faible pour usage perso.

---

## 13. Backlog

### Sprints 1, 2, 2.5, 3 ✅ LIVRÉS

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
⏳ Onboarding carousel 5 slides (voir §10)
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Tagline — valider "Performe" et mettre à jour partout
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (équipe & joueur favoris)
Système de niveaux & XP (7 niveaux Rookie → GOAT)
Avatar personnalisable (SVG layers, maillots 30 équipes)
Collection de cartes joueurs (~200 cartes, 5 raretés)
Pronostic écart final (victoire <5 pts / >20 pts = +2 pts bonus)
```

### Post-Sprint 4
```
H2H historique équipes saison régulière dans MatchDetail
Enrichissement MatchDetail : cotes bookmakers ESPN
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
- Séparateurs `<div style={{ height: 32 }} />` pour les espacements Board — pas de margins sur composants enfants
- Commentaires JSX : toujours `{/* */}`, jamais `//` dans le JSX

---

## 15. RGPD & sécurité

Clés Supabase : variables d'environnement, jamais commitées.
Clé rss2json : dans le code front pour usage perso — à passer en variable d'env si app publique.
Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`.
Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France).

---

## 16. Veille technique

- ESPN API non officielle : surveiller changements de structure
- rss2json.com : surveiller quota (10k req/jour)
- Supabase : surveiller free tier + pause inactivité
- Vercel Hobby : usage non-commercial uniquement

---

## 17. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v3_3.md` | Référence technique | ✅ Ce document |
| `swish_league_roadmap_v1_6.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.3 — 2026-06-04*
*Remplace socle_nba_v3_2.md*
