/**
 * Client-only presentation hints for chat rows. Does not change API or persistence.
 * Workflow lines can be emitted later with [Sistem] / [İş akışı] prefixes or known Turkish phrases.
 */

export type ChatThreadPresentation =
  | { mode: "bubble" }
  | { mode: "system-error" }
  | { mode: "workflow-event"; tone: "positive" | "warning" | "neutral" };

type ChatMessageLike = {
  body: string;
  kind: "TEXT" | "MEDIA";
  media: unknown | null;
};

export const WORKFLOW_TAG_PREFIX = /^\[(Sistem|İş akışı|İş akisi|Workflow)\]\s*/i;

/** Display text: hide machine tag when present so the pill stays readable. */
export function formatWorkflowEventBody(body: string): string {
  const t = body.trim();
  const stripped = t.replace(WORKFLOW_TAG_PREFIX, "").trim();
  return stripped || t;
}

function firstLine(body: string): string {
  const i = body.indexOf("\n");
  return (i === -1 ? body : body.slice(0, i)).trim();
}

/**
 * Classify workflow-style TEXT (single-line or first line only).
 * Conservative: long multi-line user messages never match.
 */
function classifyWorkflowTone(body: string): "positive" | "warning" | "neutral" | null {
  const t = body.trim();
  if (!t || t.length > 280) return null;
  const line = firstLine(t);
  if (line.length > 200) return null;

  const lower = line.toLocaleLowerCase("tr-TR");

  if (WORKFLOW_TAG_PREFIX.test(line)) {
    const rest = line.replace(WORKFLOW_TAG_PREFIX, "").trim();
    const r = rest.toLocaleLowerCase("tr-TR");
    if (!rest) return "neutral";
    if (/redded|revizyon|iptal|anlaşmazlık|uyarı|ret|red\b/i.test(r)) return "warning";
    if (/kabul|tamam|onay|teslim|yüklendi|edildi|tamamlandı/i.test(r)) return "positive";
    return "neutral";
  }

  if (line.length > 130) return null;

  if (
    /teklif\s+reddedildi|revizyon\s+istendi|teklif\s+iptal|anlaşmazlık|iş\s+birliği\s+iptal/i.test(lower)
  ) {
    return "warning";
  }

  if (
    /teklif\s+kabul\s+edildi|iş\s+birliği\s+tamamlandı|iş\s+birligi\s+tamamlandi|teslim\s+onaylandı|iş\s+teslim\s+edildi|teslim\s+edildi(?!\s*—)|dosya\s+yüklendi/i.test(
      lower,
    )
  ) {
    return "positive";
  }

  if (/sistem\s+bildirimi|durum\s+değişikliği|durum\s+degisikligi/i.test(lower)) {
    return "neutral";
  }

  return null;
}

export function getChatThreadPresentation(m: ChatMessageLike): ChatThreadPresentation {
  if (m.kind === "MEDIA" && !m.media) {
    return { mode: "system-error" };
  }
  if (m.kind !== "TEXT") {
    return { mode: "bubble" };
  }
  const tone = classifyWorkflowTone(m.body);
  if (tone) {
    return { mode: "workflow-event", tone };
  }
  return { mode: "bubble" };
}
