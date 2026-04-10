export interface ProfileTier {
  id: "novice" | "social-explorer" | "calibrated-communicator" | "magnetic-strategist" | "master-conversationalist";
  label: string;
  minLevel: number;
  maxLevel: number;
}

const PROFILE_TIERS: ProfileTier[] = [
  {
    id: "novice",
    label: "Aprendiz Social",
    minLevel: 1,
    maxLevel: 2,
  },
  {
    id: "social-explorer",
    label: "Explorador de Conexão",
    minLevel: 3,
    maxLevel: 4,
  },
  {
    id: "calibrated-communicator",
    label: "Comunicador Estratégico",
    minLevel: 5,
    maxLevel: 7,
  },
  {
    id: "magnetic-strategist",
    label: "Arquiteto de Química",
    minLevel: 8,
    maxLevel: 10,
  },
  {
    id: "master-conversationalist",
    label: "Mestre de Presença",
    minLevel: 11,
    maxLevel: Number.POSITIVE_INFINITY,
  },
];

export function getProfileTier(level: number): ProfileTier {
  const safeLevel = Math.max(1, Math.floor(level));
  return (
    PROFILE_TIERS.find((tier) => safeLevel >= tier.minLevel && safeLevel <= tier.maxLevel) ??
    PROFILE_TIERS[PROFILE_TIERS.length - 1]
  );
}
