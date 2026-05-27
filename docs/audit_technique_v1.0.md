# AUDIT TECHNIQUE — SWISH LEAGUE v1.0
> Généré le 2026-05-27 | Basé sur socle v0.7 + analyse complète de tous les fichiers sources

---

## SOMMAIRE

1. [Bugs confirmés](#1-bugs-confirmés)
2. [Risques silencieux](#2-risques-silencieux)
3. [Dette technique & architecture](#3-dette-technique--architecture)
4. [Endpoints ESPN disponibles & non exploités](#4-endpoints-espn-disponibles--non-exploités)
5. [Plan d'action priorisé](#5-plan-daction-priorisé)
6. [Règles de mise à jour de ce document](#6-règles-de-mise-à-jour-de-ce-document)

---

## 1. Bugs confirmés

Bugs avérés — à corriger sans attendre car ils peuvent causer des comportements silencieux ou incorrects.

---

### BUG-01 — `recupererGagnant` utilise la mauvaise base URL
**Fichier :** `src/services/espn.js` — fonction `recupererGagnant`  
**Sévérité :** 🔴 Haute

**Problème :**
```js
// ACTUEL — mauvais domaine pour le summary NBA
const res = await fetch(`${BASE_URL}/summary?event=${espnId}`)
// BASE_URL = site.api.espn.com → retourne probablement une erreur ou des données incomplètes
```

Le summary NBA doit être appelé sur `BASE_WEB` (`site.web.api.espn.com`), exactement comme dans `recupererDetailMatch`. Sur `site.api.espn.com`, l'endpoint summary peut retourner une structure différente ou incomplète, ce qui fait que `recupererGagnant` peut renvoyer `null` silencieusement et ne jamais valider les pronos.

**Correction :**
```js
// CORRIGÉ — ligne ~80 de espn.js, dans recupererGagnant
const res = await fetch(`${BASE_WEB}/summary?event=${espnId}`)
```

---

### BUG-02 — Variables CSS `--success-dim` et `--danger-dim` absentes de `index.css`
**Fichier :** `src/index.css` + `src/pages/MesPronos.jsx`  
**Sévérité :** 🔴 Haute

**Problème :**
`MesPronos.jsx` utilise `var(--success-dim)` et `var(--danger-dim)` pour les fonds des lignes de l'historique, mais ces variables ne sont pas déclarées dans `index.css`. Le navigateur les résout en blanc transparent, ce qui casse silencieusement les couleurs de fond des pronos corrects/ratés.

**Vérification :** Les variables `--success` et `--danger` existent, mais pas leurs variantes `-dim`.

**Correction :** Ajouter dans `index.css`, bloc `:root`, après `--danger: #ef4444` :
```css
--success-dim: rgba(34, 197, 94, 0.10);
--danger-dim:  rgba(239, 68, 68, 0.10);
```

> Note : Ces valeurs sont déjà utilisées en dur dans d'autres fichiers (ex. `BandeMatchs.jsx`). La centralisation dans `:root` est la bonne pratique.

---

### BUG-03 — `TYPE_SAISON` contient le type 4 (NBA Cup) qui ne doit pas exister
**Fichier :** `src/services/espn.js` — ligne 3  
**Sévérité :** 🟡 Moyenne

**Problème :**
```js
const TYPE_SAISON = { 1: 'Pré-saison', 2: 'Saison régulière', 3: 'Playoffs', 4: 'NBA Cup' }
```
Le socle v0.7 acte explicitement que le type 4 est inutilisable (ESPN code les matchs NBA Cup en type 2). Garder ce mapping peut polluer l'affichage si ESPN retourne occasionnellement un type 4 inattendu.

**Correction :** Supprimer l'entrée `4` :
```js
const TYPE_SAISON = { 1: 'Pré-saison', 2: 'Saison régulière', 3: 'Playoffs', 5: 'International' }
```
> Ajout du type 5 (International) qui est documenté dans le socle mais absent du mapping.

---

### BUG-04 — `BandeMatchs` charge tous les pronos sans filtre
**Fichier :** `src/components/BandeMatchs.jsx` — `useEffect` chargement pronos  
**Sévérité :** 🟡 Moyenne

**Problème :**
```js
const { data } = await supabase
  .from('pronos')
  .select('equipe_choisie, matchs(espn_id)')
  .eq('user_id', userId)
// Aucun filtre de date → charge TOUS les pronos de l'user
```
Si l'user a 200+ pronos sur la saison, cette query charge 200 lignes pour afficher 10 cartes de match. Impact perf croissant au fil de la saison.

**Correction :** Filtrer sur les `espn_id` des matchs actuellement affichés :
```js
// Récupérer uniquement les pronos des matchs affichés
const espnIds = matchs.map(m => m.espn_id)
const { data } = await supabase
  .from('pronos')
  .select('equipe_choisie, matchs(espn_id)')
  .eq('user_id', userId)
  .in('matchs.espn_id', espnIds) // filtre sur les matchs visibles
```
> Alternative plus simple : filtrer côté client après la query en ne gardant que les espn_id présents dans `matchs`.

---

### BUG-05 — Forme récente basée sur `cree_le` du prono, pas sur la date du match
**Fichier :** `src/pages/MesPronos.jsx`  
**Sévérité :** 🟡 Moyenne

**Problème :**
La forme récente (5 derniers W/L) est calculée sur les pronos triés par `cree_le` (date de création du prono), pas par date du match. Si un user a pronostiqué un match J+3 avant un match J+1, l'ordre de la forme peut être incorrect.

**Correction :** Trier `termines` par `m.matchs.date_match` décroissant avant de prendre les 5 premiers :
```js
const termines = data?.filter(p => p.resultat !== 'en_attente')
  .sort((a, b) => new Date(b.matchs?.date_match) - new Date(a.matchs?.date_match)) || []
```

---

## 2. Risques silencieux

Pas des bugs actifs, mais des bombes à retardement selon la croissance de l'app.

---

### RISQUE-01 — N+1 ESPN dans `calculerPoints`
**Fichier :** `src/services/points.js`  
**Sévérité :** 🔴 Haute (critique à l'échelle)

**Problème :**
Pour chaque prono `en_attente`, la fonction fait un appel ESPN individuel à `recupererGagnant`. Si un user a 30 pronos en attente (possible en fin de saison), ça génère 30 appels ESPN séquentiels au chargement du Board — lenteur visible + risque de rate-limiting ESPN.

```js
for (const prono of pronosEnAttente) {
  const resultatESPN = await recupererGagnant(match.espn_id) // appel individuel !
}
```

**Solution court terme :** Dédupliquer les `espn_id` avant les appels, puis regrouper les résultats :
```js
// Extraire les espn_id uniques des matchs à vérifier
const matchsUniques = [...new Map(
  pronosEnAttente.map(p => [p.matchs.espn_id, p.matchs])
).values()]

// Appels en parallèle (mais prudent avec ESPN — max 5 simultanés)
const resultats = await Promise.all(
  matchsUniques.map(m => recupererGagnant(m.espn_id))
)
```

**Solution long terme :** Edge Function Supabase (déjà au backlog Sprint 2).

---

### RISQUE-02 — `calculerPoints` déclenché sans verrou → race condition
**Fichier :** `src/services/points.js` + `src/pages/Accueil.jsx`  
**Sévérité :** 🟡 Moyenne

**Problème :**
Si l'user ouvre le Board dans 2 onglets simultanément, `calculerPoints` tourne deux fois en parallèle sur les mêmes pronos `en_attente`. Chaque instance peut lire le même prono "en_attente", le valider, et doubler les points dans `membres_groupe`.

**Solution court terme :** Ajouter un flag en `localStorage` pour éviter les doubles déclenchements dans la même session :
```js
// Dans Accueil.jsx, avant calculerPoints
const calcEnCours = localStorage.getItem('calc_points_en_cours')
if (!calcEnCours) {
  localStorage.setItem('calc_points_en_cours', '1')
  await calculerPoints(user.id).catch(() => {})
  localStorage.removeItem('calc_points_en_cours')
}
```

**Solution long terme :** Déplacer le calcul côté serveur (Edge Function).

---

### RISQUE-03 — Profil chargé à chaque montage de `Navigation`
**Fichier :** `src/components/Navigation.jsx`  
**Sévérité :** 🟡 Moyenne

**Problème :**
`Navigation` est monté sur toutes les pages privées. À chaque navigation (Board → Classement → Profil → Board…), le composant se remonte et déclenche un `supabase.from('profils').select(...)`. Sur une session de 20 min avec 15 navigations, ça fait 15 requêtes Supabase inutiles.

**Solution :** Créer un `ProfilContext` (similaire à `NoSpoilContext`) qui charge le profil une seule fois à l'init de session et l'expose partout.

---

### RISQUE-04 — Erreurs Supabase avalées silencieusement dans `points.js`
**Fichier :** `src/services/points.js`  
**Sévérité :** 🟡 Moyenne

**Problème :**
Aucun des `await supabase.from(...).update(...)` ne vérifie `.error`. Si une update échoue (RLS, timeout, pause Supabase), le prono reste `en_attente` indéfiniment sans que l'user ou le dev le sache.

**Correction :** Pattern minimal à appliquer :
```js
const { error } = await supabase.from('pronos').update({...}).eq('id', prono.id)
if (error) console.error('Erreur update prono', prono.id, error.message)
```

---

### RISQUE-05 — ADMIN_ID exposé côté client
**Fichier :** `src/pages/Groupes.jsx` — ligne 3  
**Sévérité :** 🟡 Moyenne (acceptable en proto, bloquant en prod)

**Problème :**
```js
const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'
```
Visible dans le bundle JS livré au navigateur. N'importe qui peut lire cet UUID et simuler l'interface admin s'il contourne la logique côté client. Les RLS Supabase sur la table `groupes` doivent être la vraie protection.

**À vérifier immédiatement :** Les policies RLS sur `groupes` autorisent-elles `INSERT` et `UPDATE` uniquement à cet `user_id` ? Si oui, le risque est limité à l'interface (l'attaquant voit les boutons mais ne peut pas écrire en BDD). Si non, c'est une faille réelle.

**Solution long terme :** Rôle `admin` en BDD ou claim JWT custom Supabase.

---

### RISQUE-06 — Stats classement globales, pas par ligue
**Fichier :** `src/pages/Classement.jsx`  
**Sévérité :** 🟡 Moyenne

**Problème :**
Le taux de réussite et les compteurs corrects/ratés affichés dans le classement sont calculés sur **tous** les pronos de l'user, toutes ligues confondues. Un user inscrit en ligue Playoffs aura ses pronos de saison régulière comptés dans son taux — trompeur.

**Solution :** Filtrer les pronos par `groupe_id` correspondant à la ligue affichée lors du calcul des stats.

---

## 3. Dette technique & architecture

Problèmes d'organisation du code — l'app fonctionne, mais la maintenabilité se dégrade.

---

### DETTE-01 — Composants UI dupliqués dans 6+ fichiers
**Fichiers concernés :** `Accueil.jsx`, `Classement.jsx`, `Groupes.jsx`, `MesPronos.jsx`, `Profil.jsx`, `Calendrier.jsx`

`LabelSection`, `BanniereImage` et l'objet de style `BLOC` sont recopiés dans chaque page. Toute modification de charte (couleur, radius, font-size) doit être faite 6 fois.

**Solution :** Créer `src/components/UI.jsx` :
```jsx
export const LabelSection = ({ children }) => (...)
export const BanniereImage = ({ url, hauteur = 110 }) => (...)
export const BLOC_STYLE = { /* l'objet style */ }
export const Bloc = ({ children, style }) => (
  <div style={{ ...BLOC_STYLE, ...style }}>{children}</div>
)
```

---

### DETTE-02 — `recupererLiguesCibles` dupliquée
**Fichiers :** `src/pages/Accueil.jsx` + `src/pages/MatchDetail.jsx`

Fonction identique dans les deux fichiers. Si la logique de filtrage des ligues change (ex. nouveau type de saison), elle devra être modifiée aux deux endroits — et on oubliera forcément l'un.

**Solution :** Extraire dans `src/services/ligues.js` et importer dans les deux pages.

---

### DETTE-03 — `Avatar` dans `Profil.jsx` importé par 3+ composants
**Fichiers :** `Classement.jsx`, `MesPronos.jsx`, `Navigation.jsx` importent `Avatar` depuis `../pages/Profil`

Une page qui exporte un composant utilisé par d'autres pages, c'est un couplage anormal. Si `Profil.jsx` est refactorisé, tous les imports cassent.

**Solution :** Déplacer `Avatar` et `couleurAvatar` dans `src/components/Avatar.jsx`.

---

### DETTE-04 — Pas de timeout sur les fetch ESPN
**Fichier :** `src/services/espn.js` — toutes les fonctions

Si ESPN est lent (ce qui arrive), les fetch attendent indéfiniment. L'app freeze sans message à l'user.

**Solution :** Wrapper avec `AbortController` + timeout 8s :
```js
const fetchAvecTimeout = (url, ms = 8000) => {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id))
}
```

---

### DETTE-05 — Fetch ESPN séquentiels dans `recupererMatchs3Jours`
**Fichier :** `src/services/espn.js`

3 fetch ESPN lancés l'un après l'autre → temps de chargement = somme des 3 latences (~1.5s chacun = ~4.5s total). Sans raison technique valable.

**Solution :**
```js
const dates = [0, 1, 2].map(i => {
  const d = new Date(); d.setDate(d.getDate() + i); return formaterDate(d)
})
const resultats = await Promise.all(
  dates.map(d => fetch(`${BASE_URL}/scoreboard?dates=${d}`).then(r => r.json()))
)
```

---

### DETTE-06 — Bannière Accueil avec URL hors design system
**Fichier :** `src/pages/Accueil.jsx`

La bannière de la section "Ligue en cours / Pronos en attente" utilise :
```
https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=60
```
Cette URL n'est pas dans la liste officielle des bannières du design system (`socle_nba_v0.7.md`). Risque de cohérence visuelle et de lien mort futur.

**Solution :** Remplacer par une des 5 URLs officielles du design system.

---

## 4. Endpoints ESPN disponibles & non exploités

Source : `github.com/pseudo-r/Public-ESPN-API` — doc mise à jour mars 2026.  
Tous les endpoints ci-dessous sont sans authentification. Statut CORS basé sur les domaines déjà validés terrain.

---

### GROUPE A — Données contextuelles NBA (aucun proxy requis)

| Endpoint | Données | CORS | Intégration possible |
|---|---|---|---|
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/standings` | Classement conférences Est/Ouest, bilan, série | ✅ | Page Accueil (bloc classement NBA) + future page Stats |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/news` | Articles actu NBA récents | ✅ | Bloc "Actu NBA" sur l'Accueil |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/teams` | 30 équipes, logos, couleurs, abbréviations | ✅ | Remplace la table `equipes` Supabase prévue au backlog |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}` | Détail équipe : effectif, bilan, calendrier | ✅ | Future fiche équipe |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries` | Blessés de l'équipe | ✅ | Fiche match (déjà via summary, mais disponible aussi ici) |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/schedule` | Calendrier d'une équipe | ✅ | Filtre calendrier par équipe enrichi |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/calendar` | Calendrier officiel saison (dates, semaines) | ✅ | Sélecteur de saison dans Calendrier (backlog Sprint 1) |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/transactions` | Trades, signatures, coupures | ✅ | Bloc "Mouvements" sur l'Accueil ou fiche équipe |

---

### GROUPE B — Stats joueurs (domaine déjà validé terrain)

Ces endpoints sont sur `site.web.api.espn.com` — même domaine que le summary déjà utilisé, donc CORS confirmé navigateur.

| Endpoint | Données | CORS | Intégration possible |
|---|---|---|---|
| `/apis/common/v3/sports/basketball/nba/athletes/{id}/stats` | Stats saison complètes d'un joueur | ✅ | Fiche joueur (Sprint 2) |
| `/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog` | Match par match sur la saison | ✅ | Fiche joueur détaillée |
| `/apis/common/v3/sports/basketball/nba/athletes/{id}/splits` | Stats domicile/extérieur/conférence | ✅ | Fiche joueur avancée |
| `/apis/common/v3/sports/basketball/nba/athletes/{id}/overview` | Snapshot joueur (stats, news, prochain match) | ✅ | Preview joueur au survol dans MatchDetail |
| `/apis/common/v3/sports/basketball/nba/statistics/byathlete` | Leaderboard stats avec `category=` + `sort=` | ✅ | Page leaders NBA |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/{id}` | Profil joueur : photo, équipe, position, âge | ✅ | Fiche joueur |
| `site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/{id}/gamelog` | Game log par saison | ✅ | Fiche joueur |

---

### GROUPE C — Données match enrichies (CORS à tester)

Ces endpoints sont sur `sports.core.api.espn.com` — domaine non encore utilisé, CORS à valider.

| Endpoint | Données | CORS | Intégration possible |
|---|---|---|---|
| `/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/probabilities` | Win probability au fil du match | ⚠️ à tester | MatchDetail enrichi (live) |
| `/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/plays` | Play-by-play complet | ⚠️ à tester | MatchDetail live |
| `/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor` | ESPN Game Predictor | ⚠️ à tester | MatchDetail (avant match) |
| `/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/odds` | Cotes des bookmakers | ⚠️ à tester | MatchDetail (contexte prono) |
| `/v2/sports/basketball/leagues/nba/seasons/{year}/powerindex` | BPI (Basketball Power Index) classement | ⚠️ à tester | Page Stats/Explorer |
| `/v2/sports/basketball/leagues/nba/leaders` | Leaders stats NBA (points, rebonds, passes…) | ⚠️ à tester (déjà bloqué via site.api — noter la différence de domaine) | Accueil + page Stats |

---

### GROUPE D — CDN temps réel (à tester)

| Endpoint | Données | CORS | Intégration possible |
|---|---|---|---|
| `cdn.espn.com/core/nba/game?xhr=1&gameId={id}` | Package complet match : plays, win prob, odds, boxscore | ⚠️ à tester | Remplacement ou enrichissement de la fiche match live |
| `cdn.espn.com/core/nba/scoreboard?xhr=1` | Scoreboard optimisé temps réel | ⚠️ à tester | Board en temps réel sans polling ESPN intensif |

---

### GROUPE E — News temps réel

| Endpoint | Données | CORS | Intégration possible |
|---|---|---|---|
| `now.core.api.espn.com/v1/sports/news?leagues=nba&limit=10` | Feed news NBA temps réel | ⚠️ à tester | Bloc actu Accueil (alternative au Groupe A news) |

---

## 5. Plan d'action priorisé

> ⚠️ **Principe directeur : l'app fonctionne, on ne casse rien.** Chaque action est isolée et indépendante. Priorité = impact / risque / effort.

---

### PHASE 0 — Corrections silencieuses (< 2h, zéro risque)
*Modifications ponctuelles qui n'affectent pas l'UX visible mais corrigent des bugs réels.*

| # | Action | Fichier | Effort |
|---|---|---|---|
| 0.1 | Corriger base URL dans `recupererGagnant` | `espn.js` | 1 ligne |
| 0.2 | Déclarer `--success-dim` et `--danger-dim` dans `:root` | `index.css` | 2 lignes |
| 0.3 | Supprimer type 4, ajouter type 5 dans `TYPE_SAISON` | `espn.js` | 1 ligne |
| 0.4 | Remplacer URL bannière hors design system dans Accueil | `Accueil.jsx` | 1 ligne |
| 0.5 | Ajouter logs d'erreur sur les updates Supabase dans `points.js` | `points.js` | 5 lignes |

---

### PHASE 1 — Refactos légères (< 1 jour, zéro impact UX)
*Nettoyage code sans toucher à la logique ni à l'affichage.*

| # | Action | Fichier(s) | Bénéfice |
|---|---|---|---|
| 1.1 | `Promise.all` dans `recupererMatchs3Jours` | `espn.js` | Chargement Board ~2x plus rapide |
| 1.2 | Filtre query pronos dans `BandeMatchs` | `BandeMatchs.jsx` | Moins de données chargées |
| 1.3 | Trier forme récente par `date_match` | `MesPronos.jsx` | Ordre chronologique correct |
| 1.4 | Extraire `recupererLiguesCibles` dans `services/ligues.js` | `Accueil.jsx`, `MatchDetail.jsx` | Fin de la duplication |
| 1.5 | Déplacer `Avatar` + `couleurAvatar` dans `components/Avatar.jsx` | `Profil.jsx` + imports | Couplage page-composant supprimé |
| 1.6 | Ajouter timeout 8s sur les fetch ESPN | `espn.js` | App ne freeze plus si ESPN lag |
| 1.7 | Dédupliquer les appels ESPN dans `calculerPoints` | `points.js` | Moins d'appels ESPN |

---

### PHASE 2 — Nouvelles données ESPN (< 2 jours, fonctionnalités additives)
*Ajout de blocs dans des pages existantes, sans toucher aux blocs existants.*

| # | Action | Données | Page cible |
|---|---|---|---|
| 2.1 | Standings NBA Est/Ouest | `standings` ESPN | Nouveau bloc Accueil ou bloc dans Classement |
| 2.2 | News NBA | `news` ESPN | Nouveau bloc Accueil (après BandeMatchs) |
| 2.3 | Table équipes ESPN | `teams` ESPN | Remplace backlog "table equipes Supabase" — données ESPN directes |
| 2.4 | Tester CORS `sports.core.api.espn.com` | `probabilities`, `predictor` | MatchDetail (enrichissement live) |

---

### PHASE 3 — Refactos structurelles (1-2 jours, amélioration maintenabilité)
*À faire quand tu as du temps calme — ne change pas l'UX mais allège le code.*

| # | Action | Bénéfice |
|---|---|---|
| 3.1 | Extraire `LabelSection`, `BanniereImage`, `Bloc` dans `components/UI.jsx` | Fin de la duplication dans 6 fichiers |
| 3.2 | Créer `ProfilContext` pour remplacer le fetch Navigation | N requêtes Supabase évitées |
| 3.3 | Corriger stats classement par ligue (pas globales) | Taux de réussite correct par ligue |
| 3.4 | Verrifier et documenter les RLS Supabase sur `groupes` | Sécurité ADMIN_ID |

---

### PHASE 4 — Sprint 2 (fonctionnalités majeures, planning à définir)

| # | Action | Prérequis |
|---|---|---|
| 4.1 | Edge Function Supabase — calcul points serveur | Phases 0+1 terminées |
| 4.2 | Fiche joueur (stats, gamelog, splits) | Groupe B endpoints validés |
| 4.3 | Page Stats/Explorer (leaders, classements NBA) | Groupe B + C validés |
| 4.4 | Proxy Supabase Edge pour endpoints CORS bloqués | Groupe C endpoints identifiés |
| 4.5 | IA Gemini — suggestions pronos | Phases 1-3 stables |

---

## 6. Règles de mise à jour de ce document

- **À chaque correction de bug :** marquer la ligne avec ✅ et la date.
- **À chaque validation d'endpoint ESPN :** mettre à jour le statut CORS dans la section 4.
- **À chaque sprint terminé :** archiver les phases terminées, incrémenter la version du doc.
- **Ce document ne remplace pas `socle_nba_v0.7.md`** — le socle reste la référence technique (stack, BDD, règles, backlog). Ce fichier est l'audit vivant.

---

*Document initialisé le 2026-05-27 — v1.0*  
*Prochaine révision prévue : après Phase 1 terminée*
