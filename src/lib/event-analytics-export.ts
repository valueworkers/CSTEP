import type { ExportColumn } from "@/lib/export-utils";
import {
  sumParticipationTimeTotals,
  type SessionParticipationRateRow,
  type SessionParticipationTimeRow,
} from "@/lib/participation-session-analytics";

export interface AnalyticsDistributionRow {
  category: string;
  count: number;
  sharePercent: number;
}

export interface AnalyticsMetricRow {
  metric: string;
  value: string | number;
}

export const ANALYTICS_DISTRIBUTION_EXPORT_COLUMNS: ExportColumn<AnalyticsDistributionRow>[] = [
  { header: "Category", value: (row) => row.category },
  { header: "Count", value: (row) => row.count },
  { header: "Share (%)", value: (row) => row.sharePercent },
];

export const ANALYTICS_METRIC_EXPORT_COLUMNS: ExportColumn<AnalyticsMetricRow>[] = [
  { header: "Metric", value: (row) => row.metric },
  { header: "Value", value: (row) => row.value },
];

export interface AttendanceDayModeRow {
  date: string;
  physical: number;
  virtual: number;
  total: number;
}

export const ATTENDANCE_DAY_MODE_EXPORT_COLUMNS: ExportColumn<AttendanceDayModeRow>[] = [
  { header: "Date", value: (row) => row.date },
  { header: "Physical", value: (row) => row.physical },
  { header: "Virtual", value: (row) => row.virtual },
  { header: "Total", value: (row) => row.total },
];

export interface ParticipationTimeExportRow {
  userName: string;
  email: string;
  loggedIn: string;
  loggedOut: string;
  duration: string;
  isRegistered: string;
}

export const PARTICIPATION_TIME_EXPORT_COLUMNS: ExportColumn<ParticipationTimeExportRow>[] = [
  { header: "Name", value: (row) => row.userName },
  { header: "Email", value: (row) => row.email },
  { header: "Registered", value: (row) => row.isRegistered },
  { header: "Joined at", value: (row) => row.loggedIn },
  { header: "Left at", value: (row) => row.loggedOut },
  { header: "Duration", value: (row) => row.duration },
];

export interface SessionParticipationTableExportRow {
  sessionName: string;
  sessionDurationMinutes: number;
  uniqueParticipants?: string;
  values: Record<string, string>;
}

function formatParticipationCount(value: number | undefined): string {
  if (value == null || value === 0) return "—";
  return String(value);
}

function formatRateSlotHeader(label: string): string {
  if (label === "Max") return "Max";
  const iso = label.match(/T(\d{2}):(\d{2})/);
  if (iso) {
    const hour = Number(iso[1]);
    const minute = iso[2];
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
  }
  return label;
}

export function getParticipationTimeTableExportColumns(
  bucketLabels: readonly string[],
): ExportColumn<SessionParticipationTableExportRow>[] {
  return [
    { header: "Session", value: (row) => row.sessionName },
    { header: "Duration (min)", value: (row) => row.sessionDurationMinutes },
    { header: "Unique", value: (row) => row.uniqueParticipants ?? "" },
    ...bucketLabels.map((label) => ({
      header: `${label} min`,
      value: (row: SessionParticipationTableExportRow) => row.values[label] ?? "",
    })),
  ];
}

export function buildParticipationTimeTableExportRows(
  rows: SessionParticipationTimeRow[],
  bucketLabels: readonly string[],
): SessionParticipationTableExportRow[] {
  const mapped = rows.map((row) => ({
    sessionName: row.sessionName,
    sessionDurationMinutes: row.sessionDurationMinutes,
    uniqueParticipants: formatParticipationCount(row.uniqueParticipants),
    values: Object.fromEntries(
      bucketLabels.map((label) => [
        label,
        label in row.buckets ? formatParticipationCount(row.buckets[label]) : "",
      ]),
    ),
  }));
  if (mapped.length === 0) return mapped;

  const totals = sumParticipationTimeTotals(rows, bucketLabels);
  mapped.push({
    sessionName: "Total",
    sessionDurationMinutes: totals.sessionDurationMinutes,
    uniqueParticipants: formatParticipationCount(totals.uniqueParticipants),
    values: Object.fromEntries(
      bucketLabels.map((label) => [
        label,
        formatParticipationCount(totals.buckets[label]),
      ]),
    ),
  });
  return mapped;
}

export function getParticipationRateTableExportColumns(
  slotLabels: readonly string[],
): ExportColumn<SessionParticipationTableExportRow>[] {
  return [
    { header: "Session", value: (row) => row.sessionName },
    { header: "Duration (min)", value: (row) => row.sessionDurationMinutes },
    ...slotLabels.map((label) => ({
      header: formatRateSlotHeader(label),
      value: (row: SessionParticipationTableExportRow) => row.values[label] ?? "",
    })),
  ];
}

export function buildParticipationRateTableExportRows(
  rows: SessionParticipationRateRow[],
  slotLabels: readonly string[],
): SessionParticipationTableExportRow[] {
  return rows.map((row) => ({
    sessionName: row.sessionName,
    sessionDurationMinutes: row.sessionDurationMinutes,
    values: Object.fromEntries(
      slotLabels.map((label) => [label, formatParticipationCount(row.slots[label])]),
    ),
  }));
}
