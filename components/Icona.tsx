/* Icone monocromatiche a tratto, 16×16 (dal mockup: cvv2/icone.py). */
const P: Record<string, string> = {
 "identita": "<path d=\"M2.5 5V3.5a1 1 0 0 1 1-1H5M11 2.5h1.5a1 1 0 0 1 1 1V5M13.5 11v1.5a1 1 0 0 1-1 1H11M5 13.5H3.5a1 1 0 0 1-1-1V11\"/><circle cx=\"8\" cy=\"7\" r=\"1.8\"/><path d=\"M5.2 11c.5-1.3 1.6-2 2.8-2s2.3.7 2.8 2\"/>",
 "aml": "<path d=\"M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4z\"/><path d=\"M5.8 8.2l1.5 1.5 3-3.2\"/>",
 "firma": "<path d=\"M2.5 12.5c1.5-3 2.5-6.5 3.8-6.5 1.6 0-1 5.5.6 5.5 1 0 1.6-2 2.6-2 .8 0 .7 1.4 1.5 1.4.6 0 1-.5 1.5-1\"/><path d=\"M2.5 14h11\"/>",
 "documenti": "<path d=\"M2.5 4.5a1 1 0 0 1 1-1h3l1.5 1.5h4.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z\"/>",
 "notifiche": "<path d=\"M4.5 11V7.5a3.5 3.5 0 0 1 7 0V11l1 1.5h-9z\"/><path d=\"M6.8 14h2.4\"/>",
 "componibile": "<rect x=\"2.5\" y=\"2.5\" width=\"4.5\" height=\"4.5\" rx=\".8\"/><circle cx=\"11.2\" cy=\"4.8\" r=\"2.3\"/><path d=\"M4.8 9l2.5 4.5H2.3z\"/><rect x=\"9\" y=\"9\" width=\"4.5\" height=\"4.5\" rx=\".8\"/>",
 "workflow": "<circle cx=\"3.5\" cy=\"4\" r=\"1.5\"/><rect x=\"10\" y=\"2.5\" width=\"3.5\" height=\"3\" rx=\".6\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\"/><rect x=\"2.5\" y=\"10.5\" width=\"3.5\" height=\"3\" rx=\".6\"/><path d=\"M5 4h5M11.8 5.5v5M10.5 12H6\"/>",
 "design": "<rect x=\"2.5\" y=\"2.5\" width=\"11\" height=\"11\" rx=\"1\"/><path d=\"M2.5 6h11M6 6v7.5\"/><path d=\"M8.5 9h3M8.5 11h2\"/>",
 "multifornitore": "<path d=\"M3 3h4v2.2a1.3 1.3 0 1 0 0 2.6V10H4.8a1.3 1.3 0 1 1-2.6 0H3z\"/><path d=\"M9 6h4v4h-2.2a1.3 1.3 0 1 0-2.6 0V13\"/>",
 "banca": "<path d=\"M2.5 6L8 3l5.5 3z\"/><path d=\"M4 6.5V11M6.7 6.5V11M9.3 6.5V11M12 6.5V11M2.5 13h11\"/>",
 "crm": "<circle cx=\"5.5\" cy=\"6\" r=\"1.8\"/><circle cx=\"10.8\" cy=\"6.4\" r=\"1.5\"/><path d=\"M2.5 12.5c.4-2 1.5-3 3-3s2.6 1 3 3M9 9.6c1.5-.3 3.6.4 4.2 2.9\"/>",
 "dms": "<path d=\"M2.5 4.5a1 1 0 0 1 1-1h3l1.5 1.5h4.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z\"/><path d=\"M5.5 9h5\"/>",
 "bi": "<rect x=\"2.5\" y=\"2.5\" width=\"11\" height=\"8\" rx=\"1\"/><path d=\"M5.5 8.5V7M8 8.5V5.5M10.5 8.5V6.5M8 10.5v3M5.5 13.5h5\"/>",
 "altri": "<circle cx=\"3.8\" cy=\"8\" r=\"1.2\"/><circle cx=\"8\" cy=\"8\" r=\"1.2\"/><circle cx=\"12.2\" cy=\"8\" r=\"1.2\"/>",
 "cloud": "<path d=\"M4.5 12.5a2.8 2.8 0 0 1-.3-5.6 4 4 0 0 1 7.6-.9 2.9 2.9 0 0 1 .2 6.5z\"/>",
 "database": "<ellipse cx=\"8\" cy=\"4\" rx=\"4.5\" ry=\"1.7\"/><path d=\"M3.5 4v8c0 .9 2 1.7 4.5 1.7s4.5-.8 4.5-1.7V4M3.5 8c0 .9 2 1.7 4.5 1.7s4.5-.8 4.5-1.7\"/>",
 "journey": "<rect x=\"2.5\" y=\"3\" width=\"11\" height=\"7.5\" rx=\"1\"/><path d=\"M6 13.5h4M8 10.5v3\"/><circle cx=\"8\" cy=\"6\" r=\"1.3\"/><path d=\"M5.8 9c.4-.9 1.2-1.4 2.2-1.4s1.8.5 2.2 1.4\"/>",
 "ai": "<path d=\"M8 2.5l1.2 3.1 3.1 1.2-3.1 1.2L8 11.1 6.8 8 3.7 6.8l3.1-1.2z\"/><path d=\"M12.5 10.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z\"/>",
 "cliente": "<rect x=\"3\" y=\"2.5\" width=\"10\" height=\"11\" rx=\"1\"/><path d=\"M6 5.5h1M9 5.5h1M6 8h1M9 8h1M7 13.5v-2.5h2v2.5\"/>",
 "volumi": "<path d=\"M3 13V9M6.5 13V6M10 13V8M13.5 13V3.5\"/>",
 "sistemi": "<path d=\"M6 2.5v3M10 2.5v3M4.5 5.5h7v2.5a3.5 3.5 0 0 1-7 0zM8 11.5v2\"/>",
 "vincoli": "<path d=\"M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4z\"/>",
 "approccio": "<path d=\"M8 2.5l5.5 3-5.5 3-5.5-3zM2.5 8.5l5.5 3 5.5-3M2.5 11l5.5 3 5.5-3\"/>",
 "integraz": "<path d=\"M6 3h4v2.5a1.5 1.5 0 0 0 0 3V11H7.5a1.5 1.5 0 0 0-3 0H3V7.5a1.5 1.5 0 0 0 0-3V3z\"/>",
 "cicd": "<circle cx=\"4.5\" cy=\"4\" r=\"1.5\"/><circle cx=\"4.5\" cy=\"12\" r=\"1.5\"/><circle cx=\"11.5\" cy=\"6.5\" r=\"1.5\"/><path d=\"M4.5 5.5v5M11.5 8c0 2.5-3 2.5-7 3\"/>",
 "manut": "<path d=\"M10.5 2.5a3 3 0 0 0-3.2 4L2.8 11a1.4 1.4 0 0 0 2 2l4.5-4.5a3 3 0 0 0 4-3.2l-1.8 1.8-1.6-.4-.4-1.6z\"/>",
 "stima": "<rect x=\"3\" y=\"2.5\" width=\"10\" height=\"11\" rx=\"1\"/><path d=\"M5.5 5.5h5M5.5 8h5M5.5 10.5h3\"/>",
 "quote": "<path d=\"M4 12L12 4\"/><circle cx=\"5\" cy=\"5\" r=\"1.5\"/><circle cx=\"11\" cy=\"11\" r=\"1.5\"/>",
 "figure": "<circle cx=\"6\" cy=\"5.5\" r=\"2.2\"/><path d=\"M2 13c.4-2.4 2-3.6 4-3.6s3.6 1.2 4 3.6\"/><circle cx=\"11.5\" cy=\"6\" r=\"1.7\"/><path d=\"M11 9.6c1.6.1 2.7 1.2 3 3\"/>",
 "canoni": "<path d=\"M4 2.5h8v11l-2-1.2-2 1.2-2-1.2-2 1.2z\"/><path d=\"M6 6h4M6 8.5h4\"/>",
 "scaglioni": "<path d=\"M2.5 13.5h3v-3h3v-3h3v-3h2\"/>",
 "minimo": "<rect x=\"3.5\" y=\"7\" width=\"9\" height=\"6.5\" rx=\"1\"/><path d=\"M5.5 7V5a2.5 2.5 0 0 1 5 0v2\"/>",
 "sintesi": "<path d=\"M2.5 13.5h11M3.5 11l3-3.5 2.5 2 4-5\"/>",
 "sostenib": "<path d=\"M3 13c0-6 4-9.5 10-10-.3 6.3-3.5 10-10 10z\"/><path d=\"M3 13l5.5-5.5\"/>",
 "costi": "<rect x=\"2.5\" y=\"3\" width=\"11\" height=\"10\" rx=\"1\"/><path d=\"M2.5 6.5h11M6.5 6.5V13\"/>",
 "offerte": "<path d=\"M3 4h10M3 8h10M3 12h6\"/>",
 "bp": "<path d=\"M2.5 13.5h11M3.5 10.5l3-3 2 2 4.5-5\"/><path d=\"M10.5 4.5h2.5V7\"/>",
 "parametri": "<path d=\"M3 4.5h5M11 4.5h2M3 11.5h2M8 11.5h5\"/><circle cx=\"9.5\" cy=\"4.5\" r=\"1.5\"/><circle cx=\"6.5\" cy=\"11.5\" r=\"1.5\"/>",
 "catalogo": "<rect x=\"2.5\" y=\"2.5\" width=\"4.5\" height=\"4.5\" rx=\".8\"/><rect x=\"9\" y=\"2.5\" width=\"4.5\" height=\"4.5\" rx=\".8\"/><rect x=\"2.5\" y=\"9\" width=\"4.5\" height=\"4.5\" rx=\".8\"/><rect x=\"9\" y=\"9\" width=\"4.5\" height=\"4.5\" rx=\".8\"/>",
 "valid": "<circle cx=\"8\" cy=\"8\" r=\"5.5\"/><path d=\"M5.5 8.2l1.8 1.8 3.2-3.6\"/>",
 "margine": "<path d=\"M3 13l10-10\"/><path d=\"M8.5 3H13v4.5\"/>",
 "uscita": "<path d=\"M9.5 3H13v10H9.5M7 5.5L4.5 8 7 10.5M4.5 8H11\"/>",
 "specch": "<path d=\"M4 2.5h6l2.5 2.5v8.5H4z\"/><path d=\"M10 2.5V5h2.5M6 8h4M6 10.5h4\"/>"
};

export type NomeIcona = keyof typeof P;

export function Icona({ nome, size = 16 }: { nome: string; size?: number }) {
  const d = P[nome];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: '0 0 auto', opacity: 0.75 }}
      dangerouslySetInnerHTML={{ __html: d }} />
  );
}
