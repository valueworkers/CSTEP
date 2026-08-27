export type UserRole =
  | "base_user"
  | "moderator"
  | "event_administrator"
  | "super_administrator";

export type UserStatus = "active" | "suspended" | "pending";

export interface User {
  id: string;
  salutation?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = "draft" | "published" | "live" | "completed" | "cancelled";

export type EventListType = "upcoming" | "live" | "past";
export type EventScheduleType = "WHOLE_DAY" | "MULTI_SESSION";

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  endDate?: string;
  status: EventStatus;
  location: string;
  maxParticipants: number;
  registeredCount: number;
  imageUrl: string;
  videoUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  scheduleType?: EventScheduleType;
  travelAssistance?: boolean;
  medicalAssistance?: boolean;
  translationAssistance?: boolean;
  accommodationAssistance?: boolean;
}

export interface EventRegistrationSummary {
  totalRegisteredUsers: number;
  participantsAttended: number;
  participantsAccepted: number;
  participantsRejected: number;
  participantsPending: number;
  participantsHeld: number;
}

export interface UpcomingEvent extends Event {
  isRegistered: boolean;
  summary?: EventRegistrationSummary;
}

/** Lightweight event option from GET /events/event/dropdown/ */
export interface EventDropdownOption {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  scheduleType?: EventScheduleType;
  travelAssistance?: boolean;
  medicalAssistance?: boolean;
  translationAssistance?: boolean;
  accommodationAssistance?: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  videoMutedByDefault: boolean;
  pauseContinueEnabled: boolean;
  scheduleType: EventScheduleType;
  travelAssistance: boolean;
  medicalAssistance: boolean;
  translationAssistance: boolean;
  accommodationAssistance: boolean;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export type RegistrationStatus = "pending" | "accepted" | "rejected" | "on_hold";

export type AssistanceRequestStatus = "pending" | "accepted" | "rejected" | "on_hold";

export type AssistanceActionStatus = "accepted" | "rejected" | "on_hold";

export type ParticipationDate = "21st" | "22nd" | "both_days" | (string & {});
export type ParticipationTime = "half_day" | "full_day";
export type AttendanceMode = "physical" | "virtual";
export type FoodPreference =
  | "veg"
  | "jain"
  | "vegan"
  | "satvik"
  | "egg_veg"
  | "pescetarian"
  | "gluten_free"
  | "lactose_free"
  | "diabetic_friendly"
  | "nut_allergy"
  | "halal"
  | "non_veg_chicken"
  | "non_veg_any";

export type TravelType =
  | "flight_taxi_hotel"
  | "taxi_hotel"
  | "hotel_only"
  | "taxi_only"
  | "flight_only"
  | "train_only";

export type MedicalSupportType =
  | "wheel_chair"
  | "mobility_assistance"
  | "attender"
  | "blind_companion"
  | "hearing_impaired"
  | "sign_language_interpreter"
  | "oxygen_support"
  | "guide_dog"
  | "reserved_seating"
  | "other_medical";

export type TranslationLanguage =
  | "hindi"
  | "english"
  | "kannada"
  | "tamil"
  | "telugu"
  | "malayalam"
  | "punjabi"
  | "bengali"
  | "marathi"
  | "gujarati"
  | "odia"
  | "assamese"
  | "urdu";

export interface TravelAssistanceItem {
  id: string;
  transportMode: string;
  transportModeLabel: string;
  sourceLocation: string;
  destinationLocation: string;
  travelDate: string;
  status: AssistanceRequestStatus;
}

export interface TranslationAssistanceItem {
  id: string;
  language: TranslationLanguage;
  requiredDate: string;
  status: AssistanceRequestStatus;
}

export interface MedicalAssistanceItem {
  id: string;
  medicalNeeds: string;
  requiredDate: string;
  status: AssistanceRequestStatus;
}

export interface AccommodationAssistanceItem {
  id: string;
  eventId: string;
  hotelName: string;
  address: string;
  roomNo: string;
  fromDate: string;
  toDate: string;
  status: AssistanceRequestStatus;
}

export interface TravelAssistanceRow extends TravelAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface TranslationAssistanceRow extends TranslationAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface MedicalAssistanceRow extends MedicalAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface AccommodationAssistanceRow extends AccommodationAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface SessionRegistration {
  id: string;
  registrationId: string;
  scheduleItemId: string;
  sessionTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  track: string;
  status: AssistanceRequestStatus;
  registeredAt: string;
}

export interface RegistrationDay {
  id: string;
  dayId: string;
  dayNumber?: number;
  date: string;
  attendanceMode: AttendanceMode;
  sessions: SessionRegistration[];
}

/** List payload `registration_dates[]` entry (`date` + `mode` + optional attendance). */
export interface RegistrationDateEntry {
  id?: string;
  date: string;
  attendanceMode: AttendanceMode;
  /** From API `is_attended` — not shown as text; drives lobby badge color. */
  isAttended?: boolean;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  /** Present when API includes `event_name` / `event_title`. */
  eventName?: string;
  userName: string;
  email: string;
  phone: string;
  participationDate: ParticipationDate;
  participationDateLabel?: string;
  /** Comma-separated modes aligned with `registrationDates` / date label order. */
  participationModeLabel?: string;
  /** Per-date attendance from list `registration_dates` (`date` + `mode`). */
  registrationDates?: RegistrationDateEntry[];
  participationTime: ParticipationTime;
  registeredDaysCount?: number;
  registeredSessionsCount?: number;
  selectedDayIds?: string[];
  days?: RegistrationDay[];
  sessionRegistrations?: SessionRegistration[];
  /** Present on detail / filtered list; omitted on lobby list when API sends only registration_dates. */
  attendanceMode?: AttendanceMode;
  foodPreference: FoodPreference;
  travelAssistance?: TravelAssistanceItem[];
  translationAssistance?: TranslationAssistanceItem;
  medicalAssistance?: MedicalAssistanceItem;
  travelRequired: boolean;
  travelType?: TravelType;
  travelArrangementLabel?: string;
  travelStatus?: AssistanceRequestStatus;
  medicalSupportRequired: boolean;
  medicalSupportType?: MedicalSupportType;
  translationRequired: boolean;
  translationLanguage?: TranslationLanguage;
  translationStatus?: AssistanceRequestStatus;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TravelRequest {
  id: string;
  registrationId: string;
  userId: string;
  userName: string;
  email: string;
  travelType: TravelType;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface TranslationRequest {
  id: string;
  registrationId: string;
  userId: string;
  userName: string;
  email: string;
  language: TranslationLanguage;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Recording {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  duration: string;
  date: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
}

export interface EventRecording {
  id: string;
  sessionId: string;
  date: string;
  sessionTitle: string;
  startedAt: string;
  endedAt: string | null;
  file: string | null;
  fileUrl: string | null;
  status: string;
}

export interface EventRecordingsPage {
  rows: EventRecording[];
  page: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  eventId: string;
  eventName: string;
  sessionDate: string;
  sessionTitle: string;
  rating: number;
  comments: string;
  createdAt: string;
  /** API `event_date` (day id) when present. */
  eventDayId?: string;
  /** API `schedule_item` id when present. */
  scheduleItemId?: string;
  isOverallRating?: boolean;
}

export interface AnalyticsSummary {
  totalUsers: number;
  eventParticipants: number;
  accepted: number;
  rejected: number;
  onHold: number;
  pending: number;
}

export interface DashboardTopEvent {
  id: string;
  title: string;
  status: string;
  registrationCount: number;
}

export interface DashboardAnalytics {
  events: {
    total: number;
    byStatus: Record<string, number>;
  };
  registrations: {
    total: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  topEventsByRegistrations: DashboardTopEvent[];
  viewers: {
    totalSessions: number;
    currentlyWatching: number;
  };
}

export interface EventAnalyticsAssistance {
  total: number;
  byStatus: Record<string, number>;
  byTransportMode?: Record<string, number>;
  byLanguage?: Record<string, number>;
}

export interface EventAnalyticsParticipationDate {
  date: string;
  count: number;
}

export interface EventAnalyticsDay {
  id: string;
  date: string;
  registrationsCount: number;
  sessionsCount: number;
  byAttendanceMode?: Record<string, number>;
}

export interface RegistrationIntervalBucket {
  bucketStart: string;
  count: number;
}

export interface RegistrationIntervalDay {
  date: string;
  intervalMinutes: number;
  buckets: RegistrationIntervalBucket[];
}

export interface EventAnalyticsSession {
  id: string;
  title: string;
  dayDate: string;
  registrationsCount: number;
}

export interface ParticipationTimeSession {
  id: string;
  userName: string;
  email?: string;
  loggedInAt: string;
  loggedOutAt: string | null;
  durationSeconds: number;
  /** From WS `participation_duration[].is_registered`. */
  isRegistered?: boolean;
}

export interface RegistrationInsights {
  byDayLast7: { date: string; count: number }[];
  byAttendanceMode: Record<string, number>;
  byState: Record<string, number>;
  byGender: Record<string, number>;
  byDesignation: Record<string, number>;
}

/** GET /analytics/registrations/counts/ — Overview registration status cards. */
export interface RegistrationCounts {
  total: number;
  accepted: number;
  pending: number;
  onHold: number;
  rejected: number;
}

/** GET /analytics/registrations/trend/ — Registrations by day chart. */
export interface RegistrationTrendPoint {
  date: string;
  count: number;
}

export interface RegistrationTrend {
  granularity: string;
  results: RegistrationTrendPoint[];
}

export type AttendanceModeInsightName = "Physical" | "Virtual" | "Mixed";

export interface AttendanceModeInsightSlice {
  name: AttendanceModeInsightName;
  count: number;
  share?: number;
}

export interface AttendanceModeByDateInsight {
  date: string;
  total: number;
  physical: number;
  virtual: number;
  mixed: number;
}

/** Subset of GET /analytics/registrations/insights/ used by Overview. */
export interface RegistrationAttendanceInsights {
  attendanceMode: AttendanceModeInsightSlice[];
  attendanceModeByDate: AttendanceModeByDateInsight[];
}

export interface DemographicShareRow {
  label: string;
  count: number;
  share?: number;
}

/** Subset of GET /analytics/registrations/demographics/ used by Overview. */
export interface RegistrationDemographics {
  total: number;
  byGender: DemographicShareRow[];
  byDesignation: DemographicShareRow[];
  byState: DemographicShareRow[];
  byCountry: DemographicShareRow[];
}

/** GET /analytics/events/feedback/?event=&day= */
export interface EventFeedbackDateCount {
  date: string;
  count: number;
}

export interface EventFeedbackOverall {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  /** When feedback was submitted (`overall.feedback_by_date`). */
  feedbackByDate: EventFeedbackDateCount[];
}

export interface EventFeedbackDayStat {
  eventDayId: string;
  dayNumber: number;
  /** Conference day calendar date (`event_date`). */
  eventDate?: string;
  totalFeedback: number;
  averageRating: number;
}

export interface EventFeedbackSessionStat {
  scheduleItemId: string;
  title: string;
  totalFeedback: number;
  averageRating: number;
}

export interface EventFeedbackAnalytics {
  eventId: string;
  overall: EventFeedbackOverall;
  byDay: EventFeedbackDayStat[];
  bySession: EventFeedbackSessionStat[];
}

/** GET /analytics/streaming/summary/?event_id= — Live Event Insights streaming cards. */
export interface StreamingSummary {
  currentlyWatching: number;
  uniqueViewers: number;
  broadcastSessions: number;
  peakConcurrentViewers: number;
  avgWatchTimeSeconds: number;
  avgWatchTimeDisplay: string;
  totalWatchTimeSeconds: number;
  totalWatchTimeDisplay: string;
  liveBroadcast: boolean;
}

/** GET /analytics/streaming/participation-trend/ — mode filter. */
export type StreamingParticipationMode = "all" | "physical" | "virtual";

/** GET /analytics/streaming/participation-trend/?event_id=&mode=&interval_minutes= */
export interface StreamingParticipationTrend {
  date: string;
  mode: StreamingParticipationMode;
  intervalMinutes: number;
  buckets: RegistrationIntervalBucket[];
}

/** Day row from GET /registrations/registration/ `registration_dates`. */
export interface AttendanceModeUserDay {
  id: string;
  date: string;
  attendanceMode: AttendanceMode;
  isAttended?: boolean;
}

/** Row mapped from GET /registrations/registration/ */
export interface AttendanceModeUserRow {
  id: string;
  userName: string;
  phone: string;
  email: string;
  designation: string;
  orgName: string;
  city: string;
  state: string;
  eventName: string;
  status: RegistrationStatus;
  days: AttendanceModeUserDay[];
  /** Registration `created_at` — Date of Registration */
  createdAt: string;
  /** Registration `updated_at` (fallback: user.updated_at) — Modified */
  updatedAt: string;
}

export interface AttendanceModeUsersPage {
  rows: AttendanceModeUserRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface EventAnalytics {
  event: {
    id: string;
    title: string;
    status: string;
  };
  registrations: {
    total: number;
    byStatus: Record<string, number>;
    byAttendanceMode: Record<string, number>;
    byFoodPreference: Record<string, number>;
    byParticipationTime: Record<string, number>;
  };
  participationDates: EventAnalyticsParticipationDate[];
  days: EventAnalyticsDay[];
  sessions: EventAnalyticsSession[];
  assistanceRequests: {
    travel: EventAnalyticsAssistance;
    medical: EventAnalyticsAssistance;
    translation: EventAnalyticsAssistance;
    accommodation: EventAnalyticsAssistance;
  };
  streaming: {
    broadcastSessions: number;
    primaryBroadcastActive: boolean;
    totalViewerSessions: number;
    uniqueViewers: number;
    currentlyWatching: number;
    avgWatchDurationSeconds: number;
    totalWatchTimeSeconds: number;
    peakConcurrentViewers: number;
    logins: number;
  };
  participationTimeSessions: ParticipationTimeSession[];
  registrationIntervalsByDay: RegistrationIntervalDay[];
  registrationInsights: RegistrationInsights;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  color?: string;
  /** Optional secondary metric (e.g. feedback count alongside average rating). */
  secondaryValue?: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  dashboard: DashboardAnalytics;
  registrationTrend: TrendDataPoint[];
  participationTrend: TrendDataPoint[];
  foodPreferences: DistributionDataPoint[];
  translationRequests: DistributionDataPoint[];
  travelRequirements: DistributionDataPoint[];
  languageRequests: DistributionDataPoint[];
  participationByDate: DistributionDataPoint[];
  monthlyRegistrations: TrendDataPoint[];
  statusDistribution: DistributionDataPoint[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: Record<UserRole, boolean>;
}

export interface Notification {
  id: string;
  /** Django `notification_type` (e.g. REGISTRATION_CONFIRMED). */
  notificationType?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  eventId?: string | null;
  /** Optional deep link when the notification is clicked. */
  href?: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  imageUrl: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  speaker: string;
  description: string;
}

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  speaker: string;
  description: string;
  startTime: string;
  endTime: string;
  venue?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

/** Live event chat message from WebSocket / Django chat API. */
export interface LiveChatReplyPreview {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  isDeleted: boolean;
}

export type ChatReactionType =
  | "like"
  | "love"
  | "laugh"
  | "wow"
  | "sad"
  | "angry";

export interface LiveChatReaction {
  reaction: ChatReactionType;
  count: number;
  senderIds: string[];
}

export interface LiveChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
  replyTo: LiveChatReplyPreview | null;
  reactions: LiveChatReaction[];
}

export interface StreamState {
  isLive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  viewerCount: number;
  currentSpeaker: string;
}

export interface RegistrationFormData {
  eventId: string;
  salutation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  participationDate?: ParticipationDate;
  participationTime: ParticipationTime;
  selectedDayIds?: string[];
  selectedSessionIds?: string[];
  sessionsByDay?: Record<string, string[]>;
  attendanceByDay?: Record<string, AttendanceMode>;
  attendanceMode: AttendanceMode;
}

export type ApiUserRole = "BASE_USER" | "MODERATOR" | "EVENT_ADMIN" | "SUPER_ADMIN";

export type OtpVerifyMethod = "phone" | "email";

export interface VerifyOtpPayload {
  method: OtpVerifyMethod;
  otp: string;
  phone?: string;
  email?: string;
}

export interface ResetPasswordPayload {
  phone: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SignupAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
}

export type SignupOrgType = "ORGANISATION" | "INDEPENDENT";
export type SignupGender = "MALE" | "FEMALE" | "OTHER";

export interface SignupCredentials {
  salutation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  /** E.164-style dial code, e.g. "+91" — sent as API `country_code`. */
  countryCode: string;
  phone: string;
  email: string;
  gender: SignupGender;
  designation: string;
  orgType: SignupOrgType;
  orgName?: string;
  motivation: string;
  /** Preferred when set; otherwise address.country. */
  country?: string;
  city: string;
  state: string;
  /** Lobby signup may still collect a full address; city/state are preferred when set. */
  address?: SignupAddress;
  password: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateBroadcastSessionPayload {
  eventId: string;
  broadcasterId: string;
  name: string;
  isPrimary: boolean;
}

export interface BroadcastSessionSummary {
  id: string;
  eventId: string;
  eventTitle: string;
  broadcasterId: string;
  broadcasterName: string;
  name: string;
  isPrimary: boolean;
  streamKey: string;
  ingestUrl?: string;
  playbackUrl?: string;
  ingestUrls: BroadcastStreamUrls;
  playbackUrls: BroadcastStreamUrls;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export type BroadcastUrlTarget =
  | "ingest.url"
  | "ingest.rtmp"
  | "ingest.rtsp"
  | "ingest.webrtc"
  | "playback.url"
  | "playback.hls"
  | "playback.rtsp"
  | "playback.webrtc"
  | "stream_key";

export interface BroadcastStreamUrls {
  rtmp?: string;
  rtsp?: string;
  webrtc?: string;
  hls?: string;
}

export interface BroadcastSession {
  id: string;
  eventId: string;
  eventTitle: string;
  broadcasterId: string;
  broadcasterName: string;
  name: string;
  isPrimary: boolean;
  streamKey: string;
  ingestUrl?: string;
  playbackUrl?: string;
  ingestUrls: BroadcastStreamUrls;
  playbackUrls: BroadcastStreamUrls;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  /** Primary viewer playback link from API `playback_url`. */
  liveVideoUrl?: string;
}
