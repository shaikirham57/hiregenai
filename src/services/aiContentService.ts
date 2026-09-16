import { sleep } from "@/lib/utils";

export interface JdGeneratorInput {
  title: string;
  seniority: string;
  skills: string[];
  location: string;
  tone: "professional" | "casual" | "concise";
}

export async function generateJobDescription(input: JdGeneratorInput): Promise<string> {
  await sleep(1400);
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
