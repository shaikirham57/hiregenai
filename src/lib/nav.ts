import {
  LayoutDashboard,
  Briefcase,
  Users,
  ScanSearch,
  Trophy,
  ClipboardList,
  Video,
  FileText,
  Bell,
  BarChart3,
  Search,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const RECRUITER_NAV: NavSection[] = [
  {
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Hiring",
    items: [
      { label: "Jobs", path: "/jobs", icon: Briefcase },
      { label: "Candidates", path: "/candidates", icon: Users },
      { label: "Resume Screening", path: "/screening", icon: ScanSearch },
      { label: "Candidate Ranking", path: "/ranking", icon: Trophy },
    ],
  },
  {
    label: "Evaluate",
    items: [
      { label: "Assessments", path: "/assessments", icon: ClipboardList },
      { label: "AI Interviews", path: "/interviews", icon: Video },
    ],
  },
  {
    label: "Insight",
    items: [
      { label: "Analytics", path: "/analytics", icon: BarChart3 },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

export const CANDIDATE_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Find Jobs", path: "/find-jobs", icon: Search },
      { label: "Quick Apply", path: "/quick-apply", icon: UploadCloud },
      { label: "My Applications", path: "/my-applications", icon: FileText },
      { label: "Assessments", path: "/assessments", icon: ClipboardList },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

export function getNavForRole(role: UserRole): NavSection[] {
  return role === "recruiter" ? RECRUITER_NAV : CANDIDATE_NAV;
}
