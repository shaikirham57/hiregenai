import { useEffect, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Briefcase, Check, CheckCircle2, FileText, MapPin, Sparkles, Trash2, TriangleAlert, UploadCloud, Users, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper, type StepperStep } from "@/components/ui/Stepper";
import { ScoreGauge } from "@/components/ai/ScoreGauge";
import * as jobsService from "@/services/jobsService";
import * as applicationsService from "@/services/applicationsService";
import * as resumeScreeningService from "@/services/resumeScreeningService";
import * as aiScoringService from "@/services/aiScoringService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn, formatFileSize } from "@/lib/utils";
import { isValidEmail, isValidPhone, isValidUrl } from "@/lib/validators";
import { getScoreTier, SCORE_TIER_LABEL } from "@/lib/scoreTier";
import { PIPELINE_STAGE_LABELS, type ApplicantBackground, type ApplicantPersonalInfo, type Application, type FitScoreBreakdown, type Job, type ResumeUploadJob } from "@/types";

const STAGE_LABEL: Record<ResumeUploadJob["stage"], string> = {
  uploading: "Uploading resume...",
  extracting: "Extracting resume text...",
  vectorizing: "Matching against this role...",
  done: "Ready to submit",
  error: "Failed",
};

const STEPS: StepperStep[] = [{ label: "Choose role" }, { label: "Resume" }, { label: "Details" }];

const MAX_FILE_MB = 4;
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const EMPTY_PERSONAL: ApplicantPersonalInfo = { fullName: "", email: "", phone: "", location: "", linkedIn: "", github: "", portfolio: "" };
const EMPTY_BACKGROUND: ApplicantBackground = {
  education: "",
  college: "",
  graduationYear: "",
  isFresher: false,
  yearsExperience: 0,
  previousCompany: "",
  previousRole: "",
  skills: [],
  coverLetter: "",
};

function SelectedRoleSummary({ job }: { job: Job }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Selected role</p>
        <p className="mt-1 text-[15px] font-semibold text-heading">{job.title}</p>
        <p className="text-[12.5px] text-muted">
          {job.department} · {job.seniority}
        </p>
      </div>
      <div className="space-y-2 text-[13px] text-ink">
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-muted" /> {job.location}
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="size-3.5 shrink-0 text-muted" /> {job.employmentType}
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-3.5 shrink-0 text-muted" /> {job.applicantCount} applicants so far
        </div>
      </div>
      {job.salaryRange.mid > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Salary range</p>
          <div className="flex items-center justify-between text-[12px] text-muted">
            <span>${(job.salaryRange.min / 1000).toFixed(0)}k</span>
            <span className="font-semibold text-heading">${(job.salaryRange.mid / 1000).toFixed(0)}k median</span>
            <span>${(job.salaryRange.max / 1000).toFixed(0)}k</span>
          </div>
        </div>
      )}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Key skills</p>
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <Badge key={skill} variant="neutral">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuickApplyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [reviewing, setReviewing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<ApplicantPersonalInfo>(EMPTY_PERSONAL);
  const [uploadJob, setUploadJob] = useState<ResumeUploadJob | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [background, setBackground] = useState<ApplicantBackground>(EMPTY_BACKGROUND);
  const [skillDraft, setSkillDraft] = useState("");
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});

  // The AI Match is only ever computed from this application's own real profile + resume data —
  // never from a score guessed ahead of that data existing.
  const [fitScore, setFitScore] = useState<FitScoreBreakdown | undefined>();
  const [computingFit, setComputingFit] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPersonalInfo((prev) => ({ ...prev, fullName: user.name, email: user.email }));
    Promise.all([jobsService.getJobs(), applicationsService.getApplicationsByCandidateId(user.id)]).then(([data, apps]) => {
      setJobs(data.filter((j) => j.status === "open"));
      setApplications(apps);
      setLoading(false);
    });
  }, [user]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const questions = selectedJob?.screeningQuestions ?? [];
  const existingApplication = selectedJobId ? applications.find((a) => a.jobId === selectedJobId) : undefined;

  useEffect(() => {
    const hasRequiredData = !!selectedJob && uploadJob?.stage === "done" && background.education.trim().length > 0 && background.skills.length > 0;
    if (!hasRequiredData) {
      setFitScore(undefined);
      return;
    }
    const timeout = setTimeout(async () => {
      setComputingFit(true);
      const fit = await aiScoringService.scoreCandidateAgainstJob(
        { skills: [...background.skills, ...(uploadJob?.extractedSkills ?? [])], yearsExperience: background.isFresher ? 0 : background.yearsExperience, education: background.education },
        selectedJob!
      );
      setFitScore(fit);
      setComputingFit(false);
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, uploadJob?.stage, background.education, background.skills, background.yearsExperience, background.isFresher]);

  const validateFile = (file: File): string | undefined => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return "Unsupported file type. Please upload a PDF or DOCX resume.";
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `File is too large. Max size is ${MAX_FILE_MB}MB.`;
    return undefined;
  };

  const processFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      setUploadJob(null);
      return;
    }
    setFileError(undefined);
    void resumeScreeningService.uploadResume(file, setUploadJob, { jobId: selectedJobId || undefined });
  };

  const handleFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const addSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !skillDraft.trim()) return;
    e.preventDefault();
    if (!background.skills.includes(skillDraft.trim())) {
      setBackground((prev) => ({ ...prev, skills: [...prev.skills, skillDraft.trim()] }));
    }
    setSkillDraft("");
  };
  const removeSkill = (skill: string) => setBackground((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!selectedJobId) nextErrors.job = "Select a job title to apply for.";
    if (!personalInfo.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!isValidEmail(personalInfo.email)) nextErrors.email = "Enter a valid email address.";
    if (!personalInfo.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (!isValidPhone(personalInfo.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (!personalInfo.location.trim()) nextErrors.location = "Location is required.";
    if (personalInfo.linkedIn.trim() && !isValidUrl(personalInfo.linkedIn)) nextErrors.linkedIn = "Enter a valid URL (starting with http:// or https://).";
    if (personalInfo.github.trim() && !isValidUrl(personalInfo.github)) nextErrors.github = "Enter a valid URL (starting with http:// or https://).";
    if (personalInfo.portfolio.trim() && !isValidUrl(personalInfo.portfolio)) nextErrors.portfolio = "Enter a valid URL (starting with http:// or https://).";
    if (!uploadJob || uploadJob.stage !== "done") nextErrors.resume = "Upload a resume to continue.";
    if (!background.education.trim()) nextErrors.education = "Highest qualification is required.";
    if (!background.isFresher && background.yearsExperience < 0) nextErrors.yearsExperience = "Enter a valid number of years.";
    if (background.skills.length === 0) nextErrors.skills = "Add at least one skill.";
    questions.forEach((_q, i) => {
      if (!screeningAnswers[`${i}`]?.trim()) nextErrors[`q${i}`] = "This question is required.";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReview = async () => {
    if (!validate()) {
      toast({ title: "A few things need your attention", description: "Check the highlighted fields and try again.", variant: "error" });
      return;
    }
    setReviewing(true);
  };

  const handleSubmit = async () => {
    if (!user || !selectedJob || !uploadJob?.resumeFileId) return;
    if (!validate()) {
      toast({ title: "A few things need your attention", description: "Check the highlighted fields and try again.", variant: "error" });
      setReviewing(false);
      return;
    }

    setSubmitting(true);
    try {
      // The server screens the stored resume against this job and computes the fit score.
      const application = await applicationsService.applyToJob(user.id, {
        job: selectedJob,
        personalInfo,
        background,
        screeningAnswers: questions.map((q, i) => ({ question: q, answer: screeningAnswers[`${i}`] ?? "" })),
        resumeFileId: uploadJob.resumeFileId,
      });

      navigate("/application-success", { state: { application, job: selectedJob } });
    } catch (error) {
      toast({
        title: "Couldn't submit application",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const currentStepIndex = reviewing ? 2 : step;

  return (
    <div>
      <PageHeader title="Quick Apply" description="Pick a role, upload your resume, and submit your details — all in one place." />

      <div className="mb-5 max-w-2xl">
        <Stepper steps={STEPS} currentStep={currentStepIndex} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose a role</CardTitle>
                <CardDescription>Select the open role you'd like to apply for.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="w-full sm:w-[420px]">
                    <SelectValue placeholder="Select a job title..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex flex-col py-0.5 pr-2">
                          <span>
                            {job.title} · {job.department}
                          </span>
                          <span className="text-[11px] text-muted">
                            {job.seniority} · {job.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.job}</FieldError>

                {selectedJob && existingApplication && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-score-strong/40 bg-score-strong-bg p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-score-strong">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-heading">You already applied to this role</p>
                      <p className="text-[12.5px] text-score-strong">
                        Applied {format(new Date(existingApplication.appliedAt), "MMM d, yyyy")} · Currently in{" "}
                        {PIPELINE_STAGE_LABELS[existingApplication.stage]}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              {selectedJob && (
                <CardFooter className={cn(existingApplication ? "justify-between" : "justify-end")}>
                  {existingApplication ? (
                    <>
                      <Button variant="outline" onClick={() => setSelectedJobId("")}>
                        Choose another role
                      </Button>
                      <Button asChild>
                        <Link to="/my-applications">View application →</Link>
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setStep(1)}>Continue to resume →</Button>
                  )}
                </CardFooter>
              )}
            </Card>
          )}

          {step === 1 && selectedJob && (
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
                <CardDescription>HireGen AI parses your resume automatically and matches it against this role's requirements.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {!uploadJob || uploadJob.stage === "error" ? (
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-line-strong px-6 py-12 text-center transition-colors hover:border-line-strong/80 hover:bg-sunken/50"
                  >
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleInputChange} />
                    <div className="flex size-12 items-center justify-center rounded-full bg-brand-blue-100 text-primary dark:bg-primary/15">
                      <UploadCloud className="size-6" />
                    </div>
                    <p className="text-[13.5px] font-medium text-heading">
                      Drag &amp; drop your resume, or <span className="text-primary">browse files</span>
                    </p>
                    <p className="text-[12px] text-muted">PDF or DOCX, up to {MAX_FILE_MB}MB</p>
                  </label>
                ) : (
                  <div className="rounded-lg border border-line p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-md",
                          uploadJob.stage === "done" ? "bg-score-strong-bg text-score-strong" : "bg-sunken text-muted"
                        )}
                      >
                        {uploadJob.stage === "done" ? <CheckCircle2 className="size-4" /> : <FileText className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-heading">{uploadJob.fileName}</p>
                        <p className="text-[12px] text-muted">
                          {uploadJob.stage === "done"
                            ? `${uploadJob.fileName.split(".").pop()?.toUpperCase()} · ${uploadJob.fileSize !== undefined ? formatFileSize(uploadJob.fileSize) : ""} · ${STAGE_LABEL[uploadJob.stage]}`
                            : STAGE_LABEL[uploadJob.stage]}
                        </p>
                      </div>
                      {uploadJob.stage !== "done" && <span className="font-mono text-[12px] text-muted">{uploadJob.progress}%</span>}
                    </div>
                    {uploadJob.stage !== "done" && <Progress value={uploadJob.progress} className="mt-3" />}
                    {uploadJob.stage === "done" && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {uploadJob.extractedSkills?.map((skill) => (
                            <Badge key={skill} variant="primary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setUploadJob(null)}>
                            Replace file
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setUploadJob(null)} aria-label="Remove resume">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <FieldError>{fileError ?? errors.resume}</FieldError>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={!uploadJob || uploadJob.stage !== "done"}>
                  Continue to details →
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && selectedJob && !reviewing && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Personal information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} placeholder="Jordan Ellis" />
                    <FieldError>{errors.fullName}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} placeholder="you@example.com" />
                    <FieldError>{errors.email}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} placeholder="(555) 123-4567" />
                    <FieldError>{errors.phone}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={personalInfo.location} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} placeholder="Austin, TX" />
                    <FieldError>{errors.location}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="linkedIn">LinkedIn profile (optional)</Label>
                    <Input id="linkedIn" value={personalInfo.linkedIn} onChange={(e) => setPersonalInfo({ ...personalInfo, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." />
                    <FieldError>{errors.linkedIn}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub profile (optional)</Label>
                    <Input id="github" value={personalInfo.github} onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })} placeholder="https://github.com/..." />
                    <FieldError>{errors.github}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="portfolio">Portfolio URL (optional)</Label>
                    <Input id="portfolio" value={personalInfo.portfolio} onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })} placeholder="https://yourname.com" />
                    <FieldError>{errors.portfolio}</FieldError>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Education &amp; experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="education">Highest qualification</Label>
                      <Input id="education" value={background.education} onChange={(e) => setBackground({ ...background, education: e.target.value })} placeholder="B.S. Computer Science" />
                      <FieldError>{errors.education}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor="college">College / University</Label>
                      <Input id="college" value={background.college} onChange={(e) => setBackground({ ...background, college: e.target.value })} placeholder="University of Texas at Austin" />
                    </div>
                    <div>
                      <Label htmlFor="gradYear">Graduation year</Label>
                      <Input id="gradYear" value={background.graduationYear} onChange={(e) => setBackground({ ...background, graduationYear: e.target.value })} placeholder="2021" />
                    </div>
                    <div>
                      <Label htmlFor="yearsExp">Years of experience</Label>
                      <Input
                        id="yearsExp"
                        type="number"
                        min={0}
                        disabled={background.isFresher}
                        value={background.isFresher ? 0 : background.yearsExperience}
                        onChange={(e) => setBackground({ ...background, yearsExperience: Number(e.target.value) })}
                      />
                      <FieldError>{errors.yearsExperience}</FieldError>
                      <label className="mt-2 flex items-center gap-2 text-[12.5px] text-ink">
                        <Checkbox
                          checked={background.isFresher}
                          onCheckedChange={(checked) => setBackground({ ...background, isFresher: checked === true, yearsExperience: checked === true ? 0 : background.yearsExperience })}
                        />
                        I'm a fresher (no prior professional experience)
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="prevCompany">Previous company</Label>
                      <Input
                        id="prevCompany"
                        disabled={background.isFresher}
                        value={background.previousCompany}
                        onChange={(e) => setBackground({ ...background, previousCompany: e.target.value })}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prevRole">Previous role</Label>
                      <Input
                        id="prevRole"
                        disabled={background.isFresher}
                        value={background.previousRole}
                        onChange={(e) => setBackground({ ...background, previousRole: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Technical skills</Label>
                    <div className="flex flex-wrap gap-1.5 rounded-md border border-line-strong p-2">
                      {background.skills.map((skill) => (
                        <Badge key={skill} variant="primary" className="gap-1">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        value={skillDraft}
                        onChange={(e) => setSkillDraft(e.target.value)}
                        onKeyDown={addSkill}
                        placeholder="Type a skill and press Enter"
                        className="min-w-[160px] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-muted"
                      />
                    </div>
                    <FieldError>{errors.skills}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="coverLetter">Cover letter / additional information (optional)</Label>
                    <Textarea
                      id="coverLetter"
                      rows={4}
                      value={background.coverLetter}
                      onChange={(e) => setBackground({ ...background, coverLetter: e.target.value })}
                      placeholder="Tell us why you're a great fit for this role..."
                    />
                  </div>
                </CardContent>
              </Card>

              {questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-accent" />
                      <CardTitle>Screening questions for {selectedJob.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {questions.map((q, i) => (
                      <div key={i}>
                        <Label htmlFor={`q${i}`}>{q}</Label>
                        <Textarea
                          id={`q${i}`}
                          rows={3}
                          value={screeningAnswers[`${i}`] ?? ""}
                          onChange={(e) => setScreeningAnswers((prev) => ({ ...prev, [`${i}`]: e.target.value }))}
                        />
                        <FieldError>{errors[`q${i}`]}</FieldError>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardFooter className="justify-between p-5">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleReview}>Review application</Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {step === 2 && selectedJob && reviewing && (
            <Card>
              <CardHeader>
                <CardTitle>Review your application</CardTitle>
                <CardDescription>Confirm everything looks right before you submit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="rounded-md border border-line p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Role</p>
                  <p className="mt-1 text-[13.5px] font-medium text-heading">
                    {selectedJob.title} · {selectedJob.department}
                  </p>
                  <p className="text-[12.5px] text-muted">
                    HireGen AI · {selectedJob.location} · {selectedJob.employmentType}
                  </p>
                </div>
                <div className="rounded-md border border-line p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Resume</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-medium text-heading">
                    <FileText className="size-3.5 text-muted" /> {uploadJob?.fileName}
                  </p>
                </div>
                <div className="rounded-md border border-line p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Applicant details</p>
                  <p className="mt-1 text-[13.5px] text-ink">{personalInfo.fullName}</p>
                  <p className="text-[12.5px] text-muted">
                    {personalInfo.email} · {personalInfo.phone} · {personalInfo.location}
                  </p>
                  <p className="mt-1 text-[12.5px] text-muted">
                    {background.education}
                    {background.college ? ` · ${background.college}` : ""} ·{" "}
                    {background.isFresher ? "Fresher" : `${background.yearsExperience} yrs experience`}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setReviewing(false)}>
                  Edit details
                </Button>
                <Button onClick={handleSubmit} loading={submitting}>
                  Submit application
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {fitScore && <Sparkles className="size-4 text-accent" />}
                {fitScore ? "AI Match" : "Selected role"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!selectedJob ? (
                <p className="text-[13px] text-muted">Choose a role to see the details here.</p>
              ) : computingFit ? (
                <Skeleton className="h-40" />
              ) : fitScore ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <p className="mb-2 truncate text-[12.5px] font-medium text-ink">{selectedJob.title}</p>
                    <ScoreGauge score={fitScore.overall} label={SCORE_TIER_LABEL[getScoreTier(fitScore.overall)]} size={100} />
                  </div>
                  {fitScore.matchedSkills.length > 0 && (
                    <div className="w-full">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Matched skills</p>
                      <ul className="space-y-1">
                        {fitScore.matchedSkills.slice(0, 4).map((s) => (
                          <li key={s} className="flex items-center gap-1.5 text-[12.5px] text-ink">
                            <Check className="size-3.5 shrink-0 text-score-strong" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {fitScore.missingSkills.length > 0 && (
                    <div className="w-full">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Skill gaps</p>
                      <ul className="space-y-1">
                        {fitScore.missingSkills.slice(0, 4).map((s) => (
                          <li key={s} className="flex items-center gap-1.5 text-[12.5px] text-ink">
                            <TriangleAlert className="size-3.5 shrink-0 text-score-review" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <SelectedRoleSummary job={selectedJob} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
