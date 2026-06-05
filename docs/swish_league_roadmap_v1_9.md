# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.9 — 2026-06-05 | Sprint 3.5 livré — Système RPG Progression complet

---

## 1. Situation actuelle

Swish League est une app mature, cohérente et enrichie. Elle couvre l'intégralité du calendrier NBA et dispose maintenant d'un système de progression RPG complet côté back et front.

**Ce qui a été livré (Sprints 1, 2, 2.5, 3, 3.4, 3.5) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H, ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Briefing ticker horizontal, Le Vestiaire, badge nav pronos en attente
- Refonte charte complète, MatchDetail refondu, BanniereFeed, NewsNBA
- Board v3.3 : À LA UNE / TIMELINE / TICKER / LIGUE EN COURS / VESTIAIRE / CLASSEMENT NBA / ACTU NBA
- **Scanner ESPN** (Admin) : scan complet juillet→juin, Summer League, 8 types détectés, state persistant entre onglets
- **Admin 4 onglets** : Scanner ESPN / Ligues / Utilisateurs / Modération
- **Onglet Utilisateurs Admin** : select dropdown alphabétique, attribution/retrait badges manuels avec feedback
- **Calendrier enrichi** : filtres par phase, navigation auto au 1er match
- **MatchDetail enrichi** : badge headline ESPN, fallback Summer League, détection Finals fiable
- **Explorer / Stats** : classements par phase, stats joueur historiques
- **Groupes épuré** : gestion admin déplacée dans Admin
- **StandingsNBA dynamique** : seasontype adapté à la phase courante
- `detecterType()` : fonction centrale partagée, cohérente dans tout le projet

**Sprint 3.5 — Système RPG Progression ✅ LIVRÉ**
- DDL Supabase complet : `xp_log`, `missions`, `missions_utilisateurs`, `badges_catalogue` + colonnes `profils`
- Service `xp.js` : `niveauDepuisXP`, `xpPourNiveau`, `ajouterXP`, `verifierJalons`, `verifierMissions`
- Toutes les sources XP branchées : prono posé, prono correct, connexion quotidienne, premier prono du jour, semaine 100%, premier prono de l'histoire, jalons automatiques
- Anti-doublon XP partout : vérification prono existant + index unique DB pour connexion
- Fix timezone Paris : `date_jour` en heure de Paris, comparaison string-to-string
- **13 badges** définis dans `src/data/badges.js` (source de vérité)
- Assets badges : WebP 400×400px dans Supabase Storage bucket `badges`
- **MesPronos enrichi** : header fusionné XP/badges, barre progression, popup badge cliquable avec date d'obtention, modal info 3 onglets, historique XP (100 derniers gains)
- **Popup obtention badge** sur Accueil : nouveaux badges depuis dernière visite, un par un
- **Header Accueil enrichi** : KPIs (Total pronos + % réussite), titre RPG, barre XP courte, lien "Mes stats →"
- **Briefing enrichi** : jalons XP < 24h, badges récents, changements de niveau et de titre RPG

**L'app couvre maintenant l'intégralité du calendrier NBA et un système de progression gamifié complet.**

---

## 2. Positionnement & identité

**Tagline actuelle :** "Pronostique. Clashe. Règne."
**Tagline en validation :** "Pronostique. Performe. Règne."
→ Mise à jour à faire en août : navbar, popup changelog, onboarding.

**Cible recrutement :** septembre 2026, pour préparer la présaison NBA (octobre).

---

## 3. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Ticker Briefing + BanniereFeed + BandeMatchs avec tags de phase. L'utilisateur sait immédiatement où en est la saison dès l'ouverture. Connexion quotidienne récompensée en XP.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : missions, collection de cartes, roue quotidienne.

### Pilier 3 — La progression visible
Streak ✅, série cassée ✅, **Système RPG complet ✅** — niveaux, titres, badges, XP. Prochaine étape : missions actives sur le Board + avatars.

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

### Badges (13 définis)
**Performance (auto)** : En Hibernation / En Feu / Champion / Marathonien / Analyste / Prophète / All-In
**Appartenance (manuel)** : Original Gangster
**Événements saisonniers (manuel)** : L'Échauffement / Été Brûlant / La Longue Marche / Jusqu'au Bout / Le Sacre

Attribution manuelle via onglet Utilisateurs dans Admin. Anti-doublon SQL garanti.

### Missions
Tables créées, service `verifierMissions()` opérationnel. **Catalogue à remplir** — c'est le levier éditorial à activer avant le recrutement.

### Titres saisonniers
À implémenter en fin de saison NBA (gravés définitivement dans profils). Pas encore codé.

---

## 5. Roadmap — sprints

### Sprints 1, 2, 2.5, 3, 3.4, 3.5 ✅ LIVRÉS

---

### Reste Sprint 3 ⏳

```
⏳ MissionsBoard.jsx — bloc Board missions actives
⏳ Catalogue missions quotidiennes/hebdo — à rédiger et insérer en SQL
⏳ Onglet Missions dans Admin — création/activation/désactivation
⏳ Assets badges — upload WebP restants dans Supabase Storage
⏳ Audit XP post-Finals — vérifier cohérence pour chaque user
```

---

### Avant juillet 2026 — URGENT (Summer League)

```
Répartition des points — à revoir avant Summer League (juillet 2026)
  Actuellement : 1 point par prono correct
  Objectif : système plus nuancé à définir
```

---

### Août 2026 — avant recrutement septembre

```
Onboarding carousel 5 slides :
  1. Pitch — "Pronostique chaque match NBA. Construis ton palmarès. Règne."
  2. Les pronos (Board + BandeMatchs)
  3. Le classement
  4. Explorer
  5. Action — premier prono posé = onboarding terminé
  Navigation : points + "Suivant →" + skip.
  Déclenchement : onboarding_done boolean dans profils.

Partage de pick :
  Canvas API, format Story Instagram.
  Généré après chaque prono posé.

Tagline :
  Valider "Pronostique. Performe. Règne." et mettre à jour partout.

Classements par phase (NBA Cup, pré-saison, Summer League) :
  ALTER TABLE matchs ADD COLUMN tag varchar;
  Passer match.tag dans faireProno().
```

---

### Sprint 4 — GAMIFICATION & IDENTITÉ

```
Profil fan (equipe_favorite_id + joueur_favori_id dans profils)

Avatar personnalisable
  SVG layers. Maillots 30 équipes, cadres par niveau. Tout gagné, rien acheté.

Collection de cartes joueurs
  Catalogue ~200 cartes. 5 raretés : Common / Rare / Epic / Legendary / Ultimate.
  Tirage quotidien. Page /ma-collection.

Roue quotidienne
  1 tour/jour. Récompenses : XP bonus / rien / fragment de carte.
  Complète (ne remplace pas) le +5 XP connexion quotidienne.
  Puissant pour la rétention off-season.

Pronostic écart final
  Victoire serrée (<5 pts) ou large (>20 pts) → +2 pts bonus.
  Migration table pronos requise.

Edge Functions Supabase
  Sécuriser l'attribution XP côté serveur.
  Noté post-Sprint 4.

Titres saisonniers
  Graver le titre en fin de saison NBA dans profils.
  1er = Champion Saison 25-26 / 2e-3e = Finaliste / Top 50% = Compétiteur.
```

---

## 6. Features post-Sprint 4 (notées, non planifiées)

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail — distinct du H2H playoff déjà dispo |
| Enrichissement MatchDetail | Cotes bookmakers ESPN (`sports.core.api.espn.com/odds`) |
| Bracket Summer League dynamique | Phases Semi / Final / Consolation depuis headlines |
| Classements par phase | NBA Cup, pré-saison, Summer League — nécessite colonne `tag` dans `matchs` |
| Draft Night | Nouveau type de prono pour la Draft NBA. Chantier à part entière. |
| Jalons visuels niveaux | Tous les 5 niveaux pour éviter sentiment de plateau (MVP) |
| XP social | +XP sur réaction Vestiaire si réactions ajoutées un jour |
| Edge Functions Supabase | Sécurité XP côté serveur |

---

## 7. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Impossible au basket — reformulé en pronostic d'écart final Sprint 4 |
| Paris d'argent réel | Régulation ANJ, contre la philosophie |
| Marketplace de cartes | Économie spéculative |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | iOS limité sans Add to Home Screen |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |
| Leaderboard global séparé | Inutile à l'échelle actuelle |
| Standings NBA Cup / Summer League dédiés | ESPN ne les expose pas |

---

## 8. Off-season — stratégie rétention (juin → septembre)

- **Summer League** (juillet-août) : pronos activés via endpoint ESPN `nba-summer-las-vegas`
- **Roue quotidienne** (Sprint 4) : point d'entrée quotidien même sans match
- **Le Vestiaire** : discussions off-season, rumeurs transferts, draft
- **Mode Off-Season assumé** : compte à rebours "Retour dans X jours" sur le Board
- **Draft Night** (fin juin) : noté post-Sprint 4, chantier à part

---

## 9. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure notes | 🟡 Moyenne | Scanner Admin détecte les anomalies |
| rss2json.com indisponibilité | 🟢 Faible | BanniereFeed/NewsNBA se masquent silencieusement |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, no SELECT * |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération Admin |
| Missions trop répétitives après S2 | 🟡 Moyenne | Renouveler le catalogue missions chaque saison |
| XP manipulation côté client | 🟡 Moyenne | RLS + Edge Functions post-Sprint 4 |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création |
| v1.1 | 2026-05-29 | Sprint 4 : niveaux XP, cartes, avatar |
| v1.2 | 2026-05-30 | Sprint 1 livré |
| v1.3 | 2026-06-02 | Sprint 2 livré. Refonte charte v3.0 |
| v1.4 | 2026-06-02 | Sprint 3 partiellement livré |
| v1.5 | 2026-06-03 | Sprint 3 quasi complet. BanniereFeed, NewsNBA, Briefing, Board restructuré |
| v1.6 | 2026-06-04 | Board v3.3 : ticker Briefing, CLASSEMENT NBA wrapper, navbar 52px |
| v1.7 | 2026-06-04 | Sprint 3.4 : Scanner ESPN, Admin 3 onglets, Calendrier, MatchDetail, Explorer, detecterType() |
| v1.8 | 2026-06-04 | Conception RPG Progression v2.0 validée |
| v1.9 | 2026-06-05 | Sprint 3.5 livré : RPG complet. DDL Supabase, xp.js, badges, MesPronos enrichi, Admin Utilisateurs, Briefing enrichi, header Accueil KPIs, popup badge obtention, historique XP, fix timezone Paris |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v3_6.md (référence technique)*
*Prochaine révision : après catalogue missions + MissionsBoard livrés*
