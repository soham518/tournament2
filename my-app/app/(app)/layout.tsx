import { NavBar } from "@/components/nav-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <NavBar />
      <main className="flex-1 px-6">{children}</main>
    </div>
  );
}
