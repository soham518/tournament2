import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 py-32 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Shadow Fight Arena Tournaments</h1>
      <p className="max-w-lg text-lg text-muted-foreground">
        Find and register for competitive Shadow Fight Arena tournaments — 1v1 or 3v3, free or
        paid entry, knockout or group stage.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/tournaments">Browse tournaments</Link>} />
        <Button variant="outline" render={<Link href="/register">Create an account</Link>} />
      </div>
    </div>
  );
}
