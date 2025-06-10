"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, TrendingUp } from "lucide-react"
import { getGenreInfo } from "@/lib/seo/genre-descriptions"

interface CategoryDescriptionProps {
  genre: string
  totalStories?: number
  language?: string
  status?: string
}

export default function CategoryDescription({ genre, totalStories, language, status }: CategoryDescriptionProps) {
  const info = getGenreInfo(genre)
  
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
