import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getStudioUrl } from "@/lib/utils"

export function AuthorEmpowermentSection() {
  return (
    <section className="bg-muted/20 rounded-3xl p-8 md:p-12 border border-border/40" aria-labelledby="author-empowerment-heading">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 id="author-empowerment-heading" className="text-2xl sm:text-3xl font-bold font-serif tracking-tight mb-4">
              Built for Independent Authors &amp; Creative Storytellers
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              Publish your original fiction with modern author tools. Maintain 100% ownership of your intellectual property, schedule chapter releases, and receive direct donations with zero platform fees.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={getStudioUrl()}>
                <Button className="rounded-full px-6 bg-primary text-primary-foreground font-medium shadow-sm">
                  Open Author Studio
                </Button>
              </a>
              <Button variant="outline" className="rounded-full px-6" asChild>
                <Link href="/challenges">Join Writing Challenges</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-background p-5 rounded-xl border border-border/60">
              <h3 className="text-base font-semibold font-serif mb-1.5">0% Platform Cut</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Writers keep 100% of direct reader tips and donations through transparent payment integration.
              </p>
            </div>
            <div className="bg-background p-5 rounded-xl border border-border/60">
              <h3 className="text-base font-semibold font-serif mb-1.5">Chapter Scheduling</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Draft in a distraction-free rich-text editor and schedule chapter drops on your own release timetable.
              </p>
            </div>
            <div className="bg-background p-5 rounded-xl border border-border/60">
              <h3 className="text-base font-semibold font-serif mb-1.5">Reader Analytics</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track story reads, chapter completion rates, audience engagement, and follower growth in real time.
              </p>
            </div>
            <div className="bg-background p-5 rounded-xl border border-border/60">
              <h3 className="text-base font-semibold font-serif mb-1.5">Author Forum Hub</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Connect with your dedicated fanbase through author-moderated forum threads and story discussions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AuthorEmpowermentSection
