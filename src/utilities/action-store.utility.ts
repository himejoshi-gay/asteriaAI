import { ApplyOptions } from "@sapphire/decorators";
import { Utility } from "@sapphire/plugin-utilities-store";
import { Time } from "@sapphire/time-utilities";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  timeout: NodeJS.Timeout;
}

@ApplyOptions<Utility.Options>({ name: "actionStore" })
export class ActionStoreUtility extends Utility {
  private localStore = new Map<string, CacheEntry<any>>();
  private defaultTTL = Time.Minute * 5;
  private maxEntriesLimit = 10_000;

  set<T>(data: T, ttl?: number): string {
    const id = Bun.randomUUIDv7();
    const expiration = Date.now() + (ttl ?? this.defaultTTL);

    if (this.localStore.size >= this.maxEntriesLimit) {
      this.cleanUp(1);
    }

    if (this.localStore.has(id)) {
      const entry = this.localStore.get(id)!;
      entry.data = data;
      this.updateExpiration(id, entry, expiration);
    }
    else {
      const timeout = setTimeout(() => {
        this.localStore.delete(id);
      }, ttl ?? this.defaultTTL);

      this.localStore.set(id, {
        data,
        expiresAt: expiration,
        timeout,
      });
    }

    return id;
  }

  get<T>(id: string): T | null {
    const entry = this.localStore.get(id);
    if (!entry)
      return null;

    if (Date.now() > entry.expiresAt) {
      this.delete(id);
      return null;
    }

    this.updateExpiration(id, entry);

    return entry.data;
  }

  delete(id: string): boolean {
    const entry = this.localStore.get(id);
    if (!entry)
      return false;

    clearTimeout(entry.timeout);
    return this.localStore.delete(id);
  }

  clear(): void {
    for (const [id, entry] of this.localStore.entries()) {
      clearTimeout(entry.timeout);
      this.localStore.delete(id);
    }
  }

  private cleanUp(size: number): void {
    const entriesArray = Array.from(this.localStore.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    const entriesToRemove = entriesArray.slice(size);

    for (const [id] of entriesToRemove) {
      this.delete(id);
    }
  }

  private updateExpiration<T>(id: string, entry: CacheEntry<T>, ttl: number = this.defaultTTL) {
    entry.expiresAt = Date.now() + ttl;

    if (entry.timeout)
      clearTimeout(entry.timeout);

    entry.timeout = setTimeout(() => {
      this.store.delete(id);
    }, ttl);
  }
}
