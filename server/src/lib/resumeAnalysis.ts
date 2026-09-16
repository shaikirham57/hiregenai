/**
 * Ported from the frontend's mock resumeScreeningService: the deterministic,
 * hash-seeded "extraction" result computed once a resume upload reaches its
 * final stage. Same algorithm, now server-side — the frontend keeps its own
 * staged progress-bar simulation and calls this for the final result.
 */

export interface ScreeningJobOption {
  id: string;
  title: string;
  skills: string[];
}

export const JOB_OPTIONS: ScreeningJobOption[] = [
  { id: "ai-engineer", title: "AI Engineer", skills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "MLOps", "AWS", "Docker"] },
  { id: "genai-engineer", title: "Generative AI Engineer", skills: ["Python", "LLM", "Prompt Engineering", "LangChain", "PyTorch", "RAG", "Vector Databases"] },
  { id: "python-developer", title: "Python Developer", skills: ["Python", "Django", "Flask", "REST APIs", "PostgreSQL", "Docker", "Git"] },
  { id: "java-developer", title: "Java Developer", skills: ["Java", "Spring Boot", "Microservices", "REST APIs", "SQL", "Kubernetes", "Git"] },
];

const SKILL_POOL = [
  "React", "TypeScript", "Python", "PyTorch", "TensorFlow", "Machine Learning", "MLOps",
  "Kubernetes", "AWS", "Terraform", "Docker", "GraphQL", "Node.js", "Django", "Flask",
  "REST APIs", "PostgreSQL", "SQL", "Java", "Spring Boot", "Microservices", "LangChain",
  "LLM", "Prompt Engineering", "RAG", "Vector Databases", "Git", "Figma", "User Research",
  "Go", "Design Systems",
];

const EDUCATION_POOL = [
  "B.S. Computer Science",
  "M.S. Data Science",
  "B.A. Design",
  "M.S. Human-Computer Interaction",
  "B.S. Information Systems",
  "M.S. Artificial Intelligence",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

function seededPick<T>(pool: T[], seed: string, count: number): T[] {
  const picked: T[] = [];
  let cursor = hashSeed(seed);
  for (let i = 0; i < count; i++) {
    cursor = (cursor * 31 + i) % pool.length;
    const item = pool[cursor];
    if (!picked.includes(item)) picked.push(item);
  }
  return picked;
}

export function toCandidateName(fileName: string): string {
  const base = fileName.replace(/\.[^./]+$/, "");
  const cleaned = base
    .replace(/[_\-.]+/g, " ")
    .replace(/\b(resume|cv)\b/gi, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Unknown Candidate";
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export interface AnalyzeResumeInput {
  fileName: string;
  jobId?: string;
}

export function analyzeResume(input: AnalyzeResumeInput) {
  const { fileName, jobId } = input;
  const skills = seededPick(SKILL_POOL, fileName, 6);
  const education = seededPick(EDUCATION_POOL, fileName + "edu", 1)[0];
  const experienceYears = 1 + (hashSeed(fileName) % 10);

  const targetJob = JOB_OPTIONS.find((j) => j.id === jobId);
  let matchScore: number | undefined;
  let matchedSkills: string[] | undefined;
  if (targetJob) {
    matchedSkills = targetJob.skills.filter((s) => skills.includes(s));
    const skillRatio = matchedSkills.length / targetJob.skills.length;
    const experienceBonus = Math.min(experienceYears * 2, 18);
    const variance = hashSeed(fileName + jobId) % 8;
    matchScore = Math.round(clamp(skillRatio * 70 + experienceBonus + variance, 12, 98));
  }

  return {
    candidateName: toCandidateName(fileName),
    extractedSkills: skills,
    extractedEducation: education,
    extractedExperienceYears: experienceYears,
    matchScore,
    matchedSkills,
  };
}
