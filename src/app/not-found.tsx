import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Home, Search, ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
    title: "Page Not Found - FableSpace",
    description: "The page you're looking for doesn't exist.",
}

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="max-w-2xl mx-auto text-center">
                    {/* 404 Illustration */}
                    <div className="relative mb-8">
                        <div className="text-[120px] md:text-[180px] font-bold text-primary/10 leading-none">
                            404
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-20 w-20 md:h-32 md:w-32 text-primary/30" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <h1 className="text-3xl md:text-4xl font-semibold mb-4">
                        Story Not Found
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                        Oops! It seems this page has wandered off into an unwritten chapter.
                        The story you're looking for doesn't exist or may have been removed.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button asChild size="lg" className="w-full sm:w-auto">
                            <Link href="/">
                                <Home className="mr-2 h-5 w-5" />
                                Back to Home
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                            <Link href="/browse">
                                <Search className="mr-2 h-5 w-5" />
                                Browse Stories
                            </Link>
                        </Button>
                    </div>

                    {/* Additional Help */}
                    <div className="mt-12 pt-8 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-4">
                            Looking for something specific?
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/browse?genre=fantasy">Fantasy</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/browse?genre=romance">Romance</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/browse?genre=mystery">Mystery</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/write/story-info">Start Writing</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl -z-10" />
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/5 blur-3xl -z-10" />
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
