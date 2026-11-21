import { Atom, BookOpen, Calculator, FlaskConical, Languages, Leaf } from "lucide-react";

export function SubjectIcon({ slug, className = "size-5" }: { slug: string; className?: string }) {
  const Icon = { mathematics: Calculator, physics: Atom, chemistry: FlaskConical, biology: Leaf, english: Languages }[slug] ?? BookOpen;
  return <Icon aria-hidden className={className} strokeWidth={2.25} />;
}
