export type ContentStatus = "draft" | "preview" | "published";

export type CMSSectionKey =
  | "brand"
  | "hero"
  | "stats"
  | "trustSection"
  | "aboutArtist"
  | "targetAudience"
  | "videoSection"
  | "transformation"
  | "methodFramework"
  | "coreSecrets"
  | "outcomes"
  | "instructorStory"
  | "bonuses"
  | "fitCheck"
  | "included"
  | "faqs"
  | "finalCta"
  | "footer";

export interface LandingContentRecord<T = unknown> {
  id: string;
  section_key: CMSSectionKey;
  content_json: T;
  status: ContentStatus;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: string | null;
}
