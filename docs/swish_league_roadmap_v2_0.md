# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v2.0 — 2026-06-05 | Sprint 3.6 livré — Bonus Écart complet

---

## 1. Situation actuelle

Swish League est une app mature, cohérente et enrichie. Elle couvre l'intégralité du calendrier NBA, dispose d'un système de progression RPG complet, et intègre maintenant un système de pronostic de fourchette d'écart.

**Ce qui a été livré (Sprints 1, 2, 2.5, 3, 3.4, 3.5, 3.6) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H enrichi (fourchettes), ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Briefing ticker horizontal, Le Vestiaire, badge nav pronos en attente
- Refonte charte complète, MatchDetail refondu, BanniereFeed, NewsNBA
- Board v3.3 : À LA UNE / TIMELINE / TICKER / LIGUE EN COURS / VESTIAIRE / CLASSEMENT NBA / ACTU NBA
- **Scanner ESPN** (Admin) : scan complet juillet→juin, Summer League, 8 types détectés
- **Admin 4 onglets** : Scanner ESPN / Ligues / Utilisateurs / Modération
- **Calendrier enrichi** : filtres par phase, navigation auto au 1er match
- **MatchDetail enrichi** : badge headline ESPN, fallback Summer League, détection Finals fiable
- **Explorer / Stats** : classements par phase, stats joueur historiques
- `detecterType()` : fonction centrale partagée, cohérente dans tout le projet

**Sprint 3.5 — Système RPG Progression ✅ LIVRÉ**
- DDL Supabase complet : `xp_log`, `missions`, `missions_utilisateurs`, `badges_catalogue` + colonnes `profils`
- Service `xp.js` : `niveauDepuisXP`, `xpPourNiveau`, `ajouterXP`, `verifierJalons`, `verifierMissions`
- Toutes les sources XP branchées, anti-doublon partout, fix timezone Paris
- **13 badges** définis, assets WebP uploadés dans Supabase Storage
- **MesPronos enrichi** : header XP/badges, barre progression, historique XP, modal info
- **Popup obtention badge** sur Accueil, header KPIs, Briefing enrichi

**Sprint 3.6 — Bonus Écart ✅ LIVRÉ**
- Table `pronos_ecart` créée avec RLS + GRANT
- Service `ecart.js` : pose/récupère fourchette + XP +5 anti-doublon
- `espn.js` : `recupererGagnant()` enrichi avec `ecart_final`
- `points.js` : validation fourchette, +2 pts ligue, +30 XP, jalon Tireur d'Élite
- **Bloc BONUS ÉCART** dans MatchDetail (apparaît après prono vainqueur)
- **MesPronos** : FORME RÉCENTE repositionnée, SÉRIES avant STATS GLOBALES, stats fourchette intégrées, stats ligues refondues avec dropdown + 2 lignes détail
- **H2H** : bilan fourchettes + détail match par match
- **14e badge** : Tireur d'Élite (10 fourchettes correctes cumulatives)
- Fix RLS : policy admin pour modification d'autres profils (badges)
- Fix GRANT global : `GRANT SELECT, INSERT, UPDATE ON ALL TABLES`

**L'app couvre maintenant l'intégralité du calendrier NBA, un système de progression RPG complet, et un système de pronostic de fourchette d'écart.**

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
Streak ✅, série cassée ✅, **Système RPG complet ✅**, **Bonus Écart ✅**. Prochaine étape : missions actives sur le Board + avatars.

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
**Performance (auto)** : En Hibernation / En Feu / Champion / Marathonien / Analyste / Prophète / All-In / **Tireur d'Élite**
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
| **10 fourchettes correctes cumulatives** | **+200** | **Tireur d'Élite** |

### Missions
Tables créées, service `verifierMissions()` opérationnel. **Catalogue à remplir** — c'est le levier éditorial à activer avant le recrutement.

### Titres saisonniers
À implémenter en fin de saison NBA (gravés définitivement dans profils). Pas encore codé.

### Points de classement ligue
- Prono vainqueur correct : **1 pt**
- Fourchette d'écart correcte : **+2 pts** (bonus indépendant)
- Match parfait : **3 pts**

---

## 5. Roadmap — sprints

### Sprints 1, 2, 2.5, 3, 3.4, 3.5, 3.6 ✅ LIVRÉS

---

### Reste Sprint 3 ⏳

```
⏳ MissionsBoard.jsx — bloc Board missions actives (catalogue missions à remplir d'abord)
⏳ Catalogue missions quotidiennes/hebdo — à rédiger et insérer en SQL
⏳ Onglet Missions dans Admin — création/activation/désactivation
⏳ Audit XP post-Finals — vérifier jalons, semaine_100_pct, prono_correct pour chaque user
```

---

### Avant juillet 2026 — URGENT (Summer League)

```
Répartition des points — à revoir avant Summer League (juillet 2026)
  Actuellement : 1 pt prono vainqueur + 2 pts fourchette correcte
  Objectif : confirmer ou ajuster pour la Summer League
Tagline — valider "Performe" et mettre à jour partout
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

Edge Functions Supabase
  Sécuriser l'attribution XP côté serveur.

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
| Titres saisonniers gravés | En fin de saison NBA |

---

## 7. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Impossible au basket — remplacé par fourchette d'écart ✅ livré |
| Paris d'argent réel | Régulation ANJ, contre la philosophie |
| Marketplace de cartes | Économie spéculative |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | iOS limité sans Add to Home Screen |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |
| Leaderboard global séparé | Inutile à l'échelle actuelle |
| Standings NBA Cup / Summer League dédiés | ESPN ne les expose pas |
| Fourchette d'écart sur le Board | Surchargerait le visuel — accessible via MatchDetail |

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
| v2.0 | 2026-06-05 | Sprint 3.6 livré : Bonus Écart complet. pronos_ecart, ecart.js, MatchDetail BONUS ÉCART, MesPronos refonte stats, H2H fourchettes, badge Tireur d'Élite, fix RLS admin profils, GRANT global |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v3_7.md (référence technique)*
*Prochaine révision : après catalogue missions + MissionsBoard livrés*
