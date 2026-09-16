import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.upsert({
    where: { id: "user-recruiter-1" },
    update: {},
    create: {
      id: "user-recruiter-1",
      name: "Dana Whitfield",
      email: "dana.whitfield@hiregen.ai",
      passwordHash,
      role: "recruiter",
      title: "Senior Technical Recruiter",
      avatarColor: "#0053FE",
    },
  });

  await prisma.user.upsert({
    where: { id: "user-candidate-1" },
    update: {},
    create: {
      id: "user-candidate-1",
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      passwordHash,
      role: "candidate",
      title: "Job Seeker",
      avatarColor: "#6E1EEE",
    },
  });

  const jobs = [
    {
      id: "job-1",
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Austin, TX (Hybrid)",
      employmentType: "Full_time" as const,
      seniority: "Senior",
      status: "open" as const,
      description:
        "We're looking for a Senior Frontend Engineer to lead the development of our candidate-facing experiences. You'll partner closely with design and the AI platform team to ship performant, accessible React interfaces at scale.",
      responsibilities: [
        "Own architecture and delivery for candidate- and recruiter-facing React applications.",
        "Partner with design to translate complex AI workflows into approachable interfaces.",
        "Drive accessibility (WCAG 2.1 AA) across all new and existing surfaces.",
        "Mentor mid-level engineers and review pull requests for architectural consistency.",
      ],
      qualifications: [
        "5+ years building production React/TypeScript applications.",
        "Experience with GraphQL and component-driven design systems.",
        "Track record of shipping accessible, high-traffic web applications.",
        "Comfortable owning technical decisions with minimal oversight.",
      ],
      screeningQuestions: [
        "How many years of professional experience do you have with React and TypeScript?",
        "Describe a design system or component library you've built or significantly contributed to.",
        "Are you comfortable working in a hybrid role based in Austin, TX?",
      ],
      skills: ["React", "TypeScript", "GraphQL", "Design Systems", "Accessibility"],
      scoringWeights: { skills: 50, experience: 35, education: 15 },
      salaryRange: { min: 128000, mid: 148000, max: 172000, source: "Levels.fyi + internal bands", updatedAt: "2026-07-01" },
      applicantCount: 42,
      openDate: new Date("2026-06-02"),
      hiringManager: "Dana Whitfield",
    },
    {
      id: "job-2",
      title: "Machine Learning Engineer",
      department: "AI Platform",
      location: "Remote (US)",
      employmentType: "Full_time" as const,
      seniority: "Mid-Senior",
      status: "open" as const,
      description:
        "Join the AI Platform team building the models behind HireGen's Fit Score, semantic search, and resume parsing pipelines. You'll own model evaluation, vector search infrastructure, and inference performance.",
      responsibilities: [
        "Design and maintain the vector search infrastructure behind semantic candidate matching.",
        "Own offline and online evaluation for resume-parsing and Fit Score models.",
        "Optimize inference latency for real-time scoring at scale.",
        "Collaborate with recruiters and product to ground model behavior in real hiring outcomes.",
      ],
      qualifications: [
        "3+ years building and shipping production ML systems.",
        "Hands-on experience with PyTorch and NLP model development.",
        "Familiarity with vector databases and approximate nearest-neighbor search.",
        "Strong grounding in MLOps practices — CI/CD for models, monitoring, drift detection.",
      ],
      screeningQuestions: [
        "What vector search or embedding infrastructure have you built or operated in production?",
        "Describe your experience evaluating NLP models before shipping them.",
        "Are you open to working fully remote across US time zones?",
      ],
      skills: ["Python", "PyTorch", "Vector Search", "NLP", "MLOps"],
      scoringWeights: { skills: 55, experience: 35, education: 10 },
      salaryRange: { min: 140000, mid: 165000, max: 195000, source: "Levels.fyi + internal bands", updatedAt: "2026-07-10" },
      applicantCount: 67,
      openDate: new Date("2026-05-19"),
      hiringManager: "Priya Nathan",
    },
    {
      id: "job-3",
      title: "Product Designer",
      department: "Design",
      location: "New York, NY (Hybrid)",
      employmentType: "Full_time" as const,
      seniority: "Mid-level",
      status: "open" as const,
      description:
        "Design end-to-end recruiter and candidate workflows for an AI-native hiring platform. You'll shape how explainable AI is surfaced in complex enterprise dashboards without overwhelming users.",
      responsibilities: [
        "Design end-to-end flows spanning recruiter dashboards and candidate-facing surfaces.",
        "Define patterns for surfacing AI explainability without overwhelming users.",
        "Run generative and evaluative research to validate design direction.",
        "Maintain and extend the HireGen design system in close partnership with engineering.",
      ],
      qualifications: [
        "3+ years of product design experience, ideally on B2B or dashboard-heavy products.",
        "Strong command of Figma, prototyping, and design systems thinking.",
        "Comfortable running and synthesizing user research independently.",
        "Portfolio demonstrating complex, data-dense interface design.",
      ],
      screeningQuestions: [
        "Share a project where you designed for a complex, data-dense interface. What was the outcome?",
        "How do you typically validate design decisions with user research?",
        "Are you able to work in a hybrid capacity from New York, NY?",
      ],
      skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
      scoringWeights: { skills: 45, experience: 35, education: 20 },
      salaryRange: { min: 110000, mid: 128000, max: 148000, source: "Levels.fyi + internal bands", updatedAt: "2026-06-22" },
      applicantCount: 38,
      openDate: new Date("2026-06-14"),
      hiringManager: "Marcus Iyer",
    },
    {
      id: "job-4",
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "Remote (US)",
      employmentType: "Full_time" as const,
      seniority: "Senior",
      status: "open" as const,
      description:
        "Own the infrastructure that powers our real-time scoring pipeline. You'll build resilient, auto-scaling systems on Kubernetes and AWS supporting sub-5-second AI Fit Score generation at volume.",
      responsibilities: [
        "Operate and scale the Kubernetes infrastructure behind our real-time scoring pipeline.",
        "Build Terraform modules for repeatable, multi-environment infrastructure.",
        "Define and uphold SLOs for latency-sensitive AI inference workloads.",
        "Lead incident response and drive blameless postmortems.",
      ],
      qualifications: [
        "5+ years in DevOps/SRE roles operating production Kubernetes at scale.",
        "Strong Terraform and AWS experience.",
        "Proficiency in Go or a similar systems language.",
        "Track record of building observability into latency-critical systems.",
      ],
      screeningQuestions: [
        "What's the largest Kubernetes environment you've operated, and what scale challenges did you face?",
        "Describe your approach to setting SLOs for a latency-sensitive service.",
        "Are you comfortable participating in an on-call rotation?",
      ],
      skills: ["Kubernetes", "AWS", "Terraform", "Go", "Observability"],
      scoringWeights: { skills: 50, experience: 40, education: 10 },
      salaryRange: { min: 135000, mid: 155000, max: 180000, source: "Levels.fyi + internal bands", updatedAt: "2026-07-05" },
      applicantCount: 29,
      openDate: new Date("2026-06-28"),
      hiringManager: "Dana Whitfield",
    },
    {
      id: "job-5",
      title: "Technical Recruiter",
      department: "Talent",
      location: "Austin, TX (Hybrid)",
      employmentType: "Full_time" as const,
      seniority: "Mid-level",
      status: "paused" as const,
      description:
        "Partner with hiring managers across Engineering and AI Platform to run a fast, high-quality technical hiring process using HireGen's own AI screening tools.",
      responsibilities: [
        "Partner with hiring managers to scope roles and define scoring criteria.",
        "Run a full-cycle technical hiring process using HireGen's own AI tooling.",
        "Maintain a high-quality, low-bias candidate experience end to end.",
        "Report on pipeline health and hiring velocity to leadership.",
      ],
      qualifications: [
        "3+ years of technical recruiting experience.",
        "Hands-on ATS administration experience.",
        "Strong stakeholder management across engineering and leadership.",
        "Comfortable operating in a fast-paced, metrics-driven environment.",
      ],
      screeningQuestions: [
        "How many technical roles have you closed in the past 12 months?",
        "What ATS platforms have you administered directly?",
      ],
      skills: ["Technical Sourcing", "ATS Administration", "Stakeholder Management"],
      scoringWeights: { skills: 35, experience: 45, education: 20 },
      salaryRange: { min: 85000, mid: 98000, max: 112000, source: "Levels.fyi + internal bands", updatedAt: "2026-05-30" },
      applicantCount: 21,
      openDate: new Date("2026-05-05"),
      hiringManager: "Priya Nathan",
    },
    {
      id: "job-6",
      title: "Backend Engineer, Platform",
      department: "Engineering",
      location: "Remote (US)",
      employmentType: "Full_time" as const,
      seniority: "Mid-Senior",
      status: "draft" as const,
      description:
        "Build the services layer connecting our scoring engine, notification system, and integrations. Strong API design and event-driven architecture experience required.",
      responsibilities: [
        "Design and build the services layer connecting scoring, notifications, and integrations.",
        "Own API design and versioning across internal and partner-facing endpoints.",
        "Build event-driven pipelines using Kafka for real-time pipeline updates.",
      ],
      qualifications: [
        "4+ years building production backend services.",
        "Strong API design fundamentals.",
        "Experience with event-driven architecture and Kafka or similar systems.",
      ],
      screeningQuestions: ["Describe an event-driven system you've designed. What tradeoffs did you make?"],
      skills: ["Node.js", "PostgreSQL", "Kafka", "API Design"],
      scoringWeights: { skills: 50, experience: 35, education: 15 },
      salaryRange: { min: 130000, mid: 150000, max: 175000, source: "Levels.fyi + internal bands", updatedAt: "2026-07-14" },
      applicantCount: 6,
      openDate: new Date("2026-07-12"),
      hiringManager: "Marcus Iyer",
    },
  ];

  for (const job of jobs) {
    await prisma.job.upsert({ where: { id: job.id }, update: {}, create: job });
  }

  const AVATAR_COLORS = [
    "#0053FE", "#6E1EEE", "#14296B", "#1F9D55", "#D9A404",
    "#0A1D50", "#8A47F2", "#2E71FE", "#D92D20", "#5B6472",
  ];
  function colorForSeed(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  const candidates = [
    {
      id: "cand-1", name: "Elena Marchetti", email: "elena.marchetti@example.com", location: "Austin, TX", appliedJobId: "job-1",
      skills: ["React", "TypeScript", "GraphQL", "Design Systems", "Storybook"],
      education: "B.S. Computer Science, University of Texas at Austin",
      employmentHistory: [
        { company: "Fintary", title: "Senior Frontend Engineer", startDate: "2022-03", endDate: null },
        { company: "Loopward", title: "Frontend Engineer", startDate: "2019-06", endDate: "2022-02" },
      ],
      certifications: [] as string[],
      resumeFileName: "elena_marchetti_resume.pdf",
      summaryBullets: [
        "5+ years building production React/TypeScript applications at fintech scale.",
        "Led migration of a legacy design system to a token-based component library.",
        "Strong accessibility background — drove WCAG 2.1 AA compliance across a 40-screen app.",
        "Comfortable owning frontend architecture decisions with minimal oversight.",
      ],
      fitScore: {
        overall: 91, skills: 94, experience: 90, education: 85, confidence: "high",
        matchedSkills: ["React", "TypeScript", "GraphQL", "Design Systems"],
        missingSkills: ["Accessibility audits at scale"],
        narrative: "Elena's skill profile is a near-exact match for the role, with direct production experience in all core requirements. Experience level exceeds the seniority bar for this req.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 96,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "interview" as const, appliedAt: new Date("2026-07-08"),
    },
    {
      id: "cand-2", name: "Jordan Blake", email: "jordan.blake@example.com", location: "Remote (US)", appliedJobId: "job-1",
      skills: ["React", "JavaScript", "CSS", "Redux"],
      education: "B.A. Information Systems, Arizona State University",
      employmentHistory: [
        { company: "Warmline", title: "Frontend Developer", startDate: "2023-01", endDate: null },
        { company: "Bitrise Co", title: "Junior Developer", startDate: "2021-08", endDate: "2022-12" },
      ],
      certifications: [] as string[],
      resumeFileName: "jordan_blake_resume.pdf",
      summaryBullets: [
        "Solid React fundamentals with 3 years of shipped production experience.",
        "No direct TypeScript or GraphQL experience found in resume text.",
        "Fast learner based on rapid title progression in a short span.",
      ],
      fitScore: {
        overall: 58, skills: 52, experience: 60, education: 68, confidence: "high",
        matchedSkills: ["React"],
        missingSkills: ["TypeScript", "GraphQL", "Design Systems", "Accessibility"],
        narrative: "Jordan meets the baseline React requirement but lacks TypeScript and GraphQL experience explicitly required for this role. Consider for a more junior req or with a TS ramp-up plan.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 88,
      riskLevel: "medium" as const, riskFlags: [{ type: "job-hopping", description: "3 roles in the last 2.5 years." }],
      languageTag: "en", stage: "screened" as const, appliedAt: new Date("2026-07-12"),
    },
    {
      id: "cand-3", name: "Priyanka Rao", email: "priyanka.rao@example.com", location: "Austin, TX", appliedJobId: "job-1",
      skills: ["React", "TypeScript", "Accessibility", "Next.js", "Design Systems"],
      education: "M.S. Human-Computer Interaction, Georgia Tech",
      employmentHistory: [{ company: "Handoff", title: "Senior Frontend Engineer", startDate: "2021-04", endDate: null }],
      certifications: ["IAAP CPACC"],
      resumeFileName: "priyanka_rao_resume.pdf",
      summaryBullets: [
        "Accessibility specialist with a certification and 4 years applying it in production React apps.",
        "Deep design systems experience, including token architecture and cross-platform theming.",
        "Advanced degree in HCI directly relevant to candidate-facing UX work.",
      ],
      fitScore: {
        overall: 95, skills: 97, experience: 92, education: 95, confidence: "high",
        matchedSkills: ["React", "TypeScript", "Design Systems", "Accessibility"],
        missingSkills: ["GraphQL"],
        narrative: "Exceptionally strong match — Priyanka exceeds requirements in accessibility and design systems, two areas explicitly prioritized for this role. Only GraphQL exposure is unconfirmed.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 98,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "offer" as const, appliedAt: new Date("2026-06-30"),
    },
    {
      id: "cand-4", name: "Marcus Webb", email: "marcus.webb@example.com", location: "Chicago, IL", appliedJobId: "job-1",
      skills: ["Angular", "JavaScript", "jQuery"],
      education: "B.S. Computer Science, DePaul University",
      employmentHistory: [{ company: "Ridgeway Systems", title: "Software Engineer", startDate: "2018-02", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "marcus_webb_resume.pdf",
      summaryBullets: [
        "Primarily Angular/jQuery background with limited React exposure noted.",
        "Long tenure at a single company, suggesting stability but limited breadth.",
        "No evidence of TypeScript, GraphQL, or modern design system tooling.",
      ],
      fitScore: {
        overall: 34, skills: 28, experience: 55, education: 62, confidence: "high",
        matchedSkills: [] as string[],
        missingSkills: ["React", "TypeScript", "GraphQL", "Design Systems", "Accessibility"],
        narrative: "Skill stack does not align with the React/TypeScript requirements of this role. Strong tenure and fundamentals could suit a different req with a framework ramp-up allowance.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 91,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "applied" as const, appliedAt: new Date("2026-07-15"),
    },
    {
      id: "cand-5", name: "Sofia Kastellanos", email: "sofia.kastellanos@example.com", location: "Remote (US)", appliedJobId: "job-1",
      skills: ["React", "TypeScript", "GraphQL"],
      education: "Coding Bootcamp Certificate, App Academy",
      employmentHistory: [
        { company: "Trellwork", title: "Frontend Engineer", startDate: "2023-09", endDate: null },
        { company: "Freelance", title: "Contract Developer", startDate: "2022-01", endDate: "2023-08" },
      ],
      certifications: [] as string[],
      resumeFileName: "sofia_kastellanos_resume.pdf",
      summaryBullets: [
        "Bootcamp-trained engineer with under 2 years professional experience.",
        "Skill keywords match well but employment history is thin.",
        "Resume text density for skills was below the extraction confidence threshold.",
      ],
      fitScore: {
        overall: 63, skills: 78, experience: 40, education: 45, confidence: "low",
        matchedSkills: ["React", "TypeScript", "GraphQL"],
        missingSkills: ["Design Systems", "Accessibility"],
        narrative: "Skill keyword match is strong, but limited extractable work history lowers confidence in the experience sub-score. Recommend a portfolio review before final scoring.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 82,
      riskLevel: "medium" as const, riskFlags: [{ type: "employment-gap", description: "No listed role between contract work and current position exceeding typical range." }],
      languageTag: "en", stage: "applied" as const, appliedAt: new Date("2026-07-16"),
    },
    {
      id: "cand-6", name: "Daniel Osei", email: "daniel.osei@example.com", location: "Remote (US)", appliedJobId: "job-2",
      skills: ["Python", "PyTorch", "NLP", "Vector Search", "Docker"],
      education: "Ph.D. Machine Learning, Carnegie Mellon University",
      employmentHistory: [{ company: "Vectrium AI", title: "ML Engineer", startDate: "2021-09", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "daniel_osei_resume.pdf",
      summaryBullets: [
        "PhD in ML with published research on transformer-based retrieval systems.",
        "Direct production experience building vector search infrastructure at scale.",
        "Strong overlap with HireGen's own semantic matching stack.",
      ],
      fitScore: {
        overall: 96, skills: 98, experience: 93, education: 98, confidence: "high",
        matchedSkills: ["Python", "PyTorch", "NLP", "Vector Search"],
        missingSkills: [] as string[],
        narrative: "Outstanding match across all sub-scores. Daniel's research and production background align almost exactly with the vector search and NLP focus of this role.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 97,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "offer" as const, appliedAt: new Date("2026-06-25"),
    },
    {
      id: "cand-7", name: "Rachel Kim", email: "rachel.kim@example.com", location: "Seattle, WA", appliedJobId: "job-2",
      skills: ["Python", "MLOps", "AWS", "Kubernetes"],
      education: "M.S. Data Science, University of Washington",
      employmentHistory: [{ company: "Northshore Analytics", title: "MLOps Engineer", startDate: "2020-05", endDate: null }],
      certifications: ["AWS Certified Machine Learning – Specialty"],
      resumeFileName: "rachel_kim_resume.pdf",
      summaryBullets: [
        "Strong MLOps and infrastructure background, less direct model research experience.",
        "AWS ML specialty certification supports infra-adjacent claims.",
        "No PyTorch or NLP-specific project experience found in resume.",
      ],
      fitScore: {
        overall: 71, skills: 68, experience: 78, education: 80, confidence: "high",
        matchedSkills: ["Python", "MLOps"],
        missingSkills: ["PyTorch", "NLP", "Vector Search"],
        narrative: "Rachel is a strong operational fit for MLOps responsibilities but has a gap in core modeling skills (PyTorch, NLP) explicitly weighted in this role's scoring profile.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 94,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "interview" as const, appliedAt: new Date("2026-07-01"),
    },
    {
      id: "cand-8", name: "Tobias Reinholt", email: "tobias.reinholt@example.com", location: "Remote (US)", appliedJobId: "job-2",
      skills: ["Python", "TensorFlow", "SQL"],
      education: "B.S. Statistics, Ohio State University",
      employmentHistory: [
        { company: "DataForge", title: "Data Scientist", startDate: "2023-06", endDate: null },
        { company: "DataForge", title: "Data Analyst", startDate: "2022-01", endDate: "2023-05" },
        { company: "Insight Metrics", title: "Analyst Intern", startDate: "2021-05", endDate: "2021-12" },
      ],
      certifications: [] as string[],
      resumeFileName: "tobias_reinholt_resume.pdf",
      summaryBullets: [
        "Data science background with TensorFlow rather than PyTorch experience.",
        "Three role changes within the same company suggest internal growth, not instability.",
        "No vector search or NLP-specific production experience listed.",
      ],
      fitScore: {
        overall: 47, skills: 42, experience: 50, education: 62, confidence: "high",
        matchedSkills: ["Python"],
        missingSkills: ["PyTorch", "NLP", "Vector Search", "MLOps"],
        narrative: "Adjacent but not aligned skill set — TensorFlow experience doesn't transfer scoring weight to this role's PyTorch requirement, and there's no vector search exposure.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 90,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "screened" as const, appliedAt: new Date("2026-07-10"),
    },
    {
      id: "cand-9", name: "Grace Chen", email: "grace.chen@example.com", location: "Remote (US)", appliedJobId: "job-2",
      skills: ["Python", "PyTorch", "NLP", "MLOps"],
      education: "B.S. Computer Science, UC Berkeley",
      employmentHistory: [{ company: "Solace ML", title: "ML Engineer", startDate: "2022-08", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "grace_chen_resume.pdf",
      summaryBullets: [
        "Well-rounded ML engineer with hands-on PyTorch and NLP project delivery.",
        "Resume language patterns and formatting show signs of heavy AI-assisted rewriting.",
        "Experience claims are difficult to independently verify from available text.",
      ],
      fitScore: {
        overall: 74, skills: 82, experience: 70, education: 75, confidence: "high",
        matchedSkills: ["Python", "PyTorch", "NLP", "MLOps"],
        missingSkills: ["Vector Search"],
        narrative: "Strong keyword and skill alignment, though the authenticity signal below warrants a closer resume review before advancing.",
      },
      authenticityStatus: "suspicious" as const, authenticityScore: 54,
      riskLevel: "medium" as const, riskFlags: [{ type: "resume-authenticity", description: "Formatting and phrasing patterns consistent with AI-generated resume content." }],
      languageTag: "en", stage: "applied" as const, appliedAt: new Date("2026-07-14"),
    },
    {
      id: "cand-10", name: "Hana Fujimori", email: "hana.fujimori@example.com", location: "Remote (US)", appliedJobId: "job-2",
      skills: ["Python", "PyTorch", "Vector Search", "NLP", "MLOps"],
      education: "M.S. Computer Science, University of Michigan",
      employmentHistory: [{ company: "Anchorpoint AI", title: "Applied ML Engineer", startDate: "2021-02", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "hana_fujimori_resume.pdf",
      summaryBullets: [
        "Full skill match across all five weighted competencies for this role.",
        "Four years of continuous applied ML experience at one company.",
        "Strong candidate for fast-track interview scheduling.",
      ],
      fitScore: {
        overall: 93, skills: 96, experience: 88, education: 92, confidence: "high",
        matchedSkills: ["Python", "PyTorch", "Vector Search", "NLP", "MLOps"],
        missingSkills: [] as string[],
        narrative: "Complete skill coverage with strong tenure. One of the highest-scoring applicants for this requisition to date.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 95,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "hired" as const, appliedAt: new Date("2026-06-10"),
    },
    {
      id: "cand-11", name: "Isabelle Moreau", email: "isabelle.moreau@example.com", location: "New York, NY", appliedJobId: "job-3",
      skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
      education: "B.F.A. Interaction Design, Parsons School of Design",
      employmentHistory: [{ company: "Bright Loom", title: "Senior Product Designer", startDate: "2020-11", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "isabelle_moreau_resume.pdf",
      summaryBullets: [
        "Full skill match with 5 years senior-level product design experience.",
        "Portfolio references complex B2B dashboard work relevant to this role.",
        "Strong user research methodology background.",
      ],
      fitScore: {
        overall: 90, skills: 92, experience: 88, education: 88, confidence: "high",
        matchedSkills: ["Figma", "Design Systems", "Prototyping", "User Research"],
        missingSkills: [] as string[],
        narrative: "Complete alignment with role requirements and directly relevant B2B dashboard design experience.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 97,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "interview" as const, appliedAt: new Date("2026-07-03"),
    },
    {
      id: "cand-12", name: "Owen Fitzgerald", email: "owen.fitzgerald@example.com", location: "Remote (US)", appliedJobId: "job-3",
      skills: ["Figma", "Prototyping"],
      education: "B.A. Graphic Design, Rhode Island School of Design",
      employmentHistory: [{ company: "Studio Verve", title: "Product Designer", startDate: "2023-03", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "owen_fitzgerald_resume.pdf",
      summaryBullets: [
        "Junior-to-mid level designer with limited design systems experience.",
        "No user research methodology explicitly listed.",
        "Strong visual design fundamentals from RISD background.",
      ],
      fitScore: {
        overall: 55, skills: 50, experience: 45, education: 78, confidence: "high",
        matchedSkills: ["Figma", "Prototyping"],
        missingSkills: ["Design Systems", "User Research"],
        narrative: "Solid visual design foundation but lacks the design systems and research depth this mid-level role requires.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 93,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "screened" as const, appliedAt: new Date("2026-07-11"),
    },
    {
      id: "cand-13", name: "Layla Hassan", email: "layla.hassan@example.com", location: "New York, NY", appliedJobId: "job-3",
      skills: ["Figma", "Design Systems", "User Research"],
      education: "M.S. Human-Centered Design, NYU",
      employmentHistory: [
        { company: "Verity Health", title: "Product Designer", startDate: "2022-06", endDate: null },
        { company: "Kindred Labs", title: "UX Designer", startDate: "2020-01", endDate: "2022-05" },
      ],
      certifications: [] as string[],
      resumeFileName: "layla_hassan_resume.pdf",
      summaryBullets: [
        "Strong design systems and research background across two roles.",
        "Healthcare UX experience adds domain-adjacent complexity handling.",
        "Prototyping tools not explicitly named in extracted resume text.",
      ],
      fitScore: {
        overall: 79, skills: 80, experience: 82, education: 90, confidence: "high",
        matchedSkills: ["Figma", "Design Systems", "User Research"],
        missingSkills: ["Prototyping"],
        narrative: "Strong overall candidate with only a minor extraction gap around prototyping tool experience — likely present but unlisted.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 95,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "applied" as const, appliedAt: new Date("2026-07-13"),
    },
    {
      id: "cand-14", name: "Victor Amos", email: "victor.amos@example.com", location: "Remote (US)", appliedJobId: "job-3",
      skills: ["Sketch", "Photoshop"],
      education: "Associate Degree, Digital Media",
      employmentHistory: [{ company: "PrintFirst Co", title: "Graphic Designer", startDate: "2017-04", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "victor_amos_resume.pdf",
      summaryBullets: [
        "Print and graphic design background with limited product design overlap.",
        "No Figma, prototyping, or user research experience detected.",
      ],
      fitScore: {
        overall: 22, skills: 15, experience: 30, education: 40, confidence: "high",
        matchedSkills: [] as string[],
        missingSkills: ["Figma", "Design Systems", "Prototyping", "User Research"],
        narrative: "Background is in print/graphic design rather than product design — minimal overlap with this role's core requirements.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 90,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "rejected" as const, appliedAt: new Date("2026-06-20"),
    },
    {
      id: "cand-15", name: "Chloe Bergman", email: "chloe.bergman@example.com", location: "Remote (US)", appliedJobId: "job-4",
      skills: ["Kubernetes", "AWS", "Terraform", "Go"],
      education: "B.S. Computer Engineering, Purdue University",
      employmentHistory: [{ company: "Ridgeline Cloud", title: "Senior DevOps Engineer", startDate: "2021-01", endDate: null }],
      certifications: ["CKA — Certified Kubernetes Administrator"],
      resumeFileName: "chloe_bergman_resume.pdf",
      summaryBullets: [
        "Full skill match with a current Kubernetes certification.",
        "Direct experience scaling infrastructure for high-throughput inference workloads.",
        "Strong candidate for immediate interview scheduling.",
      ],
      fitScore: {
        overall: 92, skills: 95, experience: 90, education: 85, confidence: "high",
        matchedSkills: ["Kubernetes", "AWS", "Terraform", "Go"],
        missingSkills: ["Observability"],
        narrative: "Near-complete skill match with certification backing and directly relevant infra scaling experience.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 96,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "interview" as const, appliedAt: new Date("2026-07-05"),
    },
    {
      id: "cand-16", name: "Nathaniel Cross", email: "nathaniel.cross@example.com", location: "Remote (US)", appliedJobId: "job-4",
      skills: ["AWS", "Docker", "Bash"],
      education: "B.S. Information Technology, University of Phoenix",
      employmentHistory: [
        { company: "Coreline Systems", title: "Systems Administrator", startDate: "2019-07", endDate: "2023-02" },
        { company: "Freelance", title: "Contract SysAdmin", startDate: "2023-03", endDate: null },
      ],
      certifications: [] as string[],
      resumeFileName: "nathaniel_cross_resume.pdf",
      summaryBullets: [
        "Sysadmin background transitioning toward DevOps, partial skill overlap.",
        "No Kubernetes or Terraform experience found in resume text.",
        "Certificate expiration flagged during extraction — CompTIA Security+ listed as expired.",
      ],
      fitScore: {
        overall: 41, skills: 35, experience: 48, education: 52, confidence: "high",
        matchedSkills: ["AWS"],
        missingSkills: ["Kubernetes", "Terraform", "Go", "Observability"],
        narrative: "Adjacent infrastructure background but missing the container orchestration and IaC depth this role requires.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 89,
      riskLevel: "medium" as const, riskFlags: [{ type: "expired-certification", description: "CompTIA Security+ certification listed as expired as of 2025-11." }],
      languageTag: "en", stage: "screened" as const, appliedAt: new Date("2026-07-09"),
    },
    {
      id: "cand-17", name: "Bianca Ferreira", email: "bianca.ferreira@example.com", location: "Remote (US)", appliedJobId: "job-4",
      skills: ["Kubernetes", "AWS", "Go", "Observability"],
      education: "B.S. Computer Science, Georgia Institute of Technology",
      employmentHistory: [{ company: "Northfield Data", title: "DevOps Engineer", startDate: "2022-02", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "bianca_ferreira_resume.pdf",
      summaryBullets: [
        "Strong overlap on 4 of 5 core skills, missing explicit Terraform experience.",
        "Observability tooling experience is a notable plus for this role's on-call requirements.",
      ],
      fitScore: {
        overall: 84, skills: 86, experience: 82, education: 84, confidence: "high",
        matchedSkills: ["Kubernetes", "AWS", "Go", "Observability"],
        missingSkills: ["Terraform"],
        narrative: "Strong candidate with excellent observability depth; Terraform is the only notable gap against the job's scoring weights.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 94,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "applied" as const, appliedAt: new Date("2026-07-16"),
    },
    {
      id: "cand-18", name: "Simone Laurent", email: "simone.laurent@example.com", location: "Austin, TX", appliedJobId: "job-5",
      skills: ["Technical Sourcing", "ATS Administration"],
      education: "B.A. Communications, Texas State University",
      employmentHistory: [{ company: "Talent Bridge Partners", title: "Technical Recruiter", startDate: "2021-10", endDate: null }],
      certifications: [] as string[],
      resumeFileName: "simone_laurent_resume.pdf",
      summaryBullets: [
        "Solid recruiting background with direct ATS administration experience.",
        "Stakeholder management skills not explicitly evidenced in resume text.",
      ],
      fitScore: {
        overall: 66, skills: 62, experience: 70, education: 65, confidence: "high",
        matchedSkills: ["Technical Sourcing", "ATS Administration"],
        missingSkills: ["Stakeholder Management"],
        narrative: "Good foundational fit; stakeholder management experience should be probed directly in interview given this role is currently paused.",
      },
      authenticityStatus: "authentic" as const, authenticityScore: 92,
      riskLevel: "low" as const, riskFlags: [] as unknown[],
      languageTag: "en", stage: "applied" as const, appliedAt: new Date("2026-06-18"),
    },
  ];

  for (const c of candidates) {
    await prisma.candidate.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, avatarColor: colorForSeed(c.id) },
    });
  }

  const applications = [
    {
      id: "app-1", candidateId: "user-candidate-1", jobId: "job-1", jobTitle: "Senior Frontend Engineer",
      company: "HireGen AI", location: "Austin, TX (Hybrid)", stage: "interview" as const,
      appliedAt: new Date("2026-07-08"), updatedAt: new Date("2026-07-20"),
      timeline: [
        { stage: "applied", date: "2026-07-08" },
        { stage: "screened", date: "2026-07-12", note: "AI resume screening completed — moved to review." },
        { stage: "interview", date: "2026-07-20", note: "Technical interview scheduled with the Engineering team." },
      ],
      interviewDetails: {
        interviewerName: "Daniel Cho", interviewerRole: "Engineering Manager", interviewerCompany: "HireGen AI",
        scheduledByName: "Priya Nandakumar", scheduledByRole: "Technical Recruiter",
        date: "2026-07-24", time: "10:30 AM CT", interviewType: "Technical Interview (Video Call)",
        meetingLink: "https://meet.hiregen.ai/int/senior-frontend-app-1",
        recruiterContactName: "Priya Nandakumar", recruiterContactEmail: "priya.nandakumar@hiregen.ai",
        recruiterContactPhone: "+1 (512) 555-0148",
      },
    },
    {
      id: "app-2", candidateId: "user-candidate-1", jobId: "job-3", jobTitle: "Product Designer",
      company: "HireGen AI", location: "New York, NY (Hybrid)", stage: "screened" as const,
      appliedAt: new Date("2026-07-13"), updatedAt: new Date("2026-07-16"),
      timeline: [
        { stage: "applied", date: "2026-07-13" },
        { stage: "screened", date: "2026-07-16", note: "Your profile is being reviewed by the hiring team." },
      ],
    },
    {
      id: "app-3", candidateId: "user-candidate-1", jobId: "job-4", jobTitle: "DevOps Engineer",
      company: "HireGen AI", location: "Remote (US)", stage: "applied" as const,
      appliedAt: new Date("2026-07-16"), updatedAt: new Date("2026-07-16"),
      timeline: [{ stage: "applied", date: "2026-07-16" }],
    },
    {
      id: "app-4", candidateId: "user-candidate-1", jobId: "job-2", jobTitle: "Machine Learning Engineer",
      company: "HireGen AI", location: "Remote (US)", stage: "rejected" as const,
      appliedAt: new Date("2026-06-15"), updatedAt: new Date("2026-06-29"),
      timeline: [
        { stage: "applied", date: "2026-06-15" },
        { stage: "screened", date: "2026-06-19" },
        { stage: "rejected", date: "2026-06-29", note: "The team moved forward with candidates with deeper vector search experience." },
      ],
    },
  ];

  for (const a of applications) {
    await prisma.application.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  const assessments = [
    {
      id: "assess-1", jobId: "job-1", jobTitle: "Senior Frontend Engineer", title: "Frontend Engineering Screen",
      status: "published" as const, weightInFitScore: 20, dueDate: new Date("2026-07-25"),
      questions: [
        { id: "q1-1", type: "mcq", prompt: "Which hook would you use to memoize an expensive computation between re-renders?", options: ["useEffect", "useMemo", "useRef", "useCallback"], correctOptionIndex: 1 },
        { id: "q1-2", type: "mcq", prompt: "In TypeScript, what does the `satisfies` operator primarily help with?", options: ["Runtime type validation", "Narrowing a type while preserving literal inference", "Casting between unrelated types", "Generating type declarations"], correctOptionIndex: 1 },
        { id: "q1-3", type: "mcq", prompt: "Which of the following most improves perceived performance for a slow-loading list?", options: ["Skeleton loading states", "Disabling the list", "Removing pagination", "Increasing font size"], correctOptionIndex: 0, flagged: true },
        { id: "q1-4", type: "behavioral", prompt: "Describe a time you had to push back on a design decision for technical or accessibility reasons. What was the outcome?" },
        { id: "q1-5", type: "behavioral", prompt: "Tell us about a frontend architecture decision you regret. What would you do differently today?" },
      ],
    },
    {
      id: "assess-2", jobId: "job-2", jobTitle: "Machine Learning Engineer", title: "ML Systems Screen",
      status: "published" as const, weightInFitScore: 25, dueDate: new Date("2026-07-22"),
      questions: [
        { id: "q2-1", type: "mcq", prompt: "What is the primary purpose of approximate nearest neighbor (ANN) search in a vector database?", options: ["Reducing storage cost only", "Trading a small amount of recall for large gains in query speed at scale", "Guaranteeing exact top-k results", "Replacing the need for embeddings"], correctOptionIndex: 1 },
        { id: "q2-2", type: "mcq", prompt: "Which technique is most directly used to reduce hallucination when grounding an LLM response in retrieved documents?", options: ["Increasing temperature", "Retrieval-augmented generation with citations", "Removing the system prompt", "Larger batch size"], correctOptionIndex: 1 },
        { id: "q2-3", type: "behavioral", prompt: "Walk us through how you evaluated a model before shipping it to production. What metrics mattered most and why?" },
        { id: "q2-4", type: "behavioral", prompt: "Describe a time a model underperformed in production despite strong offline evaluation. How did you diagnose it?" },
      ],
    },
    {
      id: "assess-3", jobId: "job-3", jobTitle: "Product Designer", title: "Product Design Screen",
      status: "published" as const, weightInFitScore: 15, dueDate: new Date("2026-07-24"),
      questions: [
        { id: "q3-1", type: "mcq", prompt: "When surfacing an AI-generated explanation in a dense enterprise dashboard, what's the best default state?", options: ["Always expanded", "Collapsed with a clear entry point", "Hidden until requested via search", "Shown only on hover"], correctOptionIndex: 1 },
        { id: "q3-2", type: "behavioral", prompt: "Describe a project where user research changed your design direction significantly. What did you learn?" },
        { id: "q3-3", type: "behavioral", prompt: "How do you balance design system consistency against the needs of a novel, complex workflow?" },
      ],
    },
  ];

  for (const a of assessments) {
    await prisma.assessment.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  const assessmentResults = [
    { id: "res-1", assessmentId: "assess-1", candidateId: "cand-1", candidateName: "Elena Marchetti", mcqScore: 92, behavioralScore: 88, integrityStatus: "clean" as const, completedAt: new Date("2026-07-14") },
    { id: "res-2", assessmentId: "assess-1", candidateId: "cand-2", candidateName: "Jordan Blake", mcqScore: 61, behavioralScore: 70, integrityStatus: "tab_switch" as const, completedAt: new Date("2026-07-15") },
    { id: "res-3", assessmentId: "assess-1", candidateId: "cand-3", candidateName: "Priyanka Rao", mcqScore: 97, behavioralScore: 94, integrityStatus: "clean" as const, completedAt: new Date("2026-07-05") },
    { id: "res-4", assessmentId: "assess-1", candidateId: "cand-5", candidateName: "Sofia Kastellanos", mcqScore: 74, behavioralScore: 66, integrityStatus: "clean" as const, completedAt: new Date("2026-07-17") },
    { id: "res-5", assessmentId: "assess-2", candidateId: "cand-6", candidateName: "Daniel Osei", mcqScore: 98, behavioralScore: 95, integrityStatus: "clean" as const, completedAt: new Date("2026-06-28") },
    { id: "res-6", assessmentId: "assess-2", candidateId: "cand-7", candidateName: "Rachel Kim", mcqScore: 79, behavioralScore: 84, integrityStatus: "clean" as const, completedAt: new Date("2026-07-04") },
    { id: "res-7", assessmentId: "assess-2", candidateId: "cand-8", candidateName: "Tobias Reinholt", mcqScore: 55, behavioralScore: 60, integrityStatus: "expired_link" as const, completedAt: new Date("2026-07-13") },
    { id: "res-8", assessmentId: "assess-2", candidateId: "cand-10", candidateName: "Hana Fujimori", mcqScore: 95, behavioralScore: 91, integrityStatus: "clean" as const, completedAt: new Date("2026-06-14") },
    { id: "res-9", assessmentId: "assess-3", candidateId: "cand-11", candidateName: "Isabelle Moreau", mcqScore: 90, behavioralScore: 93, integrityStatus: "clean" as const, completedAt: new Date("2026-07-06") },
    { id: "res-10", assessmentId: "assess-3", candidateId: "cand-12", candidateName: "Owen Fitzgerald", mcqScore: 58, behavioralScore: 62, integrityStatus: "clean" as const, completedAt: new Date("2026-07-12") },
  ];

  for (const r of assessmentResults) {
    await prisma.assessmentResult.upsert({ where: { id: r.id }, update: {}, create: r });
  }

  const interviews = [
    {
      id: "int-1", candidateId: "cand-1", candidateName: "Elena Marchetti", jobId: "job-1", jobTitle: "Senior Frontend Engineer",
      scheduledAt: new Date("2026-07-22T16:00:00"), interviewer: "Dana Whitfield", status: "completed" as const,
      questions: [
        { id: "q-int1-1", type: "technical", prompt: "Walk through how you'd architect a design token system shared across a design tool and a React codebase." },
        { id: "q-int1-2", type: "technical", prompt: "How would you structure GraphQL fragment colocation in a large component tree?", targetGap: "GraphQL" },
        { id: "q-int1-3", type: "behavioral", prompt: "Tell me about a time you had to drive a frontend architecture decision without full buy-in from the team." },
      ],
      transcriptExcerpt: "...I'd start by defining semantic tokens separate from raw palette values, so designers and engineers share the same vocabulary. For GraphQL, I'd colocate fragments with the component that needs the data rather than centralizing queries, which keeps ownership clear as the tree grows...",
      competencyScores: [
        { competency: "Technical Depth", score: 92 }, { competency: "Problem Solving", score: 88 },
        { competency: "Communication", score: 95 }, { competency: "Collaboration", score: 90 },
      ],
      overallScore: 91,
      strengths: ["Deep, articulate technical reasoning", "Strong systems-thinking on design tokens", "Clear communicator under follow-up questioning"],
      weaknesses: ["Limited hands-on GraphQL fragment experience, though reasoning was sound"],
      recommendation: "recommend" as const,
      justification: "Elena demonstrated senior-level architectural thinking and communicated clearly under pressure. The GraphQL gap is minor and coachable given her overall strength.",
    },
    {
      id: "int-2", candidateId: "cand-7", candidateName: "Rachel Kim", jobId: "job-2", jobTitle: "Machine Learning Engineer",
      scheduledAt: new Date("2026-07-24T14:30:00"), interviewer: "Priya Nathan", status: "scheduled" as const,
      questions: [
        { id: "q-int2-1", type: "technical", prompt: "How would you design a canary rollout strategy for a new scoring model?" },
        { id: "q-int2-2", type: "technical", prompt: "Explain your approach to evaluating embedding quality without labeled data.", targetGap: "PyTorch" },
        { id: "q-int2-3", type: "behavioral", prompt: "Describe how you've partnered with research-focused ML engineers when you come from an infra background." },
      ],
    },
    {
      id: "int-3", candidateId: "cand-11", candidateName: "Isabelle Moreau", jobId: "job-3", jobTitle: "Product Designer",
      scheduledAt: new Date("2026-07-21T10:00:00"), interviewer: "Marcus Iyer", status: "completed" as const,
      questions: [
        { id: "q-int3-1", type: "technical", prompt: "Walk through how you'd design an explainability panel for a non-technical hiring manager." },
        { id: "q-int3-2", type: "behavioral", prompt: "Tell me about a time research contradicted a stakeholder's strong opinion. How did you handle it?" },
      ],
      transcriptExcerpt: "...I'd keep the explanation collapsed by default with a single clear entry point — something like 'Why this score?' — and use plain language before showing the underlying sub-scores. For the stakeholder situation, I ran a small unmoderated study and presented the findings alongside a lightweight prototype rather than arguing in the abstract...",
      competencyScores: [
        { competency: "Design Craft", score: 90 }, { competency: "Research Rigor", score: 93 },
        { competency: "Communication", score: 92 }, { competency: "Stakeholder Management", score: 87 },
      ],
      overallScore: 91,
      strengths: ["Clear, structured explanation of complex AI concepts", "Evidence-based approach to resolving disagreement"],
      weaknesses: ["Could go deeper on prototyping tool specifics when asked directly"],
      recommendation: "recommend" as const,
      justification: "Isabelle showed exactly the kind of research-backed, low-ego approach this role needs when navigating disagreements with senior stakeholders.",
    },
    {
      id: "int-4", candidateId: "cand-15", candidateName: "Chloe Bergman", jobId: "job-4", jobTitle: "DevOps Engineer",
      scheduledAt: new Date("2026-07-25T13:00:00"), interviewer: "Dana Whitfield", status: "scheduled" as const,
      questions: [
        { id: "q-int4-1", type: "technical", prompt: "How would you design a Terraform module structure for multi-environment Kubernetes clusters?" },
        { id: "q-int4-2", type: "technical", prompt: "What's your approach to setting SLOs for a scoring pipeline that must respond in under 5 seconds?" },
        { id: "q-int4-3", type: "behavioral", prompt: "Tell me about an incident you led the response for. What changed afterward?" },
      ],
    },
    {
      id: "int-5", candidateId: "cand-3", candidateName: "Priyanka Rao", jobId: "job-1", jobTitle: "Senior Frontend Engineer",
      scheduledAt: new Date("2026-07-10T15:00:00"), interviewer: "Dana Whitfield", status: "completed" as const,
      questions: [
        { id: "q-int5-1", type: "technical", prompt: "How do you approach accessibility auditing for a component library used across dozens of teams?" },
        { id: "q-int5-2", type: "behavioral", prompt: "Tell me about a time you had to say no to a shipped feature for accessibility reasons." },
      ],
      transcriptExcerpt: "...I build automated checks into CI as a floor, not a ceiling — screen reader testing and keyboard-only walkthroughs still need a human. When I've blocked a launch, I always pair it with a fast-follow proposal so it doesn't feel like a dead end...",
      competencyScores: [
        { competency: "Technical Depth", score: 97 }, { competency: "Problem Solving", score: 94 },
        { competency: "Communication", score: 93 }, { competency: "Collaboration", score: 96 },
      ],
      overallScore: 95,
      strengths: ["Exceptional accessibility expertise, rare at this depth", "Pragmatic about tradeoffs — pairs pushback with solutions"],
      weaknesses: [] as string[],
      recommendation: "recommend" as const,
      justification: "One of the strongest interviews for this req. Priyanka's accessibility depth directly addresses a gap on the current team.",
    },
    {
      id: "int-6", candidateId: "cand-6", candidateName: "Daniel Osei", jobId: "job-2", jobTitle: "Machine Learning Engineer",
      scheduledAt: new Date("2026-07-02T11:00:00"), interviewer: "Priya Nathan", status: "completed" as const,
      questions: [
        { id: "q-int6-1", type: "technical", prompt: "Describe the tradeoffs between HNSW and IVF indexes for our candidate embedding search." },
        { id: "q-int6-2", type: "behavioral", prompt: "Tell me about a research idea that didn't pan out in production. What did you learn?" },
      ],
      transcriptExcerpt: "...HNSW gives better recall at similar latency for our dataset size, but IVF is cheaper to keep fresh with frequent re-indexing, which matters given how often we re-score. I'd lean HNSW now and revisit if the candidate pool grows 10x...",
      competencyScores: [
        { competency: "Technical Depth", score: 98 }, { competency: "Problem Solving", score: 96 },
        { competency: "Communication", score: 90 }, { competency: "Collaboration", score: 91 },
      ],
      overallScore: 94,
      strengths: ["Immediately applicable expertise in our exact infra tradeoffs", "Grounded, humble about research failures"],
      weaknesses: [] as string[],
      recommendation: "recommend" as const,
      justification: "Daniel's answer on HNSW vs IVF was essentially a design doc for a decision we need to make in Q3. Strong hire.",
    },
    {
      id: "int-7", candidateId: "cand-10", candidateName: "Hana Fujimori", jobId: "job-2", jobTitle: "Machine Learning Engineer",
      scheduledAt: new Date("2026-06-18T09:30:00"), interviewer: "Priya Nathan", status: "completed" as const,
      questions: [
        { id: "q-int7-1", type: "technical", prompt: "How would you monitor embedding drift over time in production?" },
        { id: "q-int7-2", type: "behavioral", prompt: "Describe how you've mentored more junior ML engineers on your team." },
      ],
      transcriptExcerpt: "...I'd track distributional distance between recent embedding batches and a fixed reference set, alerting on drift past a threshold tied to downstream score stability, not just the raw distance number...",
      competencyScores: [
        { competency: "Technical Depth", score: 95 }, { competency: "Problem Solving", score: 93 },
        { competency: "Communication", score: 89 }, { competency: "Collaboration", score: 94 },
      ],
      overallScore: 93,
      strengths: ["Production-minded monitoring instincts", "Demonstrated mentorship track record"],
      weaknesses: [] as string[],
      recommendation: "recommend" as const,
      justification: "Hana was hired after a unanimous panel recommendation — technical depth paired with strong mentorship signal.",
    },
  ];

  for (const i of interviews) {
    await prisma.interview.upsert({ where: { id: i.id }, update: {}, create: i });
  }

  const recruiterNotifications = [
    { id: "notif-r1", type: "status_update" as const, title: "Elena Marchetti moved to Interview", body: "AI screening completed with a 91 Fit Score. Elena has been auto-advanced to the Interview stage for Senior Frontend Engineer.", createdAt: new Date("2026-07-20T09:12:00"), read: false, aiGenerated: true },
    { id: "notif-r2", type: "interview" as const, title: "Interview scheduled: Rachel Kim", body: "Technical interview with Priya Nathan confirmed for Jul 24, 2:30 PM for the Machine Learning Engineer role.", createdAt: new Date("2026-07-19T14:40:00"), read: false, aiGenerated: false },
    { id: "notif-r3", type: "assessment" as const, title: "3 candidates completed the Frontend Engineering Screen", body: "Results are ready for review, including one flagged integrity event (tab-switch detected for Jordan Blake).", createdAt: new Date("2026-07-18T11:05:00"), read: false, aiGenerated: false },
    { id: "notif-r4", type: "system" as const, title: "Batch scoring complete", body: "487 applicants for Machine Learning Engineer were re-scored in 52 seconds following a scoring weight update.", createdAt: new Date("2026-07-17T08:00:00"), read: true, aiGenerated: false },
    { id: "notif-r5", type: "status_update" as const, title: "Grace Chen flagged for resume authenticity review", body: "Authenticity score of 54 detected — formatting patterns consistent with AI-generated content. Recommend manual review before advancing.", createdAt: new Date("2026-07-14T16:22:00"), read: true, aiGenerated: true },
    { id: "notif-r6", type: "interview" as const, title: "Interview feedback submitted: Daniel Osei", body: "Priya Nathan submitted a Recommend decision with a 94 overall interview score.", createdAt: new Date("2026-07-02T12:10:00"), read: true, aiGenerated: false },
    { id: "notif-r7", type: "system" as const, title: "AI JD generated for Backend Engineer, Platform", body: "A draft job description is ready for review. 1 potential bias flag detected in the seniority language.", createdAt: new Date("2026-07-12T10:30:00"), read: true, aiGenerated: true },
  ];

  for (const n of recruiterNotifications) {
    await prisma.notification.upsert({ where: { id: n.id }, update: {}, create: { ...n, role: "recruiter" } });
  }

  const candidateNotifications = [
    { id: "notif-c1", type: "interview" as const, title: "Your interview is confirmed", body: "Your technical interview for Senior Frontend Engineer is scheduled for Jul 22 at 4:00 PM with Dana Whitfield.", createdAt: new Date("2026-07-20T09:15:00"), read: false, aiGenerated: true },
    { id: "notif-c2", type: "status_update" as const, title: "Your application is under review", body: "Your application for Product Designer has moved to the Screened stage. We'll follow up within 5 business days.", createdAt: new Date("2026-07-16T13:00:00"), read: false, aiGenerated: false },
    { id: "notif-c3", type: "assessment" as const, title: "Assessment reminder: DevOps Engineer", body: "You have an assessment available for the DevOps Engineer role. It takes about 25 minutes to complete.", createdAt: new Date("2026-07-17T09:00:00"), read: false, aiGenerated: false },
    { id: "notif-c4", type: "status_update" as const, title: "Update on your Machine Learning Engineer application", body: "Thank you for your interest. The team has decided to move forward with other candidates for this role at this time.", createdAt: new Date("2026-06-29T15:40:00"), read: true, aiGenerated: true },
    { id: "notif-c5", type: "system" as const, title: "Welcome to HireGen AI", body: "Your candidate profile has been created. Track all of your applications from your dashboard at any time.", createdAt: new Date("2026-06-15T10:00:00"), read: true, aiGenerated: false },
  ];

  for (const n of candidateNotifications) {
    await prisma.notification.upsert({ where: { id: n.id }, update: {}, create: { ...n, role: "candidate" } });
  }

  console.log("Seed complete.");
  console.log(`Demo login password for both seeded accounts: "${DEMO_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
