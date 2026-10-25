import Link from "next/link";
import Image from "next/image";
import { Swords, Trophy, Users, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { computeDisplayStatus } from "@/lib/tournaments/status";
import { formatPaiseAsInr } from "@/lib/money";
import { UswHeader } from "@/components/usw/header";
import { UswBottomNav } from "@/components/usw/bottom-nav";
import { Countdown } from "@/components/usw/countdown";

async function getFeaturedTournament() {
  const candidates = await prisma.tournament.findMany({
    where: { status: "PUBLISHED" },
    include: {
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
      prizeDistributions: { orderBy: { position: "asc" } },
    },
    orderBy: { startAt: "asc" },
  });

  const withStatus = candidates.map((t) => ({
    tournament: t,
    displayStatus: computeDisplayStatus(t, t._count.registrations),
  }));

  return (
    withStatus.find((t) => t.displayStatus === "REGISTRATION_OPEN") ??
    withStatus.find((t) => t.displayStatus === "UPCOMING") ??
    null
  );
}

export default async function Home() {
  const [user, featured] = await Promise.all([getSessionUser(), getFeaturedTournament()]);
  const isLoggedIn = Boolean(user);
  const tournament = featured?.tournament;

  const countdownTarget =
    tournament && featured?.displayStatus === "REGISTRATION_OPEN"
      ? tournament.registrationClosesAt
      : tournament?.startAt;
  const countdownLabel =
    featured?.displayStatus === "REGISTRATION_OPEN" ? "Registration lock in" : "Tournament starts in";

  return (
    <div className="flex min-h-screen flex-col">
      <UswHeader />

      <main className="flex-1 pt-20 pb-24 sm:pb-8">
        {/* Hero */}
        <section className="relative w-full overflow-hidden bg-[var(--usw-surface-container-lowest)]">
          <div className="relative h-[460px] w-full sm:h-[560px]">
            <Image
              src="/images/hero-desktop.png"
              alt="Ultimate Shadow Warrior champions"
              fill
              priority
              sizes="100vw"
              className="hidden object-cover object-top sm:block"
            />
            <Image
              src="/images/hero-mobile.png"
              alt="Ultimate Shadow Warrior champions"
              fill
              priority
              sizes="100vw"
              className="object-cover object-top sm:hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--usw-surface)] via-[var(--usw-surface)]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--usw-surface-container-lowest)]/90 via-transparent to-[var(--usw-surface-container-lowest)]/70" />

            <div className="absolute bottom-6 left-0 right-0 flex flex-col gap-3 px-4 sm:px-8">
              <span className="font-[family-name:var(--font-space-mono)] w-fit bg-[var(--usw-surface-container-lowest)]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)] backdrop-blur-md">
                Shadow Fight Arena Tournaments
              </span>
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold uppercase leading-none tracking-tight text-[var(--usw-on-surface)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-6xl">
                Ultimate Shadow <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--usw-secondary-fixed-dim), var(--usw-primary-fixed-dim), var(--usw-tertiary))",
                  }}
                >
                  Warrior
                </span>
              </h1>
              <p className="font-[family-name:var(--font-space-mono)] max-w-sm text-sm text-[var(--usw-on-surface-variant)] sm:max-w-md sm:text-base">
                Do you have it in you?
              </p>

              <div className="flex items-center gap-3 pt-1 sm:w-fit">
                <Link
                  href={isLoggedIn ? "/tournaments" : "/register"}
                  className="font-[family-name:var(--font-space-grotesk)] flex h-12 flex-1 items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--usw-on-primary-container)] shadow-[0_0_20px_rgba(245,158,11,0.45)] transition-transform active:scale-95 sm:px-8"
                  style={{ backgroundColor: "var(--usw-primary-container)" }}
                >
                  <Swords className="h-[18px] w-[18px]" />
                  Register to Compete
                </Link>
                <Link
                  href="/tournaments"
                  className="font-[family-name:var(--font-space-grotesk)] flex h-12 items-center justify-center gap-2 bg-[var(--usw-surface-container-high)]/90 px-4 text-xs font-bold uppercase tracking-wider text-[var(--usw-secondary-fixed-dim)] shadow-md transition-colors active:bg-[var(--usw-surface-bright)]"
                >
                  <Trophy className="h-[18px] w-[18px] text-[var(--usw-tertiary)]" />
                  Browse
                </Link>
              </div>
            </div>
          </div>
        </section>

        {tournament && (
          <>
            {/* Countdown ribbon */}
            {countdownTarget && (
              <section className="w-full bg-[var(--usw-surface-container-lowest)] px-4 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] sm:px-8">
                <div className="mx-auto flex max-w-5xl flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-space-mono)] text-[11px] uppercase tracking-wider text-[var(--usw-on-surface-variant)]">
                      {countdownLabel}
                    </span>
                    <div className="font-[family-name:var(--font-space-mono)] flex items-center gap-1 text-[11px] text-[var(--usw-secondary-fixed-dim)]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--usw-secondary-fixed-dim)]" />
                      Live
                    </div>
                  </div>
                  <Countdown target={countdownTarget.toISOString()} />
                </div>
              </section>
            )}

            {/* Featured tournament */}
            <section className="w-full px-4 py-6 sm:px-8">
              <div className="mx-auto max-w-5xl">
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="h-[18px] w-[18px] text-[var(--usw-primary)]" />
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold uppercase tracking-wide text-[var(--usw-on-surface)]">
                    Featured tournament
                  </h2>
                </div>

                <div className="relative flex flex-col gap-3 bg-[var(--usw-surface-container-low)] p-4 shadow-lg sm:p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-[family-name:var(--font-space-mono)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--usw-on-primary-container)]"
                      style={{ backgroundColor: "var(--usw-primary-container)" }}
                    >
                      {tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}
                    </span>
                    {featured?.displayStatus === "REGISTRATION_OPEN" && (
                      <span className="font-[family-name:var(--font-space-mono)] flex items-center gap-1 text-[11px] font-bold uppercase text-[var(--usw-secondary-fixed-dim)]">
                        <span className="h-1.5 w-1.5 bg-[var(--usw-secondary-fixed-dim)]" /> Open registration
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold uppercase leading-tight text-[var(--usw-on-surface)] sm:text-2xl">
                        {tournament.name}
                      </h3>
                      <span className="font-[family-name:var(--font-space-mono)] text-xs uppercase text-[var(--usw-on-surface-variant)]">
                        {tournament.structureType.replace(/_/g, " ")}
                      </span>
                    </div>
                    {tournament.prizePoolEnabled && (
                      <div className="shrink-0 text-right">
                        <span className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold leading-none text-[var(--usw-primary)] sm:text-2xl">
                          {formatPaiseAsInr(tournament.prizePoolAmountPaise)}
                        </span>
                        <span className="font-[family-name:var(--font-space-mono)] block text-[10px] uppercase text-[var(--usw-on-surface-variant)]">
                          Prize pool
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[var(--usw-surface-container-lowest)] p-3">
                    <div className="flex flex-col">
                      <span className="font-[family-name:var(--font-space-mono)] text-[10px] text-[var(--usw-outline)]">
                        Starts
                      </span>
                      <span className="font-[family-name:var(--font-space-mono)] text-sm font-bold text-[var(--usw-on-surface)]">
                        {tournament.startAt.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-[family-name:var(--font-space-mono)] flex items-center justify-end gap-1 text-[10px] text-[var(--usw-outline)]">
                        <Users className="h-3 w-3" /> Capacity
                      </span>
                      <span className="font-[family-name:var(--font-space-mono)] text-sm font-bold text-[var(--usw-secondary-fixed-dim)]">
                        {tournament._count.registrations} / {tournament.maxParticipants} registered ·{" "}
                        {Math.max(tournament.maxParticipants - tournament._count.registrations, 0)} slots left
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      href={`/tournaments/${tournament.slug}`}
                      className="font-[family-name:var(--font-space-grotesk)] flex h-11 flex-1 items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--usw-on-primary)] shadow-[0_0_14px_rgba(255,193,116,0.3)] transition-colors active:bg-[var(--usw-primary-fixed-dim)]"
                      style={{ backgroundColor: "var(--usw-primary)" }}
                    >
                      Enter now
                    </Link>
                    <Link
                      href={`/tournaments/${tournament.slug}`}
                      className="font-[family-name:var(--font-space-mono)] flex h-11 items-center justify-center bg-[var(--usw-surface-container-high)] px-4 text-xs uppercase tracking-wider text-[var(--usw-on-surface)] transition-colors hover:text-[var(--usw-secondary-fixed-dim)]"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Prize breakdown, only if the organizer configured one */}
            {tournament.prizePoolEnabled && tournament.prizeDistributions.length > 0 && (
              <section className="w-full px-4 py-2 sm:px-8">
                <div className="mx-auto max-w-5xl bg-[var(--usw-surface-container-low)] p-4 shadow-md sm:p-6">
                  <span className="font-[family-name:var(--font-space-mono)] text-[11px] uppercase tracking-wider text-[var(--usw-primary)]">
                    Prize distribution
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {tournament.prizeDistributions.map((d) => (
                      <div key={d.position} className="flex flex-col bg-[var(--usw-surface-container-lowest)] p-3">
                        <span className="font-[family-name:var(--font-space-mono)] text-[10px] uppercase text-[var(--usw-on-surface-variant)]">
                          {d.label}
                        </span>
                        <span className="font-[family-name:var(--font-space-grotesk)] mt-0.5 font-bold text-[var(--usw-on-surface)]">
                          {d.valueType === "PERCENTAGE" ? `${d.value / 100}%` : formatPaiseAsInr(d.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {!tournament && (
          <section className="w-full px-4 py-10 text-center sm:px-8">
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              No tournaments are open for registration right now.
            </p>
            <Link
              href="/tournaments"
              className="font-[family-name:var(--font-space-mono)] mt-3 inline-flex items-center gap-1 text-sm text-[var(--usw-secondary-fixed-dim)]"
            >
              View all tournaments <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </main>

      {/* Sticky mobile CTA */}
      {tournament && (
        <aside className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-between gap-3 bg-[var(--usw-surface-container-lowest)]/95 px-4 py-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.7)] backdrop-blur-md sm:hidden">
          <div className="flex min-w-0 flex-col">
            <span className="font-[family-name:var(--font-space-mono)] truncate text-[10px] uppercase tracking-wider text-[var(--usw-secondary-fixed-dim)]">
              {featured?.displayStatus === "REGISTRATION_OPEN" ? "Registration open" : "Starting soon"}
            </span>
            <span className="font-[family-name:var(--font-space-grotesk)] truncate text-base uppercase leading-none text-[var(--usw-on-surface)]">
              {tournament.name}
            </span>
          </div>
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="font-[family-name:var(--font-space-grotesk)] flex h-11 shrink-0 items-center gap-1 px-4 text-xs font-bold uppercase tracking-wider text-[var(--usw-on-primary-container)] shadow-[0_0_16px_rgba(245,158,11,0.5)] transition-transform active:scale-95"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--usw-primary-container), var(--usw-primary))",
            }}
          >
            Join now
          </Link>
        </aside>
      )}

      <UswBottomNav isLoggedIn={isLoggedIn} />
    </div>
  );
}
