"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Country, State } from "country-state-city"
import type { ICountry, IState } from "country-state-city"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

export interface LocationData {
  country?: ICountry
  state?: IState
}

interface LocationSelectorProps {
  value?: string // The formatted location string (e.g., "NY, United States")
  onChange: (location: string) => void
  error?: string
  disabled?: boolean
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value = "",
  onChange,
  error,
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null)
  const [selectedState, setSelectedState] = useState<IState | null>(null)

  const [countryOpen, setCountryOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)

  // Get all countries
  const countries = useMemo(() => Country.getAllCountries(), [])
  
  // Get states for selected country
  const states = useMemo(() => {
    if (!selectedCountry) return []
    return State.getStatesOfCountry(selectedCountry.isoCode)
  }, [selectedCountry])

  // Parse initial value
  useEffect(() => {
    if (!value) {
      setSelectedCountry(null)
      setSelectedState(null)
      return
    }

    // Try to parse the location string "<STATE>, <COUNTRY>"
    const parts = value.split(', ')
    if (parts.length >= 1) {
      const countryName = parts[parts.length - 1]
      const country = countries.find(c => c.name === countryName)
      if (country) {
        setSelectedCountry(country)

        if (parts.length >= 2) {
          const stateName = parts[0] // First part is state
          const countryStates = State.getStatesOfCountry(country.isoCode)
          const state = countryStates.find(s => s.name === stateName || s.isoCode === stateName)
          if (state) {
            setSelectedState(state)
          }
        }
      }
    }
  }, [value, countries])

  // Format and emit location string as "<STATE>, <COUNTRY>"
  const updateLocation = (country: ICountry | null, state: IState | null) => {
    if (!country) {
      onChange("")
      return
    }

    const parts: string[] = []
    if (state) parts.push(state.name)
    parts.push(country.name)

    onChange(parts.join(", "))
  }

  const handleCountrySelect = (country: ICountry) => {
    setSelectedCountry(country)
    setSelectedState(null)
    setCountryOpen(false)
    updateLocation(country, null)
  }

  const handleStateSelect = (state: IState) => {
    setSelectedState(state)
    setStateOpen(false)
    updateLocation(selectedCountry, state)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Country Selector */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Country</Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between"
                  disabled={disabled}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {selectedCountry ? (
                        <span className="flex items-center gap-1">
                          <span>{selectedCountry.flag}</span>
                          <span>{selectedCountry.name}</span>
                        </span>
                      ) : (
                        "Select country..."
                      )}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search countries..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={country.isoCode}
                          value={country.name}
                          onSelect={() => handleCountrySelect(country)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCountry?.isoCode === country.isoCode
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* State Selector */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">State/Province</Label>
            <Popover open={stateOpen} onOpenChange={setStateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stateOpen}
                  className="w-full justify-between"
                  disabled={disabled || !selectedCountry || states.length === 0}
                >
                  <span className="truncate">
                    {selectedState ? selectedState.name : "Select state..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search states..." />
                  <CommandList>
                    <CommandEmpty>No state found.</CommandEmpty>
                    <CommandGroup>
                      {states.map((state) => (
                        <CommandItem
                          key={state.isoCode}
                          value={state.name}
                          onSelect={() => handleStateSelect(state)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedState?.isoCode === state.isoCode
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {state.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

        </div>

        {/* Display formatted location */}
        {(selectedCountry || selectedState) && (
          <div className="text-sm text-muted-foreground">
            Selected: {[selectedState?.name, selectedCountry?.name]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
