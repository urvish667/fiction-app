"use client"

import React from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Bell, Check, Globe } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { PublishSettings } from "@/hooks/use-chapter-editor"

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

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(publishSettings.publishDate);
      newDate.setHours(hours, minutes, 0, 0);

      // Check if the combined date and time is in the future
      const now = new Date();
      const selectedDate = new Date(publishSettings.publishDate);
      selectedDate.setHours(0, 0, 0, 0); // Start of the selected day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // If the selected date is today, ensure the time is in the future
      if (selectedDate.getTime() === today.getTime() && newDate <= now) {
        toast({
          title: "Invalid time",
          description: "Publication time must be in the future.",
          variant: "destructive",
        });
      } else {
        handlePublishSettingsChange("publishDate", newDate);
      }
    }
  }

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
                <Input
                  id="publishTime"
                  type="time"
                  value={format(publishSettings.publishDate, "HH:mm")}
                  onChange={handleTimeChange}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyFollowers"
              checked={extendedSettings.notifyFollowers}
              onCheckedChange={(checked) => handlePublishSettingsChange("notifyFollowers", checked === true)}
            />
            <Label htmlFor="notifyFollowers" className="text-sm flex items-center gap-2">
              <Bell size={16} />
              Notify followers when published
            </Label>
          </div>

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
