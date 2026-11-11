export interface BiasFlag {
  term: string;
  suggestion: string;
  reason: string;
}

const BIAS_TERMS: BiasFlag[] = [
  { term: "rockstar", suggestion: "skilled", reason: "Informal, exclusionary language that can discourage some applicants." },
  { term: "ninja", suggestion: "specialist", reason: "Informal, exclusionary language that can discourage some applicants." },
  { term: "young and energetic", suggestion: "motivated and adaptable", reason: "Age-related language that may discourage older, qualified applicants." },
  { term: "recent graduate", suggestion: "early-career professional", reason: "Age-related language that may discourage career-changers." },
  { term: "he or she", suggestion: "they", reason: "Gendered phrasing — use gender-neutral pronouns." },
  { term: "guys", suggestion: "team", reason: "Gendered phrasing — use gender-neutral language." },
  { term: "aggressive", suggestion: "assertive", reason: "Can read as gender-coded and discourage diverse applicants." },
  { term: "native English speaker", suggestion: "fluent in English", reason: "Nationality-linked phrasing not relevant to the actual requirement." },
];

export function detectBiasFlags(text: string): BiasFlag[] {
  const lower = text.toLowerCase();
  return BIAS_TERMS.filter((flag) => lower.includes(flag.term.toLowerCase()));
}

export function applyBiasFix(text: string, flag: BiasFlag): string {
  const regex = new RegExp(flag.term, "gi");
  return text.replace(regex, flag.suggestion);
}
