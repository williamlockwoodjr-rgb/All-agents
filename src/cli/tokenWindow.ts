import { estimateTokenCount, sliceByTokens } from "tokenx";

export interface TokenWindow {
  readonly text: string;
  readonly total: number;
  readonly start: number;
  readonly end: number;
  readonly truncated: boolean;
}

// tokenx 2 prices a line break from the preceding segment. sliceByTokens
// stays aligned with estimateTokenCount; a copied splitter does not.
/** Slice an approximate token range without overlapping pages. */
export const sliceTextByTokenWindow = (
  text: string,
  offset: number,
  limit: number | undefined,
): TokenWindow => {
  const total = estimateTokenCount(text);
  const end = limit === undefined ? total : offset + limit;
  if (offset === 0 && end >= total)
    return { text, total, start: 0, end: total, truncated: false };

  const actualEnd = Math.min(end, total);
  if (offset >= actualEnd)
    return {
      text: "",
      total,
      start: actualEnd,
      end: actualEnd,
      truncated: true,
    };

  return {
    text: sliceByTokens(text, offset, actualEnd),
    total,
    start: offset,
    end: actualEnd,
    truncated: true,
  };
};
