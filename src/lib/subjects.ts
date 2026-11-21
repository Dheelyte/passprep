/** Known subject slugs get their own colour scope via [data-subject]; others fall back to neutral. */
export const SUBJECT_SLUGS = ["mathematics", "physics", "chemistry", "biology", "english"] as const;
export const subjectScope = (slug: string) => ((SUBJECT_SLUGS as readonly string[]).includes(slug) ? slug : "general");
export const CLASS_LABEL: Record<string, string> = { JSS3: "JSS 3", SS1: "SS 1", SS2: "SS 2", SS3: "SS 3" };
