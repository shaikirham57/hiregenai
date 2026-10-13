/**
 * Screens real resume text against a specific job from the database.
 *
 * Requirements come from the job itself: its required-skills list plus the
 * skills named in its description (e.g. "Required skills: Python, RAG, ...",
 * "Knowledge of FastAPI ..."). The resume text is searched for each
 * requirement, and the fit score uses the job's own scoring weights and
 * seniority through the shared scoreCandidateAgainstJob formula.
 */
import { scoreCandidateAgainstJob } from "./scoring.js";

export interface ScreeningJob {
  title: string;
  description: string;
  skills: string[];
  seniority: string;
  scoringWeights: { skills: number; experience: number; education: number };
}

// Known technical skills, used to find skills named anywhere in a job
// description and to list a candidate's other skills from their resume.
const SKILL_VOCABULARY = [
  "Python", "Java", "JavaScript", "TypeScript", "Golang", "Rust", "C++", "C#", "Kotlin", "Swift", "Ruby", "PHP", "Scala",
  "SQL", "NoSQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Spark", "Hadoop", "Airflow", "dbt",
  "React", "Next.js", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "GraphQL",
  "REST APIs", "Microservices", "HTML", "CSS", "Tailwind",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Git", "MLOps", "DevOps",
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Keras", "scikit-learn",
  "Pandas", "NumPy", "Hugging Face", "Transformers", "OpenAI API",
  "LLM", "Generative AI", "Prompt Engineering", "RAG", "LangChain", "LangGraph", "LlamaIndex", "Embeddings",
  "Vector Databases", "Pinecone", "FAISS", "ChromaDB", "Fine-tuning", "AI Agents", "Agentic AI", "Tool Calling",
  "Data Analysis", "Data Engineering", "Power BI", "Tableau", "Excel", "Statistics",
  "Figma", "User Research", "Design Systems", "Prototyping",
];

// Alternate spellings that count as the same skill when searching text.
const ALIASES: Record<string, string[]> = {
  llm: ["llms", "large language model", "large language models"],
  rag: ["retrieval augmented generation", "retrieval-augmented generation"],
  "ai agents": ["ai agent", "autonomous agents", "autonomous agent", "agentic ai", "multi-agent"],
  "agentic ai": ["ai agents", "ai agent", "autonomous agents"],
  "tool calling": ["function calling", "tool use"],
  "rest apis": ["rest api", "restful", "restful apis"],
  apis: ["api", "rest api", "rest apis"],
  "vector databases": ["vector database", "vector db", "vector store", "vector stores", "pinecone", "faiss", "chromadb", "weaviate", "qdrant", "milvus"],
  embeddings: ["embedding", "vector embeddings"],
  "machine learning": ["ml"],
  "deep learning": ["dl", "neural networks"],
  "generative ai": ["genai", "gen ai"],
  "node.js": ["nodejs", "node js"],
  "next.js": ["nextjs"],
  postgresql: ["postgres"],
  kubernetes: ["k8s"],
  javascript: ["js"],
  "scikit-learn": ["sklearn", "scikit learn"],
  "hugging face": ["huggingface"],
  "ci/cd": ["cicd", "continuous integration"],
  "fine-tuning": ["fine tuning", "finetuning", "lora"],
  gcp: ["google cloud"],
  "prompt engineering": ["prompt design", "prompting"],
};

const MAX_REQUIREMENT_WORDS = 4;

/** Lowercase and collapse everything except letters, digits, and + # . / into single spaces. */
function normalizeText(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#./]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(normalizedText: string, phrase: string): boolean {
  const p = normalizeText(phrase).trim();
  if (!p) return false;
  // Bounded by spaces or sentence punctuation so "go" never matches inside "google".
  return new RegExp(`(^|[\\s])${escapeRegExp(p)}(?=[\\s.,/]|$)`).test(normalizedText);
}

function skillKey(skill: string) {
  return normalizeText(skill).trim();
}

/** Same skill when equal, singular/plural of each other, or listed as aliases. */
function sameSkill(a: string, b: string): boolean {
  const ka = skillKey(a);
  const kb = skillKey(b);
  return ka === kb || ka === `${kb}s` || `${ka}s` === kb || (ALIASES[ka] ?? []).includes(kb) || (ALIASES[kb] ?? []).includes(ka);
}

/** True when the text mentions the skill, its plural/singular form, or a known alias. */
export function mentionsSkill(normalizedText: string, skill: string): boolean {
  const key = skillKey(skill);
  const variants = new Set([key, ...(ALIASES[key] ?? [])]);
  if (key.endsWith("s") && key.length > 3) variants.add(key.slice(0, -1));
  else variants.add(`${key}s`);
  for (const v of variants) if (containsPhrase(normalizedText, v)) return true;
  return false;
}

/** Splits "Python, LLMs, and Vector Databases" style lists into clean skill names. */
function splitSkillList(list: string): string[] {
  return list
    .split(/,|;|\||•|\band\b|\bor\b|\n/i)
    .map((s) =>
      s
        .replace(/\b(is|are)\s+(preferred|required|a plus|nice to have)\b.*$/i, "")
        .replace(/^(strong|solid|good|hands-on|working)\s+(knowledge|experience|understanding)\s+(of|with|in)\s+/i, "")
        .replace(/^(knowledge|experience|understanding|familiarity)\s+(of|with|in)\s+/i, "")
        .replace(/[.:()]+$/g, "")
        .trim()
    )
    .filter((s) => s.length > 0 && s.length <= 40 && s.split(/\s+/).length <= MAX_REQUIREMENT_WORDS);
}

/** Skill lists introduced by phrases like "Required skills:" or "Knowledge of" in a job description. */
function skillsListedInDescription(description: string): string[] {
  const found: string[] = [];
  const intro =
    /(?:required skills|key skills|skills required|must[- ]have|requirements|tech stack|technologies|nice to have|preferred skills|knowledge of|experience (?:with|in)|proficien(?:t|cy) (?:in|with)|familiarity with)\s*:?\s*([^.\n]+)/gi;
  for (const match of description.matchAll(intro)) found.push(...splitSkillList(match[1]));
  return found;
}

/** The job's requirements: its skills list, skills listed in its description, and known skills it mentions. */
export function jobRequirements(job: ScreeningJob): string[] {
  const candidates = [
    ...job.skills.flatMap((s) => (/[,;]|\band\b/i.test(s) ? splitSkillList(s) : [s.trim()])),
    ...skillsListedInDescription(job.description),
  ];
  const normalizedDescription = normalizeText(`${job.title} ${job.description}`);
  for (const skill of SKILL_VOCABULARY) if (containsPhrase(normalizedDescription, skill)) candidates.push(skill);

  const seen = new Map<string, string>();
  for (const skill of candidates) {
    const key = skillKey(skill);
    if (!key) continue;
    // Treat singular/plural and known aliases as the same requirement.
    const canonical = [...seen.keys()].find((k) => sameSkill(k, key));
    if (!canonical) seen.set(key, skill);
  }
  return [...seen.values()];
}

const DEGREE_PATTERNS: { label: string; pattern: RegExp }[] = [
  // Abbreviations can end in ".", where a trailing \b never matches, so a lookahead ends each pattern.
  { label: "Ph.D.", pattern: /\b(ph\.?\s?d\.?|doctorate|doctor of philosophy)(?=\W|$)/i },
  { label: "Master's degree", pattern: /\b(master'?s?|m\.?\s?tech|m\.?\s?sc|m\.s\.|msc|mba|m\.e\.|mca)(?=\W|$)/i },
  { label: "Bachelor's degree", pattern: /\b(bachelor'?s?|b\.?\s?tech|b\.?\s?sc|b\.s\.|bsc|b\.e\.|b\.a\.|bca|undergraduate degree)(?=\W|$)/i },
  { label: "Associate/Diploma", pattern: /\b(associate degree|diploma|bootcamp|certificate program)(?=\W|$)/i },
];

// Labels chosen so scoreCandidateAgainstJob's education tiers recognise them.
const EDUCATION_FOR_SCORING: Record<string, string> = {
  "Ph.D.": "PhD",
  "Master's degree": "Master",
  "Bachelor's degree": "Bachelor",
  "Associate/Diploma": "Associate",
};

function extractEducation(text: string): { label: string; detail: string } | undefined {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const { label, pattern } of DEGREE_PATTERNS) {
    const line = lines.find((l) => pattern.test(l));
    if (line) return { label, detail: line.length > 90 ? `${line.slice(0, 87)}...` : line };
  }
  return undefined;
}

/** Years of experience: an explicit "N years" claim, otherwise the span of dated work entries. */
function extractExperienceYears(text: string): number {
  const explicit = [...text.matchAll(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+\w+){0,3}\s+experience/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => n > 0 && n <= 45);
  if (explicit.length) return Math.max(...explicit);

  const now = new Date();
  const currentYear = now.getFullYear() + now.getMonth() / 12;
  const ranges: [number, number][] = [];
  for (const line of text.split(/\n/)) {
    if (DEGREE_PATTERNS.some(({ pattern }) => pattern.test(line)) || /\b(university|college|school|institute)\b/i.test(line)) continue;
    const re = /\b((?:19|20)\d{2})\s*(?:-|–|—|to)\s*((?:19|20)\d{2}|present|current|now|till date|date)\b/gi;
    for (const m of line.matchAll(re)) {
      const start = Number(m[1]);
      const end = /\d/.test(m[2]) ? Number(m[2]) : currentYear;
      if (end >= start && start >= 1970) ranges.push([start, end]);
    }
  }
  if (!ranges.length) return 0;
  ranges.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [curStart, curEnd] = ranges[0];
  for (const [s, e] of ranges.slice(1)) {
    if (s <= curEnd) curEnd = Math.max(curEnd, e);
    else {
      total += curEnd - curStart;
      [curStart, curEnd] = [s, e];
    }
  }
  total += curEnd - curStart;
  return Math.round(Math.min(total, 45) * 10) / 10;
}

function nameFromFileName(fileName: string): string {
  const words = fileName
    .replace(/\.[^./]+$/, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\b(resume|cv|final|updated|latest|\d+)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "Unknown Candidate";
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/** A resume usually starts with the candidate's name on its own line. */
function extractName(text: string, fileName: string): string {
  const firstLines = text.split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 5);
  for (const line of firstLines) {
    const cleaned = line.replace(/\s+/g, " ");
    if (
      /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){1,3}$/.test(cleaned) &&
      cleaned.length <= 40 &&
      !/\b(resume|curriculum|vitae|profile|summary|engineer|developer|contact)\b/i.test(cleaned)
    ) {
      return cleaned
        .split(" ")
        .map((w) => (w === w.toUpperCase() && w.length > 1 ? w[0] + w.slice(1).toLowerCase() : w))
        .join(" ");
    }
  }
  return nameFromFileName(fileName);
}

export interface ResumeScreeningResult {
  candidateName: string;
  extractedSkills: string[];
  extractedEducation: string;
  extractedExperienceYears: number;
  requirements: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
  scoreBreakdown: { skills: number; experience: number; education: number };
  narrative: string;
}

export function screenResumeText(input: { fileName: string; text: string }, job: ScreeningJob): ResumeScreeningResult {
  const normalizedResume = normalizeText(input.text);
  const requirements = jobRequirements(job);
  const matchedSkills = requirements.filter((r) => mentionsSkill(normalizedResume, r));
  const missingSkills = requirements.filter((r) => !matchedSkills.includes(r));

  const otherSkills = SKILL_VOCABULARY.filter(
    (s) => mentionsSkill(normalizedResume, s) && !matchedSkills.some((m) => sameSkill(m, s))
  );
  const education = extractEducation(input.text);
  const experienceYears = extractExperienceYears(input.text);

  const score = scoreCandidateAgainstJob(
    {
      skills: matchedSkills,
      yearsExperience: experienceYears,
      education: education ? EDUCATION_FOR_SCORING[education.label] : "",
    },
    { skills: requirements, seniority: job.seniority, scoringWeights: job.scoringWeights }
  );

  return {
    candidateName: extractName(input.text, input.fileName),
    extractedSkills: [...matchedSkills, ...otherSkills],
    extractedEducation: education ? education.detail : "Not found in resume",
    extractedExperienceYears: experienceYears,
    requirements,
    matchedSkills,
    missingSkills,
    matchScore: score.overall,
    scoreBreakdown: { skills: score.skills, experience: score.experience, education: score.education },
    narrative: score.narrative,
  };
}
