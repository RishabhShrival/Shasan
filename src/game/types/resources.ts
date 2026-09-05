export type ResourceType = "capitalism" | "communism" | "socialism" | "fascism";

export type Resources = Record<ResourceType, number>;

export const RESOURCE_TYPES: ResourceType[] = ["capitalism", "communism", "socialism", "fascism"];

export const EMPTY_RESOURCES: Resources = {
  capitalism: 0,
  communism: 0,
  socialism: 0,
  fascism: 0,
};
