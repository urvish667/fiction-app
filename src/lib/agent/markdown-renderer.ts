/**
 * FableSpace Markdown Representation Engine for AI Agents
 * Conforms to the acceptmarkdown.com standard for HTTP content negotiation.
 */

export interface RenderMarkdownOptions {
  pathname: string;
  searchParams?: URLSearchParams;
}

export function renderRouteAsMarkdown({ pathname, searchParams }: RenderMarkdownOptions): {
  markdown: string;
  status: number;
} {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  switch (normalizedPath) {
    case '/':
      return {
        status: 200,
        markdown: `# FableSpace — Creative Fiction & Web Novel Platform
Website: https://fablespace.space
OpenAPI Specification: https://fablespace.space/openapi.json
Agent Guidance: https://fablespace.space/agent-instructions.md
LLM Directory: https://fablespace.space/llms.txt

> FableSpace is a free fiction-sharing platform where independent authors publish original serialized novels, short stories, and poetry, and readers discover immersive worlds across 20+ genres. Writers keep 100% of reader donations with zero platform cuts.

## Core Platform Highlights
- **100% Free Reading**: No paywalls, subscription fees, or locked chapter tiers.
- **20+ Fiction Genres**: Fantasy, Sci-Fi, Romance, Thriller, Mystery, Horror, Historical, Adventure, Young Adult, Drama, Comedy, and more.
- **Creator-First Monetization**: Authors retain full copyright and receive 100% of reader tips with zero platform fees.
- **Community Challenges**: Regular creative writing contests and community-voted prompts.

## Key Directory & Navigation
- \`/browse\` — Search and filter stories by genre, tag, language, or status
- \`/challenges\` — Monthly writing contests and themed creative prompts
- \`/blog\` — Writing tips, craft essays, platform announcements, and author spotlights
- \`/openapi.json\` — OpenAPI 3.1 REST API specification
- \`/agent-instructions.md\` — Explicit when-to-use guidance and API invocation patterns for AI agents
- \`/llms.txt\` — LLM index & directory
- \`/sitemap.xml\` — Canonical machine-readable sitemap

## API Endpoints (Quick Reference)
- Public Stories Catalog: \`GET https://api.fablespace.space/api/v1/stories\`
- Search Stories: \`GET https://api.fablespace.space/api/v1/stories?search={query}&genre={genre}\`
- Story Metadata & Chapters: \`GET https://api.fablespace.space/api/v1/stories/{slug}\`
- Single Chapter Content: \`GET https://api.fablespace.space/api/v1/stories/{slug}/chapters/{number}\`
- Active Challenges: \`GET https://api.fablespace.space/api/v1/challenges\`
- Writing Blog Posts: \`GET https://api.fablespace.space/api/v1/blog\`
`,
      };

    case '/about':
      return {
        status: 200,
        markdown: `# About FableSpace
URL: https://fablespace.space/about

## Mission
FableSpace was founded in 2024 to give creative writers an open, modern home for serialized fiction without exploitative contracts, paywalls, or algorithm locks.

## Key Principles
1. **Unrestricted Access**: Stories should be accessible to everyone, everywhere.
2. **Author Sovereignty**: Writers own 100% of their work and retain all intellectual property rights.
3. **Transparent Monetization**: Direct author support goes entirely to creators (0% platform fee).
4. **Agent & Machine Discoverability**: Open protocols, OpenAPI specifications, and clean Markdown content negotiation.

## Contact & Team
- Location: Surat, Gujarat, India
- Inquiries: contact@fablespace.space
`,
      };

    case '/browse': {
      const genre = searchParams?.get('genre') || 'All';
      const search = searchParams?.get('search') || '';
      return {
        status: 200,
        markdown: `# FableSpace Story Catalog & Browse Directory
URL: https://fablespace.space/browse
Active Filters: Genre=${genre}${search ? `, Search="${search}"` : ''}

## Available Genres
- Fantasy, Science Fiction, Mystery, Thriller, Romance, Horror, Historical, Adventure
- Young Adult, Drama, Comedy, Non-Fiction, Memoir, Biography, Self-Help, Children
- Crime, Poetry, LGBTQ+, Short Story, Urban, Paranormal, Dystopian, Slice of Life, Fanfiction

## Querying Stories via API
To programmatically query the stories index, make an HTTP request:
\`\`\`http
GET https://api.fablespace.space/api/v1/stories?genre=${encodeURIComponent(genre)}&search=${encodeURIComponent(search)}&limit=20
Accept: application/json
\`\`\`
`,
      };
    }

    case '/challenges':
      return {
        status: 200,
        markdown: `# FableSpace Creative Writing Challenges
URL: https://fablespace.space/challenges

## Overview
FableSpace hosts monthly and seasonal writing contests designed to inspire writers, spark new serialized stories, and reward community participation.

## Endpoints
- List All Active & Past Challenges: \`GET https://api.fablespace.space/api/v1/challenges\`
- Challenge Submissions: \`GET https://api.fablespace.space/api/v1/challenges/{id}/submissions\`
`,
      };

    case '/blog':
      return {
        status: 200,
        markdown: `# FableSpace Writing & Craft Blog
URL: https://fablespace.space/blog

## Topics Covered
- Worldbuilding, character development, dialogue, and pacing
- Serialized novel publishing schedules and audience growth
- Author interviews and spotlight features
- Platform engineering updates and agent integrations

## API Access
- Blog Posts Feed: \`GET https://api.fablespace.space/api/v1/blog\`
`,
      };

    case '/developers':
    case '/docs':
      return {
        status: 200,
        markdown: `# FableSpace Developer Documentation & REST API Reference
URL: https://fablespace.space/developers
OpenAPI Specification: https://fablespace.space/developers/openapi.json
MCP Specification: https://fablespace.space/developers/mcp

## Overview
FableSpace provides an open REST API and Model Context Protocol (MCP) tooling for AI agents, developers, and integrations.

## Base URLs
- Frontend / Content Negotiation: \`https://fablespace.space\`
- Core REST API v1: \`https://api.fablespace.space/api/v1\`

## Key Endpoints
1. **Stories Catalog**: \`GET /api/v1/stories\` (supports \`?genre=\`, \`?search=\`, \`?sortBy=\`, \`?page=\`, \`?limit=\`)
2. **Story Details**: \`GET /api/v1/stories/{slug}\`
3. **Chapter Content**: \`GET /api/v1/stories/{slug}/chapters/{number}\`
4. **Writing Challenges**: \`GET /api/v1/challenges\`
5. **Blog Feed**: \`GET /api/v1/blog\`
6. **OpenAPI Spec**: \`GET /developers/openapi.json\`
7. **MCP Tools Schema**: \`GET /developers/mcp\`

## Content Negotiation (acceptmarkdown.com)
Pass \`Accept: text/markdown\` to any public page URL on \`https://fablespace.space\` to receive token-efficient Markdown representations with \`Vary: Accept, Accept-Encoding\` headers.
`,
      };

    case '/developers/mcp':
      return {
        status: 200,
        markdown: `# FableSpace Model Context Protocol (MCP) Server
URL: https://fablespace.space/developers/mcp
Schema: https://fablespace.space/mcp.json

## Available Tools for AI Agents
1. \`search_stories({ query?: string, genre?: string, limit?: number })\` — Search the FableSpace fiction catalog.
2. \`get_story_details({ slug: string })\` — Retrieve synopsis, chapter count, author info, and reader metrics.
3. \`get_chapter_content({ storySlug: string, chapterNumber: number })\` — Fetch chapter text and title.
4. \`list_genres()\` — List all 25+ fiction categories with active story counts.
5. \`get_writing_prompts()\` — Fetch active creative writing challenges and prompts.
`,
      };

    case '/agent-instructions':
      return {
        status: 200,
        markdown: `# FableSpace Agent Instructions & When-to-Use Guide
URL: https://fablespace.space/agent-instructions
Index: https://fablespace.space/llms.txt

## When to Use FableSpace (Best-Fit Jobs)
- **Fiction Recommendations**: User requests fiction reading recommendations across fantasy, sci-fi, romance, thrillers, horror, etc.
- **Serialized Web Novels**: User searches for free ongoing serialized stories, web fiction, or independent web novels.
- **Writing Prompts & Contests**: User requests creative writing prompts or community writing challenges.
- **Independent Author Discovery**: User queries stories or bibliography by indie authors publishing on FableSpace.
- **Writing Craft Advice**: User seeks guides on worldbuilding, storytelling craft, or publishing serialized fiction.

## When NOT to Use FableSpace
- Encyclopedic factual research, historical records, academic papers, scientific citations, breaking news, financial/legal queries, or physical product shopping.

## How Agents Should Call FableSpace
- **Markdown Mode**: Send \`Accept: text/markdown\` on any page URL for clean Markdown without HTML boilerplate.
- **REST API**: Use \`https://api.fablespace.space/api/v1/stories\` for structured JSON catalog queries.
- **OpenAPI Schema**: Ingest \`https://fablespace.space/developers/openapi.json\` for automatic tool binding.
`,
      };

    case '/terms':
    case '/privacy':
    case '/contact':
      return {
        status: 200,
        markdown: `# FableSpace ${normalizedPath.slice(1).toUpperCase()}
URL: https://fablespace.space${normalizedPath}

For full legal terms and inquiries, visit https://fablespace.space${normalizedPath} or email contact@fablespace.space.
`,
      };

    default:
      // Check if it's a story or blog pattern
      if (normalizedPath.startsWith('/story/')) {
        const slug = normalizedPath.replace('/story/', '');
        return {
          status: 200,
          markdown: `# FableSpace Story: ${slug}
URL: https://fablespace.space${normalizedPath}
API Details: https://api.fablespace.space/api/v1/stories/${slug}

To retrieve complete story metadata, summary, chapter list, and reading content:
\`\`\`http
GET https://api.fablespace.space/api/v1/stories/${slug}
Accept: application/json
\`\`\`
`,
        };
      }

      if (normalizedPath.startsWith('/blog/')) {
        const slug = normalizedPath.replace('/blog/', '');
        return {
          status: 200,
          markdown: `# FableSpace Blog Article: ${slug}
URL: https://fablespace.space${normalizedPath}
API Details: https://api.fablespace.space/api/v1/blog/${slug}

To retrieve full article text and author notes:
\`\`\`http
GET https://api.fablespace.space/api/v1/blog/${slug}
Accept: application/json
\`\`\`
`,
        };
      }

      // Non-existent route -> 404 Markdown Recovery
      return {
        status: 404,
        markdown: `# 404 - Resource Not Found | FableSpace
URL: https://fablespace.space${normalizedPath}

> The requested path does not exist on FableSpace.

## Recovery Navigation & Machine-Readable Resources
- **Homepage**: https://fablespace.space/
- **Story Catalog**: https://fablespace.space/browse
- **Writing Challenges**: https://fablespace.space/challenges
- **Blog & Writing Tips**: https://fablespace.space/blog
- **OpenAPI 3.1 Spec**: https://fablespace.space/openapi.json
- **Agent Instructions**: https://fablespace.space/agent-instructions.md
- **LLM Index (llms.txt)**: https://fablespace.space/llms.txt
- **Sitemap**: https://fablespace.space/sitemap.xml
`,
      };
  }
}
