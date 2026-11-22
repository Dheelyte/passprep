"use client";

import { useActionState } from "react";
import { saveQuestion } from "@/app/actions/admin";
import { FormError } from "./admin-ui";

type Q = {
  id: string; topicId: string; stem: string; options: string[]; correctIndex: number; explanation: string; difficulty: string; videoUrl: string; videoFree: boolean;
  autoVideo: { id: string | null; title: string | null; channel: string | null; searchedAt: Date | null; blocked: boolean };
};

export function QuestionEditor({ q, topics }: { q: Q; topics: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(saveQuestion, undefined);
  return (
    <form action={action} className="card space-y-3">
      <input type="hidden" name="id" value={q.id} />
      <FormError message={state?.error} />
      {state?.saved ? <p role="status" className="rounded-xl bg-ok-soft px-4 py-2 text-sm font-semibold text-ok-ink">Saved.</p> : null}
      <div>
        <label className="label" htmlFor="topicId">Topic</label>
        <select id="topicId" name="topicId" defaultValue={q.topicId} className="input">
          {topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="stem">Question (Markdown, maths between $…$)</label>
        <textarea id="stem" name="stem" defaultValue={q.stem} className="input min-h-24 py-2 font-mono text-sm" required />
      </div>
      <fieldset className="space-y-2">
        <legend className="label">Options (tick the correct one)</legend>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correctIndex" value={i} defaultChecked={q.correctIndex === i} aria-label={`Option ${"ABCDE"[i]} is correct`} className="size-5 accent-[var(--brand)]" />
            <span className="w-4 font-semibold">{"ABCDE"[i]}</span>
            <input name={`option${i}`} defaultValue={q.options[i] ?? ""} className="input font-mono text-sm" placeholder={i > 1 ? "(optional)" : ""} />
          </div>
        ))}
      </fieldset>
      <div>
        <label className="label" htmlFor="explanation">Step-by-step explanation</label>
        <textarea id="explanation" name="explanation" defaultValue={q.explanation} className="input min-h-48 py-2 font-mono text-sm" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" name="difficulty" defaultValue={q.difficulty} className="input">
            <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="videoUrl">YouTube link</label>
          <input id="videoUrl" name="videoUrl" defaultValue={q.videoUrl} className="input text-sm" placeholder="https://youtu.be/…" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="videoFree" defaultChecked={q.videoFree} className="size-5 accent-[var(--brand)]" />
        Free sample video (free students can watch it)
      </label>
      <fieldset className="space-y-2 rounded border border-rule p-3 text-sm">
        <legend className="px-1 font-semibold">YouTube video found automatically</legend>
        <p className="muted text-xs">Used for Premium students only when the YouTube link above is empty.</p>
        {q.autoVideo.id ? (
          <p>
            <a className="text-info underline" href={`https://www.youtube.com/watch?v=${q.autoVideo.id}`} target="_blank" rel="noopener noreferrer">{q.autoVideo.title ?? q.autoVideo.id}</a>
            {q.autoVideo.channel ? <span className="muted"> · {q.autoVideo.channel}</span> : null}
          </p>
        ) : (
          <p className="muted">{q.autoVideo.searchedAt ? "Searched: nothing suitable found." : "Not searched yet. It searches the first time a Premium student opens the video."}</p>
        )}
        {q.autoVideo.id || q.autoVideo.searchedAt ? (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="autoVideoReset" className="size-5 accent-[var(--brand)]" />
            Search YouTube again (changing the question text does this too)
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          <input type="checkbox" name="autoVideoBlocked" defaultChecked={q.autoVideo.blocked} className="size-5 accent-[var(--brand)]" />
          Don&apos;t use a YouTube video for this question
        </label>
      </fieldset>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
