// Mirrors src/common/interceptors/transform.interceptor.ts on the backend —
// every response is wrapped in this envelope. Paginated endpoints include
// `meta`; single-resource endpoints omit it.
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// Mirrors src/common/filters/http-exception.filter.ts's error envelope.
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

// ---- Enums — must match prisma/schema.prisma exactly ----
export type PlatformRole = 'USER' | 'ADMIN';
export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type LogSource = 'TEXT' | 'VOICE' | 'SCREENSHOT' | 'SCREEN_RECORDING';
export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type NotificationType =
  | 'WEEKLY_REPORT_READY'
  | 'BURNOUT_RISK_ALERT'
  | 'RECURRING_PATTERN_DETECTED'
  | 'TEAM_INVITE'
  | 'SUBSCRIPTION_EXPIRING'
  | 'COMMENT_MENTION'
  | 'SYSTEM';
export type AttachmentKind = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
export type AttachmentStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

// ---- Auth ----
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  emailVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: TokenPair;
}

// ---- Categories ----
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isSystem: boolean;
  isActive: boolean;
  userId: string | null;
  organizationId: string | null;
  createdAt: string;
  _count?: { frustrationLogs: number };
}

// ---- Frustration Logs ----
export interface Attachment {
  id: string;
  kind: AttachmentKind;
  status: AttachmentStatus;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  transcript: string | null;
  createdAt: string;
}

export interface FrustrationLog {
  id: string;
  userId: string;
  organizationId: string | null;
  categoryId: string | null;
  description: string;
  source: LogSource;
  frustrationLevel: number;
  estimatedMinutesLost: number | null;
  location: string | null;
  occurredAt: string;
  frictionScore: number | null;
  severityScore: number | null;
  frequencyScore: number | null;
  preventabilityScore: number | null;
  isPubliclyShared: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; color: string; icon: string | null } | null;
  tags: { tag: { id: string; name: string }; addedByAI: boolean }[];
  attachments: Attachment[];
  _count?: { comments: number };
}

// ---- AI Reports ----
export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string | null;
  isDismissed: boolean;
  isActioned: boolean;
  createdAt: string;
}

export interface AIReport {
  id: string;
  userId: string | null;
  organizationId: string | null;
  period: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  summary: string | null;
  totalMinutesLost: number | null;
  avgFrictionScore: number | null;
  burnoutRiskScore: number | null;
  topCategories: { name: string; minutesLost: number; count: number; categoryId: string }[] | null;
  generatedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  recommendations: AIRecommendation[];
  organization: { id: string; name: string; slug: string } | null;
  user: { id: string; displayName: string; email: string } | null;
}

// ---- Organizations / Teams ----
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ownerId: string;
  ssoEnabled: boolean;
  createdAt: string;
  myRole?: OrgRole;
  _count?: { members: number; frustrationLogs: number };
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  user: { id: string; email: string; displayName: string; avatarUrl: string | null; lastLoginAt: string | null };
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
}

// ---- Notifications ----
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
