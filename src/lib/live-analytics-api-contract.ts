/**
 * Live Analytics WebSocket — connection contract.
 * @example ws(s)://{api-host}/ws/analytics/{eventId}/?token={accessToken}&visuals=statewise_login,...
 * Path: `event_id`. Query: `token`, `visuals` (comma-separated). No post-connect subscribe message.
 *
 * Server push shape:
 * `{ "type": "update", "data": { event_id, generated_at, statewise_login, … } }`
 *
 * Flat array examples (current Django payload):
 * - `statewise_login`: `[{ state, count }]`
 * - `countrywise_login`: `[{ country, count }]`
 * - `session_wise_max_virtual`: `[{ session_id, session_name, max_participants }]`
 * - `no_show`: `[{ day_id, day_number, registered, virtual_attended, physical_attended, attended, no_show }]`
 * - `participation_rate`: `{ rows: [{ session_id, session_name, session_duration_min, date?, points[], max_concurrent }] }` (or grouped by day)
 * - `participation_time`: session 5-min bucket table `{ rows: [{ session_name, session_duration_min, unique_participants, date?, buckets }] }` (or grouped by day)
 * - `participation_duration`: viewer watch rows `[{ user_id, full_name, email, joined_at, left_at, watch_duration_seconds, is_registered }]`
 *   Feeds the **Participation Duration** card (User / Logged in / Logged out / Duration / Registered). `left_at: null` → Still watching.
 * Day-filter reply (client sends `{ action, day_id? }`):
 * `{ action: "participation_time"|"participation_rate", errors: [], data: { subscribed, filters, data: { participation_*: { rows } } } }`
 * Legacy nested `{ all, physical, virtual }` mode objects are still supported for login maps.
 */

import type { DistributionDataPoint, EventFeedbackAnalytics, ParticipationTimeSession, StreamingSummary } from "@/types";
import type {
  SessionParticipationRateRow,
  SessionParticipationTimeRow,
} from "@/lib/participation-session-analytics";

export type LiveAnalyticsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface LiveAnalyticsModeSeries {
  all: DistributionDataPoint[];
  physical: DistributionDataPoint[];
  virtual: DistributionDataPoint[];
}

export interface LiveAnalyticsNoShowDay {
  dayId: string;
  dayNumber: number;
  registered: number;
  virtualAttended: number;
  physicalAttended: number;
  attended: number;
  noShow: number;
}

export interface LiveAnalyticsParticipationSnapshot {
  timeRows: SessionParticipationTimeRow[];
  /** Dynamic minute-bucket column labels from WS (e.g. "5", "10", …). */
  timeBucketLabels: string[];
  rateRows: SessionParticipationRateRow[];
  rateSlotLabels: string[];
}

/** Mapped snapshot from WS `type: "update"` payloads. */
export interface LiveAnalyticsSnapshot {
  receivedAt: string;
  eventId?: string;
  generatedAt?: string;
  statewiseLogin: LiveAnalyticsModeSeries;
  countrywiseLoginVirtual: DistributionDataPoint[];
  daywiseLogin: DistributionDataPoint[];
  sessionMaxVirtual: DistributionDataPoint[];
  noShow: LiveAnalyticsNoShowDay[];
  feedback: EventFeedbackAnalytics | null;
  participation: LiveAnalyticsParticipationSnapshot | null;
  /** Viewer join/leave rows from WS `participation_duration`. */
  participationDurationSessions: ParticipationTimeSession[];
  streamingSummary: Partial<StreamingSummary> | null;
  /** Full payload retained for debugging. */
  raw: unknown;
}
