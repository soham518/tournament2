// Derives the user-facing tournament status from persisted fields + the
// current time + capacity — never from client input. DRAFT and CANCELLED
// are the only statuses an admin sets directly; everything else here is
// computed so an admin editing a description can't accidentally reopen
// registration, and so the browser can never forge a status.
export type DisplayStatus =
  | "DRAFT"
  | "UPCOMING"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_FULL"
  | "REGISTRATION_CLOSED"
  | "CHECK_IN_OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const DISPLAY_STATUS_LABEL: Record<DisplayStatus, string> = {
  DRAFT: "Draft",
  UPCOMING: "Upcoming",
  REGISTRATION_OPEN: "Registration Open",
  REGISTRATION_FULL: "Registration Full",
  REGISTRATION_CLOSED: "Registration Closed",
  CHECK_IN_OPEN: "Check-in Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type StatusInput = {
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  startAt: Date;
  endAt: Date | null;
  maxParticipants: number;
  waitlistEnabled: boolean;
  checkInEnabled: boolean;
  checkInOpensBeforeMinutes: number | null;
};

export function computeDisplayStatus(
  tournament: StatusInput,
  confirmedRegistrationCount: number,
  now: Date = new Date()
): DisplayStatus {
  if (tournament.status === "DRAFT") return "DRAFT";
  if (tournament.status === "CANCELLED") return "CANCELLED";

  if (now < tournament.registrationOpensAt) return "UPCOMING";

  if (now < tournament.registrationClosesAt) {
    const isFull = confirmedRegistrationCount >= tournament.maxParticipants;
    if (isFull && !tournament.waitlistEnabled) return "REGISTRATION_FULL";
    return "REGISTRATION_OPEN";
  }

  if (now < tournament.startAt) {
    if (tournament.checkInEnabled && tournament.checkInOpensBeforeMinutes) {
      const checkInOpensAt = new Date(
        tournament.startAt.getTime() - tournament.checkInOpensBeforeMinutes * 60_000
      );
      if (now >= checkInOpensAt) return "CHECK_IN_OPEN";
    }
    return "REGISTRATION_CLOSED";
  }

  // COMPLETED currently derives from endAt only, since the match engine
  // (section 16) isn't wired up yet. Once matches exist, a tournament
  // should also be considered COMPLETED once its final match is official.
  if (tournament.endAt && now >= tournament.endAt) return "COMPLETED";

  return "IN_PROGRESS";
}

export function canAcceptRegistrations(
  tournament: StatusInput,
  confirmedRegistrationCount: number,
  now: Date = new Date()
): boolean {
  const status = computeDisplayStatus(tournament, confirmedRegistrationCount, now);
  return status === "REGISTRATION_OPEN" || (status === "REGISTRATION_FULL" && tournament.waitlistEnabled);
}
