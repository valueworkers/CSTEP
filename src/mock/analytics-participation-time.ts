import type { ParticipationTimeSession } from "@/types";

/** UI placeholder until `GET /analytics/events/:id/` returns `participation_time[]`. */
export const MOCK_PARTICIPATION_TIME_SESSIONS: ParticipationTimeSession[] = [
  {
    id: "pt-demo-1",
    userName: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    loggedInAt: "2026-08-20T09:05:00+05:30",
    loggedOutAt: "2026-08-20T10:42:00+05:30",
    durationSeconds: 5820,
    isRegistered: true,
  },
  {
    id: "pt-demo-2",
    userName: "Rahul Mehta",
    email: "rahul.mehta@example.com",
    loggedInAt: "2026-08-20T14:18:00+05:30",
    loggedOutAt: "2026-08-20T15:03:00+05:30",
    durationSeconds: 2700,
    isRegistered: false,
  },
];
