import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "cn";

export type Partner = {
  name: string;
  role: "Sponsor" | "Organizer";
  youtubeUrl: string;
  imageSrc: string;
};

export const PARTNERS: Partner[] = [
  {
    name: "ItsHassan",
    role: "Sponsor",
    youtubeUrl: "https://youtube.com/@itshassn?si=1_-ZQeZji1s6mlIm",
    imageSrc: "/partners/itshassan.webp",
  },
  {
    name: "IGKING GAMING",
    role: "Organizer",
    youtubeUrl: "https://www.youtube.com/@IGKING_GAMING",
    imageSrc: "/partners/igking-gaming.webp",
  },
  {
    name: "Dixon99 Gaming",
    role: "Organizer",
    youtubeUrl: "https://www.youtube.com/@dixon99-p8u",
    imageSrc: "/partners/dixon99-gaming.webp",
  },
];

export function PartnerGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:gap-4", className)}>
      {PARTNERS.map((partner) => (
        <a
          key={partner.name}
          href={partner.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col items-center gap-2 bg-[var(--usw-surface-container-low)] p-3 text-center shadow-md transition-colors hover:ring-1 hover:ring-[var(--usw-secondary-fixed-dim)] sm:p-4"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--usw-outline-variant)] sm:h-20 sm:w-20">
            <Image src={partner.imageSrc} alt={partner.name} fill sizes="80px" className="object-cover" />
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] line-clamp-2 text-xs font-bold uppercase leading-tight text-[var(--usw-on-surface)] group-hover:text-[var(--usw-secondary-fixed-dim)] sm:text-sm">
            {partner.name}
          </span>
          <span className="font-[family-name:var(--font-space-mono)] text-[9px] uppercase tracking-wider text-[var(--usw-on-surface-variant)] sm:text-[10px]">
            {partner.role}
          </span>
          <span className="font-[family-name:var(--font-space-mono)] flex items-center gap-1 text-[9px] uppercase text-[var(--usw-secondary-fixed-dim)] sm:text-[10px]">
            <Play className="h-3 w-3" fill="currentColor" />
            YouTube
          </span>
        </a>
      ))}
    </div>
  );
}
