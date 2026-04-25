/**
 * Utilitários para traço do lápis (inspirado em fluxos tipo Excalidraw / notas vetoriais):
 * - reduz ruído e pontos redundantes
 * - suaviza polilinha sem perder o gesto
 */

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * Mantém só pontos com espaçamento mínimo (menos ruído, menos pontos).
 */
export function dedupeByMinDistance(points, minDist = 1.2) {
  if (!points?.length) return [];
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const last = out[out.length - 1];
    if (dist(last, p) >= minDist) out.push(p);
  }
  if (points.length > 1 && out.length === 1) out.push(points[points.length - 1]);
  return out;
}

/**
 * Chaikin: 1 iteração suaviza cantos (equivalente a subdivisão de curva).
 */
export function chaikinOpenPath(points, iterations = 1) {
  if (!points || points.length < 2) return points || [];
  let cur = points;
  for (let it = 0; it < iterations; it++) {
    if (cur.length < 2) break;
    const next = [cur[0]];
    for (let i = 0; i < cur.length - 1; i++) {
      const p0 = cur[i];
      const p1 = cur[i + 1];
      next.push(
        { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y },
        { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y }
      );
    }
    next.push(cur[cur.length - 1]);
    cur = next;
  }
  return cur;
}

/**
 * Ramer–Douglas–Peucker: remove pontos quase colineares.
 */
export function simplifyRDP(points, epsilon = 1.25) {
  if (!points || points.length < 3) return points || [];

  const sqEps = epsilon * epsilon;

  const perpDistSq = (p, a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const tClamped = Math.max(0, Math.min(1, t));
    const nx = a.x + tClamped * dx;
    const ny = a.y + tClamped * dy;
    return (p.x - nx) ** 2 + (p.y - ny) ** 2;
  };

  const recurse = (arr, start, end, keep) => {
    let maxSq = 0;
    let idx = start;
    for (let i = start + 1; i < end; i++) {
      const d = perpDistSq(arr[i], arr[start], arr[end]);
      if (d > maxSq) {
        maxSq = d;
        idx = i;
      }
    }
    if (maxSq > sqEps) {
      recurse(arr, start, idx, keep);
      keep[idx] = true;
      recurse(arr, idx, end, keep);
    }
  };

  const n = points.length;
  const keep = new Array(n).fill(false);
  keep[0] = true;
  keep[n - 1] = true;
  recurse(points, 0, n - 1, keep);

  return points.filter((_, i) => keep[i]);
}

/** Níveis de suavização ao soltar o lápis (UI + `finalizePencilPolyline`) */
export const PENCIL_SMOOTH_LEVELS = {
  mild: {
    chaikinIterations: 0,
    rdpEpsilon: 2.35,
    dedupeInitial: 0.85,
    dedupeFinal: 0.9,
  },
  normal: {
    chaikinIterations: 1,
    rdpEpsilon: 1.15,
    dedupeInitial: 1,
    dedupeFinal: 0.8,
  },
  strong: {
    chaikinIterations: 2,
    rdpEpsilon: 0.62,
    dedupeInitial: 1.05,
    dedupeFinal: 0.65,
  },
};

/**
 * Pipeline ao finalizar o traço: dedupe → Chaikin → RDP → dedupe.
 * @param {string} level - 'mild' | 'normal' | 'strong'
 */
export function finalizePencilPolyline(rawPoints, level = 'normal') {
  if (!rawPoints?.length) return [];
  const cfg = PENCIL_SMOOTH_LEVELS[level] || PENCIL_SMOOTH_LEVELS.normal;
  let p = dedupeByMinDistance(rawPoints, cfg.dedupeInitial);
  if (p.length < 2) return p;
  p = chaikinOpenPath(p, cfg.chaikinIterations);
  if (p.length >= 3) {
    p = simplifyRDP(p, cfg.rdpEpsilon);
  }
  p = dedupeByMinDistance(p, cfg.dedupeFinal);
  return p.length >= 2 ? p : rawPoints;
}

/**
 * Converte pontos em d SVG com curvas quadráticas suaves (midpoint).
 * Melhor que só L quando há poucos pontos após simplificar.
 */
export function pointsToSmoothPathD(points) {
  if (!points?.length) return '';
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x} ${y} L ${x + 0.5} ${y + 0.5}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    d += ` Q ${p0.x} ${p0.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}
