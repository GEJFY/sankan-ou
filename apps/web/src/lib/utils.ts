/**
 * トピック等の配列を name フィールドで重複排除する。
 * 同じ name を持つ項目が複数ある場合、最後に出現したものが残る
 * （Map のキー上書きの挙動に合わせている）。
 */
export function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.name, item])).values());
}
