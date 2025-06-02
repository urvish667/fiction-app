"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, TrendingUp } from "lucide-react"

interface CategoryDescriptionProps {
  genre: string
  totalStories?: number
  language?: string
  status?: string
}

// Category-specific descriptions and information
const categoryInfo: Record<string, {
  description: string
  characteristics: string[]
  popularTags: string[]
  icon: string
}> = {
  'Fantasy': {
    description: 'Enter magical realms where anything is possible. Fantasy stories transport readers to worlds filled with magic, mythical creatures, and epic adventures that challenge heroes to save kingdoms, master ancient powers, and discover their true destinies.',
    characteristics: ['Magic systems', 'Mythical creatures', 'Epic quests', 'World-building'],
    popularTags: ['dragons', 'magic', 'wizards', 'elves', 'adventure'],
    icon: '🐉'
  },
  'Science Fiction': {
    description: 'Explore the boundaries of human imagination and scientific possibility. Science fiction stories examine how technology, space exploration, and scientific advancement shape our future, often questioning what it means to be human in an ever-changing universe.',
    characteristics: ['Advanced technology', 'Space exploration', 'Future societies', 'Scientific concepts'],
    popularTags: ['space', 'aliens', 'time-travel', 'cyberpunk', 'dystopian'],
    icon: '🚀'
  },
  'Romance': {
    description: 'Experience the power of love in all its forms. Romance stories celebrate human connection, from sweet first loves to passionate affairs, exploring the emotional journey of characters as they navigate relationships, overcome obstacles, and find their happily ever after.',
    characteristics: ['Emotional depth', 'Character development', 'Relationship dynamics', 'Happy endings'],
    popularTags: ['love', 'relationships', 'passion', 'heartbreak', 'wedding'],
    icon: '💕'
  },
  'Mystery': {
    description: 'Unravel puzzles and solve crimes alongside brilliant detectives and amateur sleuths. Mystery stories challenge readers to piece together clues, suspect motives, and discover the truth behind perplexing cases that keep you guessing until the final revelation.',
    characteristics: ['Plot twists', 'Clues and red herrings', 'Detective work', 'Suspenseful pacing'],
    popularTags: ['detective', 'crime', 'investigation', 'murder', 'secrets'],
    icon: '🔍'
  },
  'Horror': {
    description: 'Confront your deepest fears and experience spine-chilling thrills. Horror stories explore the darker side of human nature and the supernatural, creating atmospheric tension and psychological scares that linger long after the final page.',
    characteristics: ['Atmospheric tension', 'Psychological scares', 'Supernatural elements', 'Dark themes'],
    popularTags: ['scary', 'supernatural', 'ghosts', 'monsters', 'psychological'],
    icon: '👻'
  },
  'Young Adult': {
    description: 'Navigate the challenges of growing up through compelling coming-of-age stories. Young Adult fiction explores themes of identity, friendship, first love, and self-discovery, resonating with readers of all ages who remember the intensity of youth.',
    characteristics: ['Coming-of-age themes', 'Teen protagonists', 'Identity exploration', 'Contemporary issues'],
    popularTags: ['teen', 'school', 'friendship', 'first-love', 'growing-up'],
    icon: '🌟'
  },
  'Historical': {
    description: 'Journey through time to experience different eras and cultures. Historical fiction brings the past to life through meticulously researched settings and authentic characters, offering insights into how people lived, loved, and survived in bygone times.',
    characteristics: ['Historical accuracy', 'Period settings', 'Cultural exploration', 'Research-based'],
    popularTags: ['historical', 'period', 'war', 'ancient', 'culture'],
    icon: '🏛️'
  },
  'Thriller': {
    description: 'Experience heart-pounding suspense and adrenaline-fueled action. Thriller stories keep readers on the edge of their seats with fast-paced plots, dangerous situations, and protagonists racing against time to prevent disaster or escape peril.',
    characteristics: ['Fast-paced action', 'High stakes', 'Suspenseful plot', 'Tension building'],
    popularTags: ['suspense', 'action', 'danger', 'chase', 'conspiracy'],
    icon: '⚡'
  }
}

export default function CategoryDescription({ genre, totalStories, language, status }: CategoryDescriptionProps) {
  const info = categoryInfo[genre]
  
  if (!info) {
    return null
  }

  const formatStoryCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl" role="img" aria-label={`${genre} icon`}>
            {info.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-foreground">
                {genre} Stories
                {language && language !== 'English' && ` in ${language}`}
                {status && status !== 'all' && ` (${status === 'completed' ? 'Completed' : 'Ongoing'})`}
              </h2>
              
              {totalStories && totalStories > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen size={16} />
                  <span>{formatStoryCount(totalStories)} stories</span>
                </div>
              )}
            </div>
            
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {info.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Key Characteristics
                </h3>
                <div className="flex flex-wrap gap-1">
                  {info.characteristics.map((characteristic) => (
                    <Badge key={characteristic} variant="secondary" className="text-xs">
                      {characteristic}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                  <Users size={16} />
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-1">
                  {info.popularTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Discover {genre.toLowerCase()} stories from talented indie authors on FableSpace. 
              Support writers through optional donations with no platform fees.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
