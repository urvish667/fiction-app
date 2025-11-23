import { Metadata } from "next"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { NotFoundAnimated } from "@/components/not-found-animated"

export const metadata: Metadata = {
    title: "Page Not Found - FableSpace",
    description: "The page you're looking for doesn't exist.",
}

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 flex flex-col">
                <NotFoundAnimated />
            </main>
            <SiteFooter />
        </div>
    )
}
