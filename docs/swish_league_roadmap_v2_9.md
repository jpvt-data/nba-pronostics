# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v2.9 — 2026-06-11 | Session 7 — Corrections noSpoil, Play Store envisagé, Nexgen initié

---

## 1. Situation actuelle

Swish League est une app mature, cohérente et enrichie. La PRIORITÉ 1 est **100% livrée**. La session 6 a posé les fondations de la collection de cartes (assets + spec).

**Ce qui a été livré (Sprints 1→3.8 + Cotes + Sessions 3→6) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H enrichi (fourchettes), ligues planifiées, MVP semaine
- Briefing ticker, Le Vestiaire, BanniereFeed, NewsNBA
- Board v4.2, Scanner ESPN, Admin 5 onglets
- Calendrier enrichi, MatchDetail enrichi, Explorer/Stats
- RPG complet (100 niveaux, 7 titres, 14 badges, missions, XP)
- Bonus Écart, Tracking events, Dashboard Admin
- Bloc CONTEXTE COTES dans MatchDetail
- Session 3 : DETTE-19 soldée, typo Outfit, zéro emoji, header Board v4.2
- Session 4 : Navigation v4.3, Roue quotidienne, Missions chaînées
- Session 5 ✅ : Onboarding tuto (7 slides), Équipes favorites Top 3, MesPronos header v2
- **Session 7 ✅** : noSpoil retiré de BracketPlayoffs + NewsNBA, Play Store TWA envisagé post-recrutement, projet Nexgen initié

---

## 2. Positionnement & identité

**Tagline :** "Pronostique. Flambe. Règne." ✅ active partout.
**Objectif principal :** passion NBA, suivi de la saison, progression personnelle, compétition amicale.
**Cible recrutement :** septembre 2026, pour préparer la présaison NBA (octobre).

---

## 3. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Ticker Briefing + BanniereFeed + BandeMatchs. Connexion quotidienne récompensée en XP. Missions hebdomadaires comme moteur de rétention. Roue quotidienne ✅. Contexte cotes pour aider le prono.

### Pilier 2 — La compétition amicale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks ✅. Collection de cartes — assets prêts ✅, implémentation en cours (PRIORITÉ 3).

### Pilier 3 — La progression visible
Streak ✅, RPG complet ✅, Bonus Écart ✅, Missions chaînées ✅, Roue ✅, Onboarding ✅, Équipes favorites ✅. Prochaine étape : avatars, collection de cartes, filtrage pronos par équipes.

---

## 4. Système RPG — état détaillé

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
| **Roue quotidienne** | **+15/30/75/150 ou 0** | **1×/jour** |

### Points de classement ligue — RÈGLES UNIVERSELLES (corrigées session 6)
- Prono vainqueur correct : **1 pt**
- Fourchette d'écart correcte : **+1 pt** ← correction (anciens docs indiquaient +2, c'était faux)
- Match parfait : **3 pts**
- Valable pour **toutes les ligues** : saison régulière, playoffs, Summer League, etc.

---

## 5. Système ligues — convention (session 5)

Chaque phase NBA = une ligue dédiée dans Swish League.

| Phase | Type | Inscription |
|---|---|---|
| Saison régulière | Principale | Auto, tout le monde |
| Playoffs | Principale | Auto, tout le monde |
| NBA Finals | Principale | Auto, tout le monde |
| Summer League | Bonus | Auto ou optionnel |
| Pré-saison | Bonus | Auto ou optionnel |
| NBA Cup | Bonus / parallèle régulière | À préciser |
| All-Star | Bonus événementiel | Auto ou optionnel |

**Auto-inscription** : comportement cible — à implémenter en PRIORITÉ 2.
**Aujourd'hui** : inscription manuelle via `/groupes`.

---

## 6. Équipes favorites — mécanique saison régulière (session 5)

- Chaque user choisit **3 équipes favorites** dans son profil
- En saison régulière : l'user ne pronostique **que les matchs de ses 3 équipes** (Top 3 strict — A1)
- 82 matchs/saison par équipe → ~246 matchs max à pronostiquer sur 6 mois (~1,4/jour)
- Toutes les équipes jouent 82 matchs → comparaison équitable sans normalisation
- Joueurs favoris : reporté (pas de mécanique définie)

---

## 7. Collection de cartes — spec actée (session 6)

### Modèle général
- Hybride FUT (millésimes par saison) + Pokédex (cases vides visibles, nom affiché)
- 1 extension = 1 saison NBA. SGA 25-26 ≠ SGA 26-27
- Saisons passées jamais fermées (~10% pool, toujours tirables)

### Catalogue de lancement (~172 cartes)
- 5 majeurs × 30 équipes = 150 cartes (saison 25-26)
- ~20 légendes HOF
- 2-3 rookies phares

### Raretés — 3 au lancement
| Rareté | Probabilité |
|---|---|
| Common | 65% |
| Rare | 30% |
| Legendary | 5% |
Epic et Ultimate → post-lancement

### Mécaniques de tirage — 2 au lancement
- Connexion quotidienne → 1 carte
- Prono correct → 20% chance d'une carte

### Assets disponibles
- 522 headshots joueurs actifs 2025-26 (ESPN CDN) ✅
- 15 headshots légendes (NBA CDN) : Jordan, Kobe, Shaq, Duncan, Iverson, Nowitzki, Garnett, Olajuwon, Chamberlain, Wade, Anthony, Pierce, Nash, Carter, Allen ✅
- 15 légendes sans headshot exploitable → design carte vintage à décider
- 30 logos équipes ESPN ✅
- `_master.csv` 783 lignes avec espn_id, nba_id, rang, poste ✅

### Prochaines étapes techniques
1. Upload Google Drive → Supabase Storage
2. BDD : tables `cartes_catalogue` + `cartes_collection`
3. Composant carte React (template SVG/CSS par rareté)
4. Mécanique tirage (service JS + triggers connexion/prono)
5. Page `/ma-collection` (Cartodex + barre progression)

### Ce qu'on ne fait PAS
- Marketplace / échange entre users (économie spéculative)
- Photos action libres de droits en masse (pas de source fiable)
- Archive morte style Topps Digital

---

## 8. Système Tracking ✅ OPÉRATIONNEL

- Table `events` Supabase + service `tracker.js`
- 7 event types, 9 pages trackées
- Dashboard Admin 8 blocs, période 7j/14j/30j, export CSV + purge

---

## 9. Roadmap — sprints prioritisés

### PRIORITÉ 1 — Avant juillet 2026 ✅ SOLDÉE

```
✅ Navigation restructurée (loupe, hamburger, pages bientôt)
✅ "Stats" uniformisé
✅ Roue quotidienne (modal SVG animé, XP, missions)
✅ Missions chaînées (prerequis_slug, 5 nouvelles missions)
✅ Onboarding tuto — carousel 7 slides
✅ Équipes favorites Top 3 (Profil + MesPronos)
✅ MesPronos header v2 (3 colonnes, bio, chips, responsive)
```

Summer League Las Vegas 2026 : 9-19 juillet.

---

### PRIORITÉ 2 — Août 2026 (avant recrutement septembre)

```
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Classements par phase (front) — colonne tag déjà en base
⏳ Auto-inscription ligues — au démarrage de chaque phase NBA
```

---

### PRIORITÉ 3 — Sprint 4 — GAMIFICATION & IDENTITÉ

```
Filtrage pronos saison régulière par équipes favorites (Top 3)
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes — assets prêts ✅ :
  - Upload Supabase Storage
  - BDD cartes_catalogue + cartes_collection
  - Composant carte React par rareté
  - Mécanique tirage
  - Page /ma-collection Cartodex
Edge Functions Supabase (sécurité XP côté serveur)
Titres saisonniers (gravés en fin de saison NBA dans profils)
```

---

## 10. Features post-Sprint 4

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail |
| Bracket Summer League dynamique | Depuis headlines |
| Classements par phase | Front déjà débloqué (tag en base) |
| Draft Night | Nouveau type de prono |
| Jalons visuels niveaux | Tous les 5 niveaux |
| XP social | +XP sur réaction Vestiaire |
| Dashboard tracking enrichi | Cohortes, funnel post-recrutement |
| Upgrade The Odds API | Si > 500 req/mois après septembre |
| Déploiement Play Store (TWA) | Post septembre — PWABuilder, mentions légales, icônes PWA, FCM |
| Extensions historiques collection | "Bulls 96", "Lakers 2000"... — juste des lignes en BDD |
| Cartes spéciales | Playoffs, Champion, All-NBA, Semaine de Feu — format à définir |

---

## 11. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Impossible au basket — remplacé par fourchette d'écart ✅ |
| Paris d'argent réel | Régulation ANJ |
| Cotes dans le flow prono | Risque légal ANJ France |
| Marketplace de cartes | Économie spéculative |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | iOS limité |
| Leaderboard global séparé | Inutile à l'échelle actuelle |
| Standings NBA Cup / Summer League dédiés | ESPN ne les expose pas |
| Photos action libres de droits en masse | Pas de source fiable |

---

## 12. Off-season — stratégie rétention (juin → septembre)

- **Summer League** (juillet-août) : pronos via endpoint `nba-summer-las-vegas`
- **Missions hebdomadaires** : reset lundi, incentive récurrent même sans match NBA
- **Roue quotidienne** ✅ : point d'entrée quotidien off-season
- **Le Vestiaire** : discussions off-season, rumeurs transferts, draft
- **Onboarding tuto** ✅ : prêt pour l'arrivée des nouveaux users en septembre

---

## 13. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Scanner Admin détecte les anomalies |
| rss2json.com indisponibilité | 🟢 Faible | Composants se masquent silencieusement |
| The Odds API quota dépassé | 🟢 Faible | Cache TTL 6h — upgrade si > 50 users |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, purge events |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération Admin |
| Missions trop répétitives | 🟡 Moyenne | Catalogue renouvelable via Admin |
| XP manipulation côté client | 🟡 Moyenne | RLS + Edge Functions post-Sprint 4 |
| Volume table events | 🟢 Faible court terme | Purge manuelle via Admin |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création |
| v2.0 | 2026-06-05 | Sprint 3.6 livré : Bonus Écart complet |
| v2.1 | 2026-06-07 | Sprint 3.7 livré : Missions + Tracking + Dashboard Admin |
| v2.2 | 2026-06-07 | Sprint 3.8 livré : Bugfixes & stabilisation |
| v2.4 | 2026-06-08 | CRUD Missions Admin livré. Tagline validée. |
| v2.5 | 2026-06-09 | Session 3 : DETTE-19 soldée, typo Outfit, zéro emoji, header Board v4.2 |
| v2.6 | 2026-06-09 | Session 4 : Navigation v4.3, Roue quotidienne, Missions chaînées, Onboarding tuto en PRIORITÉ 1 |
| v2.7 | 2026-06-09 | Session 5 : PRIORITÉ 1 soldée — Onboarding livré, Équipes favorites Top 3, MesPronos header v2, convention ligues = phases NBA |
| v2.9 | 2026-06-11 | Session 7 : noSpoil retiré BracketPlayoffs + NewsNBA, Play Store TWA backlog, Nexgen initié |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v4_5.md (référence technique)*
*Prochaine révision : après PRIORITÉ 2 livrée (août 2026)*
