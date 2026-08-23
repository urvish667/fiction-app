import { Metadata } from "next"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { NotFoundAnimated } from "@/components/not-found-animated"

export const metadata: Metadata = {
    title: "Page Not Found - FableSpace",
    description: "The page you're looking for doesn't exist on FableSpace. Explore our story catalog, writing challenges, blog, or developer resources.",
    robots: {
        index: false,
        follow: true,
    },
    alternates: {
        types: {
            "text/markdown": "/404.md",
        },
    },
}

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 flex flex-col justify-center">
                <NotFoundAnimated />
            </main>
            <SiteFooter />
        </div>
    )
}
