'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ReportService, ReportSubmissionData } from '@/lib/api/report';
import { useToast } from "@/hooks/use-toast";

const reasons = [
  { value: 'PORNOGRAPHIC_CONTENT', label: 'Pornographic content' },
  { value: 'HATE_OR_BULLYING', label: 'Hate or bullying' },
  { value: 'RELEASE_OF_PERSONAL_INFO', label: 'Release of personal info' },
  {
    value: 'OTHER_INAPPROPRIATE_MATERIAL',
    label: 'Other inappropriate material',
  },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Other' },
];

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storyId?: string | null;
  commentId?: string | null;
  postId?: string | null;
  forumCommentId?: string | null;
  reportedUserId?: string | null;
}

export function ReportDialog({ isOpen, onClose, storyId, commentId, postId, forumCommentId, reportedUserId }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = () => {
    startTransition(async () => {
      const payload: ReportSubmissionData = {
        storyId: storyId || undefined,
        commentId: commentId || undefined,
        postId: postId || undefined,
        forumCommentId: forumCommentId || undefined,
        reportedUserId: reportedUserId || undefined,
        reason: reason as any,
        details: details || undefined,
      };

      try {
        const response = await ReportService.submitReport(payload);

        if (response.success) {
          toast({
            title: 'Success',
            description: response.message || 'Report submitted successfully.',
          });

          onClose(); // Close dialog
        } else {
          // Handle error response from the service
          if (response.message?.includes('already reported')) {
            toast({
              title: 'Error',
              description: 'You have already reported this content.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: response.message || 'Could not submit report, please try again later.',
              variant: 'destructive',
            });
          }
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Could not submit report, please try again later.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup onValueChange={setReason} defaultValue={reason}>
            {reasons.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value}>{r.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {reason === 'OTHER' && (
            <Textarea
              placeholder="Please provide additional details."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />
          )}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => handleSubmit()}
            disabled={isPending || !reason}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
