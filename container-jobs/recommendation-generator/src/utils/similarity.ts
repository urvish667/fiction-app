/**
 * Utility functions for computing similarity between stories
 */

// Define types locally to avoid Prisma client dependency issues
interface Tag {
  id: string;
  name: string;
}

interface Genre {
  id: string;
  name: string;
}

/**
 * Type for a story with its tags and genre
 */
export type StoryWithTagsAndGenre = {
  id: string;
  title: string;
  status: string;
  authorId: string;
  genreId: string | null;
  genre: Genre | null;
  tags: { tag: Tag }[];
};

/**
 * Computes the cosine similarity between two binary vectors
 * @param vectorA First binary vector
 * @param vectorB Second binary vector
 * @returns Cosine similarity score (0-1)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same length");
  }

  // If either vector is all zeros, similarity is 0
  const sumA = vectorA.reduce((sum, val) => sum + val, 0);
  const sumB = vectorB.reduce((sum, val) => sum + val, 0);
  if (sumA === 0 || sumB === 0) return 0;

  // Compute dot product
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  // Compute magnitudes
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));

  // Compute cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Computes the Jaccard similarity between two binary vectors
 * @param vectorA First binary vector
 * @param vectorB Second binary vector
 * @returns Jaccard similarity score (0-1)
 */
export function jaccardSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same length");
  }

  let intersection = 0;
  let union = 0;

  for (let i = 0; i < vectorA.length; i++) {
    if (vectorA[i] === 1 || vectorB[i] === 1) {
      union++;
      if (vectorA[i] === 1 && vectorB[i] === 1) {
        intersection++;
      }
    }
  }

  return union === 0 ? 0 : intersection / union;
}

/**
 * Converts a story's genre and tags to a binary vector
 * @param story The story with tags and genre
 * @param allGenres All possible genres
 * @param allTags All possible tags
 * @returns Binary vector representing the story's genre and tags
 */
export function storyToBinaryVector(
  story: StoryWithTagsAndGenre,
  allGenres: Genre[],
  allTags: Tag[]
): number[] {
  // Create a vector with zeros
  const vector: number[] = Array(allGenres.length + allTags.length).fill(0);

  // Set genre bit
  if (story.genreId) {
    const genreIndex = allGenres.findIndex((g) => g.id === story.genreId);
    if (genreIndex !== -1) {
      vector[genreIndex] = 1;
    }
  }

  // Set tag bits
  const storyTagIds = story.tags.map((t) => t.tag.id);
  for (let i = 0; i < allTags.length; i++) {
    if (storyTagIds.includes(allTags[i].id)) {
      vector[allGenres.length + i] = 1;
    }
  }

  return vector;
}

/**
 * Computes similarity scores between a story and all other stories
 * @param targetStory The target story
 * @param allStories All stories to compare with
 * @param allGenres All possible genres
 * @param allTags All possible tags
 * @param similarityFn Function to compute similarity (cosine or jaccard)
 * @param excludeSameAuthor Whether to exclude stories by the same author
 * @returns Array of stories with similarity scores, sorted by score (descending)
 */
export function computeSimilarStories(
  targetStory: StoryWithTagsAndGenre,
  allStories: StoryWithTagsAndGenre[],
  allGenres: Genre[],
  allTags: Tag[],
  similarityFn: (a: number[], b: number[]) => number = cosineSimilarity,
  excludeSameAuthor: boolean = false
): { story: StoryWithTagsAndGenre; score: number }[] {
  // Convert target story to binary vector
  const targetVector = storyToBinaryVector(targetStory, allGenres, allTags);

  // Compute similarity scores for all stories
  const similarStories = allStories
    .filter((story) => {
      // Exclude the target story itself
      if (story.id === targetStory.id) return false;

      // Exclude draft stories
      if (story.status === "draft") return false;

      // Optionally exclude stories by the same author
      if (excludeSameAuthor && story.authorId === targetStory.authorId) return false;

      return true;
    })
    .map((story) => {
      const storyVector = storyToBinaryVector(story, allGenres, allTags);
      const score = similarityFn(targetVector, storyVector);
      return { story, score };
    });

  // Sort by similarity score (descending)
  return similarStories.sort((a, b) => b.score - a.score);
}
