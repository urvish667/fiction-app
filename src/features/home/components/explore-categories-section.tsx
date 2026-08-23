import Link from "next/link"
import { Button } from "@/components/ui/button"
import { slugify } from "@/lib/utils"

export const CATEGORIES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Historical",
  "Adventure",
  "Young Adult",
  "Drama",
  "Comedy",
  "Non-Fiction",
  "Memoir",
  "Biography",
  "Self-Help",
  "Children",
  "Crime",
  "Poetry",
  "LGBTQ+",
  "Short Story",
  "Urban",
  "Paranormal",
  "Dystopian",
  "Slice of Life",
  "Fanfiction",
]

export function ExploreCategoriesSection() {
  return (
    <section className="bg-muted/30 rounded-3xl p-8 md:p-12" aria-labelledby="explore-categories-heading">
      <div className="max-w-7xl mx-auto text-center">
        <h2 id="explore-categories-heading" className="text-2xl sm:text-3xl font-bold font-serif mb-4">
          Explore Categories &amp; Fiction Genres
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-8">
          Discover thousands of original stories spanning fantasy epics, contemporary romance, sci-fi adventures, thrillers, and mystery novels written by passionate creators worldwide.
        </p>
        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center">
          {CATEGORIES.map((category: string) => (
            <Button
              key={category}
              variant="secondary"
              className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm"
              asChild
            >
              <Link href={`/browse?genre=${encodeURIComponent(slugify(category))}`}>
                {category}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExploreCategoriesSection
