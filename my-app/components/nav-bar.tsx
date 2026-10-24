import Link from "next/link";
import { getSessionUser } from "@/lib/auth/guards";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function NavBar() {
  const user = await getSessionUser();

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold">
        Shadow Fight Arena
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/tournaments">Tournaments</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            {(user.role === "TOURNAMENT_ADMIN" || user.role === "SUPER_ADMIN") && (
              <>
                <Link href="/admin">Admin</Link>
                <Link href="/admin/tournaments">Manage Tournaments</Link>
              </>
            )}
            {user.role === "SUPER_ADMIN" && <Link href="/admin/fighters">Fighters</Link>}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
