# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.8 — 2026-06-04 | Sprint 3.4 livré, conception RPG Progression en cours

---

## 1. Situation actuelle

Swish League est une app mature, cohérente et enrichie. Elle couvre maintenant l'ensemble du calendrier NBA avec une détection fine des phases de saison.

**Ce qui a été livré (Sprints 1, 2, 2.5, 3, 3.4) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H, ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Briefing ticker horizontal, Le Vestiaire, badge nav pronos en attente
- Refonte charte complète, MatchDetail refondu, BanniereFeed, NewsNBA
- Board v3.3 : À LA UNE / TIMELINE / TICKER / LIGUE EN COURS / VESTIAIRE / CLASSEMENT NBA / ACTU NBA
- **Scanner ESPN** (Admin) : scan complet juillet→juin, Summer League, 8 types détectés, state persistant entre onglets
- **Admin 3 onglets** : Scanner ESPN / Ligues / Modération. Gestion complète des ligues avec remplissage auto depuis scanner.
- **Calendrier enrichi** : filtres par phase (NBA Cup, Playoffs, Summer League...), navigation auto au 1er match
- **MatchDetail enrichi** : badge headline ESPN (NBA Cup - QF, NBA Abu Dhabi Game...), fallback Summer League, détection Finals fiable
- **BandeMatchs** : tags du jour affichés à droite de la date
- **Explorer / Stats** : classements Pré-saison/Régulière/Playoffs, stats joueur par saison historique + type
- **Groupes épuré** : gestion admin déplacée dans Admin, badge tag + description sur chaque ligue
- **StandingsNBA dynamique** : seasontype adapté à la phase courante
- `detecterType()` : fonction centrale partagée, cohérente dans tout le projet

**L'app couvre maintenant l'intégralité du calendrier NBA, de la Summer League aux Finals.**

---

## 2. Positionnement & identité

**Tagline actuelle :** "Pronostique. Clashe. Règne."
**Tagline en validation :** "Pronostique. Performe. Règne."
→ Mise à jour à faire en août : navbar, popup changelog, onboarding.

**Cible recrutement :** septembre 2026, pour préparer la présaison NBA (octobre).

---

## 3. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Ticker Briefing + BanniereFeed + BandeMatchs avec tags de phase. L'utilisateur sait immédiatement où en est la saison dès l'ouverture.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : XP, niveaux, badges, missions.

### Pilier 3 — La progression visible
Streak ✅, série cassée ✅. Système RPG Progression = chantier en cours de conception.

---

## 4. Roadmap — sprints

### Sprints 1, 2, 2.5, 3, 3.4 ✅ LIVRÉS

---

### Sprint 3 restant ⏳ — EN COURS

**Chantier principal : Système RPG Progression**

Conception v2.0 validée en session 2026-06-04. Voir document `swish_league_rpg_progression_v1_0.md` pour le détail complet.

Résumé des décisions prises :
- 100 niveaux, 7 titres, courbe exponentielle (XP_BASE=300, COEFFICIENT=1.06 dans config.js)
- XP cumulatif à vie + titre saisonnier gravé en fin de saison
- Missions : quotidiennes / hebdomadaires / événements / permanentes
- Badges : 4 familles (Performance / Appartenance / Événements / Admin)
- UI : header Board + bloc Board + /profil + Briefing ticker

**Reste à concevoir / valider avant dev :**
- DDL Supabase complet (5 tables / colonnes profils)
- Service `xp.js`
- Assets visuels badges (outil de génération à définir)
- Catalogue missions complet (quotidiennes + hebdo)

---

### Août 2026 — avant recrutement septembre

```
Onboarding carousel 5 slides :
  1. Pitch — "Pronostique chaque match NBA. Construis ton palmarès. Règne sur le classement."
  2. Les pronos (Board + BandeMatchs)
  3. Le classement
  4. Explorer
  5. Action — premier prono posé = onboarding terminé
Navigation : points + "Suivant →" + skip.
Déclenchement : onboarding_done boolean dans profils (colonne à créer en août).

Partage de pick :
  Canvas API, format Story Instagram.
  Généré après chaque prono posé.

Tagline :
  Valider "Pronostique. Performe. Règne." et mettre à jour partout.

Classements par phase (NBA Cup, pré-saison, Summer League) :
  Nécessite colonne tag dans table matchs Supabase.
  Migration : ALTER TABLE matchs ADD COLUMN tag varchar;
  Passer match.tag dans faireProno() (Accueil.jsx).
  Débloque : ClassementRapide et Classement.jsx filtrables par phase.
```

---

### Sprint 4 — GAMIFICATION & IDENTITÉ

```
Profil fan (équipe & joueur favoris)
    Champs equipe_favorite_id + joueur_favori_id dans profils.

Système RPG Progression — implémentation complète
    DDL + service xp.js + missions + badges + UI.
    (conception validée en Sprint 3 restant)

Avatar personnalisable
    SVG layers. Maillots 30 équipes, cadres par niveau. Tout gagné, rien acheté.

Collection de cartes joueurs
    Catalogue ~200 cartes. 5 raretés : Common / Rare / Epic / Legendary / Ultimate.
    Tirage quotidien. Page /ma-collection.
    Lié à la roue quotidienne (voir ci-dessous).

Roue quotidienne
    1 tour/jour. Récompenses : XP bonus / rien / fragment de carte.
    Remplace ou complète le +5 XP connexion quotidienne.
    Puissant pour la rétention off-season.

Pronostic écart final
    Victoire serrée (<5 pts) ou large (>20 pts) → +2 pts bonus.
    Migration table pronos requise.
```

---

## 5. Features post-Sprint 4 (notées, non planifiées)

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail — distinct du H2H playoff déjà dispo |
| Enrichissement MatchDetail | Cotes bookmakers ESPN (`sports.core.api.espn.com/odds`) |
| Bracket Summer League dynamique | Phases Semi / Final / Consolation depuis headlines `nba-summer-las-vegas`. Utile en juillet. |
| Classements par phase | NBA Cup, pré-saison, Summer League — nécessite colonne `tag` dans `matchs` |
| Draft Night | Nouveau type de prono pour la Draft NBA. Chantier à part entière. |

---

## 6. Ce qu'on ne fait PAS

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
| Leaderboard global séparé | Inutile à l'échelle actuelle — Classement.jsx section TOTAL suffit |
| Standings NBA Cup / Summer League dédiés | ESPN ne les expose pas — standings régulière en référence |

---

## 7. Off-season — stratégie rétention (juin → septembre)

L'été NBA (juin-septembre) = vide quasi total de matchs. Plan :

- **Summer League** (juillet-août) : pronos activés via endpoint ESPN `nba-summer-las-vegas` déjà supporté. Missions estivales dédiées dans le catalogue.
- **Roue quotidienne** : seul élément actif tous les jours même sans match. Point d'entrée quotidien.
- **Le Vestiaire** : discussions off-season, rumeurs transferts, draft.
- **Mode Off-Season assumé** : compte à rebours "Retour dans X jours" sur le Board. Honnête, pas de faux engagement.
- **Draft Night** (fin juin) : noté post-Sprint 4, chantier à part entière.

---

## 8. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure notes | 🟡 Moyenne | Scanner Admin détecte les anomalies, `inconnu` tag en filet de sécurité |
| rss2json.com indisponibilité | 🟢 Faible | BanniereFeed/NewsNBA se masquent silencieusement |
| Basket USA changement RSS | 🟢 Faible | Surveiller structure |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, no SELECT * |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération Admin |
| Missions trop répétitives après S2 | 🟡 Moyenne | Renouveler le catalogue missions chaque saison via admin |

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
| v1.6 | 2026-06-04 | Board v3.3 : ticker Briefing, CLASSEMENT NBA wrapper, navbar 52px. Positionnement revu. |
| v1.7 | 2026-06-04 | Sprint 3.4 : Scanner ESPN persistant, Admin 3 onglets + gestion ligues, Calendrier filtres par phase, MatchDetail badges ESPN, BandeMatchs tags, Explorer stats historiques, Groupes épuré, StandingsNBA dynamique, detecterType() centralisé. |
| v1.8 | 2026-06-04 | Conception RPG Progression v2.0 : 100 niveaux, 7 titres, courbe exponentielle, badges 4 familles, missions 4 types, roue quotidienne notée, Draft Night notée, stratégie off-season. |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v3_4.md (référence technique)*
*Prochaine révision : après DDL + xp.js livrés*
