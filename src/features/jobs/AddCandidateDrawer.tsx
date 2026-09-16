import { useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { CheckCircle2, FileText, UploadCloud, X } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import * as candidatesService from "@/services/candidatesService";
import * as resumeScreeningService from "@/services/resumeScreeningService";
import * as aiScoringService from "@/services/aiScoringService";
import { buildCandidateProfile } from "@/lib/buildCandidateProfile";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { ApplicantBackground, ApplicantPersonalInfo, Candidate, Job, ResumeUploadJob } from "@/types";

const STAGE_LABEL: Record<ResumeUploadJob["stage"], string> = {
  uploading: "Uploading resume...",
  extracting: "Extracting resume text...",
  vectorizing: "Matching against this role...",
  done: "Ready to submit",
  error: "Failed",
};

const MAX_FILE_MB = 10;
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const EMPTY_PERSONAL: ApplicantPersonalInfo = { fullName: "", email: "", phone: "", location: "", linkedIn: "", github: "", portfolio: "" };
const EMPTY_BACKGROUND: ApplicantBackground = {
  education: "",
  college: "",
  graduationYear: "",
  isFresher: false,
  yearsExperience: 0,
  coverLetter: "",
  previousCompany: "",
  previousRole: "",
  skills: [],
};

export function AddCandidateDrawer({
  job,
  open,
  onOpenChange,
  onCreated,
}: {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (candidate: Candidate) => void;
}) {
  const [personalInfo, setPersonalInfo] = useState<ApplicantPersonalInfo>(EMPTY_PERSONAL);
  const [uploadJob, setUploadJob] = useState<ResumeUploadJob | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [background, setBackground] = useState<ApplicantBackground>(EMPTY_BACKGROUND);
  const [skillDraft, setSkillDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setPersonalInfo(EMPTY_PERSONAL);
    setUploadJob(null);
    setFileError(undefined);
    setBackground(EMPTY_BACKGROUND);
    setSkillDraft("");
    setErrors({});
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
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
    resumeScreeningService.screenResume(file.name, setUploadJob);
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
    if (!personalInfo.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(personalInfo.email)) nextErrors.email = "Enter a valid email address.";
    if (!personalInfo.location.trim()) nextErrors.location = "Location is required.";
    if (!uploadJob || uploadJob.stage !== "done") nextErrors.resume = "Upload a resume to continue.";
    if (!background.education.trim()) nextErrors.education = "Education level is required.";
    if (background.skills.length === 0) nextErrors.skills = "Add at least one skill.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!uploadJob || !validate()) return;
    setSubmitting(true);
    try {
      const combinedSkills = Array.from(new Set([...background.skills, ...(uploadJob.extractedSkills ?? [])]));

      const fitScore = await aiScoringService.scoreCandidateAgainstJob(
        { skills: combinedSkills, yearsExperience: background.yearsExperience, education: background.education },
        job
      );

      const candidate = await candidatesService.createCandidate(
        buildCandidateProfile({
          job,
          personalInfo,
          background,
          resumeFileName: uploadJob.fileName,
          extractedSkills: uploadJob.extractedSkills ?? [],
          fitScore,
          source: "recruiter-added",
        })
      );

      onCreated(candidate);
      handleOpenChange(false);
    } catch (error) {
      toast({
        title: "Couldn't add candidate",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent title="Add candidate" description={`Manually add a candidate for ${job.title}.`}>
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-[12px] font-semibold uppercase tracking-eyebrow text-muted">Personal information</p>
            <div>
              <Label htmlFor="ac-fullName">Full name</Label>
              <Input id="ac-fullName" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} placeholder="Jordan Ellis" />
              <FieldError>{errors.fullName}</FieldError>
            </div>
            <div>
              <Label htmlFor="ac-email">Email</Label>
              <Input id="ac-email" type="email" value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} placeholder="you@example.com" />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div>
              <Label htmlFor="ac-phone">Phone</Label>
              <Input id="ac-phone" value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="ac-location">Location</Label>
              <Input id="ac-location" value={personalInfo.location} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} placeholder="Austin, TX" />
              <FieldError>{errors.location}</FieldError>
            </div>
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-[12px] font-semibold uppercase tracking-eyebrow text-muted">Resume</p>
            {!uploadJob || uploadJob.stage === "error" ? (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-dashed border-line-strong px-4 py-8 text-center transition-colors hover:border-line-strong/80 hover:bg-sunken/50"
              >
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleInputChange} />
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-blue-100 text-primary dark:bg-primary/15">
                  <UploadCloud className="size-5" />
                </div>
                <p className="text-[13px] font-medium text-heading">Drag &amp; drop, or click to browse</p>
                <p className="text-[11.5px] text-muted">PDF or DOCX, up to {MAX_FILE_MB}MB</p>
              </label>
            ) : (
              <div className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      uploadJob.stage === "done" ? "bg-score-strong-bg text-score-strong" : "bg-sunken text-muted"
                    )}
                  >
                    {uploadJob.stage === "done" ? <CheckCircle2 className="size-4" /> : <FileText className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-heading">{uploadJob.fileName}</p>
                    <p className="text-[11.5px] text-muted">{STAGE_LABEL[uploadJob.stage]}</p>
                  </div>
                  {uploadJob.stage !== "done" && <span className="font-mono text-[11.5px] text-muted">{uploadJob.progress}%</span>}
                </div>
                {uploadJob.stage !== "done" && <Progress value={uploadJob.progress} className="mt-2.5" />}
                {uploadJob.stage === "done" && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                    <div className="flex flex-wrap gap-1">
                      {uploadJob.extractedSkills?.map((skill) => (
                        <Badge key={skill} variant="primary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadJob(null)}>
                      Replace
                    </Button>
                  </div>
                )}
              </div>
            )}
            <FieldError>{fileError ?? errors.resume}</FieldError>
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-[12px] font-semibold uppercase tracking-eyebrow text-muted">Education &amp; experience</p>
            <div>
              <Label htmlFor="ac-education">Education level</Label>
              <Input id="ac-education" value={background.education} onChange={(e) => setBackground({ ...background, education: e.target.value })} placeholder="B.S. Computer Science" />
              <FieldError>{errors.education}</FieldError>
            </div>
            <div>
              <Label htmlFor="ac-college">College / University</Label>
              <Input id="ac-college" value={background.college} onChange={(e) => setBackground({ ...background, college: e.target.value })} placeholder="University of Texas at Austin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ac-gradYear">Graduation year</Label>
                <Input id="ac-gradYear" value={background.graduationYear} onChange={(e) => setBackground({ ...background, graduationYear: e.target.value })} placeholder="2021" />
              </div>
              <div>
                <Label htmlFor="ac-yearsExp">Years of experience</Label>
                <Input
                  id="ac-yearsExp"
                  type="number"
                  min={0}
                  value={background.yearsExperience}
                  onChange={(e) => setBackground({ ...background, yearsExperience: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ac-prevCompany">Previous company</Label>
              <Input id="ac-prevCompany" value={background.previousCompany} onChange={(e) => setBackground({ ...background, previousCompany: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div>
              <Label htmlFor="ac-prevRole">Previous role</Label>
              <Input id="ac-prevRole" value={background.previousRole} onChange={(e) => setBackground({ ...background, previousRole: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div>
              <Label>Skills</Label>
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
                  className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>
              <FieldError>{errors.skills}</FieldError>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <Button className="w-full" onClick={handleSubmit} loading={submitting}>
              Save candidate
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
