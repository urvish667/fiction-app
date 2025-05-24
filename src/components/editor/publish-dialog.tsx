"use client"

import React from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Globe, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PublishSettings } from "@/hooks/use-chapter-editor"
import { generateTimeIntervals, getNextQuarterHour, validateScheduledTime } from "@/utils/time-utils"

interface PublishDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  publishSettings: PublishSettings
  extendedSettings: {
    notifyFollowers: boolean
  }
  handlePublishSettingsChange: (field: string, value: any) => void
  handlePublish: () => Promise<void>
  isSaving: boolean
}

export const PublishDialog = React.memo(function PublishDialog({
  isOpen,
  setIsOpen,
  publishSettings,
  extendedSettings,
  handlePublishSettingsChange,
  handlePublish,
  isSaving
}: PublishDialogProps) {
  const { toast } = useToast()

  // Generate time intervals
  const timeIntervals = generateTimeIntervals()

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Create a new date with the selected date but keep the current time
      const currentDate = new Date(publishSettings.publishDate);
      const newDate = new Date(e.target.value);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);

      // Only allow future dates
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day for date comparison

      if (newDate >= now) {
        handlePublishSettingsChange("publishDate", newDate);
      } else {
        toast({
          title: "Invalid date",
          description: "Publication date cannot be in the past.",
          variant: "destructive",
        });
      }
    }
  }

  // Handle time change from select dropdown
  const handleTimeChange = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDate = new Date(publishSettings.publishDate);
    newDate.setHours(hours, minutes, 0, 0);

    // Validate the scheduled time
    const validation = validateScheduledTime(newDate);
    if (!validation.isValid) {
      toast({
        title: "Invalid time",
        description: validation.error || "Please select a valid time.",
        variant: "destructive",
      });
      return;
    }

    handlePublishSettingsChange("publishDate", newDate);
  }

  // Get the current time formatted for display
  const getCurrentTimeInfo = () => {
    const now = new Date()
    const nextQuarter = getNextQuarterHour()
    return {
      current: format(now, 'h:mm a'),
      nextAvailable: format(nextQuarter, 'h:mm a'),
      isToday: format(publishSettings.publishDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
    }
  }

  // Initialize with next quarter hour if scheduling is enabled and date is today
  React.useEffect(() => {
    if (publishSettings.schedulePublish) {
      const now = new Date();
      const publishDate = new Date(publishSettings.publishDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      publishDate.setHours(0, 0, 0, 0);

      // If the publish date is today and the time is in the past, update to next quarter hour
      if (publishDate.getTime() === today.getTime() && publishSettings.publishDate <= now) {
        const nextQuarter = getNextQuarterHour();
        handlePublishSettingsChange("publishDate", nextQuarter);
      }
    }
  }, [publishSettings.schedulePublish])

  const timeInfo = getCurrentTimeInfo()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publish Chapter</DialogTitle>
          <DialogDescription>
            Publishing will make this chapter visible to all readers.
            Choose your publishing options below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} />
            <span className="text-sm text-muted-foreground">Your chapter will be visible to everyone once published</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedulePublish"
                checked={publishSettings.schedulePublish}
                onCheckedChange={(checked) => handlePublishSettingsChange("schedulePublish", checked === true)}
              />
              <Label htmlFor="schedulePublish" className="text-sm">
                Schedule for later
              </Label>
            </div>
          </div>

          {publishSettings.schedulePublish && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="publishDate">Publication Date</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={format(publishSettings.publishDate, "yyyy-MM-dd")}
                  onChange={handleDateChange}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishTime">Publication Time</Label>
                <Select
                  value={format(publishSettings.publishDate, "HH:mm")}
                  onValueChange={handleTimeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeIntervals.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Times are shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </p>
                  {timeInfo.isToday && (
                    <p className="text-xs text-muted-foreground">
                      Current time: {timeInfo.current} • Next available: {timeInfo.nextAvailable}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick scheduling options */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextQuarter = getNextQuarterHour()
                    handlePublishSettingsChange("publishDate", nextQuarter)
                  }}
                  className="text-xs"
                >
                  Next 15 min
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow9am = new Date()
                    tomorrow9am.setDate(tomorrow9am.getDate() + 1)
                    tomorrow9am.setHours(9, 0, 0, 0)
                    handlePublishSettingsChange("publishDate", tomorrow9am)
                  }}
                  className="text-xs"
                >
                  Tomorrow 9 AM
                </Button>
              </div>
            </div>
          )}

          {/* <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyFollowers"
              checked={extendedSettings.notifyFollowers}
              onCheckedChange={(checked) => handlePublishSettingsChange("notifyFollowers", checked === true)}
            />
            <Label htmlFor="notifyFollowers" className="text-sm flex items-center gap-2">
              <Bell size={16} />
              Notify followers when published
            </Label>
          </div> */}

          <div className="bg-muted/30 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} className="text-green-500" />
              <span className="font-medium">Publishing checklist:</span>
            </div>
            <ul className="space-y-1 text-sm pl-6 list-disc">
              <li>Proofread your chapter for spelling and grammar</li>
              <li>Check formatting and paragraph breaks</li>
              <li>Ensure all links and images work correctly</li>
              <li>Preview your chapter to see how it will appear to readers</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            {publishSettings.schedulePublish ? "Schedule" : "Publish Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
