export interface MasterclassData {
  brand: {
    name: string;
    studioName: string;
    tagline: string;
    subTagline: string;
  };
  hero: {
    pillLabel: string;
    headlineStart: string;
    headlineHighlight: string;
    subheadline: string;
    handwrittenPhrase: string;
    date: string;
    time: string;
    duration: string;
    language: string;
    ctaText: string;
    urgencyText: string;
    guaranteeText: string;
    targetAudienceNote: string;
    instructorName: string;
    instructorTitle: string;
    instructorImage: string;
  };
  stats: Array<{
    number: string;
    label: string;
    icon: string;
  }>;
  trustSection: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    description: string;
  };
  targetAudience: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    cards: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
    footerQuote: string;
    handwrittenNote?: string;
  };
  videoSection: {
    overline: string;
    headline: string;
    description: string;
    videoTitle: string;
    videoThumbnail: string;
    youtubeId?: string;
    learningPoints: string[];
    ctaText: string;
    handwrittenNote?: string;
  };
  transformation: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    beforeTitle: string;
    beforePoints: string[];
    afterTitle: string;
    afterPoints: string[];
    takeaway: string;
  };
  methodFramework: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    steps: Array<{
      number: string;
      title: string;
      subtitle: string;
      description: string;
      icon: string;
    }>;
    pillSummary: string;
  };
  coreSecrets: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    secrets: Array<{
      number: string;
      title: string;
      subtitle: string;
      description: string;
      bullets: string[];
      icon: string;
    }>;
    bottomNote: string;
    ctaText: string;
  };
  outcomes: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    description: string;
    items: string[];
    disclaimer: string;
  };
  instructorStory: {
    overline: string;
    headline: string;
    name: string;
    subtitle: string;
    paragraphs: string[];
    quote: string;
    quoteAuthor: string;
    image: string;
  };
  bonuses: {
    overline: string;
    headline: string;
    headlineHighlight: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      icon: string;
    }>;
    deliveryNote: string;
  };
  fitCheck: {
    overline: string;
    headline: string;
    fitTitle: string;
    fitPoints: string[];
    unfitTitle: string;
    unfitPoints: string[];
    closingNote: string;
  };
  included: {
    overline: string;
    headline: string;
    items: Array<{
      title: string;
      status: string;
    }>;
    feeLabel: string;
    feeValue: string;
    ctaText: string;
    guaranteeNote: string;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  finalCta: {
    overline: string;
    headline: string;
    description: string;
    handwrittenPhrase: string;
    ctaText: string;
    dateInfo: string;
    subNote: string;
  };
  footer: {
    brandDescription: string;
    links: Array<{
      label: string;
      href: string;
    }>;
    contactEmail: string;
    copyrightYear: number;
    disclaimer: string;
    handwrittenSignature: string;
  };
}

export const masterclassData: MasterclassData = {
  brand: {
    name: "Renuka Aggarwal",
    studioName: "ART & SOUL STUDIO",
    tagline: "ART | MINDFULNESS | A BRIGHTER YOU",
    subTagline: "Mindful Watercolor & Creative Well-Being",
  },
  hero: {
    pillLabel: "ART FOR A CALMER, BRIGHTER YOU",
    headlineStart: "Learn Art. Rediscover Yourself. ",
    headlineHighlight: "Create a Kinder You.",
    subheadline:
      "Begin your creative journey with mindful, step-by-step watercolour courses designed for adults 25+ — no prior experience needed.",
    handwrittenPhrase: "Art heals. Always.",
    date: "Saturday, 28 October 2026",
    time: "6:30 PM IST (9:00 AM EDT)",
    duration: "120 Minutes",
    language: "English (with gentle visual demonstrations)",
    ctaText: "EXPLORE COURSES",
    urgencyText: "Complimentary live registration • Gentle joining details by email",
    guaranteeText: "Live intimate atelier broadcast • Limited to 200 interactive attendees.",
    targetAudienceNote: "Designed warmly for beginners, working adults, and creative souls at every level.",
    instructorName: "Renuka Aggarwal",
    instructorTitle: "Art Educator | Founder, Art & Soul Studio",
    instructorImage: "/images/instructor_hero.jpg",
  },
  stats: [
    {
      number: "15+ Years",
      label: "of teaching experience and studio practice",
      icon: "Sparkles",
    },
    {
      number: "1,000+ Students",
      label: "guided to experience the gentle joy of watercolor",
      icon: "Users",
    },
    {
      number: "Fine Arts Graduate",
      label: "grounded in classical color theory and mindful craft",
      icon: "GraduationCap",
    },
    {
      number: "Art for Well-being",
      label: "dedicated to calm, personal growth, and creative healing",
      icon: "Heart",
    },
  ],
  trustSection: {
    overline: "ABOUT THE PRACTICE",
    headline: "Learn from an Artist Who Has ",
    headlineHighlight: "Lived the Practice",
    description:
      "Artistic confidence is not built through rushed tricks or pressure. It grows gently through observation, mindful practice, and discovering how each soft brushstroke can bring stillness, presence, and joy to everyday life.",
  },
  targetAudience: {
    overline: "WHO THIS IS FOR",
    headline: "This Masterclass Is for You If You Want to Paint with ",
    headlineHighlight: "Clarity, Not Confusion",
    cards: [
      {
        id: "beginners",
        title: "Beginner Artists",
        description:
          "Who want a structured, gentle starting process without fear, judgment, or feeling lost.",
        icon: "Compass",
      },
      {
        id: "self-taught",
        title: "Self-Taught Learners",
        description:
          "Who feel stuck despite watching endless tutorials and want a cohesive, mindful foundation.",
        icon: "Sparkles",
      },
      {
        id: "working-adults",
        title: "Working Adults & Parents",
        description:
          "Returning to creativity and seeking a therapeutic, restorative practice that fits their busy life.",
        icon: "Heart",
      },
      {
        id: "advancing",
        title: "Advancing Hobbyists",
        description:
          "Who want to capture luminous botanical light, soft transparency, and poetic depth.",
        icon: "Layers",
      },
      {
        id: "students",
        title: "Art & Design Students",
        description:
          "Who want to build sound principles in color temperatures, edge control, and visual storytelling.",
        icon: "GraduationCap",
      },
      {
        id: "creative-souls",
        title: "Seekers of Well-Being",
        description:
          "Who believe that creative expression is a kinder, gentler way to be in the world.",
        icon: "Flower2",
      },
    ],
    footerQuote: "Creativity is a kinder way to be in the world.",
    handwrittenNote: "Small steps, creative changes.",
  },
  videoSection: {
    overline: "INSIDE THE SESSION",
    headline: "What You Will Learn in This Live Masterclass",
    description:
      "By the end of this live 120-minute session, you will possess a gentle, repeatable blueprint to:",
    videoTitle: "Watercolor for a Calmer, Brighter You — Studio Preview",
    videoThumbnail: "/images/video_preview.jpg",
    youtubeId: "I0q9IDdAFCs",
    learningPoints: [
      "Observe light and gentle values before your brush ever touches the paper.",
      "Simplify intricate botanical and natural references into calm, harmonious shapes.",
      "Blend warm and cool watercolor washes cleanly without accidental muddiness.",
      "Create luminous transparency and delicate atmospheric depth with confidence.",
      "Master edge transitions: know when to keep edges crisp and when to let them soften.",
      "Let go of perfectionism and embrace the organic, fluid beauty of watercolor.",
      "Infuse mood, warmth, and personal feeling into ordinary botanical scenes.",
      "Follow a reliable 3-step ritual that makes painting a daily restorative practice.",
    ],
    ctaText: "EXPLORE THE MASTERCLASS →",
    handwrittenNote: "Small Steps, Creative Big Changes",
  },
  transformation: {
    overline: "THE SHIFT",
    headline: "More Overthinking Is Not the Answer. ",
    headlineHighlight: "Better Decisions Are.",
    beforeTitle: "THE OLD WAY",
    beforePoints: [
      "Copying photo references blindly with tension and performance anxiety",
      "Beginning a painting without a clear light and value plan",
      "Overworking wet washes until the paper turns dull and muddy",
      "Judging your creative worth strictly by instant perfection",
      "Treating art like an intimidating test rather than a gentle sanctuary",
      "Abandoning unfinished paintings whenever a mistake occurs",
      "Feeling disconnected from the mindful, therapeutic pleasure of the process",
    ],
    afterTitle: "THE ART & SOUL WAY",
    afterPoints: [
      "Observing the soul and light of the subject with peaceful curiosity",
      "Anchoring one dominant light vector to organize values naturally",
      "Letting watercolor flow freely with fresh, transparent pigment washes",
      "Embracing gentle imperfections and lost edges that invite imagination",
      "Experiencing painting as mindful self-care and authentic creative expression",
      "Navigating unexpected water blooms into expressive organic marks",
      "Cultivating a lifelong, repeatable practice of calm artistic confidence",
    ],
    takeaway:
      "The goal is never to reproduce a photographic copy. The goal is to slow down, observe with love, and paint from the heart.",
  },
  methodFramework: {
    overline: "THE METHOD",
    headline: "A Clear Philosophy for ",
    headlineHighlight: "Every Watercolor Piece",
    steps: [
      {
        number: "01",
        title: "OBSERVE",
        subtitle: "Pause, breathe, and see the structure behind the light.",
        description:
          "Notice the gentle direction of illumination, value hierarchy, and emotional mood of the scene before mixing pigments.",
        icon: "Eye",
      },
      {
        number: "02",
        title: "SIMPLIFY",
        subtitle: "Transform complexity into soft, manageable shapes.",
        description:
          "Distill overwhelming botanical details into three gentle value masses and a harmonious limited palette.",
        icon: "Layers",
      },
      {
        number: "03",
        title: "CREATE",
        subtitle: "Apply pigments with intention, freshness, and release.",
        description:
          "Sequence your transparent washes, preserve luminous paper whites, and let water do its natural, organic magic.",
        icon: "Brush",
      },
    ],
    pillSummary: "Observe → Simplify → Create: Pause. Breathe. Paint with joy.",
  },
  coreSecrets: {
    overline: "WHAT YOU'LL UNLOCK",
    headline: "The Three Secrets Behind ",
    headlineHighlight: "Luminous Watercolors",
    secrets: [
      {
        number: "Secret 01",
        title: "The Mindful Light Principle™",
        subtitle: "Create radiant luminosity and breathing space",
        description:
          "Discover how establishing one governing light direction simplifies every value choice, illuminates petal layers, and gives flat paper vibrant life.",
        bullets: [
          "How to locate or gently invent the dominant light source.",
          "Why value relationships matter far more than mixing exact local colors.",
          "How cast shadows and ambient glow interplay on natural forms.",
          "How to safeguard the pure, untouched white paper for maximum brilliance.",
        ],
        icon: "Sun",
      },
      {
        number: "Secret 02",
        title: "Soft Petal & Pigment Flow™",
        subtitle: "Create vibrant harmony without muddy mixtures",
        description:
          "Understand the delicate dance of water-to-pigment ratios, warm and cool dialogues, and how to let watercolors mix optically on the page.",
        bullets: [
          "Why muddiness stems from uncertain values rather than too many colors.",
          "How warm-versus-cool contrast brings botanical forms forward effortlessly.",
          "Building a timeless, unified palette with just 4 to 5 essential pigments.",
          "Knowing when to mix in the ceramic well versus letting colors fuse on cotton.",
        ],
        icon: "Palette",
      },
      {
        number: "Secret 03",
        title: "The Soulful Storytelling Method™",
        subtitle: "Turn everyday flora into meaningful emotional art",
        description:
          "Learn how intentional suggestion, soft lost edges, and atmospheric washes invite the viewer's heart into the artwork.",
        bullets: [
          "How to identify the emotional center of any floral or landscape subject.",
          "Using edge control (sharp, soft, lost) to guide the viewer's gaze.",
          "Why under-rendering background details actually elevates your main subject.",
          "Shifting from photographic copying to authentic, personal expression.",
        ],
        icon: "Heart",
      },
    ],
    bottomNote:
      "During the live demonstration, Renuka will paint a complete floral watercolor piece step-by-step, explaining every brushstroke and mindful decision in real-time.",
    ctaText: "RESERVE MY FREE SEAT →",
  },
  outcomes: {
    overline: "THE OUTCOME",
    headline: "What Changes When Your ",
    headlineHighlight: "Decisions Become Clear",
    description: "Once you embrace this gentle, structured approach to painting, you will begin to:",
    items: [
      "Approach an empty sheet of paper with calm anticipation instead of hesitation.",
      "Mix clean, singing color washes without fear of creating accidental grey mud.",
      "Build commanding value hierarchies that read clearly and feel dimensional.",
      "Distill complex botanical blossoms and landscapes into graceful, large shapes.",
      "Master edge transitions to effortlessly guide the viewer’s eye.",
      "Stop overworking paintings and recognize the sweet moment a piece is complete.",
      "Infuse ordinary moments and flowers with poetic mood, warmth, and emotion.",
      "Evaluate your practice with kindness and curiosity rather than harsh self-criticism.",
      "Break free from painting-by-numbers tutorials and develop your own creative voice.",
      "Find genuine peace, mindfulness, and creative rejuvenation in your painting time.",
    ],
    disclaimer:
      "The masterclass provides mindful artistic education and live demonstration. Individual artistic progress naturally depends on deliberate practice and personal application.",
  },
  instructorStory: {
    overline: "ABOUT ME",
    headline: "Hi, I'm ",
    name: "Renuka Aggarwal",
    subtitle: "ART EDUCATOR | FOUNDER, ART & SOUL STUDIO",
    paragraphs: [
      "With over 15 years of teaching experience, I help adults discover the joy of art through simple, mindful and well-structured watercolour courses. My goal is to make art accessible, meaningful and a part of your everyday life — no matter where you are in your journey.",
      "I believe everyone holds a natural, innate creative impulse that often gets buried under the busyness of adult life. In my studio, we step away from competition and rigid expectations. We return to the tactile pleasure of water, natural pigment, and mindful breathing.",
      "Through Art & Soul Studio, I have had the privilege of guiding more than 1,000 students worldwide to rediscover their creative confidence, quiet their inner critic, and experience art as a kinder, restorative companion.",
    ],
    quote: "My art is always an invitation to slow down, breathe, and discover the quiet beauty hidden within everyday moments.",
    quoteAuthor: "Renuka Aggarwal",
    image: "/images/instructor_story.jpg",
  },
  bonuses: {
    overline: "LIVE ATTENDEE GIFTS",
    headline: "Attend Live and Receive Three ",
    headlineHighlight: "Art Studio Resources",
    items: [
      {
        id: "bonus-1",
        title: "The Mindful Watercolor Field Guide",
        description:
          "A beautifully illustrated 24-page guide addressing water control, clean color recipes, and gentle remedies for common beginner challenges.",
        type: "EXCLUSIVE COMPENDIUM (PDF)",
        icon: "BookOpen",
      },
      {
        id: "bonus-2",
        title: "Botanical Pigment & Color Harmony Chart",
        description:
          "A curated guide to pigment transparency, granulating washes, and mixing luminous floral greens and blush pinks with a minimal palette.",
        type: "STUDIO REFERENCE PALETTE",
        icon: "Sliders",
      },
      {
        id: "bonus-3",
        title: "Full-Length Floral Master Demonstration Replay",
        description:
          "48-hour access to an uncut, dual-camera video recording of Renuka painting a complete botanical watercolor piece with detailed commentary.",
        type: "RECORDED DEMO ACCESS",
        icon: "Video",
      },
    ],
    deliveryNote:
      "Access links and downloadable studio guides will be shared directly with live attendees during the broadcast via email and the community channel.",
  },
  fitCheck: {
    overline: "RIGHT FIT CHECK",
    headline: "Who Should Attend — and Who Should Not",
    fitTitle: "This masterclass is a wonderful fit if you:",
    fitPoints: [
      "Are looking for a calming, joyful, and creative sanctuary away from daily stress.",
      "Want clear, step-by-step guidance rather than overwhelming, disjointed video clips.",
      "Can set aside 120 uninterrupted minutes to immerse yourself in art and learning.",
      "Are excited to explore watercolor with curiosity, patience, and a playful spirit.",
      "Wish to learn mindful principles of light, botanical transparency, and edge softness.",
      "Value personal growth, kindness toward yourself, and the meditative joy of creating.",
    ],
    unfitTitle: "This masterclass may not be right for you if you:",
    unfitPoints: [
      "Are seeking a rushed, overnight shortcut that promises mastery without brush mileage.",
      "Only want downloadable files and have no intention of joining the live community.",
      "Believe art must be stressful, high-pressure, or strictly commercial.",
      "Are closed to reflecting on your creative habits with gentleness and curiosity.",
      "Cannot commit to 120 focused minutes of quiet, mindful presence.",
    ],
    closingNote:
      "There is no pressure if the timing does not feel right today. We honor where you are on your creative journey and welcome you whenever you are ready.",
  },
  included: {
    overline: "WHAT'S INCLUDED",
    headline: "Everything Included in Your Free Registration",
    items: [
      {
        title: "Live 120-Minute Masterclass: Watercolor for a Calmer, Brighter You",
        status: "Complimentary",
      },
      {
        title: "Live Interactive Q&A with Renuka Aggarwal",
        status: "Included Free",
      },
      {
        title: "E-Book: The Mindful Watercolor Field Guide",
        status: "Included Free",
      },
      {
        title: "Color Chart: Botanical Pigment & Harmony Palette",
        status: "Included Free",
      },
      {
        title: "Master Demonstration Replay Access (48 Hours)",
        status: "Included Free",
      },
      {
        title: "Calendar invitation, preparation checklist, and email reminders",
        status: "Included",
      },
    ],
    feeLabel: "Registration fee for this live broadcast",
    feeValue: "Free",
    ctaText: "RESERVE MY FREE SEAT →",
    guaranteeNote: "One gentle session. One clear framework. A lifetime of calm creative joy.",
  },
  faqs: [
    {
      question: "Is this masterclass truly suitable for complete beginners?",
      answer:
        "Yes, with all my heart. My teaching is designed specifically for adults who have never held a watercolor brush or haven't painted since childhood. We strip away intimidation and focus on simple, reassuring steps that anyone can follow with delight.",
    },
    {
      question: "I have tried watercolor before and made a muddy mess. Can I really learn?",
      answer:
        "Muddy watercolor is never a lack of talent—it is simply a misunderstanding of water-to-pigment balance and timing. In this masterclass, I will show you the exact moment to let paper dry and how to keep colors radiant, fresh, and singing.",
    },
    {
      question: "What supplies do I need to attend the live masterclass?",
      answer:
        "You do not need any supplies to attend and enjoy the live session! I recommend bringing a warm cup of tea and a notebook to absorb the ideas without pressure. You can apply the techniques later with whatever materials you have at home.",
    },
    {
      question: "How long is the session and when will it take place?",
      answer:
        "The masterclass runs for 120 minutes on Saturday, 28 October 2026 at 6:30 PM IST (9:00 AM EDT). It includes 80 minutes of structured demonstration followed by 40 minutes of live, personal Q&A.",
    },
    {
      question: "Will there be a replay if I cannot make it live?",
      answer:
        "A limited 48-hour replay link will be shared with registered attendees who join the live broadcast. The gifts and bonus studio guides are exclusive to live participants.",
    },
    {
      question: "What language will the class be conducted in?",
      answer:
        "The masterclass is taught in clear, warm, and gentle English, with close-up overhead camera angles so every brushstroke and paint mixture is clearly visible.",
    },
    {
      question: "Is registration genuinely free?",
      answer:
        "Yes, 100% complimentary. There is no credit card required. This is my gift to introduce you to our mindful art community at Art & Soul Studio.",
    },
    {
      question: "Will you try to sell something aggressively during the class?",
      answer:
        "Not at all. Aggressive sales have no place in a peaceful art studio. At the very end of the masterclass, for those who want to continue their journey with me, I will gently share details about my comprehensive courses. The masterclass itself is a complete, enriching experience.",
    },
  ],
  finalCta: {
    overline: "START TODAY",
    headline: "Ready to Begin Your Creative Journey?",
    description:
      "Join a supportive community and experience the transformative, calming power of art. Give yourself 120 mindful minutes to pause, breathe, and paint.",
    handwrittenPhrase: "Create. Pause. Breathe. Heal.",
    ctaText: "EXPLORE COURSES →",
    dateInfo: "Live on Saturday, 28 October 2026 at 6:30 PM IST",
    subNote: "100% Free Registration • Instant Email Confirmation • Suitable for all levels",
  },
  footer: {
    brandDescription:
      "Renuka Aggarwal | Art & Soul Studio. Mindful watercolor courses, creative well-being, and artistic mentorship designed to nurture a calmer, brighter you.",
    links: [
      { label: "Home", href: "#" },
      { label: "About", href: "#about" },
      { label: "Courses", href: "#courses" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "Blog", href: "#blog" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy Policy", href: "#privacy" },
    ],
    contactEmail: "hello@renukaartstudio.com",
    copyrightYear: 2026,
    disclaimer:
      "Art & Soul Studio provides educational art guidance and mindful creative mentorship. All illustrations and demonstrations are designed to foster peaceful personal expression.",
    handwrittenSignature: "Keep Creating ♡",
  },
};
