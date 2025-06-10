/**
 * Genre descriptions and keywords for SEO optimization
 * Used across the application for enhanced metadata generation
 */

export interface GenreInfo {
  description: string;
  keywords: string[];
}

/**
 * Comprehensive genre descriptions with SEO-optimized content
 */
export const categoryDescriptions: Record<string, GenreInfo> = {
  'Fantasy': {
    description: 'Immerse yourself in magical worlds filled with dragons, wizards, and epic adventures. Discover the best fantasy stories on FableSpace.',
    keywords: ['fantasy fiction', 'magic stories', 'dragons', 'wizards', 'epic fantasy', 'sword and sorcery', 'magical realism']
  },
  'Science Fiction': {
    description: 'Explore the future with cutting-edge sci-fi stories. From space exploration to dystopian futures, find your next favorite science fiction read.',
    keywords: ['sci-fi', 'space opera', 'dystopian', 'cyberpunk', 'time travel', 'aliens', 'future fiction']
  },
  'Romance': {
    description: 'Fall in love with heartwarming romance stories. From contemporary love stories to historical romance, discover your perfect romantic escape.',
    keywords: ['romance novels', 'love stories', 'contemporary romance', 'historical romance', 'romantic fiction']
  },
  'Mystery': {
    description: 'Solve puzzles and uncover secrets with thrilling mystery stories. From cozy mysteries to hard-boiled detective fiction.',
    keywords: ['mystery novels', 'detective fiction', 'crime stories', 'thriller', 'suspense', 'whodunit']
  },
  'Horror': {
    description: 'Experience spine-chilling horror stories that will keep you on the edge of your seat. From psychological horror to supernatural scares.',
    keywords: ['horror fiction', 'scary stories', 'supernatural horror', 'psychological thriller', 'ghost stories']
  },
  'Young Adult': {
    description: 'Discover coming-of-age stories perfect for young adult readers. From high school drama to dystopian adventures.',
    keywords: ['YA fiction', 'teen stories', 'coming of age', 'young adult romance', 'teen fantasy']
  },
  'Historical': {
    description: 'Journey through time with captivating historical fiction. Experience different eras through compelling storytelling.',
    keywords: ['historical fiction', 'period drama', 'historical romance', 'war stories', 'ancient history']
  },
  'Thriller': {
    description: 'Get your adrenaline pumping with heart-pounding thriller stories. From psychological thrillers to action-packed adventures.',
    keywords: ['thriller novels', 'suspense fiction', 'action thriller', 'psychological thriller', 'crime thriller']
  },
  'Adventure': {
    description: 'Embark on thrilling adventures and epic journeys. From treasure hunts to survival stories, discover action-packed tales of courage and exploration.',
    keywords: ['adventure fiction', 'action adventure', 'survival stories', 'treasure hunt', 'exploration', 'journey stories', 'heroic tales']
  },
  'Drama': {
    description: 'Experience powerful human stories filled with emotion, conflict, and character development. Explore the depths of human nature through compelling drama.',
    keywords: ['drama fiction', 'character drama', 'emotional stories', 'family drama', 'social drama', 'literary drama', 'human interest']
  },
  'Comedy': {
    description: 'Laugh out loud with hilarious comedy stories. From witty dialogue to absurd situations, find your next favorite funny read.',
    keywords: ['comedy fiction', 'humor stories', 'funny books', 'satirical fiction', 'comedic novels', 'light-hearted stories', 'parody']
  },
  'Non-Fiction': {
    description: 'Discover true stories, memoirs, and factual accounts. From personal experiences to educational content, explore real-world narratives.',
    keywords: ['non-fiction', 'true stories', 'real life', 'factual accounts', 'educational content', 'informative stories', 'documentary style']
  },
  'Memoir': {
    description: 'Read personal life stories and autobiographical accounts. Experience real journeys through the eyes of those who lived them.',
    keywords: ['memoir', 'autobiography', 'personal stories', 'life stories', 'biographical fiction', 'personal narrative', 'real experiences']
  },
  'Biography': {
    description: 'Explore the lives of fascinating people through detailed biographical stories. From historical figures to contemporary personalities.',
    keywords: ['biography', 'life story', 'biographical fiction', 'historical figures', 'personality profiles', 'character studies', 'real people']
  },
  'Self-Help': {
    description: 'Find inspiration and guidance through motivational stories and self-improvement narratives. Transform your life through powerful storytelling.',
    keywords: ['self-help', 'motivational stories', 'inspirational fiction', 'personal growth', 'life improvement', 'self-development', 'empowerment']
  },
  'Children': {
    description: 'Delightful stories perfect for young readers. From picture book narratives to early chapter books, discover age-appropriate tales.',
    keywords: ['children stories', 'kids fiction', 'young readers', 'family friendly', 'educational stories', 'moral tales', 'bedtime stories']
  },
  'Crime': {
    description: 'Dive into the dark world of crime fiction. From detective stories to criminal underworld tales, explore gripping crime narratives.',
    keywords: ['crime fiction', 'detective stories', 'police procedural', 'criminal stories', 'noir fiction', 'investigation stories', 'law enforcement']
  },
  'Poetry': {
    description: 'Experience the beauty of verse and poetic storytelling. From narrative poems to lyrical expressions, discover the art of poetry.',
    keywords: ['poetry', 'verse', 'poetic fiction', 'narrative poetry', 'lyrical stories', 'spoken word', 'poetic prose']
  },
  'LGBTQ+': {
    description: 'Celebrate diverse love stories and LGBTQ+ experiences. Find representation, romance, and authentic queer narratives.',
    keywords: ['LGBTQ+ fiction', 'queer stories', 'diverse romance', 'gay fiction', 'lesbian stories', 'transgender narratives', 'inclusive stories']
  },
  'Short Story': {
    description: 'Quick reads with powerful impact. Discover compelling short fiction that tells complete stories in bite-sized formats.',
    keywords: ['short stories', 'flash fiction', 'quick reads', 'micro fiction', 'short form', 'brief narratives', 'compact stories']
  },
  'Urban': {
    description: 'Stories set in city landscapes exploring urban life, culture, and experiences. From street fiction to metropolitan tales.',
    keywords: ['urban fiction', 'city stories', 'street fiction', 'metropolitan tales', 'urban culture', 'city life', 'contemporary urban']
  },
  'Paranormal': {
    description: 'Explore supernatural phenomena and otherworldly experiences. From ghosts to psychic abilities, discover stories beyond the ordinary.',
    keywords: ['paranormal fiction', 'supernatural stories', 'ghost stories', 'psychic fiction', 'otherworldly tales', 'mystical stories', 'occult fiction']
  },
  'Dystopian': {
    description: 'Enter dark futures and oppressive societies. Explore cautionary tales of what could go wrong in tomorrow\'s world.',
    keywords: ['dystopian fiction', 'dark future', 'oppressive society', 'post-apocalyptic', 'authoritarian fiction', 'social commentary', 'future warning']
  },
  'Slice of Life': {
    description: 'Everyday moments transformed into meaningful stories. Experience the beauty in ordinary life through realistic, relatable narratives.',
    keywords: ['slice of life', 'everyday stories', 'realistic fiction', 'ordinary life', 'daily experiences', 'relatable stories', 'contemporary life']
  },
  'Fanfiction': {
    description: 'Creative reimaginings of beloved characters and worlds. Explore fan-created stories that expand on existing universes.',
    keywords: ['fanfiction', 'fan stories', 'fandom fiction', 'character reimagining', 'universe expansion', 'fan creativity', 'derivative works']
  }
};

/**
 * Get genre information by name
 */
export function getGenreInfo(genreName: string): GenreInfo | null {
  return categoryDescriptions[genreName] || null;
}

/**
 * Get all available genre names
 */
export function getAllGenreNames(): string[] {
  return Object.keys(categoryDescriptions);
}

/**
 * Check if a genre exists in our descriptions
 */
export function isValidGenre(genreName: string): boolean {
  return genreName in categoryDescriptions;
}
