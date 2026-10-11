import Link from "next/link";
import { ArrowUpRight, Activity, CalendarDays, GitCompareArrows, Trophy } from "lucide-react";

const routes = [
  { href: "/drivers", icon: Trophy, title: "Follow the championship", detail: "Driver standings & team battles", code: "01" },
  { href: "/compare", icon: GitCompareArrows, title: "Compare two careers", detail: "Wins, race pace & season history", code: "02" },
  { href: "/calendar", icon: CalendarDays, title: "Explore race weekends", detail: "The calendar, circuits & results", code: "03" },
  { href: "/live", icon: Activity, title: "Go inside a session", detail: "Lap times, sectors & tyre strategy", code: "04" },
];

export default function ExploreRoutes() {
  return (
    <section className="container-page py-8 sm:py-12" aria-labelledby="explore-heading">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="explore-heading" className="text-title-3 text-paper">Find your racing line</h2>
        <p className="text-subhead text-label-3">From the championship to a single lap.</p>
      </div>
      <ul className="explore-routes">
        {routes.map(({ href, icon: Icon, title, detail, code }) => (
          <li key={href}><Link href={href} className="group block h-full p-5 sm:p-6">
            <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-tint" aria-hidden /><span className="font-mono text-caption text-label-3">{code}</span></div>
            <h3 className="mt-6 text-headline text-paper">{title}</h3>
            <p className="mt-1 text-footnote text-label-3">{detail}</p>
            <ArrowUpRight className="mt-4 h-4 w-4 text-label-3 transition-colors group-hover:text-tint" aria-hidden />
          </Link></li>
        ))}
      </ul>
    </section>
  );
}
