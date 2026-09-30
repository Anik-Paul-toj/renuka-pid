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
  aboutArtist: {
    eyebrow: string;
    heading: string;
    role: string;
    introduction: string;
    bio: string[];
    qualifications: string[];
    expertise: string[];
  };
  targetAudience: {
    heading: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      quote?: string;
      icon: string;
      isConclusion?: boolean;
    }>;
  };
  videoSection: {
    overline: string;
    headline: string;
    description?: string;
    videoTitle: string;
    videoThumbnail: string;
    youtubeId?: string;
    learningPoints: string[];
    takeawayHeading?: string;
    takeawayText?: string;
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

export interface WorkshopData {
  type: string;
  title: string;
  transformation: string;
  transformationBefore: string;
  transformationAfter: string;
  format: string;
  focus: string;
  date: string;
  time: string;
  language: string;
  duration: string;
  originalPrice: number;
  offerPrice: number;
  registrationDeadline: string;
  cta: string;
  handwrittenPhrase: string;
}

export const workshopData: WorkshopData = {
  type: "LIVE WORKSHOP",
  title: "The WATERCOLOUR Roadmap:",
  transformation: "“I Can’t Paint” → “I Painted This Myself.”",
  transformationBefore: "“I Can’t Paint”",
  transformationAfter: "“I Painted This Myself.”",
  format: "One-Day Masterclass",
  focus: "To Fix Basics",
  date: "Saturday, 28 October 2026",
  time: "6:30 PM – 8:30 PM IST",
  language: "HINGLISH",
  duration: "120 Minutes",
  originalPrice: 599,
  offerPrice: 199,
  registrationDeadline: "2026-10-28T18:30:00+05:30",
  cta: "REGISTER NOW",
  handwrittenPhrase: "Art heals. Always.",
};

export const masterclassData: MasterclassData = {
  brand: {
    name: "Renuka Aggarwal",
    studioName: "RENUKA ART STUDIO",
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
    instructorTitle: "Art Educator | Founder, Renuka Art Studio",
    instructorImage: "/images/instructor_hero.jpeg",
  },
  stats: [
    {
      number: "15+ Years",
      label: "of teaching experience and studio practice",
      icon: "Sparkles",
    },
    {
      number: "5,000+ Students",
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
  aboutArtist: {
    eyebrow: "ABOUT THE ARTIST",
    heading: "Meet Renuka Aggarwal",
    role: "Art Educator | Founder, Renuka Art Studio",
    introduction:
      "With over 15 years of experience in art education, Renuka Aggarwal is an experienced Art Educator dedicated to helping people discover their creativity, build artistic confidence, and reconnect with the joy of creating.",
    bio: [
      "She is the Director and Co-Owner of Meraki Institute of Fine Art, an established art education institute where she has guided and mentored thousands of students across different age groups and skill levels.",
      "Her teaching philosophy goes beyond simply learning techniques. Renuka believes that art is a way of seeing, expressing and connecting with ourselves. Through her online classes, she aims to make art approachable for beginners while also helping learners develop strong artistic foundations and their own creative voice.",
    ],
    qualifications: [
      "BFA — College of Art, Delhi",
      "Master’s in Fine Arts — Gwalior",
      "Diploma in Fine Arts",
      "Diploma in Photography",
      "Diploma in Art Therapy",
    ],
    expertise: [
      "Watercolour Painting",
      "Oil Colour Painting",
      "Perspective Drawing",
      "Art Therapy & Creative Expression",
      "Drawing & Observation",
      "Composition & Visual Understanding",
      "Art Fundamentals",
      "Creative Exploration & Experimentation",
      "Art Appreciation & Art History",
      "Developing Confidence through Art",
    ],
  },
  targetAudience: {
    heading: "This Workshop Is Ideal For:",
    items: [
      {
        id: "adults-20",
        title: "ADULTS AGED 20+",
        description: "Who want to learn watercolour painting from the basics.",
        icon: "User",
      },
      {
        id: "working-professionals",
        title: "WORKING PROFESSIONALS",
        description: "Looking for a creative and relaxing activity beyond their daily routine.",
        icon: "Sparkles",
      },
      {
        id: "homemakers",
        title: "HOMEMAKERS",
        description: "Who want to explore their artistic side and make time for themselves.",
        icon: "Heart",
      },
      {
        id: "complete-beginners",
        title: "COMPLETE BEGINNERS",
        description: "With little or no prior painting experience.",
        icon: "Palette",
      },
      {
        id: "hobby-artists",
        title: "HOBBY ARTISTS",
        description: "Who want to strengthen their watercolour skills and techniques.",
        icon: "Brush",
      },
      {
        id: "youtube-tutorials",
        title: "PEOPLE WHO HAVE TRIED YOUTUBE TUTORIALS",
        description: "But still struggle to paint confidently on their own.",
        icon: "BookOpen",
      },
      {
        id: "aspiring-artists",
        title: "ASPIRING ARTISTS",
        description: "Who want to build a strong foundation in watercolour painting.",
        icon: "GraduationCap",
      },
      {
        id: "water-colour-control",
        title: "ANYONE WHO STRUGGLES WITH WATER & COLOUR CONTROL",
        description: "And wants a structured, guided approach.",
        icon: "Droplets",
      },
    ],
  },
  videoSection: {
    overline: "INSIDE THE SESSION",
    headline: "What You’ll Learn in the Live Masterclass",
    videoTitle: "Watercolor for a Calmer, Brighter You — Studio Preview",
    videoThumbnail: "/images/video_preview.jpg",
    youtubeId: "I0q9IDdAFCs",
    learningPoints: [
      "Understand the secrets behind beautiful watercolour paintings.",
      "Learn how to begin your watercolour journey with minimal drawing skills.",
      "Master water and colour control for better, more predictable results.",
      "Learn the basics of colour mixing and create harmonious colour combinations.",
      "Discover how to maintain freshness and transparency in your paintings.",
      "Create a beginner-friendly watercolour work using simple techniques.",
      "Learn how to approach and start a painting with confidence.",
      "Understand the essential watercolour materials and how to use them effectively.",
    ],
    takeawayHeading: "And the biggest takeaway:",
    takeawayText:
      "You’ll stop wondering, “Why doesn’t my painting look like the reference?” — and start understanding exactly what to do differently.",
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
    afterTitle: "THE RENUKA ART STUDIO WAY",
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
    overline: "ABOUT RENUKA",
    headline: "Meet ",
    name: "Renuka Aggarwal",
    subtitle: "ART EDUCATOR | FOUNDER, RENUKA ART STUDIO",
    paragraphs: [
      "She is the Director and Co-Owner of Meraki Institute of Fine Art, an established art education institute in Delhi where she has guided and mentored thousands of students across different age groups and skill levels.",
      "Her teaching philosophy goes beyond simply learning techniques. Renuka believes that art is a way of seeing, expressing and connecting with ourselves.",
    ],
    quote: "My art is always an invitation to slow down, breathe, and discover the quiet beauty hidden within everyday moments.",
    quoteAuthor: "Renuka Aggarwal",
    image: "/images/instructor_story.jpeg",
  },
  bonuses: {
    overline: "LIVE ATTENDEE GIFTS",
    headline: "Attend Live and Receive Three ",
    headlineHighlight: "Renuka Art Studio Resources",
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
      question: "Is this Masterclass suitable for complete beginners?",
      answer:
        "Yes! It is specially designed for complete beginners. You don’t need any previous experience with watercolours—just bring your interest and curiosity.",
    },
    {
      question: "What supplies do I need to attend the Masterclass?",
      answer:
        "You can use whatever watercolour supplies you already have at home. Colours, paper, brushes and a palette are enough. You can also simply keep a notebook and pen for taking notes.",
    },
    {
      question: "Will there be a replay if I cannot attend the live session?",
      answer:
        "No. This is a live, interactive Masterclass designed to give you a hands-on learning experience. If you miss the live session, the experience cannot be replicated through a replay.",
    },
    {
      question: "Who is this Masterclass for?",
      answer:
        "This Masterclass is specially designed for beginners aged 20+, including working professionals, homemakers and anyone who wants to start painting from scratch.",
    },
    {
      question: "What will I learn in 1 hour?",
      answer:
        "You’ll learn the basics of water control, colour mixing, brush handling and simple watercolour techniques, and create a painting along with the instructor.",
    },
    {
      question: "What language will the class be conducted in?",
      answer:
        "The Masterclass will be conducted in a comfortable combination of Hindi and English, so that the concepts are easy to understand and follow.",
    },
    {
      question: "Will you try to sell something during the class?",
      answer:
        "Not at all. The Masterclass is focused on giving you a genuine learning experience. At the end, if you wish to continue your watercolour journey, I’ll share details about my complete Watercolour Course and how you can take your learning further.",
    },
    {
      question: "Is this a recorded class or a live class?",
      answer:
        "It is a live, interactive Masterclass where you can paint along with the instructor and experience the process in real time.",
    },
    {
      question: "Do I need to know drawing before joining?",
      answer:
        "Absolutely not! This Masterclass is created for beginners, so you don’t need to be good at drawing or have any previous art background.",
    },
    {
      question: "What if I’m not able to complete the painting during the session?",
      answer:
        "That’s completely okay. The goal is to understand the process, techniques and approach—not to create a perfect painting. You can always complete your artwork afterwards using what you learn.",
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
      "Renuka Aggarwal | Renuka Art Studio. Mindful watercolor courses, creative well-being, and artistic mentorship designed to nurture a calmer, brighter you.",
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
      "Renuka Art Studio provides educational art guidance and mindful creative mentorship. All illustrations and demonstrations are designed to foster peaceful personal expression.",
    handwrittenSignature: "Keep Creating ♡",
  },
};
