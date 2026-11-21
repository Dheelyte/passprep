import { renderInline, renderMarkdown } from "@/lib/markdown";

const LETTERS = ["A", "B", "C", "D", "E"];

/** Server-rendered preview exactly as students will see it. */
export function QuestionPreview({ q }: { q: { stem: string; options: string[]; correctIndex: number; explanation: string; videoUrl: string | null } }) {
  return (
    <div className="space-y-3">
      <div className="prose-q" dangerouslySetInnerHTML={{ __html: renderMarkdown(q.stem) }} />
      <ol className="space-y-1">
        {q.options.map((o, i) => (
          <li key={i} className={`flex gap-2 rounded-lg px-3 py-2 ${i === q.correctIndex ? "bg-ok-soft font-semibold" : "bg-paper-2"}`}>
            <span>{LETTERS[i]}.</span>
            <span className="prose-q" dangerouslySetInnerHTML={{ __html: renderInline(o) }} />
            {i === q.correctIndex ? <span className="ml-auto text-ok-ink">✓ correct</span> : null}
          </li>
        ))}
      </ol>
      <div className="rounded-xl border border-rule p-3">
        <p className="muted mb-1 text-xs font-bold uppercase">Explanation</p>
        <div className="prose-q text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(q.explanation) }} />
      </div>
      {q.videoUrl ? <p className="text-sm">🎬 <a className="text-info underline" href={q.videoUrl} target="_blank" rel="noopener noreferrer">{q.videoUrl}</a></p> : null}
    </div>
  );
}
