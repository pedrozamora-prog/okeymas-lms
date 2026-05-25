// ─── ROLES ───────────────────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "BRANCH_ADMIN" | "INSTRUCTOR" | "EMPLOYEE";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BRANCH_ADMIN: "BRANCH_ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  EMPLOYEE: "EMPLOYEE",
} as const;

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  image?: string | null;
}

// ─── COURSE ──────────────────────────────────────────────────────────────────

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type LessonType = "VIDEO" | "PDF" | "QUIZ" | "LIVE_CLASS" | "SCORM";
export type EnrollmentStatus = "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";

export interface CourseCard {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: CourseStatus;
  isRequired: boolean;
  totalLessons: number;
  completedLessons: number;
  enrollmentStatus?: EnrollmentStatus;
  progress: number;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalEnrolled: number;
  completedCourses: number;
  inProgress: number;
  totalPoints: number;
  upcomingLiveClasses: number;
  certificatesEarned: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  completionRate: number;
  totalLiveClasses: number;
}

// ─── LIVE CLASS ───────────────────────────────────────────────────────────────

export interface LiveClassCard {
  id: string;
  title: string;
  scheduledAt: Date;
  durationMins: number;
  instructorName: string;
  attendeeCount: number;
  isLive: boolean;
  recordingUrl?: string | null;
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
