import {
  cosineSimilarity,
  jaccardSimilarity,
  storyToBinaryVector,
  computeSimilarStories,
  StoryWithTagsAndGenre,
} from "@/utils/similarity";

describe("Similarity Utilities", () => {
  // Test cosine similarity
  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vectorA = [1, 0, 1, 1, 0];
      const vectorB = [1, 0, 1, 1, 0];
      expect(cosineSimilarity(vectorA, vectorB)).toBe(1);
    });

    it("should return 0 for orthogonal vectors", () => {
      const vectorA = [1, 0, 0, 0, 0];
      const vectorB = [0, 1, 0, 0, 0];
      expect(cosineSimilarity(vectorA, vectorB)).toBe(0);
    });

    it("should return a value between 0 and 1 for partially similar vectors", () => {
      const vectorA = [1, 0, 1, 1, 0];
      const vectorB = [1, 1, 0, 1, 0];
      const similarity = cosineSimilarity(vectorA, vectorB);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it("should throw an error for vectors of different lengths", () => {
      const vectorA = [1, 0, 1];
      const vectorB = [1, 0, 1, 0];
      expect(() => cosineSimilarity(vectorA, vectorB)).toThrow();
    });

    it("should return 0 if either vector is all zeros", () => {
      const vectorA = [0, 0, 0];
      const vectorB = [1, 1, 0];
      expect(cosineSimilarity(vectorA, vectorB)).toBe(0);
      expect(cosineSimilarity(vectorB, vectorA)).toBe(0);
    });
  });

  // Test Jaccard similarity
  describe("jaccardSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vectorA = [1, 0, 1, 1, 0];
      const vectorB = [1, 0, 1, 1, 0];
      expect(jaccardSimilarity(vectorA, vectorB)).toBe(1);
    });

    it("should return 0 for completely different vectors", () => {
      const vectorA = [1, 1, 1, 0, 0];
      const vectorB = [0, 0, 0, 1, 1];
      expect(jaccardSimilarity(vectorA, vectorB)).toBe(0);
    });

    it("should return a value between 0 and 1 for partially similar vectors", () => {
      const vectorA = [1, 0, 1, 1, 0];
      const vectorB = [1, 1, 0, 1, 0];
      const similarity = jaccardSimilarity(vectorA, vectorB);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it("should throw an error for vectors of different lengths", () => {
      const vectorA = [1, 0, 1];
      const vectorB = [1, 0, 1, 0];
      expect(() => jaccardSimilarity(vectorA, vectorB)).toThrow();
    });

    it("should return 0 if both vectors are all zeros", () => {
      const vectorA = [0, 0, 0];
      const vectorB = [0, 0, 0];
      expect(jaccardSimilarity(vectorA, vectorB)).toBe(0);
    });
  });

  // Test story to binary vector conversion
  describe("storyToBinaryVector", () => {
    const mockGenres = [
      { id: "genre1", name: "Fantasy" },
      { id: "genre2", name: "Sci-Fi" },
      { id: "genre3", name: "Mystery" },
    ];

    const mockTags = [
      { id: "tag1", name: "Adventure" },
      { id: "tag2", name: "Magic" },
      { id: "tag3", name: "Space" },
      { id: "tag4", name: "Crime" },
    ];

    it("should convert a story with genre and tags to a binary vector", () => {
      const story: StoryWithTagsAndGenre = {
        id: "story1",
        title: "Test Story",
        status: "ongoing",
        authorId: "author1",
        genreId: "genre1",
        genre: mockGenres[0],
        tags: [
          { tag: mockTags[0] },
          { tag: mockTags[1] },
        ],
      };

      const vector = storyToBinaryVector(story, mockGenres, mockTags);
      expect(vector).toEqual([1, 0, 0, 1, 1, 0, 0]);
    });

    it("should handle a story with no genre", () => {
      const story: StoryWithTagsAndGenre = {
        id: "story1",
        title: "Test Story",
        status: "ongoing",
        authorId: "author1",
        genreId: null,
        genre: null,
        tags: [
          { tag: mockTags[0] },
          { tag: mockTags[1] },
        ],
      };

      const vector = storyToBinaryVector(story, mockGenres, mockTags);
      expect(vector).toEqual([0, 0, 0, 1, 1, 0, 0]);
    });

    it("should handle a story with no tags", () => {
      const story: StoryWithTagsAndGenre = {
        id: "story1",
        title: "Test Story",
        status: "ongoing",
        authorId: "author1",
        genreId: "genre2",
        genre: mockGenres[1],
        tags: [],
      };

      const vector = storyToBinaryVector(story, mockGenres, mockTags);
      expect(vector).toEqual([0, 1, 0, 0, 0, 0, 0]);
    });

    it("should handle a story with no genre and no tags", () => {
      const story: StoryWithTagsAndGenre = {
        id: "story1",
        title: "Test Story",
        status: "ongoing",
        authorId: "author1",
        genreId: null,
        genre: null,
        tags: [],
      };

      const vector = storyToBinaryVector(story, mockGenres, mockTags);
      expect(vector).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });

  // Test compute similar stories
  describe("computeSimilarStories", () => {
    const mockGenres = [
      { id: "genre1", name: "Fantasy" },
      { id: "genre2", name: "Sci-Fi" },
    ];

    const mockTags = [
      { id: "tag1", name: "Adventure" },
      { id: "tag2", name: "Magic" },
      { id: "tag3", name: "Space" },
    ];

    const mockStories: StoryWithTagsAndGenre[] = [
      {
        id: "story1",
        title: "Fantasy Adventure",
        status: "ongoing",
        authorId: "author1",
        genreId: "genre1",
        genre: mockGenres[0],
        tags: [{ tag: mockTags[0] }, { tag: mockTags[1] }],
      },
      {
        id: "story2",
        title: "Fantasy Magic",
        status: "ongoing",
        authorId: "author2",
        genreId: "genre1",
        genre: mockGenres[0],
        tags: [{ tag: mockTags[1] }],
      },
      {
        id: "story3",
        title: "Sci-Fi Space",
        status: "ongoing",
        authorId: "author1",
        genreId: "genre2",
        genre: mockGenres[1],
        tags: [{ tag: mockTags[2] }],
      },
      {
        id: "story4",
        title: "Draft Story",
        status: "draft",
        authorId: "author3",
        genreId: "genre1",
        genre: mockGenres[0],
        tags: [{ tag: mockTags[0] }, { tag: mockTags[1] }],
      },
    ];

    it("should compute similar stories and exclude the target story", () => {
      const targetStory = mockStories[0];
      const similarStories = computeSimilarStories(
        targetStory,
        mockStories,
        mockGenres,
        mockTags
      );

      // Should exclude the target story
      expect(similarStories.length).toBe(2);
      expect(similarStories.find(s => s.story.id === targetStory.id)).toBeUndefined();

      // Should exclude draft stories
      expect(similarStories.find(s => s.story.id === "story4")).toBeUndefined();

      // Should sort by similarity score (descending)
      expect(similarStories[0].story.id).toBe("story2");
      expect(similarStories[1].story.id).toBe("story3");
    });

    it("should exclude stories by the same author when excludeSameAuthor is true", () => {
      const targetStory = mockStories[0];
      const similarStories = computeSimilarStories(
        targetStory,
        mockStories,
        mockGenres,
        mockTags,
        cosineSimilarity,
        true
      );

      // Should exclude stories by the same author
      expect(similarStories.length).toBe(1);
      expect(similarStories.find(s => s.story.authorId === targetStory.authorId)).toBeUndefined();
      expect(similarStories[0].story.id).toBe("story2");
    });

    it("should use Jaccard similarity when specified", () => {
      const targetStory = mockStories[0];
      const similarStories = computeSimilarStories(
        targetStory,
        mockStories,
        mockGenres,
        mockTags,
        jaccardSimilarity
      );

      // Results should be the same for this simple test case
      expect(similarStories.length).toBe(2);
      expect(similarStories[0].story.id).toBe("story2");
      expect(similarStories[1].story.id).toBe("story3");
    });
  });
});
