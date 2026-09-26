/**
 * THRONE ideologies. Each ideology is also a resource type.
 * Socialism and Communism are intentionally not part of THRONE.
 */
export type ResourceType = "capitalism" | "idealism" | "conservatism" | "supremacy";

export type Resources = Record<ResourceType, number>;

export const RESOURCE_TYPES: ResourceType[] = ["capitalism", "idealism", "conservatism", "supremacy"];

export const EMPTY_RESOURCES: Resources = {
  capitalism: 0,
  idealism: 0,
  conservatism: 0,
  supremacy: 0,
};

export function createResources(partial: Partial<Resources> = {}): Resources {
  return { ...EMPTY_RESOURCES, ...partial };
}

export function isResourceType(value: unknown): value is ResourceType {
  return typeof value === "string" && (RESOURCE_TYPES as string[]).includes(value);
}
