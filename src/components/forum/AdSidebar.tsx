import { Card, CardContent } from "@/components/ui/card"
import AdBanner from "@/components/ad-banner"

export default function AdSidebar() {
  return (
    <div className="sticky top-4">
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <AdBanner
            type="sidebar"
            width={300}
            height={600}
            className="w-full h-auto"
          />
        </CardContent>
      </Card>
    </div>
  )
}
