import { useEffect, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Pencil, Trash2, UploadCloud, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { Stepper } from "@/components/ui/Stepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import * as jobsService from "@/services/jobsService";
import * as applicationsService from "@/services/applicationsService";
import * as resumeScreeningService from "@/services/resumeScreeningService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { isValidEmail, isValidPhone, isValidUrl } from "@/lib/validators";
import type { ApplicantBackground, ApplicantPersonalInfo, Job, ResumeUploadJob } from "@/types";

const STEPS = [{ label: "Personal Info" }, { label: "Resume" }, { label: "Education & Experience" }, { label: "Screening" }, { label: "Review & Submit" }];

const STAGE_LABEL: Record<ResumeUploadJob["stage"], string> = {
  uploading: "Uploading resume...",
  extracting: "Extracting resume text...",
  vectorizing: "Matching against this role...",
  done: "Ready to submit",
  error: "Failed",
};

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

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | undefined>();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<ApplicantPersonalInfo>(EMPTY_PERSONAL);
  const [uploadJob, setUploadJob] = useState<ResumeUploadJob | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [background, setBackground] = useState<ApplicantBackground>(EMPTY_BACKGROUND);
  const [skillDraft, setSkillDraft] = useState("");
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id || !user) return;
    setPersonalInfo((prev) => ({ ...prev, fullName: user.name, email: user.email }));
    jobsService.getJobById(id).then((data) => {
      setJob(data);
      setLoading(false);
    });
  }, [id, user]);

  const questions = job?.screeningQuestions ?? [];

  const validateStep = (index: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (index === 0) {
      if (!personalInfo.fullName.trim()) nextErrors.fullName = "Full name is required.";
      if (!isValidEmail(personalInfo.email)) nextErrors.email = "Enter a valid email address.";
      if (!personalInfo.phone.trim()) nextErrors.phone = "Phone number is required.";
      else if (!isValidPhone(personalInfo.phone)) nextErrors.phone = "Enter a valid phone number.";
      if (!personalInfo.location.trim()) nextErrors.location = "Location is required.";
      if (personalInfo.linkedIn.trim() && !isValidUrl(personalInfo.linkedIn)) nextErrors.linkedIn = "Enter a valid URL (starting with http:// or https://).";
      if (personalInfo.github.trim() && !isValidUrl(personalInfo.github)) nextErrors.github = "Enter a valid URL (starting with http:// or https://).";
      if (personalInfo.portfolio.trim() && !isValidUrl(personalInfo.portfolio)) nextErrors.portfolio = "Enter a valid URL (starting with http:// or https://).";
    } else if (index === 1) {
      if (!uploadJob || uploadJob.stage !== "done") nextErrors.resume = "Upload a resume to continue.";
    } else if (index === 2) {
      if (!background.education.trim()) nextErrors.education = "Highest qualification is required.";
      if (!background.isFresher && background.yearsExperience < 0) nextErrors.yearsExperience = "Enter a valid number of years.";
      if (background.skills.length === 0) nextErrors.skills = "Add at least one skill.";
    } else if (index === 3) {
      questions.forEach((_q, i) => {
        if (!screeningAnswers[`${i}`]?.trim()) nextErrors[`q${i}`] = "This question is required.";
      });
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const jumpTo = (index: number) => {
    setErrors({});
    setStep(index);
  };

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
    if (job) void resumeScreeningService.uploadResume(file, setUploadJob, { jobId: job.id });
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

  const handleSubmit = async () => {
    if (!job || !user || !uploadJob?.resumeFileId) return;
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setSubmitting(true);
    try {
      // The server screens the stored resume against this job and computes the fit score.
      const application = await applicationsService.applyToJob(user.id, {
        job,
        personalInfo,
        background,
        screeningAnswers: questions.map((q, i) => ({ question: q, answer: screeningAnswers[`${i}`] ?? "" })),
        resumeFileId: uploadJob.resumeFileId,
      });

      navigate("/application-success", { state: { application, job } });
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
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/find-jobs">Back to Find Jobs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Link to={`/find-jobs/${job.id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to job details
      </Link>
      <PageHeader title={`Apply — ${job.title}`} description={`${job.department} · ${job.location}`} />

      <div className="mb-6">
        <Stepper steps={STEPS} currentStep={step} />
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-heading">Personal information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-heading">Upload your resume</h2>
                <p className="mt-1 text-[12.5px] text-muted">HireGen AI parses your resume automatically and matches it against this role's requirements.</p>
              </div>

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
                  <p className="text-[13.5px] font-medium text-heading">Drag &amp; drop your resume, or click to browse</p>
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
                      <p className="text-[12px] text-muted">{STAGE_LABEL[uploadJob.stage]}</p>
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
              <FieldError>{fileError ?? (uploadJob?.stage === "error" ? uploadJob.errorMessage : undefined) ?? errors.resume}</FieldError>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-heading">Education &amp; experience</h2>
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-heading">Screening questions</h2>
              {questions.length === 0 ? (
                <p className="text-[13px] text-muted">This role has no additional screening questions — you're all set.</p>
              ) : (
                questions.map((q, i) => (
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
                ))
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-heading">Review your application</h2>

              <ReviewSection title="Personal information" onEdit={() => jumpTo(0)}>
                <ReviewRow label="Name" value={personalInfo.fullName} />
                <ReviewRow label="Email" value={personalInfo.email} />
                <ReviewRow label="Phone" value={personalInfo.phone} />
                <ReviewRow label="Location" value={personalInfo.location} />
                {personalInfo.linkedIn && <ReviewRow label="LinkedIn" value={personalInfo.linkedIn} />}
                {personalInfo.github && <ReviewRow label="GitHub" value={personalInfo.github} />}
                {personalInfo.portfolio && <ReviewRow label="Portfolio" value={personalInfo.portfolio} />}
              </ReviewSection>

              <ReviewSection title="Resume" onEdit={() => jumpTo(1)}>
                <ReviewRow label="File" value={uploadJob?.fileName ?? "—"} />
              </ReviewSection>

              <ReviewSection title="Education & experience" onEdit={() => jumpTo(2)}>
                <ReviewRow label="Highest qualification" value={background.education} />
                <ReviewRow label="College" value={background.college || "—"} />
                <ReviewRow label="Graduation year" value={background.graduationYear || "—"} />
                <ReviewRow label="Experience" value={background.isFresher ? "Fresher" : `${background.yearsExperience} years`} />
                {!background.isFresher && (
                  <ReviewRow label="Previous role" value={background.previousRole ? `${background.previousRole} at ${background.previousCompany || "—"}` : "—"} />
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {background.skills.map((skill) => (
                    <Badge key={skill} variant="neutral">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {background.coverLetter && (
                  <div className="pt-2">
                    <p className="text-[12px] text-muted">Cover letter</p>
                    <p className="mt-0.5 whitespace-pre-line text-[13px] text-ink">{background.coverLetter}</p>
                  </div>
                )}
              </ReviewSection>

              {questions.length > 0 && (
                <ReviewSection title="Screening questions" onEdit={() => jumpTo(3)}>
                  {questions.map((q, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <p className="text-[12px] font-medium text-muted">{q}</p>
                      <p className="text-[13px] text-ink">{screeningAnswers[`${i}`] || "—"}</p>
                    </div>
                  ))}
                </ReviewSection>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <Button variant="outline" onClick={goBack} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                Submit application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-heading">{title}</p>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" /> Edit
        </Button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-[13px] sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 break-words text-ink sm:text-right">{value}</span>
    </div>
  );
}
