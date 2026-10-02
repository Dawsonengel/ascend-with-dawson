export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  createdAt: string;
  viewCount?: number;
  uniqueViewerCount?: number;
  avgCompletion?: number;
};

export const initialBlogPosts: BlogPost[] = [
  {
    id: "tiny-systems",
    title: "Tiny Systems, Real Momentum",
    excerpt: "Small repeatable systems beat random heroic effort.",
    content:
      "Create one small system each week and run it daily. Lower the entry barrier, define a clear finish line, and review outcomes every Friday.",
    createdAt: "2026-01-18T10:00:00.000Z",
  },
  {
    id: "content-boundaries",
    title: "Content Boundaries That Protect Energy",
    excerpt: "Boundaries improve creative output and reduce decision fatigue.",
    content:
      "Choose fixed windows for creating and publishing. Boundaries reduce reactive posting and preserve energy for meaningful work.",
    createdAt: "2026-01-11T10:00:00.000Z",
  },
  {
    id: "calm-execution",
    title: "Calm Execution in Noisy Markets",
    excerpt: "Routine replaces reaction when the timeline is loud.",
    content:
      "Pre-plan your core tasks before opening social apps. Your execution quality improves when your priorities are already set.",
    createdAt: "2026-01-04T10:00:00.000Z",
  },
  {
    id: "creator-focus",
    title: "Creator Focus in 45-Minute Blocks",
    excerpt: "Single-tasking with fixed windows compounds faster than multitasking.",
    content:
      "Use 45-minute blocks for one objective at a time. Capture distractions on paper and return to them after the block ends.",
    createdAt: "2025-12-28T10:00:00.000Z",
  },
  {
    id: "identity-evidence",
    title: "Identity Evidence Beats Motivation",
    excerpt: "Confidence grows from proof, not mood.",
    content:
      "Collect daily evidence of the person you are becoming. One kept promise per day changes self-trust over time.",
    createdAt: "2025-12-21T10:00:00.000Z",
  },
];
