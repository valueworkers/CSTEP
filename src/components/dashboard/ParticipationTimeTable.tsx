"use client";

import { useMemo } from "react";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatParticipationDateTime,
  formatWatchDuration,
} from "@/lib/analytics-mappers";
import { slugifyFilename } from "@/lib/export-utils";
import {
  PARTICIPATION_TIME_EXPORT_COLUMNS,
  type ParticipationTimeExportRow,
} from "@/lib/event-analytics-export";
import type { ParticipationTimeSession } from "@/types";

interface ParticipationTimeTableProps {
  sessions: ParticipationTimeSession[];
  exportSlug: string;
}

function formatRegisteredLabel(isRegistered: boolean | undefined): string {
  if (isRegistered == null) return "—";
  return isRegistered ? "Yes" : "No";
}

export function ParticipationTimeTable({
  sessions,
  exportSlug,
}: ParticipationTimeTableProps) {
  const exportRows: ParticipationTimeExportRow[] = useMemo(
    () =>
      sessions.map((session) => ({
        userName: session.userName,
        email: session.email ?? "",
        loggedIn: formatParticipationDateTime(session.loggedInAt),
        loggedOut: session.loggedOutAt
          ? formatParticipationDateTime(session.loggedOutAt)
          : "Watching",
        duration: formatWatchDuration(session.durationSeconds),
        isRegistered: formatRegisteredLabel(session.isRegistered),
      })),
    [sessions],
  );

  const exportFilename = slugifyFilename(exportSlug);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 px-4 py-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">Participation Log</CardTitle>
          <CardDescription>
            Viewer name, email, join/leave times, watch duration, and registration status.
          </CardDescription>
        </div>
        <ExportMenu
          filename={exportFilename}
          title="Participation duration"
          columns={PARTICIPATION_TIME_EXPORT_COLUMNS}
          data={exportRows}
          disabled={exportRows.length === 0}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="rounded-md border max-h-[calc(2.5rem*11)] overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Joined at</TableHead>
                <TableHead>Left at</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                    No participation duration data yet.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id} className="h-10">
                    <TableCell className="font-medium whitespace-nowrap">
                      {session.userName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.email?.trim() || "—"}
                    </TableCell>
                    <TableCell>
                      {session.isRegistered == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge variant={session.isRegistered ? "success" : "secondary"}>
                          {session.isRegistered ? "Yes" : "No"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatParticipationDateTime(session.loggedInAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {session.loggedOutAt
                        ? formatParticipationDateTime(session.loggedOutAt)
                        : (
                          <span className="text-emerald-600 dark:text-emerald-400">Watching</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatWatchDuration(session.durationSeconds)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
