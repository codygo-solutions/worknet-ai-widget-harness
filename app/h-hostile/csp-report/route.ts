// CSP report sink. The strict CSP for /h-hostile/* declares
// `report-uri /h-hostile/csp-report`; the browser POSTs violation reports
// here. Kept in an in-memory ring the H page polls so a CSP-blocked widget
// load is visible (the target state is ZERO widget-related violations).
//
// Only a typed descriptor is retained (blocked-uri + violated-directive) —
// never the raw report body (which can carry script-sample / document-uri /
// source-file). DELETE clears the ring so each H session starts from a clean
// `total === 0` signal regardless of any prior run in the same process.

type CspReport = { at: string; blockedUri: string; directive: string };

const ring: CspReport[] = [];
const CAP = 50;
const MAX_BODY = 16 * 1024;

export async function POST(request: Request): Promise<Response> {
  const text = (await request.text().catch(() => '')).slice(0, MAX_BODY);
  const root = (() => {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {};
    }
  })();
  const r = (root['csp-report'] as Record<string, unknown>) ?? root;
  const str = (k: string): string => (typeof r[k] === 'string' ? r[k] : '');
  ring.push({
    at: new Date().toISOString(),
    blockedUri: str('blocked-uri') || str('blockedURI') || 'unknown',
    directive: str('violated-directive') || str('effectiveDirective') || 'unknown',
  });
  if (ring.length > CAP) ring.shift();
  return new Response(null, { status: 204 });
}

export async function GET(): Promise<Response> {
  return Response.json({ total: ring.length, recent: ring.slice(-10) });
}

export async function DELETE(): Promise<Response> {
  ring.length = 0;
  return new Response(null, { status: 204 });
}
