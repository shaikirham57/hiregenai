/**
 * Ported from the frontend's mock aiScoringService: a deterministic, heuristic
 * approximation of an AI fit score — no real model, same algorithm, now server-side.
 */

export interface ScoringInput {
  skills: string[];
  yearsExperience: number;
  education: string;
}

export interface ScoringJob {
  skills: string[];
  seniority: string;
  scoringWeights: { skills: number; experience: number; education: number };
}

function normalize(skill: string) {
  return skill.trim().toLowerCase();
}

export function scoreCandidateAgainstJob(input: ScoringInput, job: ScoringJob) {
  const candidateSkillSet = new Set(input.skills.map(normalize));
  const matchedSkills = job.skills.filter((s) => candidateSkillSet.has(normalize(s)));
  const missingSkills = job.skills.filter((s) => !candidateSkillSet.has(normalize(s)));
  const skillsScore = job.skills.length === 0 ? 100 : Math.round((matchedSkills.length / job.skills.length) * 100);

  const seniorityBar = /senior|lead|staff|principal/i.test(job.seniority) ? 5 : /mid/i.test(job.seniority) ? 3 : 1;
  const experienceScore = Math.max(20, Math.min(100, Math.round(50 + (input.yearsExperience - seniorityBar) * 12)));

  const educationScore = /ph\.?d|doctorate/i.test(input.education)
    ? 96
    : /m\.?s\.?|master/i.test(input.education)
      ? 90
      : /b\.?s\.?|b\.?a\.?|bachelor/i.test(input.education)
        ? 80
        : /bootcamp|certificate|associate/i.test(input.education)
          ? 62
          : 55;

  const overall = Math.round(
    (skillsScore * job.scoringWeights.skills + experienceScore * job.scoringWeights.experience + educationScore * job.scoringWeights.education) / 100
  );

  const confidence: "high" | "low" = input.skills.length >= 3 ? "high" : "low";

  const narrative =
    matchedSkills.length === job.skills.length
      ? `Full skill coverage against this role's requirements, with ${input.yearsExperience} years of relevant experience.`
      : missingSkills.length > 0
        ? `Strong overlap on ${matchedSkills.length} of ${job.skills.length} required skills. Missing: ${missingSkills.join(", ")}.`
        : "Skill profile is a reasonable match for this role's core requirements.";

  return {
    overall: Math.max(0, Math.min(100, overall)),
    skills: skillsScore,
    experience: experienceScore,
    education: educationScore,
    confidence,
    matchedSkills,
    missingSkills,
    narrative,
  };
}
