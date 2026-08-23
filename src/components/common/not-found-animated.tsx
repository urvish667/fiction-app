import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function NotFoundAnimated() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-36 lg:py-48 min-h-[85vh] md:min-h-[90vh] lg:min-h-[94vh] flex items-center justify-center">
      <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-8 md:gap-14 lg:gap-20 w-full">
        {/* Left: Text Information */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md lg:max-w-lg space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-foreground leading-[1.18] text-balance">
            Looks like you found a plot hole.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground font-normal">
            Pabby is investigating.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 py-2 h-9 text-xs sm:text-sm font-medium shadow-sm transition-all duration-150 active:scale-95"
            >
              <Link href="/">
                ← Back to home
              </Link>
            </Button>
          </div>
        </div>

        {/* Right: Character Illustration */}
        <div className="flex justify-center items-center shrink-0">
          <Image
            src="/Pabby-404.png"
            alt="404 - Page Not Found"
            width={360}
            height={450}
            priority
            className="w-auto h-auto max-h-[250px] sm:max-h-[290px] md:max-h-[330px] lg:max-h-[370px] object-contain select-none drop-shadow-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default NotFoundAnimated
