// Finds a YouTube solution video for a question (YouTube Data API v3).
// Pure helpers (query building, ranking) are exported for tests; network calls live in searchSolutionVideo.

const API = () => process.env.YOUTUBE_API_BASE ?? "https://www.googleapis.com/youtube/v3";

export const youtubeSearchEnabled = () => Boolean(process.env.YOUTUBE_API_KEY);

const STOP = new Set(
  ("a an the of to in on at for and or is are was were be been by with from as that this these those it its which what " +
    "who whom how find calculate evaluate determine given if then than into each per using use value values following " +
    "correct answer simplify express show solve write state choose option options below above").split(" "),
);

const LATEX_WORDS: Record<string, string> = {
  frac: " over ", dfrac: " over ", tfrac: " over ", sqrt: " square root ", times: " times ", div: " divided by ",
  cap: " intersection ", cup: " union ", log: " log ", sin: " sin ", cos: " cos ", tan: " tan ", pi: " pi ",
  theta: " theta ", alpha: " alpha ", beta: " beta ", leq: " ", geq: " ", le: " ", ge: " ", neq: " ", cdot: " times ",
};

/** Plain words from a markdown + LaTeX question stem. */
export function plainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/\\([a-zA-Z]+)/g, (_, cmd: string) => LATEX_WORDS[cmd] ?? " ")
    .replace(/_\{?(\w+)\}?/g, " base $1 ") // 345_4 → "345 base 4"
    .replace(/[{}$*_`#>|~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The distinctive words of a stem, in order, without duplicates or filler. */
export function keywords(stem: string, max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of plainText(stem).toLowerCase().split(/[^a-z0-9^/.-]+/)) {
    const w = raw.replace(/^[.^/-]+|[.^/-]+$/g, "");
    if (!w || STOP.has(w) || (w.length < 3 && !/\d/.test(w)) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

export function buildQuery(q: { stem: string; topic: string; parentTopic?: string | null; subject: string; exams?: string[] }) {
  const words = keywords(q.stem);
  const exam = q.exams?.includes("WAEC") || !q.exams?.length ? "WAEC" : q.exams[0];
  const topic = q.parentTopic && q.parentTopic !== q.topic ? `${q.parentTopic} ${q.topic}` : q.topic;
  return { query: [topic, q.subject, ...words, exam].join(" ").replace(/\s+/g, " ").trim().slice(0, 200), words: [...words, ...topic.toLowerCase().split(/\s+/)] };
}

/** ISO-8601 duration ("PT4M13S") → seconds. */
export function durationSeconds(iso: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

export type Candidate = { id: string; title: string; channel: string; description: string; seconds: number; embeddable: boolean; rank: number };
export type FoundVideo = { id: string; title: string; channel: string };

const MIN_S = 60; // skip Shorts and teasers
const MAX_S = 25 * 60; // skip full-length lessons and livestreams

/** Best candidate: embeddable, 1–25 min, most keyword overlap; YouTube's own order breaks ties. */
export function pickBest(cands: Candidate[], words: string[]): FoundVideo | null {
  const terms = [...new Set(words.map((w) => w.toLowerCase()).filter((w) => w.length > 2))];
  const scored = cands
    .filter((c) => c.embeddable && c.seconds >= MIN_S && c.seconds <= MAX_S)
    .map((c) => {
      const hay = `${c.title} ${c.description}`.toLowerCase();
      const title = c.title.toLowerCase();
      const score = terms.reduce((n, t) => n + (title.includes(t) ? 2 : hay.includes(t) ? 1 : 0), 0) - c.rank * 0.5;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0]?.c;
  return best ? { id: best.id, title: best.title, channel: best.channel } : null;
}

export class YoutubeQuotaError extends Error {}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** One search (100 quota units) + one details lookup (1 unit). Returns null when nothing suitable exists. */
export async function searchSolutionVideo(query: string, words: string[]): Promise<FoundVideo | null> {
  const key = process.env.YOUTUBE_API_KEY!;
  const search = new URL(`${API()}/search`);
  search.search = new URLSearchParams({
    part: "snippet", type: "video", maxResults: "8", q: query, key,
    safeSearch: "strict", videoEmbeddable: "true", videoSyndicated: "true", relevanceLanguage: "en", regionCode: "NG",
  }).toString();
  const res = await fetch(search, { signal: AbortSignal.timeout(8000) });
  if (res.status === 403 || res.status === 429) throw new YoutubeQuotaError(`youtube search refused: ${res.status}`);
  if (!res.ok) throw new Error(`youtube search failed: ${res.status}`);
  const items = ((await res.json()).items ?? []) as { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; description?: string } }[];
  const ids = items.map((i) => i.id?.videoId).filter((v): v is string => !!v && /^[\w-]{11}$/.test(v));
  if (ids.length === 0) return null;

  const details = new URL(`${API()}/videos`);
  details.search = new URLSearchParams({ part: "contentDetails,status", id: ids.join(","), key }).toString();
  const dres = await fetch(details, { signal: AbortSignal.timeout(8000) });
  if (!dres.ok) throw new Error(`youtube videos failed: ${dres.status}`);
  const info = new Map(
    (((await dres.json()).items ?? []) as { id: string; contentDetails?: { duration?: string }; status?: { embeddable?: boolean; privacyStatus?: string } }[]).map((v) => [v.id, v]),
  );

  const cands: Candidate[] = items.flatMap((it, rank) => {
    const id = it.id?.videoId;
    const v = id ? info.get(id) : undefined;
    if (!id || !v) return [];
    return [{
      id,
      title: decode(it.snippet?.title ?? ""),
      channel: decode(it.snippet?.channelTitle ?? ""),
      description: decode(it.snippet?.description ?? ""),
      seconds: durationSeconds(v.contentDetails?.duration ?? ""),
      embeddable: v.status?.embeddable !== false && v.status?.privacyStatus === "public",
      rank,
    }];
  });
  return pickBest(cands, words);
}
