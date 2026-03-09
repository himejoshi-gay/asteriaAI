import { faker } from "@faker-js/faker";
import { container } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { Mocker } from "../../lib/mock/mocker";
import type { ActionStoreUtility } from "../action-store.utility";

describe("Action Store Utility", () => {
  let actionStore: ActionStoreUtility;

  beforeAll(() => {
    Mocker.createSapphireClientInstance();
    actionStore = container.utilities.actionStore;
  });

  afterAll(async () => {
    await Mocker.resetSapphireClientInstance();
  });

  beforeEach(() => actionStore.clear());

  describe("set", () => {
    it("should store data and return a unique ID", () => {
      const testData = { foo: "bar" };
      const id = actionStore.set(testData);

      expect(id).toBeString();
      expect(id.length).toBeGreaterThan(0);
    });

    it("should store different types of data", () => {
      const stringData = "test string";
      const numberData = 42;
      const objectData = { key: "value" };
      const arrayData = [1, 2, 3];

      const id1 = actionStore.set(stringData);
      const id2 = actionStore.set(numberData);
      const id3 = actionStore.set(objectData);
      const id4 = actionStore.set(arrayData);

      expect(actionStore.get<string>(id1)).toBe(stringData);
      expect(actionStore.get<number>(id2)).toBe(numberData);
      expect(actionStore.get<object>(id3)).toEqual(objectData);
      expect(actionStore.get<number[]>(id4)).toEqual(arrayData);
    });

    it("should generate unique IDs for each entry", () => {
      const id1 = actionStore.set("data1");
      const id2 = actionStore.set("data2");
      const id3 = actionStore.set("data3");

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should accept custom TTL", () => {
      const testData = { custom: "ttl" };
      const customTTL = Time.Second * 1;
      const id = actionStore.set<object>(testData, customTTL);

      expect(actionStore.get<object>(id)).toEqual(testData);
    });
  });

  describe("get", () => {
    it("should retrieve stored data by ID", () => {
      const testData = { test: "data" };
      const id = actionStore.set(testData);

      const retrieved = actionStore.get(id);

      expect(retrieved).toEqual(testData);
    });

    it("should return null for non-existent ID", () => {
      const fakeId = faker.string.uuid();
      const result = actionStore.get(fakeId);

      expect(result).toBeNull();
    });

    it("should return null for expired entries", async () => {
      const testData = { expires: "soon" };
      const shortTTL = Time.Millisecond * 100;
      const id = actionStore.set(testData, shortTTL);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = actionStore.get(id);

      expect(result).toBeNull();
    });

    it("should refresh expiration on get", async () => {
      const testData = { refresh: "test" };
      const ttl = Time.Millisecond * 200;
      const id = actionStore.set(testData, ttl);

      // Wait 100ms, then get (should refresh)
      await new Promise(resolve => setTimeout(resolve, Time.Millisecond * 100));
      const result1 = actionStore.get(id);
      expect(result1).toEqual(testData);

      // Wait another 100ms, data should still be there (refreshed)
      await new Promise(resolve => setTimeout(resolve, Time.Millisecond * 100));
      const result2 = actionStore.get(id);
      expect(result2).toEqual(testData);
    });
  });

  describe("delete", () => {
    it("should delete an entry and return true", () => {
      const testData = { to: "delete" };
      const id = actionStore.set(testData);

      const deleted = actionStore.delete(id);

      expect(deleted).toBe(true);
      expect(actionStore.get(id)).toBeNull();
    });

    it("should return false for non-existent ID", () => {
      const fakeId = faker.string.uuid();
      const deleted = actionStore.delete(fakeId);

      expect(deleted).toBe(false);
    });

    it("should clear timeout when deleting", () => {
      const testData = { with: "timeout" };
      const id = actionStore.set(testData);

      actionStore.delete(id);

      expect(actionStore.get(id)).toBeNull();
    });

    it("should allow deleting the same ID multiple times", () => {
      const testData = { double: "delete" };
      const id = actionStore.set(testData);

      const deleted1 = actionStore.delete(id);
      const deleted2 = actionStore.delete(id);

      expect(deleted1).toBe(true);
      expect(deleted2).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      const id1 = actionStore.set("data1");
      const id2 = actionStore.set("data2");
      const id3 = actionStore.set("data3");

      actionStore.clear();

      expect(actionStore.get(id1)).toBeNull();
      expect(actionStore.get(id2)).toBeNull();
      expect(actionStore.get(id3)).toBeNull();
    });

    it("should clear timeouts for all entries", async () => {
      const id1 = actionStore.set("data1", Time.Second * 5);
      const id2 = actionStore.set("data2", Time.Second * 5);

      actionStore.clear();

      // Wait a bit to ensure timeouts were cleared
      await new Promise(resolve => setTimeout(resolve, Time.Millisecond * 50));

      expect(actionStore.get(id1)).toBeNull();
      expect(actionStore.get(id2)).toBeNull();
    });

    it("should work on empty store", () => {
      expect(() => actionStore.clear()).not.toThrow();
    });
  });

  describe("expiration", () => {
    it("should automatically delete entries after TTL", async () => {
      const testData = { auto: "expire" };
      const shortTTL = Time.Millisecond * 100;
      const id = actionStore.set(testData, shortTTL);

      // Wait for expiration (without calling get, which would refresh)
      await new Promise(resolve => setTimeout(resolve, Time.Millisecond * 150));

      // Data should be gone
      expect(actionStore.get(id)).toBeNull();
    });

    it("should handle multiple entries with different TTLs", async () => {
      const data1 = { ttl: "short" };
      const data2 = { ttl: "long" };

      const id1 = actionStore.set(data1, Time.Millisecond * 100);
      const id2 = actionStore.set(data2, Time.Millisecond * 400);

      // Wait for first to expire (without calling get, which would refresh)
      await new Promise(resolve => setTimeout(resolve, Time.Millisecond * 150));

      expect(actionStore.get(id1)).toBeNull();

      // Wait for second to expire
      await new Promise(resolve => setTimeout(resolve, Time.Millisecond * 300));

      expect(actionStore.get(id2)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle storing null values", () => {
      const id = actionStore.set(null);
      const result = actionStore.get(id);

      expect(result).toBeNull();
    });

    it("should handle storing undefined values", () => {
      const id = actionStore.set(undefined);
      const result = actionStore.get(id);

      expect(result).toBeUndefined();
    });

    it("should handle storing empty objects", () => {
      const emptyObj = {};
      const id = actionStore.set(emptyObj);
      const result = actionStore.get(id);

      expect(result).toEqual({});
    });

    it("should handle storing empty arrays", () => {
      const emptyArr: any[] = [];
      const id = actionStore.set(emptyArr);
      const result = actionStore.get(id);

      expect(result).toEqual([]);
    });

    it("should handle zero TTL", async () => {
      const testData = { ttl: "zero" };
      const id = actionStore.set(testData, 0);

      // Wait for the immediate timeout to fire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should be expired
      const result = actionStore.get(id);
      expect(result).toBeNull();
    });

    it("should handle very large TTL", () => {
      const testData = { ttl: "large" };
      const largeTTL = Time.Day * 20;
      const id = actionStore.set(testData, largeTTL);

      const result = actionStore.get(id);
      expect(result).toEqual(testData);
    });
  });

  describe("data isolation", () => {
    it("should not modify original data when retrieved", () => {
      const originalData = { nested: { value: "original" } };
      const id = actionStore.set(originalData);

      const retrieved = actionStore.get<typeof originalData>(id);
      if (retrieved) {
        retrieved.nested.value = "modified";
      }

      const retrievedAgain = actionStore.get<typeof originalData>(id);
      expect(retrievedAgain?.nested.value).toBe("modified");
    });

    it("should store independent copies for different IDs", () => {
      const data1 = { value: 1 };
      const data2 = { value: 2 };

      const id1 = actionStore.set(data1);
      const id2 = actionStore.set(data2);

      expect(actionStore.get<{ value: number }>(id1)).toEqual({ value: 1 });
      expect(actionStore.get<{ value: number }>(id2)).toEqual({ value: 2 });
    });
  });
});
