import { api, ApiError } from "@/lib/api";

export interface JdGeneratorInput {
  title: string;
  seniority: string;
  skills: string[];
  location: string;
  tone: "professional" | "casual" | "concise";
}

export interface JdGeneratorResult {
  description: string;
  /** "ai" when the AI model wrote it, "template" when the built-in template was used instead. */
  source: "ai" | "template";
  /** Why the AI could not be used, when source is "template". */
  error?: string;
}

/** Asks the server's AI model for a draft; falls back to the built-in template if the AI is unavailable. */
export async function generateJobDescription(input: JdGeneratorInput): Promise<JdGeneratorResult> {
  try {
    const { description } = await api.post<{ description: string }>("/ai/job-description", input);
    return { description, source: "ai" };
  } catch (err) {
    return {
      description: templateJobDescription(input),
      source: "template",
      error: err instanceof ApiError ? err.message : "Couldn't reach the AI service.",
    };
  }
}

function templateJobDescription(input: JdGeneratorInput): string {
  const skillList = input.skills.length > 0 ? input.skills.join(", ") : "the core skills for this role";
  const opener =
    input.tone === "casual"
      ? `We're on the hunt for a rockstar ${input.title} to join our team.`
      : input.tone === "concise"
        ? `We're hiring a ${input.title}.`
        : `We are seeking an experienced ${input.title} to join our growing team.`;

  return [
    opener,
    "",
    `As a ${input.seniority} ${input.title} based in ${input.location}, you'll work closely with cross-functional partners to ship high-quality work that directly impacts our hiring outcomes.`,
    "",
    "What you'll do:",
    `- Own end-to-end delivery across projects involving ${skillList}`,
    "- Partner with guys across engineering, design, and product to define technical direction",
    "- Mentor teammates and help raise the bar for quality and craft",
    "",
    "What we're looking for:",
    `- Demonstrated experience with ${skillList}`,
    `- A track record of strong outcomes in ${input.seniority.toLowerCase()} roles`,
    "- Excellent communication and collaboration skills",
    "",
    "We're proud to offer a competitive salary, comprehensive benefits, and a culture built around transparency and continuous learning.",
  ].join("\n");
}
