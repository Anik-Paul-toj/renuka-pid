export interface MasterclassData {
  brand: {
    name: string;
    tagline: string;
    logoText: string;
  };
  hero: {
    pillLabel: string;
    headlineStart: string;
    headlineHighlight: string;
    subheadline: string;
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
    headline: string;
    description: string;
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
  };
}

export const masterclassData: MasterclassData = {
  brand: {
    name: "Renuka Atelier",
    tagline: "Fine Art & Expressive Light Masterclasses",
    logoText: "RENUKA ATELIER",
  },
  hero: {
    pillLabel: "LIVE 120-MINUTE MASTERCLASS WITH RENUKA RAO",
    headlineStart: "The Luminosity Blueprint™ ",
    headlineHighlight: "for Expressive Realism",
    subheadline:
      "Learn how to capture luminous light, atmospheric depth, and emotional resonance in your paintings without getting lost in endless detail.",
    date: "Saturday, 28 October 2026",
    time: "6:30 PM IST (9:00 AM EDT)",
    duration: "120 Minutes",
    language: "English (with clear visual demonstrations)",
    ctaText: "Reserve My Free Seat",
    urgencyText: "Free live registration • Joining details by email • Registration closes 28 Oct, 6:30 PM IST",
    guaranteeText: "Registration closes on 28 October 2026, 6:30 PM IST — or earlier when 200 live seats are filled.",
    targetAudienceNote: "Designed for beginners and advancing visual artists. No formal academic art degree required.",
    instructorName: "Renuka Rao",
    instructorTitle: "Master Artist & Visual Mentor • Founder, Renuka Atelier",
    instructorImage: "/images/instructor_hero.jpg",
  },
  stats: [
    {
      number: "25+ Years",
      label: "of immersive studio practice and international exhibitions",
    },
    {
      number: "180+ Workshops",
      label: "conducted globally across studio residencies and live sessions",
    },
    {
      number: "14 Countries",
      label: "visited for plein-air studies, residencies, and cultural fellowships",
    },
    {
      number: "12,000+ Students",
      label: "mentored to paint with confidence, structure, and distinct personal voice",
    },
  ],
  trustSection: {
    overline: "YOUR MENTOR",
    headline: "Learn from an Artist Who Has ",
    headlineHighlight: "Lived the Practice",
    description:
      "Artistic confidence is never built through disconnected hacks or superficial tricks. It grows through decades of deliberate observation, disciplined simplification, and understanding how to make every brushstroke count with clear intention.",
  },
  targetAudience: {
    overline: "WHO IT'S FOR",
    headline: "This Masterclass Is for You If You Want to Paint with ",
    headlineHighlight: "Clarity — Not Confusion",
    cards: [
      {
        id: "beginners",
        title: "Beginner Artists",
        description:
          "Who want a structured, reliable starting process instead of wondering what step to take first.",
        icon: "Compass",
      },
      {
        id: "self-taught",
        title: "Self-Taught Painters",
        description:
          "Who feel stuck in plateaus despite watching dozens of fragmented YouTube tutorials and time-lapses.",
        icon: "Sparkles",
      },
      {
        id: "advancing",
        title: "Advancing Visual Artists",
        description:
          "Who want to command light, temperature contrast, and visual storytelling with greater emotional depth.",
        icon: "Layers",
      },
      {
        id: "students",
        title: "Design & Fine Art Students",
        description:
          "Who need rock-solid foundation principles in tonal values, focal priority, and edge control.",
        icon: "GraduationCap",
      },
      {
        id: "professionals",
        title: "Working Professionals & Creatives",
        description:
          "Returning to their creative passion and wanting focused, high-yield guidance that respects their time.",
        icon: "Briefcase",
      },
      {
        id: "instructors",
        title: "Art Educators & Serious Hobbyists",
        description:
          "Who want a repeatable, articulate vocabulary to explain complex visual decisions clearly to others.",
        icon: "Palette",
      },
    ],
    footerQuote: "You do not need extraordinary raw talent. You need a clearer way to see, decide, and paint.",
  },
  videoSection: {
    overline: "INSIDE THE SESSION",
    headline: "What You Will Learn in This Live Masterclass",
    description: "By the end of this live 120-minute session, you will possess a repeatable blueprint to:",
    videoTitle: "The Luminosity Blueprint™ Studio Masterclass Preview",
    videoThumbnail: "/images/video_preview.jpg",
    youtubeId: "I0q9IDdAFCs",
    learningPoints: [
      "Identify and anchor your dominant light source before your brush ever touches paper.",
      "Simplify complex, overwhelming photo references into 3 fundamental value masses.",
      "Master warm and cool color temperature harmonies without creating dull, muddy mixtures.",
      "Engineer compelling three-dimensional depth through deliberate atmospheric perspective.",
      "Make decisive choices on what to render sharp, what to soften, and what to leave untouched.",
      "Harness pigment transparency to create radiant luminosity and glowing undertones.",
      "Infuse mood, emotion, and visual storytelling into everyday ordinary subjects.",
      "Follow a reliable 3-phase framework that eliminates creative hesitation and second-guessing.",
    ],
    ctaText: "Yes, I Want to Paint with Confidence — Join Free",
  },
  transformation: {
    overline: "THE SHIFT",
    headline: "More Tutorials Are Not the Answer. ",
    headlineHighlight: "Better Decisions Are.",
    beforeTitle: "THE OLD WAY",
    beforePoints: [
      "Blindly copying every visible surface detail from photographs",
      "Beginning a painting without a clear tonal value strategy",
      "Selecting individual colors object-by-object in total isolation",
      "Constantly scrubbing and correcting until the work is overworked and lifeless",
      "Depending rigidly on the reference photo for every tiny mark",
      "Chasing realism through obsessive rendering rather than light relationships",
      "Judging artistic worth solely by the final outcome rather than process",
    ],
    afterTitle: "THE LUMINOSITY BLUEPRINT™ WAY",
    afterPoints: [
      "Distilling the reference to discover what truly creates the visual story",
      "Establishing one dominant, unambiguous light vector across the canvas",
      "Building unified warm-cool temperature dialogues across all planes",
      "Preserving fresh, luminous passages through intentional suggestion and lost edges",
      "Interpreting the scene with personal creative authority and confidence",
      "Achieving breathtaking realism through values, edges, and atmospheric air",
      "Following a proven, repeatable decision hierarchy every single time",
    ],
    takeaway:
      "The goal is never to reproduce a photographic copy. The goal is to understand the soul of the scene deeply enough to reimagine it with light, atmosphere, and feeling.",
  },
  methodFramework: {
    overline: "THE METHOD",
    headline: "A Clear Philosophy for ",
    headlineHighlight: "Every Masterpiece",
    steps: [
      {
        number: "01",
        title: "OBSERVE",
        subtitle: "See the structural architecture behind the subject.",
        description:
          "Analyze the dominant light angle, value distribution, temperature shifts, and emotional character before mixing a single drop of paint.",
        icon: "Eye",
      },
      {
        number: "02",
        title: "SIMPLIFY",
        subtitle: "Transform overwhelming complexity into clear shapes.",
        description:
          "Reduce the visual world into three primary value families, define the emotional focal center, and establish a harmonious limited palette.",
        icon: "Layers",
      },
      {
        number: "03",
        title: "EXPRESS",
        subtitle: "Apply pigments with intention, freshness, and restraint.",
        description:
          "Sequence your washes, manage edge transitions from razor-sharp to lost, and preserve radiant paper whites for maximum luminosity.",
        icon: "Brush",
      },
    ],
    pillSummary: "Observe → Simplify → Express: See clearly. Decide confidently. Paint intentionally.",
  },
  coreSecrets: {
    overline: "WHAT YOU'LL UNLOCK",
    headline: "The Three Secrets Behind ",
    headlineHighlight: "Stunning Realism",
    secrets: [
      {
        number: "Secret 01",
        title: "The Single Light Vector Rule™",
        subtitle: "Generate convincing light and dimensional space",
        description:
          "Learn how establishing one governing light direction simplifies all value choices, unifies cast shadows, and makes flat paper spring into dynamic three dimensions.",
        bullets: [
          "How to locate or deliberately invent the dominant light direction.",
          "Why value relationships matter ten times more than local object color.",
          "How form shadows, cast shadows, and ambient bounce light interact.",
          "How to safeguard the brightest light passages to maintain pure brilliance.",
        ],
        icon: "Sun",
      },
      {
        number: "Secret 02",
        title: "Chromatic Temperature Harmony™",
        subtitle: "Create vibrant harmony without accidental muddy mixtures",
        description:
          "Unlock the secret dialogues of warm against cool tones, learn clean mixing principles, and let complementary colors vibrate without dulling down your painting.",
        bullets: [
          "Why 'mud' is almost always the result of value confusion, not color mixing.",
          "How warm-versus-cool contrast creates depth far faster than heavy pigment.",
          "How a restrained 5-pigment palette produces far richer unity.",
          "When to blend on the palette versus allowing optical blending on the surface.",
        ],
        icon: "Palette",
      },
      {
        number: "Secret 03",
        title: "The Atmospheric Suggestion System™",
        subtitle: "Transform mere references into evocative emotional stories",
        description:
          "Discover how leaving certain passages soft, suggested, or unresolved invites the viewer's imagination to complete the story with unforgettable resonance.",
        bullets: [
          "How to identify the emotional heartbeat of any scene.",
          "How lost edges and atmospheric haze create breathtaking depth.",
          "Why over-explaining every background element ruins the focal narrative.",
          "How to transition from photographic mimicry to authentic artistic expression.",
        ],
        icon: "Compass",
      },
    ],
    bottomNote:
      "During the live demonstration, Renuka will weave all three secrets together in real-time, walking you through every decision from empty white canvas to complete expressive artwork.",
    ctaText: "Unlock the Three Secrets — Register Free",
  },
  outcomes: {
    overline: "THE OUTCOME",
    headline: "What Changes When Your ",
    headlineHighlight: "Decisions Become Clear",
    description: "Once you adopt this systematic way of seeing and painting, you will begin to:",
    items: [
      "Approach an empty canvas with calm excitement instead of paralysis and fear.",
      "Mix clean, singing color chords without fear of creating accidental grey mud.",
      "Build commanding value hierarchies that read powerfully from across the room.",
      "Distill intricate cityscapes, landscapes, and portraits into effortless large shapes.",
      "Intentionally control hard, soft, and lost edges to orchestrate where the eye travels.",
      "Stop overworking paintings and know precisely when a piece is finished.",
      "Infuse ordinary, everyday scenes with poetic light, atmosphere, and mood.",
      "Evaluate your own work using objective visual principles rather than vague self-criticism.",
      "Break free from relying on paint-by-numbers tutorials and develop your own style.",
      "Build lasting artistic momentum with a repeatable practice you can trust for life.",
    ],
    disclaimer:
      "The masterclass provides rigorous artistic education and live demonstration. Individual artistic progress naturally depends on deliberate practice and application; no instant magical outcomes are promised.",
  },
  instructorStory: {
    overline: "MEET YOUR MENTOR",
    headline: "Meet Your Mentor, ",
    name: "Renuka Rao",
    paragraphs: [
      "Renuka Rao is an acclaimed contemporary realist painter, visual mentor, and the founder of Renuka Atelier. Over a career spanning 25 years of dedicated studio practice, her works have been exhibited across prestigious galleries in London, New York, Paris, and Mumbai.",
      "Before committing fully to her fine art studio, Renuka spent over a decade leading visual design architectures and human perception research. That unique intersection of rigorous analytical thinking and expressive fine art allows her to break down intimidating artistic concepts into clear, structured, and repeatable frameworks.",
      "Through Renuka Atelier, her mission is to guide 100,000 artists worldwide to overcome self-doubt, master the language of light and value, and paint with deep personal conviction and effortless craft.",
    ],
    quote: "Art is never about duplicating what is in front of the lens. It is about illuminating the unseen emotional story living within the light, the air, and the brush.",
    quoteAuthor: "Renuka Rao",
    image: "/images/instructor_story.jpg",
  },
  bonuses: {
    overline: "LIVE-ATTENDEE BONUSES",
    headline: "Attend Live and Unlock Three ",
    headlineHighlight: "Exclusive Learning Resources",
    items: [
      {
        id: "bonus-1",
        title: "The Studio Field Guide to Common Painting Traps",
        description:
          "A practical, 28-page visual handbook to diagnose and correct muddy washes, chalky values, pigment overworking, and weak compositional focal points.",
        type: "EXCLUSIVE E-BOOK (PDF)",
        icon: "BookOpen",
      },
      {
        id: "bonus-2",
        title: "Mastering Pigment Characteristics & Color Harmony",
        description:
          "A curated guide to pigment transparency, granulating properties, staining ratings, and building timeless limited palettes with modern lightfast colors.",
        type: "CURATED REFERENCE COMPENDIUM",
        icon: "Sliders",
      },
      {
        id: "bonus-3",
        title: "Uncut High-Definition Master Demonstration Replay",
        description:
          "Lifetime access to an uncut, dual-camera studio demonstration capturing palette mixing and brush application from first wash to final glaze.",
        type: "RECORDED MASTER DEMO ACCESS",
        icon: "Video",
      },
    ],
    deliveryNote:
      "Access instructions and digital assets will be shared directly with eligible live attendees during the masterclass via registered email and VIP community broadcast.",
  },
  fitCheck: {
    overline: "RIGHT FIT CHECK",
    headline: "Who Should Attend — and Who Should Not",
    fitTitle: "This masterclass is a powerful fit if you:",
    fitPoints: [
      "Are genuinely passionate about elevating your painting craft and visual understanding.",
      "Seek a disciplined, systematic framework rather than collecting random disjointed tips.",
      "Are ready to commit 120 uninterrupted, focused minutes to the live educational experience.",
      "Are eager to take the principles and actively paint and apply them in your own studio.",
      "Want to master light, temperature, tonal values, lost edges, and storytelling.",
      "Understand that artistic maturity rewards thoughtful observation and deliberate repetition.",
    ],
    unfitTitle: "This masterclass may not be right for you if you:",
    unfitPoints: [
      "Are hunting for an overnight shortcut that requires zero brush mileage or practice.",
      "Only wish to collect free PDF downloads with no intention of attending the masterclass.",
      "Expect one masterclass alone to substitute for ongoing creative effort.",
      "Are defensive about trying new techniques or reflecting honestly on past habits.",
      "Are unable or unwilling to set aside 120 focused minutes to engage with the session.",
    ],
    closingNote:
      "There is zero shame in realizing the timing may not fit your schedule. This experience is intentionally curated for artists ready to invest focused attention and elevate their craft.",
  },
  included: {
    overline: "WHAT'S INCLUDED",
    headline: "Everything Included in Your Free Registration",
    items: [
      {
        title: "Live 120-Minute Masterclass: The Luminosity Blueprint™ for Expressive Realism",
        status: "Free",
      },
      {
        title: "Interactive Live Q&A Session with Renuka Rao",
        status: "Included Free",
      },
      {
        title: "E-Book: The Studio Field Guide to Common Painting Traps",
        status: "Included Free",
      },
      {
        title: "Reference Compendium: Pigment Characteristics & Color Harmony",
        status: "Included Free",
      },
      {
        title: "High-Definition Master Demonstration Video Access",
        status: "Included Free",
      },
      {
        title: "Official calendar reminders, workbook downloads, and email onboarding",
        status: "Included",
      },
    ],
    feeLabel: "Registration fee during the current campaign",
    feeValue: "Free",
    ctaText: "Reserve My Free Seat",
    guaranteeNote: "One focused session. One proven framework. A lifetime of confident painting decisions.",
  },
  faqs: [
    {
      question: "Is this masterclass suitable for complete beginners?",
      answer:
        "Yes, absolutely. Renuka breaks down painting principles from their fundamental visual roots (light, shapes, and value hierarchy) without using confusing academic jargon. Whether you have never picked up a brush or are restarting after years, you will find the framework logical, approachable, and immediately actionable.",
    },
    {
      question: "I have watched hundreds of tutorials but still struggle when painting alone. How is this different?",
      answer:
        "Most online tutorials only show what an artist does stroke-by-stroke, which encourages mechanical copying. This masterclass teaches you why decisions are made: how to analyze reference photos, identify light vectors, and organize values. You will leave with a decision-making system that works on any subject, without needing anyone to guide your hand.",
    },
    {
      question: "What medium will be used during the demonstration?",
      answer:
        "Renuka demonstrates primarily in expressive watercolor and fluid media, but the foundational core—light vectors, tonal values, chromatic temperature, and edge control—applies equally to oils, acrylics, gouache, and digital painting.",
    },
    {
      question: "How long is the live session?",
      answer:
        "The masterclass is a focused 120-minute session. We begin promptly with 80 minutes of structured teaching and live painting demonstration, followed by 40 minutes of live interactive Q&A where Renuka answers participant questions.",
    },
    {
      question: "When and where does the masterclass take place?",
      answer:
        "It takes place live on Saturday, 28 October 2026 at 6:30 PM IST (9:00 AM EDT). It is hosted online via high-definition private live stream. You can attend from any computer, tablet, or mobile phone with a stable internet connection.",
    },
    {
      question: "What language will be used during the session?",
      answer:
        "The masterclass is conducted in clear, accessible English with clear visual annotations, step-by-step close-up camera angles, and on-screen diagrams.",
    },
    {
      question: "Do I need special art materials to attend?",
      answer:
        "No materials are required to attend the live session! We strongly recommend attending with a notebook and pen so you can absorb the concepts without distraction. You can apply the techniques with your own supplies at your own pace afterwards.",
    },
    {
      question: "Will I receive a recording if I cannot attend live?",
      answer:
        "The masterclass is designed primarily as a live interactive experience. A limited 48-hour replay link will be shared exclusively with registered participants who join the live broadcast. Bonuses are reserved for live attendees.",
    },
    {
      question: "How do I receive the joining link and reminders?",
      answer:
        "Immediately upon reserving your seat, you will receive a confirmation email with calendar invitation links. You will also receive reminder notifications 24 hours, 2 hours, and 15 minutes before the broadcast begins.",
    },
    {
      question: "Is registration genuinely 100% free?",
      answer:
        "Yes, 100% free. There is no credit card required and no hidden subscription fees. Our live masterclasses are our way of introducing serious artists to the Renuka Atelier educational philosophy.",
    },
    {
      question: "Will you try to sell a long-term program during the session?",
      answer:
        "At the conclusion of the 120-minute masterclass, for those who wish to continue their mentorship and join our intensive year-long atelier curriculum, Renuka will briefly share details on how to apply. There is zero high-pressure selling, and the free masterclass itself is a complete, self-contained educational experience with immediate value.",
    },
    {
      question: "Can teenagers or students under 18 join?",
      answer:
        "Yes, enthusiastic young artists and students over the age of 13 are very welcome to attend and participate with parent or guardian awareness.",
    },
  ],
  finalCta: {
    headline: "Your Next Painting Does Not Need More Guesswork",
    description:
      "Give yourself 120 focused minutes to understand how light, color temperature, and emotion work in harmony. Learn a repeatable process for seeing clearly, simplifying confidently, and painting with true intention.",
    ctaText: "Reserve My Free Seat",
    dateInfo: "Live on Saturday, 28 October 2026 at 6:30 PM IST (9:00 AM EDT)",
    subNote: "Suitable for beginners and advancing artists • 100% Free Registration • Instant Email Confirmation",
  },
  footer: {
    brandDescription:
      "Renuka Atelier provides premier visual art education, live demonstrations, and creative mentorship. Master light, value, and emotional depth through structured, repeatable artistic frameworks.",
    links: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Atelier Code of Ethics", href: "#ethics" },
      { label: "Contact: admissions@renukaatelier.com", href: "mailto:admissions@renukaatelier.com" },
    ],
    contactEmail: "admissions@renukaatelier.com",
    copyrightYear: 2026,
    disclaimer:
      "Renuka Atelier provides educational fine art instruction. Demonstrations and examples are illustrative of core techniques. Individual artistic progress naturally varies according to prior foundation and dedicated personal practice.",
  },
};
