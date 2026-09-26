import { describe, expect, it } from "vitest";

import { EMPTY_RESOURCES } from "../types";
import { ResourceManager } from "./ResourceManager";

describe("ResourceManager", () => {
  const manager = new ResourceManager(12);

  it("caps awards at the holding limit", () => {
    const stock = { ...EMPTY_RESOURCES, capitalism: 10 };
    const awarded = manager.award(stock, { ...EMPTY_RESOURCES, idealism: 4 });
    expect(awarded.idealism).toBe(2);
    expect(manager.getTotal(stock)).toBe(12);
  });

  it("validates a client resource selection", () => {
    expect(manager.parseSelection({ capitalism: 2, supremacy: 2 }, { exactly: 4 })).toEqual({ ...EMPTY_RESOURCES, capitalism: 2, supremacy: 2 });
    expect(() => manager.parseSelection({ capitalism: 3 }, { exactly: 4 })).toThrow("exactly 4");
    expect(() => manager.parseSelection({ capitalism: -1 }, {})).toThrow();
    expect(() => manager.parseSelection({ communism: 4 }, {})).toThrow("Unknown resource");
  });

  it("discounts the largest costs first", () => {
    expect(manager.discount({ capitalism: 2, idealism: 1, conservatism: 1, supremacy: 1 }, 2)).toEqual({ capitalism: 0, idealism: 1, conservatism: 1, supremacy: 1 });
  });
});
