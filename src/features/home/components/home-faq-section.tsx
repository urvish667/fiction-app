export function HomeFaqSection() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="homepage-faq-heading">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 id="homepage-faq-heading" className="text-2xl sm:text-3xl font-bold font-serif tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Everything you need to know about reading, publishing, and integrating with FableSpace.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/50">
            <h3 className="text-base sm:text-lg font-semibold font-serif mb-2 text-foreground">
              What is FableSpace?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              FableSpace is an online creative fiction community and web publishing platform where independent authors publish serialized novels, short stories, and poetry, while readers discover and read original fiction for free.
            </p>
          </div>

          <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/50">
            <h3 className="text-base sm:text-lg font-semibold font-serif mb-2 text-foreground">
              Is reading and publishing on FableSpace free?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Yes! All stories published on FableSpace are 100% free to read without paywalls or subscriptions. Writers can publish unlimited stories and chapters at no cost.
            </p>
          </div>

          <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/50">
            <h3 className="text-base sm:text-lg font-semibold font-serif mb-2 text-foreground">
              How can developers and AI agents access FableSpace?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              FableSpace supports modern agentic standards including HTTP content negotiation (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">Accept: text/markdown</code>), an OpenAPI 3.1 REST API specification at <a href="/openapi.json" target="_blank" rel="noopener noreferrer" className="text-primary underline">/openapi.json</a>, and machine-readable instructions in <a href="/llms.txt" className="text-primary underline">llms.txt</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeFaqSection
