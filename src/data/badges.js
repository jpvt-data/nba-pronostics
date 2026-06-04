import { SUPABASE_URL } from '../config'

const BUCKET = 'badges'

export const badgeImageUrl = (slug) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/badge_${slug}.webp`

export const BADGES_CATALOGUE = [
  {
    slug:        'original_gangster',
    nom:         'Original Gangster',
    famille:     'appartenance',
    description: 'Membre fondateur de Swish League. Là depuis le début.',
    image:       badgeImageUrl('original_gangster'),
  },
  {
    slug:        'all_in',
    nom:         'All-In',
    famille:     'appartenance',
    description: '50 pronos posés. Tu es dedans pour de bon.',
    image:       badgeImageUrl('all_in'),
  },
  {
    slug:        'en_hibernation',
    nom:         'En Hibernation',
    famille:     'performance',
    description: '5 ratés consécutifs. Ça arrive aux meilleurs.',
    image:       badgeImageUrl('en_hibernation'),
  },
  {
    slug:        'en_feu',
    nom:         'En Feu',
    famille:     'performance',
    description: '5 pronos corrects d\'affilée. Tu es en mission.',
    image:       badgeImageUrl('en_feu'),
  },
  {
    slug:        'champion',
    nom:         'Champion',
    famille:     'performance',
    description: 'Meilleur de la semaine sur ta ligue.',
    image:       badgeImageUrl('champion'),
  },
  {
    slug:        'marathonien',
    nom:         'Marathonien',
    famille:     'performance',
    description: '100 pronos posés. La régularité, c\'est toi.',
    image:       badgeImageUrl('marathonien'),
  },
  {
    slug:        'analyste',
    nom:         'Analyste',
    famille:     'performance',
    description: '65%+ de réussite sur 20 pronos. Tu lis le jeu.',
    image:       badgeImageUrl('analyste'),
  },
  {
    slug:        'prophete',
    nom:         'Prophète',
    famille:     'performance',
    description: '10 pronos corrects d\'affilée. Légendaire.',
    image:       badgeImageUrl('prophete'),
  },
  {
    slug:        'echauffement',
    nom:         'L\'Échauffement',
    famille:     'evenement',
    description: 'Vainqueur de la ligue Pré-Saison.',
    image:       badgeImageUrl('echauffement'),
  },
  {
    slug:        'ete_brulant',
    nom:         'Été Brûlant',
    famille:     'evenement',
    description: 'Vainqueur de la ligue Summer League.',
    image:       badgeImageUrl('ete_brulant'),
  },
  {
    slug:        'la_longue_marche',
    nom:         'La Longue Marche',
    famille:     'evenement',
    description: 'Vainqueur de la ligue Saison Régulière.',
    image:       badgeImageUrl('la_longue_marche'),
  },
  {
    slug:        'jusqu_au_bout',
    nom:         'Jusqu\'au Bout',
    famille:     'evenement',
    description: 'Vainqueur de la ligue Playoffs.',
    image:       badgeImageUrl('jusqu_au_bout'),
  },
  {
    slug:        'le_sacre',
    nom:         'Le Sacre',
    famille:     'evenement',
    description: 'Vainqueur de la ligue NBA Finals.',
    image:       badgeImageUrl('le_sacre'),
  },
]
