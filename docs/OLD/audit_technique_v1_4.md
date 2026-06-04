# AUDIT TECHNIQUE — SWISH LEAGUE v1.4
> Mis à jour le 2026-05-28 | Phases 0, 1, 2, 3, 4 (partielle) terminées

---

## SOMMAIRE

1. [Bugs confirmés](#1-bugs-confirmés)
2. [Risques silencieux](#2-risques-silencieux)
3. [Dette technique & architecture](#3-dette-technique--architecture)
4. [Endpoints ESPN — statuts CORS](#4-endpoints-espn--statuts-cors)
5. [Plan d'action priorisé](#5-plan-daction-priorisé)
6. [Règles de mise à jour de ce document](#6-règles-de-mise-à-jour-de-ce-document)

---

## 1. Bugs confirmés

### ✅ BUG-01 — `recupererGagnant` utilisait la mauvaise base URL
Corrigé le 2026-05-27 — `BASE_WEB` dans `recupererGagnant` (`espn.js`).

### ✅ BUG-02 — Variables CSS `--success-dim` et `--danger-dim` absentes
Corrigé avant session 2026-05-27 — présentes dans `index.css`.

### ✅ BUG-03 — `TYPE_SAISON` contenait le type 4 (NBA Cup)
Corrigé le 2026-05-27 — type 4 supprimé, type 5 ajouté (`espn.js`).

### ✅ BUG-04 — `BandeMatchs` chargeait tous les pronos sans filtre
Corrigé le 2026-05-27 — filtre côté client sur les `espn_id` des matchs affichés.

### ✅ BUG-05 — Forme récente basée sur `cree_le` du prono, pas sur la date du match
Corrigé le 2026-05-27 — tri par `date_match` décroissant (`MesPronos.jsx`).

### ✅ BUG-06 — Classement standings ESPN trié par index tableau au lieu de playoffSeed
Corrigé le 2026-05-28 — tri explicite par `playoffSeed` ESPN (`Stats.jsx`).

### ✅ BUG-07 — Stats joueur affichaient la première saison au lieu de 2026
Corrigé le 2026-05-28 — filtre `statistics.find(s => s.season?.year === 2026)` (`Stats.jsx`).

### ✅ BUG-08 — SeriesPlayoffs ne respectait pas le mode No Spoil
Corrigé le 2026-05-28 — import `useNoSpoil` + masquage scores et summaries (`SeriesPlayoffs.jsx`).

### ✅ BUG-09 — Predictor ESPN : mauvaise structure de réponse parsée
Corrigé le 2026-05-28 — `gameProjection` est dans `statistics[]`, pas directement sur `homeTeam`/`awayTeam` (`MatchDetail.jsx`).

### ✅ BUG-10 — Bracket playoffs : ESPN retourne données vides avec `seasontype=3` sur plage historique
Corrigé le 2026-05-28 — suppression de `seasontype=3` sur les fetches scoreboard du bracket, filtre sur `type.id` dans ['14','15','16','17'] (`BracketPlayoffs.jsx`).

### ✅ BUG-11 — Bracket playoffs : séries 1er tour terminées tôt absentes
Corrigé le 2026-05-28 — fetch par plages de 7 jours (au lieu de mois entiers) sur avril-juin (`BracketPlayoffs.jsx`).

---

## 2. Risques silencieux

### ✅ RISQUE-01 — N+1 ESPN dans `calculerPoints`
Corrigé le 2026-05-27 — déduplication des `espn_id` + `Promise.all` (`points.js`).

### RISQUE-02 — `calculerPoints` déclenché sans verrou → race condition
**Sévérité :** 🟡 Moyenne
Toujours actif. Solution long terme : Edge Function Supabase (mis de côté — voir backlog).

### ✅ RISQUE-03 — Profil chargé à chaque montage de `Navigation`
Corrigé le 2026-05-27 — `ProfilContext` charge le profil une fois à l'init de session.

### ✅ RISQUE-04 — Erreurs Supabase avalées silencieusement dans `points.js`
Corrigé le 2026-05-27 — logs d'erreur sur toutes les updates.

### ✅ RISQUE-05 — ADMIN_ID exposé côté client sans protection BDD
Corrigé le 2026-05-28 — RLS INSERT sur `groupes` restreinte à l'UUID admin en BDD.

### ✅ RISQUE-06 — Stats classement globales, pas par ligue
Corrigé le 2026-05-28 — stats filtrées par groupe_id dans `Classement.jsx`.

### RISQUE-07 — Limite Vercel Hobby ~100 déploiements/jour
**Sévérité :** 🟢 Faible
Constaté le 2026-05-28. Ne pas pusher trop souvent en session intensive. Reset à minuit UTC.

---

## 3. Dette technique & architecture

### ✅ DETTE-01 — Composants UI dupliqués dans 6+ fichiers
Corrigé le 2026-05-28 — `LabelSection`, `BanniereImage`, `Bloc` extraits dans `src/components/UI.jsx`.

### ✅ DETTE-02 — `recupererLiguesCibles` dupliquée
Corrigé le 2026-05-27 — extraite dans `src/services/ligues.js`.

### ✅ DETTE-03 — `Avatar` dans `Profil.jsx` importé par 3+ composants
Corrigé le 2026-05-27 — `Avatar` et `couleurAvatar` dans `src/components/Avatar.jsx`.

### ✅ DETTE-04 — Pas de timeout sur les fetch ESPN
Corrigé le 2026-05-27 — `fetchAvecTimeout` (AbortController, 8s) sur tous les appels ESPN.

### ✅ DETTE-05 — Fetch ESPN séquentiels dans `recupererMatchs3Jours`
Corrigé le 2026-05-27 — `Promise.allSettled` sur les 3 dates.

### ✅ DETTE-06 — Filtre "NBA Cup" dans `Calendrier.jsx` et `CreerGroupe.jsx`
Corrigé le 2026-05-28 — supprimé des deux fichiers.

### ✅ DETTE-07 — RLS Supabase sur `groupes` non vérifiées
Corrigé le 2026-05-28 — audit RLS complet, policy INSERT groupes corrigée.

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN à chaque ouverture fiche équipe
**Sévérité :** 🟢 Faible (acceptable, parallèle). Pas de cache entre sessions.

### DETTE-09 — BracketPlayoffs : saison passée en dur (`saison={2026}`) dans Accueil.jsx
**Sévérité :** 🟢 Faible. À mettre à jour manuellement chaque saison. Alternative : déduire depuis matchs[0].saisonNum.

### DETTE-10 — BracketPlayoffs non intégré dans Stats.jsx
**Sévérité :** 🟢 Faible. Composant prêt, intégration dans l'onglet Classements de Stats.jsx à faire.

---

## 4. Endpoints ESPN — statuts CORS validés terrain (2026-05-28)

| Domaine | Statut | Validé terrain |
|---|---|---|
| `site.api.espn.com` | ✅ CORS OK | Oui |
| `site.web.api.espn.com` | ✅ CORS OK | Oui |
| `sports.core.api.espn.com` | ✅ CORS OK | Oui — 2026-05-28 |
| `site.api.espn.com/leaders` | 🔴 CORS bloqué | Oui — proxy requis |
| `site.api.espn.com/athletes/{id}` | 🔴 CORS bloqué (404) | Oui — 2026-05-28 |
| `site.api.espn.com/teams?limit=30` | 🔴 CORS bloqué | Oui — 2026-05-28 |

### Endpoints actuellement utilisés
- Scoreboard : `site.api.espn.com/.../scoreboard?dates=YYYYMMDD`
- Summary : `site.web.api.espn.com/.../summary?event={id}`
- Standings : `site.api.espn.com/apis/v2/.../standings?season=2026&seasontype=2`
- News : `site.api.espn.com/.../news?limit=5`
- Roster : `site.api.espn.com/.../teams/{id}/roster`
- Injuries : `site.api.espn.com/.../teams/{id}/injuries`
- Stats joueur : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/stats?season=2026&seasontype=2`
- Predictor : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/predictor`
- Bracket playoffs : `site.api.espn.com/.../scoreboard?dates={plage7j}` (SANS seasontype)

### Endpoints validés CORS, non encore exploités
- Play-by-play : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/plays`
- Cotes bookmakers : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/odds`
- Game log joueur : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/gamelog`
- Splits joueur : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/splits`

### Endpoints confirmés non fonctionnels NBA
- `probabilities` : ❌ ESPN ne supporte pas win probability pour le basket NBA

---

## 5. Plan d'action priorisé

### ✅ PHASE 0 — Corrections silencieuses — TERMINÉE (2026-05-27)
### ✅ PHASE 1 — Refactos légères — TERMINÉE (2026-05-27)
### ✅ PHASE 2 — Nouvelles données ESPN — TERMINÉE (2026-05-28)
### ✅ PHASE 3 — Refactos structurelles — TERMINÉE (2026-05-28)

---

### ✅ PHASE 4 — Sprint 2 (partiellement terminée)

| # | Action | Statut | Notes |
|---|---|---|---|
| 4.1 | Audit et correction RLS Supabase sur `groupes` | ✅ TERMINÉ 2026-05-28 | INSERT restreint à l'UUID admin en BDD |
| 4.2 | Page Stats/Explorer — classements, fiches équipes, fiches joueurs | ✅ TERMINÉ 2026-05-28 | Route `/stats`, 3 onglets complets |
| 4.3 | Entrée menu hamburger + nav → page Stats/Explorer | ✅ TERMINÉ 2026-05-28 | Desktop + mobile + hamburger |
| 4.4 | StandingsNBA Board : TOP 5 + lien "voir tout" → Stats/Explorer | ✅ TERMINÉ 2026-05-28 | `useNavigate` vers `/stats` |
| 4.5 | Prédiction ESPN (predictor) dans MatchDetail | ✅ TERMINÉ 2026-05-28 | Barre % + verdict. `probabilities` non supporté NBA |
| 4.6 | Sélecteur de saison dans Calendrier | ⏸️ MIS DE CÔTÉ | Nice to have, navigation manuelle suffisante |
| 4.7 | Edge Function Supabase — calcul points serveur + verrou prono | ⏸️ MIS DE CÔTÉ | À faire si industrialisation |
| 4.8 | Bonus score exact + bonus série | ⏸️ MIS DE CÔTÉ | Dépend de 4.7 |
| 4.9 | IA Gemini — suggestions pronos, résumés matchs | ⏸️ MIS DE CÔTÉ | Phase 2 |
| 4.10 | News FR via RSS + proxy Edge Function | ⏸️ MIS DE CÔTÉ | Dépend de 4.7 |
| 4.11 | No Spoil SeriesPlayoffs | ✅ TERMINÉ 2026-05-28 | Scores masqués, badge No Spoil |
| 4.12 | Bracket playoffs visuel (BracketPlayoffs.jsx) | ✅ TERMINÉ 2026-05-28 | Composant autonome, Board + Stats |

---

### PHASE 5 — Backlog restant

| # | Action | Priorité | Notes |
|---|---|---|---|
| 5.1 | Intégration BracketPlayoffs dans Stats.jsx | 🟡 Moyenne | Composant prêt, à brancher |
| 5.2 | Game log joueur dans fiche joueur | 🟡 Moyenne | Endpoint validé CORS |
| 5.3 | Splits joueur dans fiche joueur | 🟡 Moyenne | Endpoint validé CORS |
| 5.4 | Historique carrière joueur | 🟢 Basse | |
| 5.5 | Edge Function Supabase (si industrialisation) | 🟢 Basse | Corrige RISQUE-02 |

---

## 6. Règles de mise à jour de ce document

- **À chaque correction de bug :** marquer la ligne avec ✅ et la date.
- **À chaque validation d'endpoint ESPN :** mettre à jour le statut CORS section 4.
- **À chaque sprint terminé :** archiver les phases terminées, incrémenter la version du doc.
- **Ce document ne remplace pas `socle_nba_v1.1.md`** — le socle reste la référence technique.

---

*Document v1.4 — 2026-05-28*
*Phases 0, 1, 2, 3, 4 (partielle) terminées. Phase 5 en cours de définition.*
