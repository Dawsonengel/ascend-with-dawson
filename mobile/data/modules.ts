export type Module = {
  id: string;
  title: string;
  category: string;
  description: string;
  intro: string;
  reflectionPrompt: string;
};

export const modules: Module[] = [
  {
    id: "identity-reset",
    title: "Identity Reset",
    category: "Mindset",
    description: "Define the person you are becoming through small daily proof.",
    intro: "Clarity comes from repeated identity-aligned actions.",
    reflectionPrompt: "What action today proved your future identity?",
  },
  {
    id: "morning-anchor",
    title: "Morning Anchor",
    category: "Ritual",
    description: "A calm 10-minute start to reduce friction and reactiveness.",
    intro: "Simple starts beat perfect starts.",
    reflectionPrompt: "What anchor can you protect every morning this week?",
  },
  {
    id: "focus-sprint",
    title: "Focus Sprint",
    category: "Productivity",
    description: "Train deep focus in short intervals and recover with intention.",
    intro: "Attention is your most valuable asset.",
    reflectionPrompt: "What distracted you, and what boundary will you set next?",
  },
  {
    id: "nervous-system",
    title: "Nervous System Reset",
    category: "Recovery",
    description: "Use breath and pacing to regulate pressure in real time.",
    intro: "Regulation unlocks better choices under stress.",
    reflectionPrompt: "What sign told you to pause and regulate today?",
  },
  {
    id: "energy-basics",
    title: "Energy Basics",
    category: "Body",
    description: "Sleep, movement, and hydration without overcomplication.",
    intro: "Sustainable energy starts with repeatable basics.",
    reflectionPrompt: "Which basic gave you the biggest lift this week?",
  },
  {
    id: "weekly-review",
    title: "Weekly Review",
    category: "Reflection",
    description: "Close your week with objective wins, gaps, and next actions.",
    intro: "Measured reflection compounds progress.",
    reflectionPrompt: "What one change would make next week easier to win?",
  },
];

export function getModuleById(id: string) {
  return modules.find((item) => item.id === id);
}
