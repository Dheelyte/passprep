import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { renderInline, renderMarkdown } from "@/lib/markdown";
import { studentToday } from "@/lib/student";
import { isPremium, canWatchVideo } from "@/lib/entitlements";
import { youtubeId } from "@/lib/youtube";
import { PracticeRunner, type RunnerQuestion } from "@/components/practice-runner";
import { SkeletonList } from "@/components/ui";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage({ params }: PageProps<"/practice/[id]">) {
  return (
    <Suspense fallback={<SkeletonList rows={5} />}>
      <Practice params={params} />
    </Suspense>
  );
}

async function Practice({ params }: { params: PageProps<"/practice/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser();
  const session = await db.practiceSession.findUnique({
    where: { id },
    include: { topic: { include: { subject: true, parent: true } }, attempts: true },
  });
  if (!session || session.userId !== user.id) notFound();

  const questions = await db.question.findMany({ where: { id: { in: session.questionIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const attempts = new Map(session.attempts.map((a) => [a.questionId, a]));
  const premium = isPremium(user.subscription);
  const day = await studentToday(user);

  const items: RunnerQuestion[] = session.questionIds
    .map((qid) => byId.get(qid))
    .filter((q) => !!q)
    .map((q) => {
      const a = attempts.get(q.id);
      const vid = q.videoUrl ? youtubeId(q.videoUrl) : null;
      return {
        id: q.id,
        difficulty: q.difficulty,
        stemHtml: renderMarkdown(q.stem),
        optionsHtml: q.options.map((o) => renderInline(o)),
        hasVideo: !!vid,
        // Only reveal answers for questions already answered in this set.
        answered: a
          ? {
              selectedIndex: a.selectedIndex,
              isCorrect: a.isCorrect,
              correctIndex: q.correctIndex,
              explanationHtml: renderMarkdown(q.explanation),
              pointsAwarded: a.pointsAwarded,
              video: !vid
                ? { kind: "none" as const }
                : canWatchVideo({ premium, videoFree: q.videoFree })
                  ? { kind: "open" as const, youtubeId: vid }
                  : { kind: "locked" as const },
            }
          : null,
      };
    });

  const topicTitle = session.topic.parent ? `${session.topic.parent.name} › ${session.topic.name}` : session.topic.name;

  return (
    <PracticeRunner
      sessionId={session.id}
      topicId={session.topicId}
      subjectSlug={session.topic.subject.slug}
      title={topicTitle}
      subject={session.topic.subject.name}
      questions={items}
      initialStreak={day.streak}
      remaining={day.remaining}
    />
  );
}
