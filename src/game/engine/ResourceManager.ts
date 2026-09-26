import { EMPTY_RESOURCES, RESOURCE_TYPES, isResourceType, type ResourceType, type Resources } from "../types";

export class ResourceManagerError extends Error {}

export const MAX_TOTAL_RESOURCES = 12;

export class ResourceManager {
  constructor(private readonly maxTotal = MAX_TOTAL_RESOURCES) {}

  getTotal(resources: Resources) {
    return RESOURCE_TYPES.reduce((total, type) => total + resources[type], 0);
  }

  /** How many more resources this stock can hold. */
  capacity(resources: Resources) {
    return Math.max(this.maxTotal - this.getTotal(resources), 0);
  }

  canAfford(resources: Resources, cost: Resources) {
    return RESOURCE_TYPES.every((type) => resources[type] >= cost[type]);
  }

  spend(resources: Resources, cost: Resources) {
    if (!this.canAfford(resources, cost)) {
      throw new ResourceManagerError("You do not have the required resources.");
    }
    for (const type of RESOURCE_TYPES) resources[type] -= cost[type];
    return resources;
  }

  /** Adds resources up to the holding limit. Returns what was actually added. */
  award(resources: Resources, reward: Resources) {
    let remainingCapacity = Math.max(this.maxTotal - this.getTotal(resources), 0);
    const awarded: Resources = { ...EMPTY_RESOURCES };
    for (const type of RESOURCE_TYPES) {
      const amount = Math.min(reward[type], remainingCapacity);
      resources[type] += amount;
      awarded[type] = amount;
      remainingCapacity -= amount;
    }
    return awarded;
  }

  /** Removes up to `count` random resources. Returns what was removed. */
  removeRandom(resources: Resources, count: number, random: () => number) {
    const removed: Resources = { ...EMPTY_RESOURCES };
    for (let taken = 0; taken < count; taken += 1) {
      const pool = RESOURCE_TYPES.flatMap((type) => Array<ResourceType>(resources[type]).fill(type));
      if (pool.length === 0) break;
      const type = pool[Math.floor(random() * pool.length)];
      resources[type] -= 1;
      removed[type] += 1;
    }
    return removed;
  }

  /**
   * Validates a client-supplied resource selection (e.g. the 4 resources paid
   * for a sealed card). Never trust the client: every value is re-checked.
   */
  parseSelection(input: unknown, options: { exactly?: number; min?: number; max?: number }): Resources {
    if (!input || typeof input !== "object") throw new ResourceManagerError("Select resources first.");
    const record = input as Record<string, unknown>;
    const selection: Resources = { ...EMPTY_RESOURCES };
    for (const [key, value] of Object.entries(record)) {
      if (!isResourceType(key)) throw new ResourceManagerError(`Unknown resource "${key}".`);
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new ResourceManagerError("Resource amounts must be whole numbers.");
      }
      selection[key] = value;
    }
    const total = this.getTotal(selection);
    if (options.exactly !== undefined && total !== options.exactly) {
      throw new ResourceManagerError(`Select exactly ${options.exactly} resources.`);
    }
    if (options.min !== undefined && total < options.min) throw new ResourceManagerError(`Select at least ${options.min} resources.`);
    if (options.max !== undefined && total > options.max) throw new ResourceManagerError(`Select at most ${options.max} resources.`);
    return selection;
  }

  /** Reduces a cost by `amount`, taking from the largest components first. */
  discount(cost: Resources, amount: number) {
    const reduced = { ...cost };
    for (let step = 0; step < amount; step += 1) {
      const largest = [...RESOURCE_TYPES].sort((left, right) => reduced[right] - reduced[left])[0];
      if (reduced[largest] === 0) break;
      reduced[largest] -= 1;
    }
    return reduced;
  }
}
