/**
 * Genre descriptions and keywords for SEO optimization
 * Used across the application for enhanced metadata generation and UI display
 */

export interface GenreInfo {
  description: string;
  keywords: string[];
  characteristics: string[];
  popularTags: string[];
  icon: string;
}

/**
 * Comprehensive genre descriptions with SEO-optimized content
 */
export const categoryDescriptions: Record<string, GenreInfo> = {
  'Fantasy': {
    description: 'Enter magical realms where anything is possible. Fantasy stories transport readers to worlds filled with magic, mythical creatures, and epic adventures that challenge heroes to save kingdoms, master ancient powers, and discover their true destinies.',
    keywords: ['fantasy fiction', 'magic stories', 'dragons', 'wizards', 'epic fantasy', 'sword and sorcery', 'magical realism'],
    characteristics: ['Magic systems', 'Mythical creatures', 'Epic quests', 'World-building'],
    popularTags: ['dragons', 'magic', 'wizards', 'elves', 'adventure'],
    icon: '🐉'
  },
  'Science Fiction': {
    description: 'Explore the boundaries of human imagination and scientific possibility. Science fiction stories examine how technology, space exploration, and scientific advancement shape our future, often questioning what it means to be human in an ever-changing universe.',
    keywords: ['sci-fi', 'space opera', 'dystopian', 'cyberpunk', 'time travel', 'aliens', 'future fiction'],
    characteristics: ['Advanced technology', 'Space exploration', 'Future societies', 'Scientific concepts'],
    popularTags: ['space', 'aliens', 'time-travel', 'cyberpunk', 'dystopian'],
    icon: '🚀'
  },
  'Romance': {
    description: 'Experience the power of love in all its forms. Romance stories celebrate human connection, from sweet first loves to passionate affairs, exploring the emotional journey of characters as they navigate relationships, overcome obstacles, and find their happily ever after.',
    keywords: ['romance novels', 'love stories', 'contemporary romance', 'historical romance', 'romantic fiction'],
    characteristics: ['Emotional depth', 'Character development', 'Relationship dynamics', 'Happy endings'],
    popularTags: ['love', 'relationships', 'passion', 'heartbreak', 'wedding'],
    icon: '💕'
  },
  'Mystery': {
    description: 'Unravel puzzles and solve crimes alongside brilliant detectives and amateur sleuths. Mystery stories challenge readers to piece together clues, suspect motives, and discover the truth behind perplexing cases that keep you guessing until the final revelation.',
    keywords: ['mystery novels', 'detective fiction', 'crime stories', 'thriller', 'suspense', 'whodunit'],
    characteristics: ['Plot twists', 'Clues and red herrings', 'Detective work', 'Suspenseful pacing'],
    popularTags: ['detective', 'crime', 'investigation', 'murder', 'secrets'],
    icon: '🔍'
  },
  'Horror': {
    description: 'Confront your deepest fears and experience spine-chilling thrills. Horror stories explore the darker side of human nature and the supernatural, creating atmospheric tension and psychological scares that linger long after the final page.',
    keywords: ['horror fiction', 'scary stories', 'supernatural horror', 'psychological thriller', 'ghost stories'],
    characteristics: ['Atmospheric tension', 'Psychological scares', 'Supernatural elements', 'Dark themes'],
    popularTags: ['scary', 'supernatural', 'ghosts', 'monsters', 'psychological'],
    icon: '👻'
  },
  'Young Adult': {
    description: 'Navigate the challenges of growing up through compelling coming-of-age stories. Young Adult fiction explores themes of identity, friendship, first love, and self-discovery, resonating with readers of all ages who remember the intensity of youth.',
    keywords: ['YA fiction', 'teen stories', 'coming of age', 'young adult romance', 'teen fantasy'],
    characteristics: ['Coming-of-age themes', 'Teen protagonists', 'Identity exploration', 'Contemporary issues'],
    popularTags: ['teen', 'school', 'friendship', 'first-love', 'growing-up'],
    icon: '🌟'
  },
  'Historical': {
    description: 'Journey through time to experience different eras and cultures. Historical fiction brings the past to life through meticulously researched settings and authentic characters, offering insights into how people lived, loved, and survived in bygone times.',
    keywords: ['historical fiction', 'period drama', 'historical romance', 'war stories', 'ancient history'],
    characteristics: ['Historical accuracy', 'Period settings', 'Cultural exploration', 'Research-based'],
    popularTags: ['historical', 'period', 'war', 'ancient', 'culture'],
    icon: '🏛️'
  },
  'Thriller': {
    description: 'Experience heart-pounding suspense and adrenaline-fueled action. Thriller stories keep readers on the edge of their seats with fast-paced plots, dangerous situations, and protagonists racing against time to prevent disaster or escape peril.',
    keywords: ['thriller novels', 'suspense fiction', 'action thriller', 'psychological thriller', 'crime thriller'],
    characteristics: ['Fast-paced action', 'High stakes', 'Suspenseful plot', 'Tension building'],
    popularTags: ['suspense', 'action', 'danger', 'chase', 'conspiracy'],
    icon: '⚡'
  },
  'Adventure': {
    description: 'Embark on thrilling adventures and epic journeys. From treasure hunts to survival stories, discover action-packed tales of courage and exploration.',
    keywords: ['adventure fiction', 'action adventure', 'survival stories', 'treasure hunt', 'exploration', 'journey stories', 'heroic tales'],
    characteristics: ['Action-packed plots', 'Heroic journeys', 'Exploration themes', 'Survival challenges'],
    popularTags: ['adventure', 'journey', 'exploration', 'survival', 'treasure'],
    icon: '🗺️'
  },
  'Drama': {
    description: 'Experience powerful human stories filled with emotion, conflict, and character development. Explore the depths of human nature through compelling drama.',
    keywords: ['drama fiction', 'character drama', 'emotional stories', 'family drama', 'social drama', 'literary drama', 'human interest'],
    characteristics: ['Character development', 'Emotional depth', 'Social issues', 'Human conflict'],
    popularTags: ['drama', 'family', 'relationships', 'conflict', 'emotion'],
    icon: '🎭'
  },
  'Comedy': {
    description: 'Laugh out loud with hilarious comedy stories. From witty dialogue to absurd situations, find your next favorite funny read.',
    keywords: ['comedy fiction', 'humor stories', 'funny books', 'satirical fiction', 'comedic novels', 'light-hearted stories', 'parody'],
    characteristics: ['Humor and wit', 'Light-hearted tone', 'Satirical elements', 'Comic situations'],
    popularTags: ['funny', 'humor', 'comedy', 'satire', 'witty'],
    icon: '😂'
  },
  'Non-Fiction': {
    description: 'Discover true stories, memoirs, and factual accounts. From personal experiences to educational content, explore real-world narratives.',
    keywords: ['non-fiction', 'true stories', 'real life', 'factual accounts', 'educational content', 'informative stories', 'documentary style'],
    characteristics: ['Factual content', 'Real experiences', 'Educational value', 'Documentary style'],
    popularTags: ['true-story', 'real-life', 'facts', 'educational', 'documentary'],
    icon: '📚'
  },
  'Memoir': {
    description: 'Read personal life stories and autobiographical accounts. Experience real journeys through the eyes of those who lived them.',
    keywords: ['memoir', 'autobiography', 'personal stories', 'life stories', 'biographical fiction', 'personal narrative', 'real experiences'],
    characteristics: ['Personal narrative', 'Life experiences', 'Autobiographical', 'Reflective tone'],
    popularTags: ['memoir', 'autobiography', 'personal', 'life-story', 'reflection'],
    icon: '📖'
  },
  'Biography': {
    description: 'Explore the lives of fascinating people through detailed biographical stories. From historical figures to contemporary personalities.',
    keywords: ['biography', 'life story', 'biographical fiction', 'historical figures', 'personality profiles', 'character studies', 'real people'],
    characteristics: ['Life stories', 'Historical figures', 'Character studies', 'Research-based'],
    popularTags: ['biography', 'historical-figures', 'famous-people', 'life-story', 'real-person'],
    icon: '👤'
  },
  'Self-Help': {
    description: 'Find inspiration and guidance through motivational stories and self-improvement narratives. Transform your life through powerful storytelling.',
    keywords: ['self-help', 'motivational stories', 'inspirational fiction', 'personal growth', 'life improvement', 'self-development', 'empowerment'],
    characteristics: ['Motivational content', 'Personal growth', 'Life improvement', 'Inspirational themes'],
    popularTags: ['self-help', 'motivation', 'inspiration', 'personal-growth', 'improvement'],
    icon: '💪'
  },
  'Crime': {
    description: 'Dive into the dark world of crime fiction. From detective stories to criminal underworld tales, explore gripping crime narratives.',
    keywords: ['crime fiction', 'detective stories', 'police procedural', 'criminal stories', 'noir fiction', 'investigation stories', 'law enforcement'],
    characteristics: ['Criminal investigations', 'Police procedures', 'Dark themes', 'Justice themes'],
    popularTags: ['crime', 'police', 'investigation', 'justice', 'law'],
    icon: '🚔'
  },
  'Poetry': {
    description: 'Experience the beauty of verse and poetic storytelling. From narrative poems to lyrical expressions, discover the art of poetry.',
    keywords: ['poetry', 'verse', 'poetic fiction', 'narrative poetry', 'lyrical stories', 'spoken word', 'poetic prose'],
    characteristics: ['Lyrical language', 'Rhythmic structure', 'Emotional expression', 'Artistic form'],
    popularTags: ['poetry', 'verse', 'lyrical', 'spoken-word', 'artistic'],
    icon: '🎨'
  },
  'LGBTQ+': {
    description: 'Celebrate diverse love stories and LGBTQ+ experiences. Find representation, romance, and authentic queer narratives.',
    keywords: ['LGBTQ+ fiction', 'queer stories', 'diverse romance', 'gay fiction', 'lesbian stories', 'transgender narratives', 'inclusive stories'],
    characteristics: ['Diverse representation', 'Queer experiences', 'Identity exploration', 'Inclusive narratives'],
    popularTags: ['LGBTQ+', 'queer', 'diverse', 'representation', 'identity'],
    icon: '🏳️‍🌈'
  },
  'Short Story': {
    description: 'Quick reads with powerful impact. Discover compelling short fiction that tells complete stories in bite-sized formats.',
    keywords: ['short stories', 'flash fiction', 'quick reads', 'micro fiction', 'short form', 'brief narratives', 'compact stories'],
    characteristics: ['Concise storytelling', 'Quick reads', 'Complete narratives', 'Impactful endings'],
    popularTags: ['short-story', 'flash-fiction', 'quick-read', 'micro-fiction', 'brief'],
    icon: '📄'
  },
  'Urban': {
    description: 'Stories set in city landscapes exploring urban life, culture, and experiences. From street fiction to metropolitan tales.',
    keywords: ['urban fiction', 'city stories', 'street fiction', 'metropolitan tales', 'urban culture', 'city life', 'contemporary urban'],
    characteristics: ['City settings', 'Urban culture', 'Street life', 'Metropolitan themes'],
    popularTags: ['urban', 'city', 'street', 'metropolitan', 'contemporary'],
    icon: '🏙️'
  },
  'Paranormal': {
    description: 'Explore supernatural phenomena and otherworldly experiences. From ghosts to psychic abilities, discover stories beyond the ordinary.',
    keywords: ['paranormal fiction', 'supernatural stories', 'ghost stories', 'psychic fiction', 'otherworldly tales', 'mystical stories', 'occult fiction'],
    characteristics: ['Supernatural elements', 'Psychic abilities', 'Otherworldly beings', 'Mystical themes'],
    popularTags: ['paranormal', 'supernatural', 'psychic', 'otherworldly', 'mystical'],
    icon: '🔮'
  },
  'Dystopian': {
    description: 'Enter dark futures and oppressive societies. Explore cautionary tales of what could go wrong in tomorrow\'s world.',
    keywords: ['dystopian fiction', 'dark future', 'oppressive society', 'post-apocalyptic', 'authoritarian fiction', 'social commentary', 'future warning'],
    characteristics: ['Dark futures', 'Oppressive societies', 'Social commentary', 'Cautionary tales'],
    popularTags: ['dystopian', 'dark-future', 'oppression', 'post-apocalyptic', 'authoritarian'],
    icon: '🌆'
  },
  'Slice of Life': {
    description: 'Everyday moments transformed into meaningful stories. Experience the beauty in ordinary life through realistic, relatable narratives.',
    keywords: ['slice of life', 'everyday stories', 'realistic fiction', 'ordinary life', 'daily experiences', 'relatable stories', 'contemporary life'],
    characteristics: ['Everyday moments', 'Realistic portrayal', 'Relatable characters', 'Ordinary life'],
    popularTags: ['slice-of-life', 'everyday', 'realistic', 'ordinary', 'relatable'],
    icon: '☕'
  },
  'Fanfiction': {
    description: 'Creative reimaginings of beloved characters and worlds. Explore fan-created stories that expand on existing universes.',
    keywords: ['fanfiction', 'fan stories', 'fandom fiction', 'character reimagining', 'universe expansion', 'fan creativity', 'derivative works'],
    characteristics: ['Fan creativity', 'Character reimagining', 'Universe expansion', 'Fandom culture'],
    popularTags: ['fanfiction', 'fandom', 'fan-created', 'reimagining', 'derivative'],
    icon: '📝'
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
