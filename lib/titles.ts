export const BUILDER_TITLES = [
  "Full-Stack Alchemist",
  "Chaos Engineer",
  "Backend Wizard",
  "Frontend Sorcerer",
  "DevOps Whisperer",
  "Pixel Pusher",
  "Database Necromancer",
  "API Artisan",
  "UI Virtuoso",
  "System Tinkerer",
  "Code Bard",
  "Serverless Samurai",
  "Infra Gardener",
  "Bug Exterminator",
  "Edge Enthusiast",
  "Hackathon Heretic",
];

export function randomBuilderTitle(current?: string): string {
  const pool = current
    ? BUILDER_TITLES.filter((title) => title !== current)
    : BUILDER_TITLES;
  return pool[Math.floor(Math.random() * pool.length)];
}
