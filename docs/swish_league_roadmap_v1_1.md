# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.1 — 2026-05-29 | Ajout Sprint 4 : Gamification & Identité (cartes, niveaux, avatar, profil fan)

---

## SOMMAIRE

1. [Contexte & objectif](#1-contexte--objectif)
2. [Benchmark marché](#2-benchmark-marché)
3. [Audit Swish League — état des lieux](#3-audit-swish-league--état-des-lieux)
4. [Les 3 piliers d'une app de pronos qui dure](#4-les-3-piliers-dune-app-de-pronos-qui-dure)
5. [Fonctionnalités manquantes — classification complète](#5-fonctionnalités-manquantes--classification-complète)
6. [Roadmap priorisée — 4 sprints](#6-roadmap-priorisée--4-sprints)
7. [Détail technique par fonctionnalité](#7-détail-technique-par-fonctionnalité)
8. [Ce qu'on ne fait PAS (et pourquoi)](#8-ce-quon-ne-fait-pas-et-pourquoi)
9. [KPIs de succès](#9-kpis-de-succès)
10. [Risques à anticiper](#10-risques-à-anticiper)

---

## 1. Contexte & objectif

### Situation actuelle
Swish League est un MVP fonctionnel. L'app fait le job de base : pronos, classements, scores ESPN, stats joueurs. Elle est déployée en production sur Vercel, connectée à Supabase, avec une identité visuelle cohérente (dark, violet/orange, mobile first).

**Ce n'est pas encore une app qu'on installe et qu'on garde.**

### Objectif de ce document
Définir la feuille de route précise pour passer d'un MVP à une app communautaire aboutie, diffusable à une audience au-delà du cercle initial. Ce document est la référence de priorisation pour toutes les prochaines sessions de développement.

### Périmètre
- **Focus exclusif : Swish League** (Swish Data mis de côté)
- Stack inchangé : React + Vite + Supabase + Vercel Hobby
- Contrainte : zéro budget, zéro serveur dédié, ESPN API publique uniquement
- Pas d'IA dans ce cycle — fonctionnalités humaines d'abord

---

## 2. Benchmark marché

### 2.1 — Les catégories d'acteurs

#### Catégorie A — Pure scores/stats
**Acteurs :** SofaScore, FotMob, Flashscore, ESPN app

Ce qu'ils font bien :
- Données en temps réel, riches, fiables
- Design soigné, lisible
- Notifications pertinentes (match qui commence, résultat)
- Heatmaps, ratings joueurs, H2H équipes (SofaScore)
- Momentum graph, xG timelines (FotMob)

Ce qu'ils ne font pas :
- Aucune dimension communautaire ou de prédiction (FotMob, Flashscore)
- Tu consultes, tu ne joues pas

**Lesson :** Swish League n'est pas en concurrence directe. Elle complète ces apps avec une couche sociale et de jeu.

---

#### Catégorie B — Pick'Em / Pronos
**Acteurs :** NBA Pick'Em (officiel NBA), ESPN NBA Playoff Challenge, Pick'Em Sports, Hunch

Ce qu'ils font bien :
- Picks match par match ou bracket complet
- Ligues officielles + ligues privées
- Leaderboard global en temps réel
- Head-to-head direct entre deux joueurs
- Analytics perso (win rate, streaks, trends)
- Badges / récompenses (NBA Pick'Em : prix physiques, billets)
- Score exact en option pour plus de points

Ce qu'ils ne font pas :
- Expérience communautaire réelle (chat, réactions)
- Vraie personnalisation (profil riche, historique complet)
- Stats NBA intégrées pour aider le prono (ils tablent sur ce que l'utilisateur sait déjà)

**Lesson :** Le modèle de scoring est la mécanique centrale. Score exact = différenciateur fort. Analytics perso = rétention.

---

#### Catégorie C — Communautaire/Social
**Acteurs :** Hunch (groupes + trash talk), communautés Reddit NBA, Discord serveurs NBA

Ce qu'ils font bien :
- Groupes publics et privés avec échanges
- Trash talk intégré (commentaires sur les picks)
- Compétition élargie (pas seulement ses amis)

Ce qu'ils ne font pas :
- Design et UX soignés
- Intégration de données NBA réelles

**Lesson :** La dimension sociale crée de l'attachement que les données seules ne créent pas.

---

#### Catégorie D — Collectibles numériques (référence)
**Acteur de référence :** NBA TopShot (Dapper Labs)

Ce que fait NBA TopShot :
- Collecte de "Moments" NBA (clips vidéo sous licence officielle) packagés en NFTs
- Système de raretés (Common / Rare / Legendary) avec mint counts limités
- Extensions par saison, rookies, parallels, autographes numériques
- Marketplace d'échange entre collecteurs — plus d'1 milliard de dollars de transactions

**Pourquoi ce n'est PAS le modèle à copier :**
TopShot repose sur de l'argent réel, une blockchain, une licence NBA officielle et une dimension spéculative. Le modèle s'est d'ailleurs retourné contre lui : la communauté s'est fracturée entre vrais fans et spéculateurs. Beaucoup ont perdu de l'argent.

**Ce qu'on retient de TopShot :** la mécanique de collection (rareté, extensions, tirage au sort, progression de sa galerie) — pas le modèle économique. Notre version : 100% gratuite, gagnée par les performances, sans blockchain, sans argent. **Panini numérique communautaire, pas marché financier.**

---

### 2.2 — Ce que veulent vraiment les utilisateurs

| Besoin | Fréquence | Intensité |
|---|---|---|
| Savoir si mon prono était bon rapidement | Quotidien | Haute |
| Comparer ma performance à mes amis | Quotidien | Haute |
| Chambrer un ami après un mauvais prono | Quotidien | Haute |
| Suivre ma progression dans le temps | Hebdomadaire | Moyenne |
| Consulter les stats avant de pronostiquer | Avant chaque match | Moyenne |
| Collectionner, compléter, posséder quelque chose | Continu | Haute (si bien exécuté) |
| Être récompensé et reconnu pour ses performances | Continu | Moyenne |
| Personnaliser son identité dans l'app | Continu | Moyenne |

**Conclusion clé :** Le produit doit générer un rituel quotidien ET un attachement identitaire. L'utilisateur doit avoir l'impression que son profil lui appartient vraiment.

---

## 3. Audit Swish League — état des lieux

### 3.1 — Ce qui existe et fonctionne ✅

| Fonctionnalité | Niveau de maturité | Note |
|---|---|---|
| Pronos match par match | ✅ Complet | Verrouillage auto, upsert propre |
| Ligues privées | ✅ Complet | Rejoindre/quitter, admin unique |
| Classement par ligue + général | ✅ Complet | Points, corrects, ratés, % |
| Scores ESPN temps réel | ✅ Complet | Scoreboard 3 jours, polling |
| MatchDetail complet | ✅ Complet | Stats équipes, leaders, blessés, L5 |
| Standings NBA Est/Ouest | ✅ Complet | Saison régulière + historique |
| Bracket playoffs | ✅ Complet | Visuel + sélecteur de saison |
| Fiche joueur | ✅ Bon | Stats saison, radars, game log 15 matchs |
| News NBA | ✅ Basique | 5 actus ESPN, sans filtre |
| Mode No Spoil | ✅ Complet | Tous les composants couverts |
| Auth (inscription/connexion) | ✅ Complet | Session persistante |
| Profil utilisateur | 🟡 Partiel | Avatar, bio, stats basiques |
| Mes pronos | 🟡 Partiel | Liste sans analytics |
| Calendrier | ✅ Complet | 4 vues, filtres, cache local |
| Prédiction ESPN (predictor) | ✅ Intégré | Dans MatchDetail avant/pendant match |

### 3.2 — Forces distinctives actuelles

- **Design cohérent et soigné** : dark theme, tokens CSS propres, mobile first réel
- **Data ESPN profonde** : fiche joueur, radars, game log — peu d'apps de pronos offrent ça
- **Bracket playoffs fonctionnel** : rare dans les apps amateurs
- **No Spoil** : feature distinctive, pensée pour l'expérience utilisateur

### 3.3 — Faiblesses critiques actuelles

1. **Aucune notification** → l'utilisateur n'a aucune raison de revenir s'il n'y pense pas
2. **Aucun indicateur de progression visible** → pas de streak, pas de win rate affiché
3. **Aucune interaction sociale** → les ligues existent mais personne ne se parle
4. **Dashboard personnel vide** → MesPronos = liste brute, pas d'analytics
5. **Aucune mécanique de reward** → correct ou raté, aucun feedback émotionnel
6. **Identité utilisateur pauvre** → avatar basique, aucune personnalisation, aucun objet d'attachement

---

## 4. Les 3 piliers d'une app de pronos qui dure

### Pilier 1 — Le rituel quotidien

L'utilisateur doit avoir une raison de revenir chaque jour, sans effort cognitif.

Le déclencheur externe indispensable : **la notification push**.
Sans notification, l'app est passive. L'utilisateur y pense quand il s'en souvient, soit jamais.

Le déclencheur interne : **voir en 5 secondes où j'en suis**.
Streak en cours, position dans ma ligue, prochain match à pronostiquer, carte du jour disponible. Ce doit être la première chose visible au chargement du Board.

**Ce qui tue le rituel :** devoir naviguer 3 écrans pour savoir si mon prono d'hier était bon.

### Pilier 2 — La tension sociale

Le chambrage entre amis est le moteur émotionnel du produit. C'est ce qui rend l'app unique vs ESPN ou SofaScore.

Vecteurs de tension sociale :
- **Head-to-head direct** : "vs Baptiste ce mois-ci : 12-9 en ma faveur"
- **Réactions sur les pronos** : un emoji ou un message après un résultat tombé
- **Classement en temps réel** : voir son rang bouger pendant le match
- **Partage de pick ou de carte** : envoyer une image de son prono ou de sa carte rare

**Ce qui tue la tension sociale :** le silence. Les ligues sans interaction deviennent des tableaux Excel.

### Pilier 3 — La progression visible + l'identité

L'utilisateur doit sentir qu'il s'améliore, être reconnu pour ça, et avoir un profil qui lui ressemble.

Mécaniques de progression :
- **Streak** : série de pronos corrects consécutifs — simple, addictif
- **Niveaux & XP** : progression continue visible à tout moment
- **Badges** : récompenses symboliques pour les exploits ponctuels
- **Collection de cartes** : objet d'attachement personnel qui grandit dans le temps

**Ce qui tue la progression :** aucun feedback différencié entre "correct" et "raté", et un profil qui ressemble à celui de tout le monde.

---

## 5. Fonctionnalités manquantes — classification complète

### Niveau 1 — CRITIQUE (bloque la rétention)

#### F1 — Notifications push (Web Push API)
**Pourquoi critique :** Sans notification, l'app est invisible dans le quotidien.

**Cas d'usage :**
- "Le match Lakers vs Warriors commence dans 1h — tu n'as pas encore pronostiqué !"
- "Résultat tombé : ton prono Lakers était CORRECT ✅ (+1 pt)"
- "Baptiste vient de te dépasser au classement 😬"
- "Ta carte du jour t'attend ! 🃏"

**Complexité :** Moyenne — Web Push API + Service Worker. Compatible Vercel Hobby.
**Prérequis :** Consentement utilisateur explicite (RGPD).

---

#### F2 — Dashboard personnel enrichi (MesPronos → MonProfil complet)
**Pourquoi critique :** Actuellement MesPronos = liste brute. L'utilisateur ne sait pas s'il est bon.

**Contenu à ajouter :**
- Streak actuel (corrects consécutifs) + streak max de la saison
- Win rate global (%) + évolution sur les 30 derniers jours
- Meilleure équipe pronostiquée (% correct sur cette équipe)
- Pire équipe pronostiquée (à éviter)
- Résultat des 10 derniers pronos (timeline visuelle ✅❌)
- Comparaison à la moyenne de mes ligues
- Bilan par phase de saison (régulière vs playoffs)
- Niveau actuel + barre XP + prochain palier
- Cartes récemment obtenues (aperçu collection)

**Complexité :** Faible — toutes les données sont en BDD Supabase. Pur calcul front.

---

#### F3 — Streak visible dans le Board
**Pourquoi critique :** Le streak est la mécanique d'engagement la plus simple et la plus efficace qui existe.

**Implémentation :** Badge dans le header du Board : "🔥 7 corrects d'affilée". Réinitialisé au premier raté.
**Complexité :** Très faible — calcul depuis `pronos` Supabase.

---

### Niveau 2 — IMPORTANT (différencie l'app)

#### F4 — Head-to-Head entre membres d'un groupe
**Description :** Vue dédiée "moi vs [ami]" dans le contexte d'une ligue.

**Exemple d'affichage :**
```
Baptiste vs JPVT — Ligue Potes
Saison 2025-26 : 12 - 9 en faveur de Baptiste
Ce mois-ci : 4 - 3 en ta faveur
Dernier match : Lakers @ Warriors — Baptiste ✅ / JPVT ❌
```

**Complexité :** Moyenne — JOIN Supabase pronos des deux users sur les mêmes match_id dans la même ligue.

---

#### F5 — Score exact en bonus
**Description :** Option pour saisir le score exact du match. Score exact → +3 pts bonus.

**Règles suggérées :**
- Winner correct uniquement → +1 pt (inchangé)
- Winner correct + écart ±5 pts → +2 pts
- Score exact → +3 pts

**Complexité :** Moyenne — modifier table `pronos`, adapter `points.js`, adapter UI.

---

#### F6 — Classement hebdomadaire (reset lundi)
**Description :** Points gagnés sur les 7 derniers jours uniquement, en parallèle du classement saison.

**Complexité :** Faible — filtre `cree_le` sur la semaine en cours.

---

#### F7 — Chat / réactions par ligue
**Description :** Messagerie simple dans chaque ligue — fil de messages, réactions par match.

**Complexité :** Moyenne/Haute — Supabase Realtime ou polling 30s. Table `messages`.

---

#### F8 — Profil public enrichi + picks visibles
**Description :** Page profil consultable par les membres d'un groupe commun. Stats, badges, niveau, cartes récentes, historique pronos.

**Complexité :** Faible — enrichir `Profil.jsx`.

---

### Niveau 3 — SOUHAITABLE (polish & viralité)

#### F9 — Badges / achievements
**Description :** Badges symboliques débloqués selon les performances.

| Badge | Déclencheur |
|---|---|
| 🎯 Sniper | Premier score exact |
| 🔥 En feu | 5 corrects d'affilée |
| 💀 Cold streak | 5 ratés d'affilée |
| 🏆 Champion de semaine | Meilleur score hebdo dans une ligue |
| 👑 Prophète | 10 corrects d'affilée |
| 😤 Anti-LeBron | 0% sur les Lakers (badge honteux) |
| 🃏 All-in | Tous les matchs pronostiqués en une semaine |
| 🧠 Analyst | Win rate > 65% sur 20+ pronos |
| 💎 Collectionneur | 50 cartes dans sa collection |
| 🌟 Légendaire | Obtenir une carte légendaire |

**Complexité :** Moyenne — table `badges` Supabase, logique de déclenchement, affichage profil.

---

#### F10 — Preview match enrichi (avant prono)
**Description :** Win probability ESPN, blessés clés, L5 des deux équipes, H2H, classements — avant de poser son prono.

**Complexité :** Faible à moyenne — données ESPN déjà disponibles.

---

#### F11 — Partage de pick (image générée)
**Description :** Image partageable (Canvas API) représentant le prono. Format Story Instagram.

**Complexité :** Haute — HTML to Canvas. ROI long terme (acquisition organique).

---

#### F12 — Leaderboard global (toutes ligues confondues)
**Description :** Classement de tous les utilisateurs Swish League, profils publics uniquement.

**Complexité :** Faible — agrégation Supabase par user_id.

---

#### F13 — Onboarding guidé (première connexion)
**Description :** Flow 4 étapes : pitch → rejoindre/créer ligue → premier prono → activer notifs.

**Complexité :** Faible — composant React + champ `onboarding_done` dans `profils`.

---

### Niveau 4 — GAMIFICATION & IDENTITÉ (Sprint 4)

Ce niveau représente la couche d'attachement profond — ce qui fait qu'un utilisateur ne désinstalle pas l'app même en inter-saison, parce que sa collection et son profil ont de la valeur à ses yeux.

---

#### F14 — Système de niveaux & XP

**Description :** Chaque action dans l'app rapporte de l'XP. L'XP s'accumule et fait monter de niveau. Chaque niveau a un titre NBA-thémé et débloque des avantages (cadre de profil, tenues d'avatar, cartes bonus).

**Niveaux suggérés :**
| Niveau | Titre | XP requis (cumulé) |
|---|---|---|
| 1 | 🏀 Rookie | 0 |
| 2 | 📋 Role Player | 500 |
| 3 | ⭐ Starter | 1 500 |
| 4 | 🌟 All-Star | 3 500 |
| 5 | 🏆 MVP | 7 500 |
| 6 | 👑 Hall of Famer | 15 000 |
| 7 | 🐐 GOAT | 30 000 |

**Sources d'XP :**
| Action | XP gagné |
|---|---|
| Connexion quotidienne | +10 |
| Prono posé | +5 |
| Prono correct | +15 |
| Score exact | +40 |
| Carte du jour récupérée | +20 |
| Carte rare obtenue | +50 |
| Carte légendaire obtenue | +200 |
| Streak de 5 corrects | +100 bonus |
| Streak de 10 corrects | +300 bonus |
| Champion de semaine dans une ligue | +150 |
| Premier membre invité dans une ligue | +100 |

**Affichage :** Barre de progression XP dans le header du profil. Niveau affiché sous le pseudo dans le classement et les messages de chat.

**Complexité :** Moyenne — table `xp_log` Supabase pour l'historique, champ `xp_total` + `niveau` calculé dans `profils`. Calcul niveau côté front depuis `xp_total`.

**Tables Supabase :**
```sql
ALTER TABLE profils
ADD COLUMN xp_total INTEGER DEFAULT 0,
ADD COLUMN niveau INTEGER DEFAULT 1;

CREATE TABLE xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  source TEXT NOT NULL,  -- 'connexion', 'prono_correct', 'carte_obtenue', etc.
  montant INTEGER NOT NULL,
  cree_le TIMESTAMP DEFAULT NOW()
);
```

---

#### F15 — Collection de cartes joueurs

**Description :** Système de cartes joueurs à collectionner, inspiré de Panini / Pokémon mais 100% gratuit et gagné par les performances et la régularité.

**Philosophie :** Pas d'argent réel. Pas de blockchain. Pas de marketplace. Les cartes sont des objets de collection personnels, non échangeables, qui valorisent l'engagement de l'utilisateur.

**Système de raretés :**
| Rareté | Couleur | Probabilité de tirage | Exemples |
|---|---|---|---|
| ⚪ Common | Gris argenté | 60% | Joueurs NBA actuels — roster complet 30 équipes |
| 🔵 Rare | Bleu saphir | 25% | Stars actuelles (LeBron, Curry, Giannis...) |
| 🟣 Epic | Violet | 12% | Légendes récentes (Kobe, Shaq, D-Wade...) |
| 🟡 Legendary | Or | 2,5% | GOAT era (Jordan, Magic, Bird, Kareem...) |
| 🔴 Ultimate | Rouge prismatique | 0,5% | Cartes "moment" spéciales (Jordan 1996 Finals, LeBron 2016 Game 7...) |

**Extensions & sets :**
- **Set Saison** : renouvelé chaque saison NBA. Les cartes d'une saison ont un badge millésime.
- **Set Légendes** : cartes intemporelles, pool stable
- **Set Franchise** : LeBron dans chacune de ses équipes (Cavs, Heat, Lakers, Cavs again) — cartes thématiques par période de carrière
- **Set Playoffs** : cartes spéciales disponibles uniquement pendant les playoffs, plus difficiles à obtenir
- **Set Rookie** : les rookies de la saison en cours, raretés limitées

**Mécaniques de tirage :**
- **Carte du jour** : 1 carte gratuite par connexion quotidienne. Rareté selon distribution standard.
- **Pack récompense** : 3 cartes d'un coup, obtenu après un streak de 5 corrects ou un niveau atteint.
- **Pack d'élite** : 5 cartes avec probabilité de rareté boostée (+Epic/+Legendary), obtenu en atteignant un niveau Milestone (All-Star, MVP, GOAT).
- **Carte de performance** : carte spéciale d'un joueur obtenue après avoir correctement pronostiqué son match (probabilité 20% de déclencher le tirage).

**Affichage de la collection :**
- Page `/ma-collection` : grille de toutes les cartes obtenues, filtrables par rareté / équipe / saison / set
- Cartes non obtenues visibles en "silhouette" (incite à compléter)
- Compteur de progression par set : "14/30 cartes du Set Saison 2025-26"
- Carte mise en avant ("carte du mois") sur le profil public

**Design des cartes :**
- Format portrait, style trading card
- Fond dégradé selon la rareté (gris → bleu → violet → or → rouge holographique)
- Photo du joueur (headshot ESPN)
- Nom, équipe, position, saison
- Logo équipe aux couleurs officielles ESPN
- Badge de rareté + numéro de série (ex: "Jordan #0042 / Common") — fictif mais crée l'illusion de scarcité
- Cartes Legendary et Ultimate : animation CSS subtile (shimmer, particules, glow)

**Complexité globale :** Haute — c'est le chantier éditorial et technique le plus lourd du Sprint 4. À décomposer en sous-étapes.

**Tables Supabase :**
```sql
-- Catalogue des cartes disponibles (éditoriale — à remplir manuellement/scriptée)
CREATE TABLE cartes_catalogue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  joueur_nom TEXT NOT NULL,
  joueur_espn_id TEXT,           -- pour fetch headshot ESPN
  equipe TEXT NOT NULL,
  equipe_espn_id TEXT,
  saison TEXT,                   -- ex: '2025-26', 'Légendes', 'Playoffs 2016'
  set_nom TEXT NOT NULL,         -- ex: 'Saison 2025-26', 'Franchise LeBron', 'Légendes'
  rarete TEXT NOT NULL CHECK (rarete IN ('common', 'rare', 'epic', 'legendary', 'ultimate')),
  serie_max INTEGER,             -- numéro de série max (fictif, ex: 9999 pour common)
  description TEXT,              -- texte flavor (ex: "LeBron à Miami, saison 2012-13")
  actif BOOLEAN DEFAULT TRUE
);

-- Cartes possédées par les utilisateurs
CREATE TABLE cartes_collection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  carte_id UUID REFERENCES cartes_catalogue(id),
  serie_numero INTEGER,          -- numéro fictif attribué à l'obtention
  obtenu_le TIMESTAMP DEFAULT NOW(),
  source TEXT NOT NULL           -- 'carte_du_jour', 'pack_recompense', 'performance', etc.
);

-- Index pour performance
CREATE INDEX idx_cartes_collection_user ON cartes_collection(user_id);
CREATE INDEX idx_cartes_collection_carte ON cartes_collection(carte_id);
```

**Note éditoriale :** Constituer le catalogue initial est le vrai travail. Prévoir ~200 cartes pour le lancement (30 équipes × 2-3 joueurs clés = ~90 Common/Rare + ~50 Epic légendes + ~30 Legendary GOAT + ~30 Ultimate moments spéciaux). Le catalogue s'enrichit à chaque saison.

---

#### F16 — Système d'avatar personnalisable

**Description :** Avatar stylisé représentant l'utilisateur dans l'app. Personnalisable avec des éléments déblocables progressivement : maillots d'équipe, accessoires, cadres de profil.

**Philosophie :** L'avatar n'est pas une photo réelle — c'est une représentation stylisée NBA (silhouette de joueur, style illustration). Les éléments cosmétiques sont gagnés, jamais achetés.

**Éléments personnalisables :**
| Élément | Déblocage |
|---|---|
| **Maillot équipe favorite** | Automatique à la déclaration de l'équipe favorite |
| **Maillots des 30 équipes** | 1 maillot gagné par niveau atteint (All-Star → tous déblocables) |
| **Maillots rétro** | Obtenus en récupérant une carte Epic/Legendary de cette franchise |
| **Cadre de profil** | Niveau : Rookie = cadre basique, GOAT = cadre animé doré |
| **Badge de titre** | Affiché sous le pseudo : champion de semaine, champion de saison |
| **Fond de profil** | Couleurs de l'équipe favorite, ou fond spécial selon niveau |

**Implémentation technique :**
L'avatar est un système de layers SVG superposés — pas de moteur 3D, pas de library externe lourde. Un layer par élément (fond, silhouette, maillot, accessoire, cadre). Maintenable et performant.

```
profil_avatar/
  layer_0_fond.svg       (couleur équipe ou niveau)
  layer_1_silhouette.svg (silhouette joueur — fixe)
  layer_2_maillot/       (1 SVG par équipe × variante home/away/rétro)
    lakers_home.svg
    bulls_1996_home.svg
    ...
  layer_3_cadre/         (1 SVG par niveau)
    rookie.svg
    allstar.svg
    goat_animated.svg
```

**Table Supabase :**
```sql
ALTER TABLE profils
ADD COLUMN avatar_maillot TEXT DEFAULT 'default',    -- clé du maillot équipé
ADD COLUMN avatar_cadre TEXT DEFAULT 'rookie',       -- clé du cadre équipé
ADD COLUMN avatar_fond TEXT DEFAULT 'default';       -- clé du fond équipé

CREATE TABLE avatar_deblockages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  type TEXT NOT NULL,     -- 'maillot', 'cadre', 'fond'
  cle TEXT NOT NULL,      -- identifiant de l'élément (ex: 'lakers_home', 'allstar')
  obtenu_le TIMESTAMP DEFAULT NOW(),
  source TEXT NOT NULL    -- 'niveau', 'carte_legendaire', 'champion_semaine', etc.
);
```

**Complexité :** Moyenne — le travail est surtout graphique (créer les SVG). La logique de déblocage et d'équipement est simple.

---

#### F17 — Profil fan complet (équipe & joueur favoris)

**Description :** L'utilisateur déclare son équipe favorite et son joueur favori dans son profil. Ces choix personnalisent l'expérience dans toute l'app.

**Impact de l'équipe favorite :**
- Le prochain match de cette équipe est mis en avant en premier dans le Board
- Les cartes de cette franchise ont un badge "Ma franchise" dans la collection
- Le maillot de l'équipe est automatiquement débloqué dans l'avatar
- Le fond de profil adopte les couleurs officielles de l'équipe (hex ESPN)
- Les standings mettent cette équipe en surbrillance

**Impact du joueur favori :**
- Notification si ce joueur fait une performance exceptionnelle (30+ pts, triple-double)
- La carte de ce joueur a un statut ⭐ "Favori" dans la collection
- Sa fiche joueur est accessible en un clic depuis le profil

**Implémentation :**
```sql
ALTER TABLE profils
ADD COLUMN equipe_favorite_id TEXT,     -- ESPN team ID
ADD COLUMN equipe_favorite_nom TEXT,    -- pour affichage sans fetch
ADD COLUMN joueur_favori_id TEXT,       -- ESPN athlete ID
ADD COLUMN joueur_favori_nom TEXT;      -- pour affichage sans fetch
```

**UX :** Sélection lors de l'onboarding (étape 2 du flow) avec picker visuel logos équipes. Modifiable dans les paramètres du profil.

**Complexité :** Faible — quelques champs BDD + logique d'affichage conditionnelle dans les composants existants.

---

## 6. Roadmap priorisée — 4 sprints

### Vue d'ensemble

```
Sprint 1 (2-3 semaines) — RÉTENTION
  F3 — Streak visible dans le Board
  F2 — Dashboard personnel enrichi
  F1 — Notifications push

Sprint 2 (2-3 semaines) — ENGAGEMENT SOCIAL
  F4 — Head-to-Head entre membres
  F5 — Score exact en bonus
  F6 — Classement hebdomadaire
  F13 — Onboarding guidé

Sprint 3 (3-4 semaines) — PROFONDEUR & POLISH
  F7 — Chat / réactions par ligue
  F9 — Badges / achievements
  F8 — Profil public enrichi
  F10 — Preview match enrichi
  F12 — Leaderboard global
  F11 — Partage de pick (si ressources)

Sprint 4 (4-6 semaines) — GAMIFICATION & IDENTITÉ
  F17 — Profil fan (équipe & joueur favoris)    ← démarrer ici, le plus simple
  F14 — Système de niveaux & XP
  F16 — Avatar personnalisable
  F15 — Collection de cartes joueurs            ← chantier le plus lourd, à garder pour la fin
```

### Pourquoi cet ordre dans le Sprint 4 ?

1. **F17 en premier** : zéro complexité technique, impact immédiat sur la personnalisation de l'expérience. Ça nourrit F15 (les cartes de l'équipe favorite sont mises en avant).
2. **F14 ensuite** : la logique XP est le moteur qui justifie tout le reste. Sans XP, les cartes et l'avatar n'ont pas de sens économique interne.
3. **F16 après F14** : les cadres d'avatar se débloquent par les niveaux — F14 doit exister d'abord.
4. **F15 en dernier** : le chantier éditorial (constituer le catalogue) peut commencer en parallèle des autres sprints. La partie technique arrive en dernier quand la logique XP et d'avatar est stabilisée.

---

### Sprint 1 — Rétention (priorité absolue)

**Objectif :** Que les utilisateurs actuels reviennent chaque jour.

**Étape 1.1 — Streak visible dans le Board**
- Calcul depuis `pronos` Supabase : dernière série de `resultat = 'correct'` consécutifs
- Affichage : badge 🔥 dans le header Board avec le nombre
- Si streak = 0 : icône neutre, pas d'affichage négatif
- Durée estimée : 0.5 jour

**Étape 1.2 — Dashboard personnel enrichi**
- Transformer `MesPronos.jsx` en vrai dashboard
- Ajouter : win rate global, streak actuel + max, meilleure/pire équipe, timeline des 10 derniers
- Toutes les données sont en BDD — pur calcul front
- Durée estimée : 2-3 jours

**Étape 1.3 — Notifications push**
- Service Worker + Web Push API
- Table `push_subscriptions` Supabase
- Déclencheurs prioritaires : match imminent (J-1h), résultat tombé
- Consentement RGPD obligatoire
- Durée estimée : 3-4 jours

---

### Sprint 2 — Engagement social

**Objectif :** Que les utilisateurs interagissent entre eux dans l'app.

**Étape 2.1 — Classement hebdomadaire** — 0.5 jour
**Étape 2.2 — Head-to-Head entre membres** — 2 jours
**Étape 2.3 — Score exact en bonus** — 3 jours (⚠️ migration BDD)
**Étape 2.4 — Onboarding guidé** — 1.5 jour

---

### Sprint 3 — Profondeur & polish

**Objectif :** Rendre l'app mémorable et diffusable.

**Étape 3.1 — Preview match enrichi** — 1.5 jour
**Étape 3.2 — Badges / achievements** — 3-4 jours
**Étape 3.3 — Chat / réactions par ligue** — 4-5 jours
**Étape 3.4 — Profil public enrichi** — 1.5 jour
**Étape 3.5 — Leaderboard global** — 1 jour
**Étape 3.6 — Partage de pick** — 3-4 jours

---

### Sprint 4 — Gamification & identité

**Objectif :** Créer un attachement profond à l'app, au-delà des pronos.

**Étape 4.1 — Profil fan (équipe & joueur favoris)** — 1 jour
- Champs BDD dans `profils`
- Picker visuel logos ESPN dans l'onboarding et les paramètres
- Personnalisation conditionnelle Board + standings + profil

**Étape 4.2 — Système de niveaux & XP** — 3-4 jours
- Table `xp_log` + champs `xp_total` / `niveau` dans `profils`
- Logique d'attribution XP pour chaque action (connexion, prono, carte, streak)
- Composant barre de progression dans le profil
- Notification "Niveau supérieur !" au passage de palier

**Étape 4.3 — Avatar personnalisable** — 4-5 jours
- Création des SVG de base (silhouette + maillots des 30 équipes + cadres par niveau)
- Table `avatar_deblockages` Supabase
- Logique de déblocage liée aux niveaux et aux cartes obtenues
- Composant éditeur d'avatar dans le profil
- Rendu dans le classement, le chat, les messages

**Étape 4.4 — Collection de cartes joueurs** — 6-8 jours
- Constitution du catalogue initial (~200 cartes) — travail éditorial en amont
- Tables `cartes_catalogue` + `cartes_collection`
- Mécanique de tirage (carte du jour, packs, performance)
- Composant carte (SVG layered, animation CSS rareté)
- Page `/ma-collection` avec grille, filtres, compteurs de complétion
- Intégration dans le profil (carte mise en avant) et le dashboard
- Intégration dans les notifications push ("ta carte du jour t'attend")

---

## 7. Détail technique par fonctionnalité

### F1 — Notifications push

**Architecture :**
```
Navigateur → Service Worker (sw.js) → Push API → Serveur → Supabase
```

**Table Supabase :**
```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  cree_le TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Note :** Web Push nécessite HTTPS (Vercel OK) + VAPID key pair (`web-push` npm). Déclenchement via Supabase Edge Function.

---

### F2 — Dashboard personnel

```sql
-- Win rate global
SELECT 
  COUNT(*) FILTER (WHERE resultat = 'correct') as corrects,
  COUNT(*) FILTER (WHERE resultat = 'raté') as rates,
  ROUND(COUNT(*) FILTER (WHERE resultat = 'correct')::numeric / COUNT(*) * 100, 1) as win_rate
FROM pronos 
WHERE user_id = $userId AND resultat IS NOT NULL;

-- Meilleure équipe pronostiquée
SELECT 
  equipe_choisie,
  COUNT(*) FILTER (WHERE resultat = 'correct') as corrects,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE resultat = 'correct')::numeric / COUNT(*) * 100, 1) as win_rate
FROM pronos p
JOIN matchs m ON p.match_id = m.id
WHERE p.user_id = $userId AND resultat IS NOT NULL
GROUP BY equipe_choisie
ORDER BY win_rate DESC
LIMIT 5;
```

---

### F4 — Head-to-Head

```sql
SELECT 
  p1.match_id,
  p1.equipe_choisie as pick_user1,
  p1.resultat as resultat_user1,
  p2.equipe_choisie as pick_user2,
  p2.resultat as resultat_user2,
  m.equipe_domicile,
  m.equipe_exterieur,
  m.date_match
FROM pronos p1
JOIN pronos p2 ON p1.match_id = p2.match_id AND p1.groupe_id = p2.groupe_id
JOIN matchs m ON p1.match_id = m.id
WHERE p1.user_id = $userId1 
  AND p2.user_id = $userId2
  AND p1.groupe_id = $groupeId
  AND p1.resultat IS NOT NULL
ORDER BY m.date_match DESC;
```

---

### F5 — Score exact

```sql
ALTER TABLE pronos 
ADD COLUMN score_dom_prono INTEGER,
ADD COLUMN score_ext_prono INTEGER;
```

```javascript
function calculerPointsMatch(prono, matchFinal) {
  const { equipe_choisie, score_dom_prono, score_ext_prono } = prono;
  const { equipe_gagnante, score_dom, score_ext } = matchFinal;

  if (equipe_choisie !== equipe_gagnante) return 0;
  let points = 1;

  if (score_dom_prono === score_dom && score_ext_prono === score_ext) {
    points += 2; // score exact → total +3
  } else if (
    score_dom_prono !== null && 
    Math.abs((score_dom_prono - score_ext_prono) - (score_dom - score_ext)) <= 5
  ) {
    points += 1; // écart correct → total +2
  }
  return points;
}
```

---

### F7 — Chat par ligue

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  groupe_id UUID REFERENCES groupes(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matchs(id) ON DELETE SET NULL,
  contenu TEXT NOT NULL CHECK (char_length(contenu) <= 500),
  cree_le TIMESTAMP DEFAULT NOW()
);

-- RLS lecture
CREATE POLICY "Membres lisent messages groupe"
ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM membres_groupe 
  WHERE groupe_id = messages.groupe_id AND user_id = auth.uid() AND actif = true
));

-- RLS écriture
CREATE POLICY "Membres écrivent dans groupe"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM membres_groupe WHERE groupe_id = messages.groupe_id AND user_id = auth.uid() AND actif = true)
);
```

---

### F9 — Badges

```sql
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  obtenu_le TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);
```

```javascript
const BADGES_DEFINITIONS = {
  'premier_correct': { label: '🎯 Sniper', condition: (s) => s.totalCorrects >= 1 },
  'streak_5':        { label: '🔥 En feu', condition: (s) => s.streakMax >= 5 },
  'streak_10':       { label: '👑 Prophète', condition: (s) => s.streakMax >= 10 },
  'score_exact':     { label: '🎯 Chirurgien', condition: (s) => s.scoresExacts >= 1 },
  'win_rate_65':     { label: '🧠 Analyst', condition: (s) => s.winRate >= 65 && s.total >= 20 },
  'collectionneur':  { label: '💎 Collectionneur', condition: (s) => s.totalCartes >= 50 },
  'legendaire':      { label: '🌟 Légendaire', condition: (s) => s.cartesLegendary >= 1 }
};
```

---

### F14 — Niveaux & XP

```javascript
// Seuils XP par niveau (côté front — pas de table BDD nécessaire)
const NIVEAUX = [
  { niveau: 1, titre: '🏀 Rookie',      xp_requis: 0 },
  { niveau: 2, titre: '📋 Role Player', xp_requis: 500 },
  { niveau: 3, titre: '⭐ Starter',     xp_requis: 1500 },
  { niveau: 4, titre: '🌟 All-Star',    xp_requis: 3500 },
  { niveau: 5, titre: '🏆 MVP',         xp_requis: 7500 },
  { niveau: 6, titre: '👑 Hall of Famer', xp_requis: 15000 },
  { niveau: 7, titre: '🐐 GOAT',        xp_requis: 30000 },
];

function getNiveau(xp_total) {
  return [...NIVEAUX].reverse().find(n => xp_total >= n.xp_requis) || NIVEAUX[0];
}

function getProgressionVersProchain(xp_total) {
  const actuel = getNiveau(xp_total);
  const prochain = NIVEAUX[actuel.niveau]; // niveau suivant (index = niveau actuel)
  if (!prochain) return 100; // GOAT = 100%
  const xp_palier = prochain.xp_requis - actuel.xp_requis;
  const xp_dans_palier = xp_total - actuel.xp_requis;
  return Math.round((xp_dans_palier / xp_palier) * 100);
}
```

---

### F15 — Cartes joueurs (logique de tirage)

```javascript
// Probabilités de rareté par type de tirage
const PROBABILITES = {
  carte_du_jour: { common: 60, rare: 25, epic: 12, legendary: 2.5, ultimate: 0.5 },
  pack_recompense: { common: 40, rare: 35, epic: 18, legendary: 6, ultimate: 1 },
  pack_elite:      { common: 20, rare: 30, epic: 30, legendary: 17, ultimate: 3 }
};

function tirerRarete(type_pack) {
  const proba = PROBABILITES[type_pack];
  const rand = Math.random() * 100;
  let cumul = 0;
  for (const [rarete, pct] of Object.entries(proba)) {
    cumul += pct;
    if (rand < cumul) return rarete;
  }
  return 'common';
}

async function tirerCarte(userId, type_pack) {
  const rarete = tirerRarete(type_pack);
  
  // Fetch une carte aléatoire du catalogue avec cette rareté
  const { data: cartes } = await supabase
    .from('cartes_catalogue')
    .select('id, serie_max')
    .eq('rarete', rarete)
    .eq('actif', true);

  const carte = cartes[Math.floor(Math.random() * cartes.length)];
  const serie_numero = Math.floor(Math.random() * carte.serie_max) + 1;

  // Enregistrer dans la collection
  await supabase.from('cartes_collection').insert({
    user_id: userId,
    carte_id: carte.id,
    serie_numero,
    source: type_pack
  });

  // Attribuer XP
  const xp = { common: 10, rare: 25, epic: 50, legendary: 150, ultimate: 500 }[rarete];
  await attribuerXP(userId, 'carte_obtenue', xp);

  return { carte, rarete, serie_numero };
}
```

---

## 8. Ce qu'on ne fait PAS (et pourquoi)

| Fonctionnalité | Raison |
|---|---|
| **IA prédictive** | Pas de données historiques stockées + ROI faible à ce stade |
| **Fantasy league** | Produit différent, scope trop large |
| **Paris d'argent réel** | Régulation ANJ, risque légal, contre la philosophie du projet |
| **Marketplace de cartes (vente/échange)** | Crée une économie spéculative — ce qu'on reproche à TopShot |
| **Cartes NFT / blockchain** | Complexité technique, coût, sans valeur ajoutée pour le fun |
| **App mobile native** | PWA suffit. Native = App Store review, coût, délai |
| **Stats avancées (PER, Win Shares)** | Non disponibles ESPN, scraping complexe |
| **Highlights vidéo** | Derrière ESPN+ auth |
| **Intégration Twitter/X** | API payante, instable |
| **Swish Data pipeline** | Mis de côté — pas de cas d'usage immédiat |

---

## 9. KPIs de succès

### KPIs d'engagement (après Sprint 1)

| Métrique | Cible | Mesure |
|---|---|---|
| DAU / MAU ratio | > 40% | Sessions Vercel Analytics |
| Taux de retour J+1 | > 50% | `profils.derniere_connexion` |
| Prono / utilisateur actif / semaine | > 5 | Count `pronos` / 7j |
| Taux d'ouverture notif push | > 30% | Logs Service Worker |
| Streak moyen actif | > 3 | Calculé depuis `pronos` |

### KPIs de croissance (après Sprint 3)

| Métrique | Cible | Mesure |
|---|---|---|
| Nouveaux inscrits / semaine | Croissance organique | Supabase auth |
| Ligues créées / mois | > 2 | Table `groupes` |
| Membres par ligue en moyenne | > 4 | JOIN `membres_groupe` |
| Taux d'activation (prono < 24h après inscription) | > 60% | `pronos.cree_le` vs `profils.cree_le` |

### KPIs gamification (après Sprint 4)

| Métrique | Cible | Mesure |
|---|---|---|
| % utilisateurs ayant récupéré leur carte du jour | > 70% | `cartes_collection.source = 'carte_du_jour'` / DAU |
| Cartes moyenne par utilisateur actif | > 15 après 1 mois | Count `cartes_collection` / user |
| % utilisateurs ayant atteint niveau 3+ | > 40% après 1 mois | `profils.niveau >= 3` |
| Taux de personnalisation avatar | > 60% | `profils.avatar_maillot != 'default'` |

### KPIs qualité produit

| Métrique | Cible |
|---|---|
| Temps de chargement Board (LCP) | < 2s sur mobile 4G |
| Erreurs ESPN API / semaine | < 5 |
| Supabase uptime | Session active 1x/semaine minimum |

---

## 10. Risques à anticiper

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute si l'app grandit
**Mitigation :** Ping automatique 1x/semaine via cron Vercel Hobby (1 cron autorisé).

### RISQUE-B — ESPN API blocage CORS ou changement de structure
**Sévérité :** 🟡 Moyenne
**Mitigation :** Proxy Supabase Edge Function en fallback. Documenter dans `espn_capacites_v1_0.md`.

### RISQUE-C — Dépassement quota Supabase free tier
**Sévérité :** 🟡 Moyenne — risque accru avec les tables Sprint 4 (cartes_collection peut grossir vite)
**Paliers :** 500 MB stockage, 2 GB bande passante/mois, 50k rows
**Mitigation :** Pagination stricte, pas de SELECT * sans LIMIT. Surveiller la taille de `cartes_collection` (1 carte/jour × 50 users × 365j = 18 000 rows/an — gérable).

### RISQUE-D — Spam dans le chat
**Sévérité :** 🟡 Moyenne
**Mitigation :** Limite 500 caractères, rate limiting RLS, signalement simple.

### RISQUE-E — Légalité (confusion pronos / paris)
**Sévérité :** 🟡 Moyenne
**Mitigation :** Mention claire "jeu de pronostics gratuit, aucun argent réel" dans onboarding + footer. Pas de cotes bookmakers dans le flow prono.

### RISQUE-F — Droits sur les images joueurs (cartes)
**Sévérité :** 🟡 Moyenne — à surveiller en cas de diffusion publique large
**Mitigation :** Utiliser les headshotss ESPN (déjà utilisés dans l'app, même usage). Ne pas utiliser de photos Getty ou sous licence distincte. En cas de doute à l'échelle commerciale, passer sur des illustrations / avatars stylisés plutôt que des photos réelles.

### RISQUE-G — Charge éditoriale du catalogue de cartes
**Sévérité :** 🟡 Moyenne — risque de blocage si sous-estimé
**Mitigation :** Commencer avec un catalogue minimal mais cohérent (50-100 cartes) et l'enrichir progressivement. Scripter l'import depuis ESPN API pour les joueurs actifs (roster ESPN → génération automatique des entrées Common).

### RISQUE-H — Limite Vercel Hobby (100 déploiements/jour)
**Sévérité :** 🟢 Faible
**Mitigation :** Grouper les commits avant de pusher.

---

## RÉCAPITULATIF — SCHÉMA D'ENSEMBLE

```
SWISH LEAGUE — VISION COMPLÈTE

┌─────────────────────────────────────────────────────────┐
│  COUCHE DONNÉES (ESPN API)                              │
│  Scores · Stats · Joueurs · Standings · News           │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│  COUCHE PRONOS (cœur MVP — livré)                       │
│  Picks · Ligues · Classements · Calcul points          │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│  COUCHE ENGAGEMENT (Sprints 1-2)                        │
│  Streak · Dashboard perso · Notifs · H2H · Score exact │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│  COUCHE SOCIAL (Sprint 3)                               │
│  Chat · Badges · Profil public · Leaderboard global    │
└─────────────────────────────┬───────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│  COUCHE IDENTITÉ (Sprint 4)                             │
│  Niveaux XP · Avatar · Cartes à collectionner · Fan    │
└─────────────────────────────────────────────────────────┘
```

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création — benchmark marché + roadmap 3 sprints |
| v1.1 | 2026-05-29 | Ajout Sprint 4 : F14 Niveaux XP, F15 Cartes, F16 Avatar, F17 Profil fan |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec `socle_nba_v2_1.md` (référence technique) — documents complémentaires*
*Prochaine révision : après Sprint 1 livré*
