import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Layout modes for iPhone Duo (and any other wide screen).
 *
 * iPhone Duo viewports in Safari 27.1 (CSS px):
 *   outer, portrait            382 x 580–618   -> compact, bottom tab bar
 *   outer, landscape           594 x 368–406   -> compact, side rail (height is tiny)
 *   inner, portrait            669 x 867–902   -> regular, side rail, one column
 *   inner, landscape           951 x 585–620   -> regular, side rail, two columns
 *   inner, two windows         385 x 571–609   -> compact, bottom tab bar
 *
 * The inner display folds down the middle (about 40 pt wide, centred). In two-column
 * mode the gutter sits on that crease so no card or row is split by the fold. When
 * Safari exposes the Viewport Segments API (Settings › Safari › Advanced › Feature
 * Flags), the real segment rectangles are used instead of the centred estimate.
 */

export const RAIL_WIDTH = 76;
/** Estimated width of the inner-display crease when the phone lies flat. */
export const CREASE_WIDTH = 40;

const REGULAR_MIN_WIDTH = 600;
const TWO_PANE_MIN_WIDTH = 840;

type Rect = { left: number; right: number; top: number; bottom: number };

export type Hinge = { start: number; end: number };

export type AdaptiveLayout = {
  width: number;
  height: number;
  /** Inner display / tablet / desktop: regular width size class. */
  regular: boolean;
  /** Navigation lives in a vertical rail on the right edge instead of the bottom bar. */
  rail: boolean;
  /** Content splits into two columns either side of the hinge. */
  twoPane: boolean;
  /** Horizontal span (window x coordinates) the gutter must cover, when two-pane. */
  hinge: Hinge | null;
  /** True when the browser reports the phone half-folded like a book. */
  folded: boolean;
};

function readSegments(): Rect[] | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const segments = (window as unknown as { viewport?: { segments?: Rect[] } }).viewport?.segments;
  if (!Array.isArray(segments) || segments.length < 2) return null;
  return segments.map((s) => ({ left: s.left, right: s.right, top: s.top, bottom: s.bottom }));
}

function readFolded(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const posture = (navigator as unknown as { devicePosture?: { type?: string } }).devicePosture;
  return posture?.type === 'folded';
}

/** Re-reads viewport segments when the window resizes or the device posture changes. */
function useFoldState(width: number, height: number) {
  const [state, setState] = useState(() => ({ segments: readSegments(), folded: readFolded() }));

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const update = () => setState({ segments: readSegments(), folded: readFolded() });
    update();

    const posture = (navigator as unknown as { devicePosture?: EventTarget }).devicePosture;
    posture?.addEventListener?.('change', update);

    const queries = ['(horizontal-viewport-segments: 2)', '(vertical-viewport-segments: 2)']
      .map((q) => window.matchMedia?.(q))
      .filter((q): q is MediaQueryList => Boolean(q));
    queries.forEach((q) => q.addEventListener?.('change', update));

    return () => {
      posture?.removeEventListener?.('change', update);
      queries.forEach((q) => q.removeEventListener?.('change', update));
    };
  }, [width, height]);

  return state;
}

export function useAdaptiveLayout(): AdaptiveLayout {
  const { width, height } = useWindowDimensions();
  const { segments, folded } = useFoldState(width, height);

  const sideBySide =
    segments && segments.length === 2 && Math.abs(segments[0].top - segments[1].top) < 1
      ? [...segments].sort((a, b) => a.left - b.left)
      : null;

  const regular = width >= REGULAR_MIN_WIDTH;
  const landscapePhone = width > height && width >= 560;
  const rail = regular || landscapePhone;
  const twoPane = width >= TWO_PANE_MIN_WIDTH || Boolean(sideBySide && width >= REGULAR_MIN_WIDTH);

  let hinge: Hinge | null = null;
  if (twoPane) {
    hinge = sideBySide
      ? { start: sideBySide[0].right, end: sideBySide[1].left }
      : { start: width / 2 - CREASE_WIDTH / 2, end: width / 2 + CREASE_WIDTH / 2 };
  }

  return { width, height, regular, rail, twoPane, hinge, folded: folded || Boolean(sideBySide) };
}
