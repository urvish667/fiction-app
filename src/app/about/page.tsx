import { BookOpen, Sparkles, Users, Tag, Award, MessageSquare, Compass, Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { generateAboutMetadata, generateOrganizationStructuredData } from "@/lib/seo/metadata"
import type { Metadata } from "next"

export const metadata: Metadata = generateAboutMetadata()

export default function AboutPage() {
  const organizationSchema = generateOrganizationStructuredData()

  return (
    <>
      {/* Organization Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />

      <div className="min-h-screen flex flex-col">
        <Navbar />

      <main className="flex-1 container mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-6">Welcome to FableSpace – Where Stories Come Alive</h1>
          <p className="text-xl text-muted-foreground">
            A cozy corner of the internet for storytellers, dreamers, and readers alike.
          </p>
        </div>

        {/* Our Mission */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-6">Our Mission</h2>
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-lg mb-4">
              At FableSpace, we believe in the power of storytelling—and in the storytellers who bring worlds to life. Our mission is to create a space where writers can share their imagination freely, connect with readers, and eventually earn from their creative work.
            </p>
            <p className="text-lg mb-4">
              Right now, we sustain FableSpace through Google Ads to keep the platform alive and growing. While we aren't yet able to share ad revenue, writers receive 100% of reader donations, ensuring that your support goes directly to them.
            </p>
            <p className="text-lg mb-4">
              But this is just the beginning. As our community grows, so will our support for writers. We're committed to launching new ways for creators to earn—starting with ad revenue sharing once we reach scale, and expanding into more features designed to help writers thrive.
            </p>
            <p className="text-lg font-semibold text-primary">
              FableSpace is more than a platform—it's a promise to uplift the voices of tomorrow. 🌱✍️
            </p>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Makes FableSpace Different</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 mr-3">
                  <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-xl text-green-800 dark:text-green-200">Get Paid by Readers</h3>
              </div>
              <p className="text-green-700 dark:text-green-300 mb-3">
                Readers can directly support their favorite authors through our integrated PayPal donation system.
                Every dollar goes straight to the writer—no middleman, no platform fees.
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ 100% of donations go to authors<br/>
                ✓ Instant PayPal transfers<br/>
                ✓ No subscription barriers for readers
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 mr-3">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-xl text-blue-800 dark:text-blue-200">Creator-First Platform</h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 mb-3">
                Unlike other platforms that prioritize algorithms and ads, we put creators first.
                Your stories aren't buried under corporate content or paywalled features.
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ✓ No algorithm manipulation<br/>
                ✓ All features free for writers<br/>
                ✓ Reader-focused, distraction-free interface
              </p>
            </div>
          </div>
        </section>
        
        {/* What You Can Do */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What You Can Do on FableSpace</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Write & Publish</h3>
                <p className="text-muted-foreground">Create and publish your stories with our intuitive editor</p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Earn Money</h3>
                <p className="text-muted-foreground">Receive direct PayPal donations from readers who love your work</p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Read & Discover</h3>
                <p className="text-muted-foreground">Explore thousands of original stories from talented writers</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tag</h3>
                <p className="text-muted-foreground">Organize your stories by genre and theme for better discovery</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Join Challenges</h3>
                <p className="text-muted-foreground">Test your creativity with writing challenges and prompts</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Comment & Interact</h3>
                <p className="text-muted-foreground">Engage with fellow writers and readers through comments</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Get Recommendations</h3>
                <p className="text-muted-foreground">Discover stories tailored to your reading preferences</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Why FableSpace */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose FableSpace Over Other Platforms?</h2>

          <div className="bg-muted/30 rounded-lg p-8">
            <ul className="space-y-4">
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                <span><strong>Zero platform fees</strong> — Keep 100% of your earnings</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                <span><strong>Direct PayPal donations</strong> — No complex revenue sharing</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Reader-focused, minimal distraction interface</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>No algorithm manipulation or buried content</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Built for both short and longform fiction</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Genre-flexible: from fantasy to slice-of-life</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Community-first, creativity-driven approach</span>
              </li>
            </ul>
          </div>
        </section>
        
        {/* Our Story */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-6">Our Story</h2>
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-lg mb-4">
              FableSpace began with a simple idea: give storytellers a home. Tired of algorithm-heavy platforms, 
              we dreamed of a quiet digital library where imagination thrives and stories aren't buried in noise. 
              That dream became FableSpace.
            </p>
          </div>
        </section>
        
        {/* Community & Values */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Community & Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Creative Freedom</h3>
              <p className="text-muted-foreground">We believe in giving writers the space to express themselves</p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Diversity & Inclusivity</h3>
              <p className="text-muted-foreground">We support diverse voices and perspectives in storytelling</p>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to write your first story?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/write/story-info">Start Writing</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/browse">Explore Stories</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <SiteFooter />
      </div>
    </>
  )
}
