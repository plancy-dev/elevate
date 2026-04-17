/**
 * Limited concurrency for async mappers (e.g. Runway scene batches).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i]!, i);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
