import type { ProgressSnapPdf } from '@/lib/pdf/client-diet-report-model';

export type SeriesPoint = { x: string; y: number };

export function progressWeightSeries(snaps: ProgressSnapPdf[]): SeriesPoint[] {
  return snaps
    .filter((s) => s.weight_kg != null)
    .map((s) => ({ x: s.period_month ?? s.recorded_at, y: s.weight_kg as number }));
}

export function progressWaistSeries(snaps: ProgressSnapPdf[]): SeriesPoint[] {
  return snaps
    .filter((s) => s.waist_cm != null)
    .map((s) => ({ x: s.period_month ?? s.recorded_at, y: s.waist_cm as number }));
}

export function progressFatSeries(snaps: ProgressSnapPdf[]): SeriesPoint[] {
  return snaps
    .filter((s) => s.body_fat_pct != null)
    .map((s) => ({ x: s.period_month ?? s.recorded_at, y: s.body_fat_pct as number }));
}

export function progressBmiSeries(snaps: ProgressSnapPdf[], heightCm: number | null): SeriesPoint[] {
  if (heightCm == null || heightCm <= 0) return [];
  const hm = heightCm / 100;
  return snaps
    .filter((s) => s.weight_kg != null)
    .map((s) => ({
      x: s.period_month ?? s.recorded_at,
      y: (s.weight_kg as number) / (hm * hm),
    }));
}

export type LineChartGeom = {
  polylinePoints: string;
  dots: { cx: number; cy: number }[];
  minV: number;
  maxV: number;
  baselineY: number;
};

/** Geometría para Svg Polyline (puntos "x,y x,y …"). */
export function lineChartGeometry(points: SeriesPoint[], width: number, height: number, pad: number): LineChartGeom | null {
  if (points.length < 2) return null;
  const vals = points.map((p) => p.y);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const n = points.length;
  const dots: { cx: number; cy: number }[] = [];
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = pad + (i / Math.max(1, n - 1)) * innerW;
    const y = pad + innerH - ((points[i].y - minV) / range) * innerH;
    parts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    dots.push({ cx: x, cy: y });
  }
  return {
    polylinePoints: parts.join(' '),
    dots,
    minV,
    maxV,
    baselineY: pad + innerH,
  };
}
