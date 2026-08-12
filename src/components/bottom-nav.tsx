"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Users } from "lucide-react"

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    exact: true,
  },
  {
    label: "Browse",
    href: "/browse",
    icon: Compass,
    exact: false,
  },
  {
    label: "Community",
    href: "/community",
    icon: Users,
    exact: false,
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const currentPath = pathname || ""

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t shadow-lg"
      style={{ fontFamily: "'Inter', sans-serif" }}
      aria-label="Bottom mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2 max-w-md mx-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact
            ? currentPath === href
            : currentPath === href || currentPath.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-150 active:scale-95 ${
                isActive
                  ? "text-[#125ba5] dark:text-blue-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-150 ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span className="text-xs tracking-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
