export type CheckInEntry = {
  id: string;
  createdAt: string;
  mood: number;
  energy: number;
  reflection: string;
};

export type WinEntry = {
  id: string;
  createdAt: string;
  text: string;
};

const checkIns: CheckInEntry[] = createSeedCheckIns();
const wins: WinEntry[] = [
  { id: "w1", createdAt: isoDaysAgo(0), text: "Protected deep work for 45 minutes." },
  { id: "w2", createdAt: isoDaysAgo(1), text: "Skipped late-night scrolling." },
  { id: "w3", createdAt: isoDaysAgo(2), text: "Read 10 pages before bed." },
];

const completedModules = new Set<string>();
let idCounter = 100;

function isoDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function createSeedCheckIns(): CheckInEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `c${i + 1}`,
    createdAt: isoDaysAgo(i),
    mood: 7 - (i % 3),
    energy: 6 - (i % 2),
    reflection: "Stayed consistent with one intentional action.",
  }));
}

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

export function saveCheckIn(input: { mood: number; energy: number; reflection: string }) {
  checkIns.unshift({
    id: nextId("c"),
    createdAt: new Date().toISOString(),
    mood: input.mood,
    energy: input.energy,
    reflection: input.reflection,
  });
}

export function saveWin(text: string) {
  wins.unshift({
    id: nextId("w"),
    createdAt: new Date().toISOString(),
    text,
  });
}

export function getRecentCheckIns(limit = 7) {
  return checkIns.slice(0, limit);
}

export function getStats() {
  return {
    streak: Math.max(3, Math.min(30, checkIns.length)),
    wins: wins.length,
  };
}

export function markModuleComplete(moduleId: string) {
  completedModules.add(moduleId);
}

export function isModuleComplete(moduleId: string) {
  return completedModules.has(moduleId);
}
