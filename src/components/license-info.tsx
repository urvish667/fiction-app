import { Copyright, ExternalLink } from "lucide-react"
import { getLicenseByValue } from "@/constants/licenses"

interface LicenseInfoProps {
  license: string
  className?: string
  showFullDescription?: boolean
}

export default function LicenseInfo({ license, className = "", showFullDescription = false }: LicenseInfoProps) {
  const licenseData = getLicenseByValue(license)
  
  if (!licenseData) {
    return null
  }

  const isCreativeCommons = license.startsWith("CC_") || license === "CC0"
  const isAllRightsReserved = license === "ALL_RIGHTS_RESERVED"

  const getLicenseUrl = (licenseValue: string) => {
    switch (licenseValue) {
      case "CC_BY":
        return "https://creativecommons.org/licenses/by/4.0/"
      case "CC_BY_SA":
        return "https://creativecommons.org/licenses/by-sa/4.0/"
      case "CC_BY_NC":
        return "https://creativecommons.org/licenses/by-nc/4.0/"
      case "CC_BY_ND":
        return "https://creativecommons.org/licenses/by-nd/4.0/"
      case "CC_BY_NC_SA":
        return "https://creativecommons.org/licenses/by-nc-sa/4.0/"
      case "CC_BY_NC_ND":
        return "https://creativecommons.org/licenses/by-nc-nd/4.0/"
      case "CC0":
        return "https://creativecommons.org/publicdomain/zero/1.0/"
      default:
        return null
    }
  }

  const licenseUrl = getLicenseUrl(license)

  return (
    <div className={`flex items-start gap-2 text-sm ${className}`}>
      <Copyright size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{licenseData.label}</span>
          {licenseUrl && (
            <a
              href={licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} />
              <span className="text-xs">Learn more</span>
            </a>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          {showFullDescription ? licenseData.fullDescription : licenseData.description}
        </p>
        {isCreativeCommons && !showFullDescription && (
          <p className="text-xs text-muted-foreground mt-1">
            This work is licensed under Creative Commons.
          </p>
        )}
        {isAllRightsReserved && !showFullDescription && (
          <p className="text-xs text-muted-foreground mt-1">
            All rights reserved by the author.
          </p>
        )}
      </div>
    </div>
  )
}
