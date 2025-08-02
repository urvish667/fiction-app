import { z } from 'zod';

export const ReportReasonEnum = z.enum([
  'PORNOGRAPHIC_CONTENT',
  'HATE_OR_BULLYING',
  'RELEASE_OF_PERSONAL_INFO',
  'OTHER_INAPPROPRIATE_MATERIAL',
  'SPAM',
  'OTHER',
]);

export const ReportValidator = z.object({
  storyId: z.string().optional(),
  commentId: z.string().optional(),
  reason: ReportReasonEnum,
  details: z.string().max(500).optional(),
});

export type ReportRequest = z.infer<typeof ReportValidator>;
