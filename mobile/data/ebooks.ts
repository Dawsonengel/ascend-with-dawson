export type Ebook = {
  id: string;
  title: string;
  subtitle: string;
  coverColor: string;
  pdfUrl: string;
  description: string;
};

export const ebooks: Ebook[] = [
  {
    id: "attention-engine",
    title: "Attention Engine",
    subtitle: "Focus systems for modern creators",
    coverColor: "#4A5A8A",
    pdfUrl: "https://example.com/ebooks/attention-engine.pdf",
    description:
      "A practical blueprint for reclaiming focus, reducing context switching, and protecting execution time.",
  },
  {
    id: "creator-rhythm",
    title: "Creator Rhythm",
    subtitle: "A weekly cadence that compounds",
    coverColor: "#5E6C54",
    pdfUrl: "https://example.com/ebooks/creator-rhythm.pdf",
    description:
      "Design a calm publishing rhythm you can sustain without burnout while building meaningful momentum.",
  },
  {
    id: "boundary-playbook",
    title: "Boundary Playbook",
    subtitle: "Protect energy and stay consistent",
    coverColor: "#7A5C58",
    pdfUrl: "https://example.com/ebooks/boundary-playbook.pdf",
    description:
      "Communication scripts and operational boundaries that protect time, energy, and deep-work quality.",
  },
];

export function getEbookById(id: string) {
  return ebooks.find((ebook) => ebook.id === id);
}
