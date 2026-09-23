import { z } from "zod";

// Status Lifecycle Enum
export const contentStatusSchema = z.enum(["draft", "preview", "published"]);

// 1. Brand Schema
export const brandSectionSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  studioName: z.string().min(1, "Studio name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  subTagline: z.string().min(1, "Sub-tagline is required"),
});

// 2. Hero Section Schema
export const heroSectionSchema = z.object({
  pillLabel: z.string().min(1),
  headlineStart: z.string().min(1),
  headlineHighlight: z.string().min(1),
  subheadline: z.string().min(1),
  handwrittenPhrase: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  duration: z.string().min(1),
  language: z.string().min(1),
  ctaText: z.string().min(1),
  urgencyText: z.string().min(1),
  guaranteeText: z.string().min(1),
  targetAudienceNote: z.string().min(1),
  instructorName: z.string().min(1),
  instructorTitle: z.string().min(1),
  instructorImage: z.string().min(1),
});

// 3. Stats Schema
export const statItemSchema = z.object({
  number: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
});
export const statsSectionSchema = z.array(statItemSchema);

// 4. Trust Section Schema
export const trustSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string().min(1),
  description: z.string().min(1),
});

// 5. About Artist Schema
export const aboutArtistSectionSchema = z.object({
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  role: z.string().min(1),
  introduction: z.string().min(1),
  bio: z.array(z.string().min(1)),
  qualifications: z.array(z.string().min(1)),
  expertise: z.array(z.string().min(1)),
});

// 6. Target Audience Schema
export const targetAudienceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  quote: z.string().optional(),
  icon: z.string().min(1),
  isConclusion: z.boolean().optional(),
});
export const targetAudienceSectionSchema = z.object({
  heading: z.string().min(1),
  items: z.array(targetAudienceItemSchema).min(1),
});

// 7. Video Section Schema
export const videoSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  description: z.string().optional(),
  videoTitle: z.string().min(1),
  videoThumbnail: z.string().min(1),
  youtubeId: z.string().optional(),
  learningPoints: z.array(z.string().min(1)).min(1),
  takeawayHeading: z.string().optional(),
  takeawayText: z.string().optional(),
  ctaText: z.string().min(1),
  handwrittenNote: z.string().optional(),
});

// 8. Transformation Schema
export const transformationSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string().min(1),
  beforeTitle: z.string().min(1),
  beforePoints: z.array(z.string().min(1)).min(1),
  afterTitle: z.string().min(1),
  afterPoints: z.array(z.string().min(1)).min(1),
  takeaway: z.string().min(1),
});

// 9. Method Framework Schema
export const methodStepSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
});
export const methodFrameworkSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string().min(1),
  steps: z.array(methodStepSchema).min(1),
  pillSummary: z.string().min(1),
});

// 10. Core Secrets Schema
export const secretItemSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  bullets: z.array(z.string().min(1)),
  icon: z.string().min(1),
});
export const coreSecretsSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string().min(1),
  secrets: z.array(secretItemSchema).min(1),
  bottomNote: z.string().min(1),
  ctaText: z.string().min(1),
});

// 11. Outcomes Schema
export const outcomesSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string().min(1),
  description: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
  disclaimer: z.string().min(1),
});

// 12. Instructor Story Schema
export const instructorStorySectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  quote: z.string().min(1),
  quoteAuthor: z.string().min(1),
  image: z.string().min(1),
});

// 13. Bonuses Schema
export const bonusItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string().min(1),
  icon: z.string().min(1),
});
export const bonusesSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string().min(1),
  items: z.array(bonusItemSchema).min(1),
  deliveryNote: z.string().min(1),
});

// 14. Fit Check Schema
export const fitCheckSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  fitTitle: z.string().min(1),
  fitPoints: z.array(z.string().min(1)).min(1),
  unfitTitle: z.string().min(1),
  unfitPoints: z.array(z.string().min(1)).min(1),
  closingNote: z.string().min(1),
});

// 15. Included Section Schema
export const includedItemSchema = z.object({
  title: z.string().min(1),
  status: z.string().min(1),
});
export const includedSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  items: z.array(includedItemSchema).min(1),
  feeLabel: z.string().min(1),
  feeValue: z.string().min(1),
  ctaText: z.string().min(1),
  guaranteeNote: z.string().min(1),
});

// 16. FAQ Schema
export const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
export const faqsSectionSchema = z.array(faqItemSchema).min(1);

// 17. Final CTA Schema
export const finalCtaSectionSchema = z.object({
  overline: z.string().min(1),
  headline: z.string().min(1),
  description: z.string().min(1),
  handwrittenPhrase: z.string().min(1),
  ctaText: z.string().min(1),
  dateInfo: z.string().min(1),
  subNote: z.string().min(1),
});

// 18. Footer Schema
export const footerLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});
export const footerSectionSchema = z.object({
  brandDescription: z.string().min(1),
  links: z.array(footerLinkSchema).min(1),
  contactEmail: z.string().email(),
  copyrightYear: z.number().int().min(2020),
  disclaimer: z.string().min(1),
  handwrittenSignature: z.string().min(1),
});

// Unified Schema Map by Section Key
export const sectionSchemaMap = {
  brand: brandSectionSchema,
  hero: heroSectionSchema,
  stats: statsSectionSchema,
  trustSection: trustSectionSchema,
  aboutArtist: aboutArtistSectionSchema,
  targetAudience: targetAudienceSectionSchema,
  videoSection: videoSectionSchema,
  transformation: transformationSectionSchema,
  methodFramework: methodFrameworkSectionSchema,
  coreSecrets: coreSecretsSectionSchema,
  outcomes: outcomesSectionSchema,
  instructorStory: instructorStorySectionSchema,
  bonuses: bonusesSectionSchema,
  fitCheck: fitCheckSectionSchema,
  included: includedSectionSchema,
  faqs: faqsSectionSchema,
  finalCta: finalCtaSectionSchema,
  footer: footerSectionSchema,
} as const;
