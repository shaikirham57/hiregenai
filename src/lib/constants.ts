export const AVATAR_COLORS = [
  "#0053FE",
  "#6E1EEE",
  "#14296B",
  "#1F9D55",
  "#D9A404",
  "#0A1D50",
  "#8A47F2",
  "#2E71FE",
  "#D92D20",
  "#5B6472",
];

export function colorForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
