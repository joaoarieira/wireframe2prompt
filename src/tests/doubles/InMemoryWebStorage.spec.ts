import { describe, expect, test } from "vitest";
import { InMemoryWebStorage } from "./InMemoryWebStorage";

describe("InMemoryWebStorage", () => {
  test("setItem then getItem round-trips the value", () => {
    const storage = new InMemoryWebStorage();
    storage.setItem("a", "1");
    expect(storage.getItem("a")).toBe("1");
  });

  test("getItem returns null for an unknown key", () => {
    expect(new InMemoryWebStorage().getItem("missing")).toBeNull();
  });

  test("length and key(index) reflect insertion order", () => {
    const storage = new InMemoryWebStorage();
    storage.setItem("first", "1");
    storage.setItem("second", "2");

    expect(storage.length).toBe(2);
    expect(storage.key(0)).toBe("first");
    expect(storage.key(1)).toBe("second");
    expect(storage.key(2)).toBeNull();
  });

  test("removeItem drops the entry", () => {
    const storage = new InMemoryWebStorage();
    storage.setItem("a", "1");
    storage.removeItem("a");
    expect(storage.getItem("a")).toBeNull();
    expect(storage.length).toBe(0);
  });

  test("setItem on an existing key overwrites without growing length", () => {
    const storage = new InMemoryWebStorage();
    storage.setItem("a", "1");
    storage.setItem("a", "2");
    expect(storage.getItem("a")).toBe("2");
    expect(storage.length).toBe(1);
  });
});
