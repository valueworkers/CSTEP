import type {
  LiveAnalyticsModeSeries,
  LiveAnalyticsNoShowDay,
  LiveAnalyticsParticipationSnapshot,
  LiveAnalyticsSnapshot,
} from "@/lib/live-analytics-api-contract";
import {
  PARTICIPATION_ANALYTICS_DAY_DATES,
  type SessionParticipationRateRow,
  type SessionParticipationTimeRow,
} from "@/lib/participation-session-analytics";
import type {
  DistributionDataPoint,
  EventFeedbackAnalytics,
  EventFeedbackDayStat,
  EventFeedbackSessionStat,
  ParticipationTimeSession,
  StreamingSummary,
} from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function pickNumberByKeys(row: Record<string, unknown>, keys: string[]): number | null {
  const wanted = new Set(keys.map((key) => key.trim()));
  for (const key of keys) {
    const direct = pickNumber(row[key]);
    if (direct != null) return direct;
  }
  for (const [rawKey, value] of Object.entries(row)) {
    if (wanted.has(rawKey.trim())) {
      const parsed = pickNumber(value);
      if (parsed != null) return parsed;
    }
  }
  return null;
}

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return pickString(value);
}

const PARTICIPATION_DAY_BY_NUMBER: Record<number, string> = {
  1: PARTICIPATION_ANALYTICS_DAY_DATES[0],
  2: PARTICIPATION_ANALYTICS_DAY_DATES[1],
  3: PARTICIPATION_ANALYTICS_DAY_DATES[2],
};

function pickSessionDate(
  row: Record<string, unknown>,
  fallbackDate?: string,
): string | undefined {
  const raw =
    pickString(row.date)
    ?? pickString(row.event_date)
    ?? pickString(row.session_date)
    ?? pickString(row.day_date)
    ?? pickString(row.day);
  if (raw) {
    const iso = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  }
  const dayNumber =
    pickNumber(row.day_number)
    ?? pickNumber(row.event_date__day_number)
    ?? pickNumber(row.day);
  if (dayNumber != null && PARTICIPATION_DAY_BY_NUMBER[dayNumber]) {
    return PARTICIPATION_DAY_BY_NUMBER[dayNumber];
  }
  return fallbackDate;
}

function extractParticipationItems(
  raw: unknown,
): Array<{ row: Record<string, unknown>; date?: string }> {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      const row = asRecord(item);
      return row ? [{ row, date: pickSessionDate(row) }] : [];
    });
  }

  const root = asRecord(raw);
  if (!root) return [];

  const grouped = root.by_day ?? root.by_date ?? root.days;
  if (Array.isArray(grouped)) {
    return grouped.flatMap((group) => {
      const groupRow = asRecord(group);
      if (!groupRow) return [];
      const fallback = pickSessionDate(groupRow);
      const list = Array.isArray(groupRow.rows)
        ? groupRow.rows
        : Array.isArray(groupRow.sessions)
          ? groupRow.sessions
          : [];
      return list.flatMap((item) => {
        const row = asRecord(item);
        return row ? [{ row, date: pickSessionDate(row, fallback) }] : [];
      });
    });
  }

  if (Array.isArray(root.rows)) {
    return root.rows.flatMap((item) => {
      const row = asRecord(item);
      return row ? [{ row, date: pickSessionDate(row) }] : [];
    });
  }

  const items: Array<{ row: Record<string, unknown>; date?: string }> = [];
  for (const [key, value] of Object.entries(root)) {
    const dateKey = key.slice(0, 10);
    const isDateKey =
      /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
      || (PARTICIPATION_ANALYTICS_DAY_DATES as readonly string[]).includes(key);
    if (!isDateKey) continue;
    const inner = asRecord(value);
    const list = Array.isArray(value)
      ? value
      : Array.isArray(inner?.rows)
        ? inner!.rows
        : [];
    for (const item of list) {
      const row = asRecord(item);
      if (!row) continue;
      items.push({ row, date: pickSessionDate(row, dateKey) });
    }
  }
  return items;
}

function mapShareRows(raw: unknown): DistributionDataPoint[] {
  if (!Array.isArray(raw)) return [];
  const points: DistributionDataPoint[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      points.push({ name: item, value: 0 });
      continue;
    }
    const row = asRecord(item);
    if (!row) continue;
    const name =
      pickString(row.label)
      ?? pickString(row.name)
      ?? pickString(row.state)
      ?? pickString(row.country)
      ?? pickString(row.session)
      ?? pickString(row.title)
      ?? pickString(row.session_name)
      ?? pickString(row.schedule_item__title)
      ?? pickString(row.schedule_item_title)
      ?? (pickNumber(row.day_number) != null ? `Day ${pickNumber(row.day_number)}` : null)
      ?? (pickNumber(row.event_date__day_number) != null
        ? `Day ${pickNumber(row.event_date__day_number)}`
        : null);
    const value =
      pickNumber(row.max_participants)
      ?? pickNumber(row.count)
      ?? pickNumber(row.value)
      ?? pickNumber(row.max)
      ?? pickNumber(row.max_count)
      ?? pickNumber(row.peak)
      ?? pickNumber(row.participants)
      ?? pickNumber(row.avg_rating)
      ?? 0;
    if (!name) continue;
    points.push({ name, value });
  }
  return points.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function mapSessionMaxVirtual(raw: unknown): DistributionDataPoint[] {
  return mapShareRows(raw);
}

function mapCountRecord(raw: unknown): DistributionDataPoint[] {
  const record = asRecord(raw);
  if (!record) return [];
  return Object.entries(record)
    .map(([name, value]) => ({ name, value: pickNumber(value) ?? 0 }))
    .filter((row) => row.name)
    .sort((a, b) => b.value - a.value);
}

function mapDistribution(raw: unknown): DistributionDataPoint[] {
  const fromRows = mapShareRows(raw);
  if (fromRows.length > 0) return fromRows;
  return mapCountRecord(raw);
}

function emptyModeSeries(): LiveAnalyticsModeSeries {
  return { all: [], physical: [], virtual: [] };
}

function mapModeSeries(raw: unknown): LiveAnalyticsModeSeries {
  const root = asRecord(raw);
  if (!root) {
    const flat = mapDistribution(raw);
    return { all: flat, physical: [], virtual: [] };
  }

  const all = mapDistribution(root.all ?? root.total);
  const physical = mapDistribution(root.physical ?? root.PHYSICAL);
  const virtual = mapDistribution(root.virtual ?? root.VIRTUAL);

  if (all.length === 0 && physical.length === 0 && virtual.length === 0) {
    const flat = mapDistribution(raw);
    return { all: flat, physical: [], virtual: [] };
  }

  return {
    all: all.length > 0 ? all : [...physical, ...virtual],
    physical,
    virtual,
  };
}

function mapStreamingPartial(root: Record<string, unknown>): Partial<StreamingSummary> | null {
  const streaming = asRecord(root.streaming) ?? asRecord(root.streaming_summary);
  if (!streaming) return null;

  const currentlyWatching =
    pickNumber(streaming.currently_watching)
    ?? pickNumber(streaming.currently_watching_count);
  const uniqueViewers =
    pickNumber(streaming.unique_viewers)
    ?? pickNumber(streaming.unique_viewers_count);
  const broadcastSessions =
    pickNumber(streaming.broadcast_sessions)
    ?? pickNumber(streaming.broadcast_sessions_count);
  const peakConcurrentViewers =
    pickNumber(streaming.peak_concurrent_viewers)
    ?? pickNumber(streaming.peak_concurrent_viewers_count);

  if (
    currentlyWatching == null
    && uniqueViewers == null
    && broadcastSessions == null
    && peakConcurrentViewers == null
  ) {
    return null;
  }

  return {
    ...(currentlyWatching != null ? { currentlyWatching } : {}),
    ...(uniqueViewers != null ? { uniqueViewers } : {}),
    ...(broadcastSessions != null ? { broadcastSessions } : {}),
    ...(peakConcurrentViewers != null ? { peakConcurrentViewers } : {}),
    ...(pickNumber(streaming.avg_watch_time_seconds) != null
      ? { avgWatchTimeSeconds: pickNumber(streaming.avg_watch_time_seconds)! }
      : {}),
    ...(pickString(streaming.avg_watch_time_display)
      ? { avgWatchTimeDisplay: pickString(streaming.avg_watch_time_display)! }
      : {}),
    ...(pickNumber(streaming.total_watch_time_seconds) != null
      ? { totalWatchTimeSeconds: pickNumber(streaming.total_watch_time_seconds)! }
      : {}),
    ...(pickString(streaming.total_watch_time_display)
      ? { totalWatchTimeDisplay: pickString(streaming.total_watch_time_display)! }
      : {}),
    ...(typeof streaming.live_broadcast === "boolean"
      ? { liveBroadcast: streaming.live_broadcast }
      : {}),
  };
}

function mapNoShow(raw: unknown): LiveAnalyticsNoShowDay[] {
  if (!Array.isArray(raw)) return [];
  const rows: LiveAnalyticsNoShowDay[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const dayNumber = pickNumber(row.day_number) ?? 0;
    rows.push({
      dayId: pickId(row.day_id) ?? String(dayNumber),
      dayNumber,
      registered: pickNumberByKeys(row, ["registered"]) ?? 0,
      virtualAttended: pickNumberByKeys(row, ["virtual_attended"]) ?? 0,
      physicalAttended: pickNumberByKeys(row, ["physical_attended"]) ?? 0,
      attended: pickNumberByKeys(row, ["attended"]) ?? 0,
      noShow: pickNumberByKeys(row, ["no_show"]) ?? 0,
    });
  }
  return rows.sort((a, b) => a.dayNumber - b.dayNumber);
}

function mapFeedback(eventId: string | undefined, data: Record<string, unknown>): EventFeedbackAnalytics | null {
  const byDayRaw = Array.isArray(data.daywise_feedback) ? data.daywise_feedback : [];
  const bySessionRaw = Array.isArray(data.session_wise_feedback) ? data.session_wise_feedback : [];
  if (byDayRaw.length === 0 && bySessionRaw.length === 0) return null;

  const byDay: EventFeedbackDayStat[] = [];
  for (const item of byDayRaw) {
    const row = asRecord(item);
    if (!row) continue;
    const dayNumber = pickNumber(row.event_date__day_number) ?? pickNumber(row.day_number) ?? 0;
    byDay.push({
      eventDayId: pickId(row.event_date_id) ?? pickId(row.day_id) ?? String(dayNumber),
      dayNumber,
      totalFeedback: pickNumber(row.count) ?? 0,
      averageRating: pickNumber(row.avg_rating) ?? 0,
    });
  }

  const bySession: EventFeedbackSessionStat[] = [];
  for (const item of bySessionRaw) {
    const row = asRecord(item);
    if (!row) continue;
    const title =
      pickString(row.schedule_item__title)
      ?? pickString(row.title)
      ?? pickString(row.session_name)
      ?? "Session";
    bySession.push({
      scheduleItemId: pickId(row.schedule_item_id) ?? title,
      title,
      totalFeedback: pickNumber(row.count) ?? 0,
      averageRating: pickNumber(row.avg_rating) ?? 0,
    });
  }

  const totalFeedback =
    byDay.reduce((sum, row) => sum + row.totalFeedback, 0)
    || bySession.reduce((sum, row) => sum + row.totalFeedback, 0);
  const ratingSum = bySession.reduce(
    (sum, row) => sum + row.averageRating * row.totalFeedback,
    0,
  );
  const averageRating = totalFeedback > 0 ? ratingSum / totalFeedback : 0;

  return {
    eventId: eventId ?? "",
    overall: {
      totalFeedback,
      averageRating,
      ratingDistribution: {},
      feedbackByDate: [],
    },
    byDay,
    bySession,
  };
}

function mapParticipationTime(raw: unknown): {
  rows: SessionParticipationTimeRow[];
  bucketLabels: string[];
} {
  const list = extractParticipationItems(raw);
  const labelSet = new Set<string>();
  const rows: SessionParticipationTimeRow[] = [];

  for (const { row, date } of list) {
    const name = pickString(row.session_name) ?? pickString(row.name);
    if (!name) continue;
    const rawBuckets = asRecord(row.buckets) ?? {};
    const buckets: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawBuckets)) {
      labelSet.add(key);
      buckets[key] = pickNumber(value) ?? 0;
    }
    rows.push({
      sessionId: pickId(row.session_id) ?? pickId(row.sessionId) ?? undefined,
      sessionName: name,
      sessionDurationMinutes: pickNumber(row.session_duration_min) ?? 0,
      uniqueParticipants: pickNumber(row.unique_participants) ?? 0,
      date,
      buckets,
    });
  }

  // Columns = 5-min marks up to each session's duration (union across rows).
  const bucketLabels = [...labelSet].sort((a, b) => Number(a) - Number(b));
  return { rows, bucketLabels };
}

function mapParticipationRate(raw: unknown): {
  rows: SessionParticipationRateRow[];
  slotLabels: string[];
} {
  const list = extractParticipationItems(raw);
  const labelSet = new Set<string>();
  const rows: SessionParticipationRateRow[] = [];

  for (const { row, date } of list) {
    const name = pickString(row.session_name) ?? pickString(row.name);
    if (!name) continue;

    const slots: Record<string, number> = {};
    const points = Array.isArray(row.points) ? row.points : [];
    for (const point of points) {
      if (typeof point === "number") continue;
      const p = asRecord(point);
      if (!p) continue;
      const label =
        pickString(p.label)
        ?? pickString(p.time)
        ?? pickString(p.slot)
        ?? (pickNumber(p.minute) != null ? String(pickNumber(p.minute)) : null)
        ?? (pickNumber(p.offset_min) != null ? `+${pickNumber(p.offset_min)}m` : null);
      const value =
        pickNumber(p.count)
        ?? pickNumber(p.value)
        ?? pickNumber(p.participants)
        ?? pickNumber(p.concurrent)
        ?? 0;
      if (!label) continue;
      labelSet.add(label);
      slots[label] = value;
    }

    const maxConcurrent = pickNumber(row.max_concurrent);
    if (maxConcurrent != null) {
      labelSet.add("Max");
      slots.Max = maxConcurrent;
    }

    rows.push({
      sessionId: pickId(row.session_id) ?? pickId(row.sessionId) ?? undefined,
      sessionName: name,
      sessionDurationMinutes: pickNumber(row.session_duration_min) ?? 0,
      date,
      slots,
    });
  }

  const slotLabels = [...labelSet].sort((a, b) => {
    if (a === "Max") return 1;
    if (b === "Max") return -1;
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return { rows, slotLabels };
}

function mapParticipationDurationSessions(raw: unknown): ParticipationTimeSession[] {
  if (raw == null) return [];

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.rows)
      ? (asRecord(raw)!.rows as unknown[])
      : Array.isArray(asRecord(raw)?.results)
        ? (asRecord(raw)!.results as unknown[])
        : null;
  if (!list) return [];

  return list.map((item, index) => {
    const row = asRecord(item) ?? {};
    const leftAt = row.left_at ?? row.logged_out_at ?? row.loggedOutAt ?? row.logout_at;
    const joinedAt =
      pickString(row.joined_at)
      ?? pickString(row.logged_in_at)
      ?? pickString(row.loggedInAt)
      ?? pickString(row.login_at)
      ?? "";
    const userId = pickId(row.user_id) ?? pickId(row.id);
    return {
      id: userId ? `${userId}-${joinedAt || index}` : `participation-duration-${index}`,
      userName:
        pickString(row.full_name)
        ?? pickString(row.user_name)
        ?? pickString(row.userName)
        ?? pickString(row.name)
        ?? "Guest",
      email: pickString(row.email) ?? undefined,
      loggedInAt: joinedAt,
      loggedOutAt: leftAt == null || leftAt === "" ? null : String(leftAt),
      durationSeconds:
        pickNumber(row.watch_duration_seconds)
        ?? pickNumber(row.duration_seconds)
        ?? pickNumber(row.durationSeconds)
        ?? pickNumber(row.duration)
        ?? 0,
      isRegistered:
        typeof row.is_registered === "boolean"
          ? row.is_registered
          : typeof row.isRegistered === "boolean"
            ? row.isRegistered
            : undefined,
    };
  });
}

function isParticipationActionReply(raw: unknown): boolean {
  const root = asRecord(raw);
  if (!root) return false;
  const action = pickString(root.action)?.toLowerCase();
  if (action === "participation_time" || action === "participation_rate") return true;
  const envelope = asRecord(root.data);
  const payload = asRecord(envelope?.data);
  return payload?.participation_time != null || payload?.participation_rate != null;
}

function extractLiveAnalyticsData(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw) ?? {};
  const type = pickString(root.type)?.toLowerCase();
  if (type === "update") {
    return asRecord(root.data) ?? root;
  }

  const envelope = asRecord(root.data);
  const nestedPayload = asRecord(envelope?.data);
  if (nestedPayload) {
    return nestedPayload;
  }

  const action = pickString(root.action)?.toLowerCase();
  if (action === "participation_time" || action === "participation_rate") {
    if (envelope?.[action] != null) return envelope;
  }

  return envelope ?? root;
}

function mapParticipation(data: Record<string, unknown>): LiveAnalyticsParticipationSnapshot | null {
  // Session 5-min buckets — `participation_time` only (not viewer duration rows).
  const hasTime = data.participation_time != null;
  const hasRate = data.participation_rate != null;
  if (!hasTime && !hasRate) return null;

  const time = mapParticipationTime(data.participation_time);
  const rate = mapParticipationRate(data.participation_rate);

  return {
    timeRows: time.rows,
    timeBucketLabels: time.bucketLabels,
    rateRows: rate.rows,
    rateSlotLabels: rate.slotLabels.length > 0 ? rate.slotLabels : ["Max"],
  };
}

/**
 * Subscribe ack / non-update control — not a chart payload; skip snapshot updates.
 */
export function isLiveAnalyticsControlMessage(raw: unknown): boolean {
  if (isParticipationActionReply(raw)) return false;
  const root = asRecord(raw);
  if (!root) return false;
  const type = pickString(root.type)?.toLowerCase();
  if (type === "update") return false;
  const action = pickString(root.action)?.toLowerCase();
  if (action === "ping" || action === "subscribe") return true;
  const data = asRecord(root.data);
  return Boolean(data && Array.isArray(data.subscribed) && !asRecord(data.data));
}

export function extractLiveAnalyticsErrors(raw: unknown): string[] {
  const root = asRecord(raw);
  if (!root || !Array.isArray(root.errors)) return [];
  return root.errors
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const row = asRecord(item);
      return pickString(row?.detail) ?? pickString(row?.message) ?? "";
    })
    .filter(Boolean);
}

/**
 * Map a live analytics WebSocket JSON payload into UI-ready series.
 * Expects `{ type: "update", data: { … } }` from Django, or a day-scoped
 * `{ action: "participation_time"|"participation_rate", … }` reply.
 */
export function mapLiveAnalyticsPayload(raw: unknown): LiveAnalyticsSnapshot {
  const data = extractLiveAnalyticsData(raw);

  const eventId =
    pickId(data.event_id)
    ?? pickString(data.eventId)
    ?? (pickNumber(data.event) != null ? String(pickNumber(data.event)) : undefined);

  const countrywiseRaw = data.countrywise_login;
  const countryRoot = asRecord(countrywiseRaw);
  const countryVirtual = countryRoot
    ? mapDistribution(countryRoot.virtual ?? countryRoot.all ?? countrywiseRaw)
    : mapDistribution(countrywiseRaw);

  return {
    receivedAt: new Date().toISOString(),
    eventId,
    generatedAt: pickString(data.generated_at) ?? undefined,
    statewiseLogin: mapModeSeries(data.statewise_login),
    countrywiseLoginVirtual: countryVirtual,
    daywiseLogin: mapDistribution(data.daywise_login),
    sessionMaxVirtual: mapSessionMaxVirtual(data.session_wise_max_virtual),
    noShow: mapNoShow(data.no_show),
    feedback: mapFeedback(eventId, data),
    participation: mapParticipation(data),
    participationDurationSessions: mapParticipationDurationSessions(data.participation_duration),
    streamingSummary: mapStreamingPartial(data),
    raw,
  };
}

/** Keep existing visuals when a day-scoped participation reply only includes one table. */
export function mergeLiveAnalyticsSnapshot(
  previous: LiveAnalyticsSnapshot | null,
  incoming: LiveAnalyticsSnapshot,
  raw: unknown,
): LiveAnalyticsSnapshot {
  if (!previous) return incoming;
  const data = extractLiveAnalyticsData(raw);
  const hasTime = data.participation_time != null;
  const hasRate = data.participation_rate != null;
  const prevParticipation = previous.participation;
  const nextParticipation = incoming.participation;

  let participation = previous.participation;
  if (hasTime || hasRate) {
    participation = {
      timeRows: hasTime
        ? (nextParticipation?.timeRows ?? [])
        : (prevParticipation?.timeRows ?? []),
      timeBucketLabels: hasTime
        ? (nextParticipation?.timeBucketLabels ?? [])
        : (prevParticipation?.timeBucketLabels ?? []),
      rateRows: hasRate
        ? (nextParticipation?.rateRows ?? [])
        : (prevParticipation?.rateRows ?? []),
      rateSlotLabels: hasRate
        ? (nextParticipation?.rateSlotLabels?.length
          ? nextParticipation.rateSlotLabels
          : ["Max"])
        : (prevParticipation?.rateSlotLabels ?? ["Max"]),
    };
  } else if (nextParticipation) {
    participation = nextParticipation;
  }

  return {
    receivedAt: incoming.receivedAt,
    eventId: incoming.eventId ?? previous.eventId,
    generatedAt: incoming.generatedAt ?? previous.generatedAt,
    statewiseLogin:
      data.statewise_login != null ? incoming.statewiseLogin : previous.statewiseLogin,
    countrywiseLoginVirtual:
      data.countrywise_login != null
        ? incoming.countrywiseLoginVirtual
        : previous.countrywiseLoginVirtual,
    daywiseLogin:
      data.daywise_login != null ? incoming.daywiseLogin : previous.daywiseLogin,
    sessionMaxVirtual:
      data.session_wise_max_virtual != null
        ? incoming.sessionMaxVirtual
        : previous.sessionMaxVirtual,
    noShow: data.no_show != null ? incoming.noShow : previous.noShow,
    feedback:
      data.session_wise_feedback != null
      || data.daywise_feedback != null
      || data.feedback != null
        ? incoming.feedback
        : previous.feedback,
    participation,
    participationDurationSessions:
      data.participation_duration != null
        ? incoming.participationDurationSessions
        : previous.participationDurationSessions,
    streamingSummary: incoming.streamingSummary ?? previous.streamingSummary,
    raw: incoming.raw,
  };
}

export function emptyLiveAnalyticsSnapshot(): LiveAnalyticsSnapshot {
  return {
    receivedAt: new Date().toISOString(),
    statewiseLogin: emptyModeSeries(),
    countrywiseLoginVirtual: [],
    daywiseLogin: [],
    sessionMaxVirtual: [],
    noShow: [],
    feedback: null,
    participation: null,
    participationDurationSessions: [],
    streamingSummary: null,
    raw: null,
  };
}
