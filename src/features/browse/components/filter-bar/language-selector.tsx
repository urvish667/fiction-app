"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface LanguageSelectorProps {
  languages: string[]
  selectedLanguage: string
  onLanguageChange: (language: string) => void
}

export function LanguageSelector({
  languages,
  selectedLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 text-sm">
          <span className="hidden sm:inline">Language: </span>
          <span className="sm:hidden">Lang: </span>
          {selectedLanguage || "All"}
          <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedLanguage} onValueChange={onLanguageChange}>
          <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
          {languages.map(language => (
            <DropdownMenuRadioItem key={language} value={language}>
              {language}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
