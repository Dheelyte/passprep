"use client";

import { startTransition, useActionState, useState } from "react";
import { runImport } from "@/app/actions/admin";
import { FormError } from "./ui";

export function ImportForm({ canEditSyllabus }: { canEditSyllabus: boolean }) {
  const [state, action, pending] = useActionState(runImport, undefined);
  const [kind, setKind] = useState<"questions" | "syllabus">("questions");
  const report = state?.report;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          // Submit manually: React resets forms after an action, which would clear the chosen file
          // between "Check file" and "Import".
          e.preventDefault();
          const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => action(fd));
        }}
      >
        <fieldset>
          <legend className="label">What are you importing?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["questions", "syllabus"] as const).map((k) => (
              <label key={k} className={`btn-secondary cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-soft ${k === "syllabus" && !canEditSyllabus ? "opacity-50" : ""}`}>
                <input type="radio" name="kind" value={k} className="sr-only" checked={kind === k} disabled={k === "syllabus" && !canEditSyllabus} onChange={() => setKind(k)} />
                {k === "questions" ? "Questions" : "Syllabus (topics)"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="file">Spreadsheet (.csv or .xlsx)</label>
          <input id="file" name="file" type="file" accept=".csv,.xlsx" required className="input py-2.5" />
          <p className="muted mt-1 text-xs">
            Templates:{" "}
            {kind === "questions" ? (
              <>
                <a className="font-semibold text-brand" href="/templates/questions-template.csv" download>questions.csv</a> ·{" "}
                <a className="font-semibold text-brand" href="/templates/questions-template.xlsx" download>questions.xlsx</a>
              </>
            ) : (
              <a className="font-semibold text-brand" href="/templates/syllabus-template.csv" download>syllabus.csv</a>
            )}
          </p>
        </div>
        <FormError message={state?.error} />
        <div className="grid grid-cols-2 gap-2">
          <button name="intent" value="preview" className="btn-secondary" disabled={pending}>{pending ? "Checking…" : "1. Check file"}</button>
          <button
            name="intent"
            value="commit"
            className="btn-primary"
            disabled={pending || !report || report.valid === 0 || state?.committed}
            title={!report ? "Check the file first" : undefined}
          >
            2. Import {report && !state?.committed ? report.valid : ""}
          </button>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">How to fill the template</summary>
          {kind === "questions" ? (
            <ul className="muted mt-2 list-disc space-y-1 pl-5">
              <li><b>subject, topic, subtopic</b> must match the syllabus (subtopic can be blank).</li>
              <li><b>difficulty</b>: easy, medium or hard.</li>
              <li><b>option_a … option_e</b>: fill from A with no gaps; 2 to 5 options.</li>
              <li><b>correct</b>: the letter of the right option (A–E).</li>
              <li><b>explanation</b> is required: full step-by-step working in simple English.</li>
              <li>Maths: write formulas between dollar signs, e.g. <code>$x^2 + 3x = 0$</code> or <code>$\frac{'{1}{2}'}$</code>.</li>
              <li><b>video_url</b>: a YouTube link (optional). <b>video_free</b>: yes to let free students watch it as a sample.</li>
            </ul>
          ) : (
            <ul className="muted mt-2 list-disc space-y-1 pl-5">
              <li>One row per topic, plus one row per subtopic (repeat the topic name).</li>
              <li><b>order</b>: position within its subject/topic. <b>class_levels</b>: e.g. <code>SS1, SS2</code>. <b>exams</b>: e.g. <code>WAEC, NECO, JAMB</code>.</li>
              <li>Re-importing updates names, order and tags — it never deletes topics.</li>
            </ul>
          )}
        </details>
      </form>

      <section className="card" aria-live="polite">
        <h2 className="mb-2 font-semibold">Preview</h2>
        {!report ? (
          <p className="muted text-sm">Upload a file and press “Check file” to see what will be imported.</p>
        ) : (
          <div className="space-y-4 text-sm">
            {state?.committed ? (
              <p className="rounded-xl bg-ok-soft px-4 py-3 font-semibold text-ok">
                Imported {report.created} {state.kind === "syllabus" ? "rows" : "questions (now waiting for review)"}.
              </p>
            ) : null}
            <p>
              <strong>{report.total}</strong> rows · <strong className="text-ok">{report.valid} ready</strong> ·{" "}
              <strong className={report.invalid.length ? "text-bad" : ""}>{report.invalid.length} with problems</strong>
            </p>
            {report.invalid.length ? (
              <div>
                <h3 className="mb-1 font-semibold">Fix these rows (they will be skipped):</h3>
                <ul className="max-h-72 space-y-1 overflow-auto rounded-xl bg-bad-soft p-3">
                  {report.invalid.map((r) => (
                    <li key={r.line}><strong>Row {r.line}:</strong> {r.errors.join("; ")}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {report.sample.length ? (
              <div>
                <h3 className="mb-1 font-semibold">First rows that will be imported:</h3>
                <ul className="space-y-1">
                  {report.sample.map((r) => (
                    <li key={r.line} className="truncate"><span className="muted">Row {r.line}:</span> {r.summary}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
