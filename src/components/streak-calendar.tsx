import { addDays } from "@/lib/time";
import { cn } from "./ds/cn";

/** 5-week grid (Mon–Sun) of practised days. Practised days show a filled square + tick for non-colour cue. */
export function StreakCalendar({ from, today, active }: { from: Date; today: Date; active: Map<string, number> }) {
  // align start to Monday
  const dow = (from.getUTCDay() + 6) % 7;
  const start = addDays(from, -dow);
  const days: Date[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) days.push(d);
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-ink-2" aria-hidden>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Days you practised in the last five weeks">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const n = active.get(key) ?? 0;
          const isToday = d.getTime() === today.getTime();
          const label = `${d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}: ${n ? `${n} answered` : "no practice"}`;
          return (
            <li
              key={key}
              title={label}
              aria-label={label}
              className={cn(
                "grid aspect-square place-items-center rounded-[6px] border-2 text-[10px] font-extrabold",
                n ? "border-line bg-sun text-on-fill" : "border-rule bg-card text-ink-2",
                isToday && "outline-2 outline-offset-1 outline-[var(--focus)]",
              )}
            >
              {n ? "✓" : d.getUTCDate()}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
