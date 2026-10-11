import { CourseContentDetails } from "@/lib/validations/course-admin";

export const COURSE_IMAGES: Record<string, string> = {
  "watercolour-foundation": "/images/foundation.jpeg",
  "watercolour-artistry-foundation": "/images/ARTISTRY.jpeg",
};

export const DEFAULT_FOUNDATION_DETAILS: CourseContentDetails = {
  cardSubtitle: "2 Live Sessions • 90 Minutes Each",
  cardSummary: "Master the Fundamentals of Watercolour Painting",
  cardDescription: "Master the Fundamentals of Watercolour Painting",
  subjects: "Materials • Techniques • Colour Mixing • Wash",
  cardPriceLabel: "₹990/-",
  sessionCountText: "2 Live Interactive Sessions",
  sessionDurationText: "90 Minutes Each",
  durationMonthsText: "1 Week",
  fullDescription:
    "A focused 2-session foundation program designed to help you understand the essentials of watercolour before moving into detailed painting projects.",
  learningOutcomesHeading: "What You’ll Learn",
  learningOutcomesSubheading: "Essential Foundation Topics Covered",
  learningOutcomes: [
    "Introduction to Watercolour",
    "Complete Material Knowledge",
    "Understanding Papers, Brushes & Colours",
    "Essential Watercolour Techniques",
    "Different Wash Techniques",
    "Colour Theory for Watercolour",
    "Shade Chart & Colour Mixing",
    "Understanding Watercolour Brands & Products",
    "The Right Way to Set Up Your Palette",
    "Practical Tips for Choosing Art Materials",
    "Guided Mini Activity",
  ],
  whyHeading: "Why This Course?",
  whyDescription:
    "Starting watercolour can be confusing—which paper, which brushes, which colours, how much water, and which techniques to use?\n\nThis foundation course gives you the right knowledge and direction from the beginning, helping you avoid unnecessary purchases and common beginner mistakes.",
  whyCallout: "A strong foundation before you start creating.",
  scheduleHeading: "Session Details",
  scheduleItems: [
    {
      label: "Session 1",
      detail:
        "Material Knowledge, Understanding Papers, Brushes, Colours & Essential Washes (90 Mins)",
    },
    {
      label: "Session 2",
      detail:
        "Colour Theory, Shade Chart Mixing, Palette Setup & Guided Mini Activity (90 Mins)",
    },
  ],
  scheduleNote:
    "Live interactive atelier sessions on Zoom with personal feedback and guidance.",
  ctaText: "Enrol in Foundation Course",
};

export const DEFAULT_ARTISTRY_DETAILS: CourseContentDetails = {
  cardSubtitle: "Landscape • Floral • Still Life",
  cardSummary: "24 Live Interactive Sessions",
  cardDescription: "A Complete 3-Months Watercolour Learning Journey.",
  subjects: "Landscape • Floral • Still Life",
  cardPriceLabel: "Course Fee: ₹9,990/-",
  sessionCountText: "24 Live Classes",
  sessionDurationText: "90 Minutes Each",
  durationMonthsText: "3 Months",
  fullDescription:
    "The course focuses on 3 major subjects: Landscape | Still Life | Floral. You will explore each subject from the very beginning—starting from scratch and gradually developing complete artworks. Understand how…",
  learningOutcomesHeading: "What You Will Learn",
  learningOutcomesSubheading:
    "The course focuses on 3 major subjects: Landscape | Still Life | Floral",
  learningOutcomes: [
    "Explore Landscape, Floral, and Still Life from the very beginning",
    "Start from scratch and gradually develop complete, layered artworks",
    "Understand tonal values, atmospheric perspective and depth in landscapes",
    "Master delicate botanical and floral wash layering techniques",
    "Still life light, shadow and composition mastery",
    "Understand how…",
  ],
  whyHeading: "A Complete 3-Months Watercolour Learning Journey",
  whyDescription:
    "Designed for artists and creative learners who want to go beyond the basics. Through 24 structured interactive classes over three months, you will develop confidence, technique, and your own unique artistic voice across three timeless painting subjects.",
  whyCallout: "Master Landscape, Floral & Still Life with guided mentorship.",
  scheduleHeading: "3 Months | 24 Live Classes",
  scheduleItems: [
    {
      label: "2 Foundation Classes",
      detail:
        "to build a strong understanding of the basics before moving into painting.",
    },
    {
      label: "18 Demo Classes",
      detail:
        "6 live sessions every month, scheduled on Tuesdays & Thursdays according to the monthly calendar.",
    },
    {
      label: "3 Discussion Sessions",
      detail:
        "1 dedicated discussion session every month for interaction, feedback and guidance.",
    },
    {
      label: "1 Complimentary Black Ink Demo Session",
      detail: "Special bonus exploration session.",
    },
  ],
  scheduleNote:
    "The detailed class schedule will be shared every month after enrolment.",
  ctaText: "Enrol in Artistry + Foundation Course",
};

export const DEFAULT_WORKSHOP_DETAILS: CourseContentDetails = {
  cardSubtitle: "One-Day Masterclass",
  cardSummary: "Interactive Live Masterclass on Zoom",
  cardDescription: "Live Masterclass designed to fix basics and get you painting.",
  subjects: "Watercolour Essentials • Live Demonstration",
  cardPriceLabel: "Complete Live Atelier Access",
  sessionCountText: "1 Live Session",
  sessionDurationText: "130 mins",
  durationMonthsText: "1 Day",
  fullDescription:
    "Live intimate masterclass session on Zoom with personal guidance and feedback.",
  learningOutcomesHeading: "",
  learningOutcomesSubheading: "",
  learningOutcomes: [],
  whyHeading: "",
  whyDescription: "",
  whyCallout: "",
  scheduleHeading: "Live Workshop Details",
  scheduleItems: [],
  scheduleNote:
    "Live interactive atelier sessions on Zoom with personal feedback and guidance.",
  ctaText: "Register Now",
};

/**
 * Safely parses course details from JSON string or returns baseline fallback
 */
export function parseCourseDetails(
  slug: string,
  rawDescription: string | null
): CourseContentDetails {
  const isWorkshop =
    slug === "the-watercolour" || slug === "the-watercolour-roadmap";

  const fallback =
    slug === "watercolour-artistry-foundation"
      ? DEFAULT_ARTISTRY_DETAILS
      : isWorkshop
      ? DEFAULT_WORKSHOP_DETAILS
      : DEFAULT_FOUNDATION_DETAILS;

  if (!rawDescription) {
    return fallback;
  }

  const trimmed = rawDescription.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (isWorkshop) {
        return {
          ...DEFAULT_WORKSHOP_DETAILS,
          ...parsed,
          learningOutcomes: [],
          scheduleItems: [],
        };
      }

      return {
        ...fallback,
        ...parsed,
        learningOutcomes: Array.isArray(parsed.learningOutcomes)
          ? parsed.learningOutcomes
          : fallback.learningOutcomes,
        scheduleItems: Array.isArray(parsed.scheduleItems)
          ? parsed.scheduleItems
          : fallback.scheduleItems,
      };
    } catch {
      return {
        ...fallback,
        fullDescription: rawDescription,
      };
    }
  }

  return {
    ...fallback,
    fullDescription: rawDescription,
  };
}
