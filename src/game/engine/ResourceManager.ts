import { EMPTY_RESOURCES, RESOURCE_TYPES, type Resources } from "../types";

export class ResourceManagerError extends Error {}

export const MAX_TOTAL_RESOURCES = 12;

export class ResourceManager {
  getTotal(resources: Resources) {
    return RESOURCE_TYPES.reduce((total, resourceType) => total + resources[resourceType], 0);
  }

  canAfford(resources: Resources, cost: Resources) {
    return RESOURCE_TYPES.every((resourceType) => resources[resourceType] >= cost[resourceType]);
  }

  spend(resources: Resources, cost: Resources) {
    if (!this.canAfford(resources, cost)) {
      throw new ResourceManagerError("You do not have the required resources.");
    }
    for (const resourceType of RESOURCE_TYPES) {
      resources[resourceType] -= cost[resourceType];
    }
    return resources;
  }

  award(resources: Resources, reward: Resources) {
    const availableCapacity = MAX_TOTAL_RESOURCES - this.getTotal(resources);
    let remainingCapacity = Math.max(availableCapacity, 0);
    const awarded: Resources = { ...EMPTY_RESOURCES };

    for (const resourceType of RESOURCE_TYPES) {
      const amount = Math.min(reward[resourceType], remainingCapacity);
      resources[resourceType] += amount;
      awarded[resourceType] = amount;
      remainingCapacity -= amount;
    }
    return awarded;
  }
}
