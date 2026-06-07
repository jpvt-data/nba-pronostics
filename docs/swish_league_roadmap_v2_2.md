# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v2.2 — 2026-06-07 | Sprint 3.8 livré — Bugfixes & stabilisation

---

## 1. Situation actuelle

Swish League est une app mature, cohérente et enrichie. Elle couvre l'intégralité du calendrier NBA, dispose d'un système de progression RPG complet avec missions, et intègre un système de tracking comportemental avec dashboard Admin.

**Ce qui a été livré (Sprints 1→3.7) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H enrichi (fourchettes), ligues planifiées, MVP semaine
- Briefing ticker, Le Vestiaire, BanniereFeed, NewsNBA
- Board v3.3, Scanner ESPN, Admin 5 onglets
- Calendrier enrichi, MatchDetail enrichi, Explorer/Stats
- `detecterType()` centralisé

**Sprint 3.5 — Système RPG Progression ✅ LIVRÉ**
- DDL Supabase : `xp_log`, `missions`, `missions_utilisateurs`, `badges_catalogue`
- Service `xp.js` complet, toutes sources XP branchées, 14 badges, MesPronos enrichi

**Sprint 3.6 — Bonus Écart ✅ LIVRÉ**
- `pronos_ecart`, `ecart.js`, BONUS ÉCART dans MatchDetail, stats fourchette partout

**Sprint 3.7 — Missions + Tracking + Dashboard ✅ LIVRÉ**
- **Système missions complet** : 9 missions en base, `MissionsPopup.jsx`, modes `set`/`increment`, `calculerSerieConnexion()`, branché partout
- **Briefing enrichi** : missions complétées < 24h + missions proches (≥ 50%) dans le ticker
- **Tracking events** : table `events`, `tracker.js`, branché dans 11 pages/composants, `session_start` enrichi
- **Dashboard Admin** (5e onglet) : 8 blocs — vue d'ensemble, pages vues, profil users, actions clés, top users, rétention, XP par user, export CSV + purge

**Sprint 3.8 — Bugfixes & stabilisation ✅ LIVRÉ**
- Scores `score_domicile` / `score_exterieur` stockés dans `matchs` via `calculerPoints()`
- `semaine_100_pct` : attribution lundi heure Paris uniquement, semaine précédente
- Fourchette d'écart résolue immédiatement si match déjà terminé au moment de la pose
- `BandeMatchs` : flèches desktop navigation groupe par groupe, masquées mobile, centrage initial corrigé
- `Briefing` ticker : démarrage plein, boucle sans gap, libellés missions contextualisés

---

## 2. Positionnement & identité

**Tagline actuelle :** "Pronostique. Clashe. Règne."
**Tagline en validation :** "Pronostique. Performe. Règne."
→ Mise à jour en août : navbar, popup changelog, onboarding.

**Cible recrutement :** septembre 2026, pour préparer la présaison NBA (octobre).

---

## 3. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Ticker Briefing + BanniereFeed + BandeMatchs avec tags de phase. Connexion quotidienne récompensée en XP. **Missions hebdomadaires** comme moteur de rétention récurrent.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : roue quotidienne, collection de cartes.

### Pilier 3 — La progression visible
Streak ✅, RPG complet ✅, Bonus Écart ✅, **Missions ✅**. Prochaine étape : roue quotidienne + avatars.

---

## 4. Système RPG — état détaillé

### Philosophie
"Tu démarres tout nu. Tu finis armé." 100 niveaux, 7 titres, XP cumulatif à vie.

### Courbe
`XP_BASE = 300` / `XP_COEFFICIENT = 1.06` dans `config.js`

| Titre | Niveaux |
|---|---|
| Rookie | 1 → 10 |
| Sixième Homme | 11 → 20 |
| Starter | 21 → 30 |
| All-Star | 31 → 40 |
| MVP | 41 → 60 |
| Hall of Fame | 61 → 80 |
| GOAT | 81 → 100 |

### Badges (14 définis)
**Performance (auto)** : En Hibernation / En Feu / Champion / Marathonien / Analyste / Prophète / All-In / Tireur d'Élite
**Appartenance (manuel)** : Original Gangster
**Événements saisonniers (manuel)** : L'Échauffement / Été Brûlant / La Longue Marche / Jusqu'au Bout / Le Sacre

### Sources XP complètes

| Action | XP | Fréquence |
|---|---|---|
| Connexion quotidienne | +5 | 1×/jour |
| Prono posé | +10 | Par prono |
| Premier prono du jour | +10 | 1×/jour |
| Prono correct | +25 | Par prono validé |
| Semaine 100% pronostiquée | +50 | 1×/semaine |
| Premier prono de l'histoire | +75 | 1× à vie |
| Fourchette d'écart posée | +5 | 1× par match |
| Fourchette d'écart correcte | +30 | Par fourchette validée |

### Jalons

| Jalon | XP | Badge |
|---|---|---|
| 10 pronos posés | +50 | — |
| 50 pronos posés | +150 | All-In |
| 100 pronos posés | +300 | Marathonien |
| 5 corrects consécutifs | +100 | En Feu |
| 10 corrects consécutifs | +250 | Prophète |
| Win rate 65%+ sur 20 pronos | +200 | Analyste |
| Gagner une semaine de ligue | +150 | Champion |
| 5 ratés consécutifs | +0 | En Hibernation |
| 10 fourchettes correctes cumulatives | +200 | Tireur d'Élite |

### Missions ✅ OPÉRATIONNELLES

**Catalogue actuel (9 missions) :**

| Mission | Type | XP | Déclencheur |
|---|---|---|---|
| Régulier | permanente | 75 | 5 jours connexion consécutifs |
| Assidu | permanente | 200 | 10 jours connexion consécutifs |
| Indéboulonnable | permanente | 500 | 30 jours connexion consécutifs |
| En Rythme | permanente | 100 | 3 pronos corrects d'affilée |
| En Mission | permanente | 200 | 5 pronos corrects d'affilée |
| Précision | hebdomadaire | 75 | 3 fourchettes posées dans la semaine |
| Tireur d'élite | hebdomadaire | 150 | 2 fourchettes correctes dans la semaine |
| Présent | hebdomadaire | 40 | 5 jours connecté dans la semaine |
| Actif | hebdomadaire | 40 | 5 pronos posés dans la semaine |

Missions hebdomadaires resetent chaque lundi — moteur de rétention récurrent.
Missions permanentes = one-shot (une fois à vie).

### Points de classement ligue
- Prono vainqueur correct : **1 pt**
- Fourchette d'écart correcte : **+2 pts** (bonus indépendant)
- Match parfait : **3 pts**

---

## 5. Système Tracking ✅ OPÉRATIONNEL

### Architecture
- Table `events` Supabase (user_id, event_type, page, meta jsonb, cree_le)
- Service `tracker.js` — `track()` silencieuse, non-bloquante
- RLS : INSERT propre / SELECT admin uniquement

### Events trackés
`session_start` (enrichi) | `page_view` | `clic_prono` | `clic_fourchette` | `clic_nav` | `clic_vestiaire` | `clic_missions`

### Dashboard Admin — 8 blocs
1. Vue d'ensemble (KPIs)
2. Fréquentation par page
3. Profil users (distribution niveaux, moy pronos/badges)
4. Actions clés (clics prono, fourchette, vestiaire, missions)
5. Top users par sessions
6. Rétention (jours actifs / période)
7. XP par user (historique 100 entrées, labels lisibles)
8. Export CSV + purge manuelle avec confirmation

---

## 6. Roadmap — sprints

### Sprints 1→3.7 ✅ LIVRÉS

---

### Reste Sprint 3
```
⏳ Audit XP post-Finals — vérifier jalons manquants pour users existants
⏳ Onglet Missions dans Admin — création/activation/désactivation manuelle
```

---

### Avant juillet 2026 — URGENT (Summer League)

```
⏳ Répartition des points Summer League — confirmer ou ajuster (1 pt prono + 2 pts fourchette)
⏳ Tagline — valider "Performe" et mettre à jour partout
⏳ Cotations matchs — ESPN data.odds déjà disponible dans summary + explorer Odds API pour cotes FR (Unibet, Winamax) — post-Sprint 4, note légale ANJ
```

---

### Sprint 4 — GAMIFICATION & IDENTITÉ

```
Roue quotidienne
  1 tour/jour. Récompenses : XP bonus / rien / fragment de carte.
  Complète (ne remplace pas) le +5 XP connexion.
  Point d'entrée off-season. Missions dédiées à brancher après implémentation.

Profil fan (equipe_favorite_id + joueur_favori_id dans profils)
Filtrage pronos saison régulière
  1230 matchs/saison = invivable sans filtre.
  Pistes à concevoir : équipe favorite, conférence, top matchs ESPN, sélection manuelle.

Avatar personnalisable
  SVG layers. Maillots 30 équipes, cadres par niveau. Tout gagné, rien acheté.

Collection de cartes joueurs
  Catalogue ~200 cartes. 5 raretés : Common / Rare / Epic / Legendary / Ultimate.
  Tirage quotidien. Page /ma-collection.

Edge Functions Supabase
  Sécuriser l'attribution XP côté serveur.

Titres saisonniers
  Graver le titre en fin de saison NBA dans profils.
```

---

### Août 2026 — avant recrutement septembre

```
Onboarding carousel 5 slides :
  1. Pitch
  2. Les pronos (Board + BandeMatchs)
  3. Le classement
  4. Explorer
  5. Premier prono posé = onboarding terminé
  Déclenchement : onboarding_done boolean dans profils.

Partage de pick :
  Canvas API, format Story Instagram.

Tagline :
  Valider "Pronostique. Performe. Règne." et mettre à jour partout.

Colonne tag dans matchs → classements par phase (DETTE-19)
```

---

## 7. Features post-Sprint 4 (notées, non planifiées)

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail |
| Enrichissement MatchDetail | Cotes bookmakers ESPN |
| Bracket Summer League dynamique | Depuis headlines |
| Classements par phase | Nécessite colonne `tag` dans `matchs` |
| Draft Night | Nouveau type de prono, chantier à part |
| Jalons visuels niveaux | Tous les 5 niveaux (plateau MVP) |
| XP social | +XP sur réaction Vestiaire |
| Dashboard tracking enrichi | Cohortes, funnel, taux conversion après recrutement |

---

## 8. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Impossible au basket — remplacé par fourchette d'écart ✅ |
| Paris d'argent réel | Régulation ANJ |
| Marketplace de cartes | Économie spéculative |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | iOS limité |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |
| Leaderboard global séparé | Inutile à l'échelle actuelle |
| Pronos tous matchs saison régulière | 1230 matchs/saison — filtrage obligatoire |
| Standings NBA Cup / Summer League dédiés | ESPN ne les expose pas |
| Fourchette d'écart sur le Board | Surchargerait le visuel |

---

## 9. Off-season — stratégie rétention (juin → septembre)

- **Summer League** (juillet-août) : pronos via endpoint `nba-summer-las-vegas`
- **Missions hebdomadaires** : reset lundi, incentive récurrent même sans match NBA
- **Roue quotidienne** (Sprint 4) : point d'entrée quotidien off-season
- **Le Vestiaire** : discussions off-season, rumeurs transferts, draft
- **Mode Off-Season assumé** : compte à rebours "Retour dans X jours" sur le Board

---

## 10. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Scanner Admin détecte les anomalies |
| rss2json.com indisponibilité | 🟢 Faible | Composants se masquent silencieusement |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, purge events |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération Admin |
| Missions trop répétitives | 🟡 Moyenne | Renouveler le catalogue chaque saison |
| XP manipulation côté client | 🟡 Moyenne | RLS + Edge Functions post-Sprint 4 |
| Volume table events | 🟢 Faible court terme | Purge manuelle via Admin |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création |
| v1.1 | 2026-05-29 | Sprint 4 : niveaux XP, cartes, avatar |
| v1.2 | 2026-05-30 | Sprint 1 livré |
| v1.3 | 2026-06-02 | Sprint 2 livré. Refonte charte v3.0 |
| v1.4 | 2026-06-02 | Sprint 3 partiellement livré |
| v1.5 | 2026-06-03 | Sprint 3 quasi complet |
| v1.6 | 2026-06-04 | Board v3.3 |
| v1.7 | 2026-06-04 | Sprint 3.4 : Scanner ESPN, Admin, Calendrier, MatchDetail |
| v1.8 | 2026-06-04 | Conception RPG Progression v2.0 validée |
| v1.9 | 2026-06-05 | Sprint 3.5 livré : RPG complet |
| v2.0 | 2026-06-05 | Sprint 3.6 livré : Bonus Écart complet |
| v2.1 | 2026-06-07 | Sprint 3.7 livré : Missions + Tracking + Dashboard Admin |
| v2.2 | 2026-06-07 | Sprint 3.8 livré : Bugfixes & stabilisation — nouveaux chantiers identifiés |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v3_8.md (référence technique)*
*Prochaine révision : après roue quotidienne livrée ou conception filtrage pronos saison régulière*
