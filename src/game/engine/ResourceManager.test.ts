import { describe, expect, it } from "vitest";

import { ResourceManager, ResourceManagerError } from "./ResourceManager";

describe("ResourceManager", () => {
  it("awards resources in order without exceeding the twelve-resource cap", () => {
    const manager = new ResourceManager();
    const resources = { capitalism: 10, communism: 0, socialism: 0, fascism: 0 };

    const awarded = manager.award(resources, { capitalism: 2, communism: 1, socialism: 1, fascism: 0 });
    expect(awarded).toEqual({ capitalism: 2, communism: 0, socialism: 0, fascism: 0 });
    expect(manager.getTotal(resources)).toBe(12);
  });

  it("spends only affordable resource bundles", () => {
    const manager = new ResourceManager();
    const resources = { capitalism: 2, communism: 1, socialism: 0, fascism: 0 };

    manager.spend(resources, { capitalism: 1, communism: 1, socialism: 0, fascism: 0 });
    expect(resources).toEqual({ capitalism: 1, communism: 0, socialism: 0, fascism: 0 });
    expect(() => manager.spend(resources, { capitalism: 2, communism: 0, socialism: 0, fascism: 0 })).toThrow(ResourceManagerError);
  });
});
