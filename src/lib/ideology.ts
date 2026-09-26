import type { ResourceType } from "@/game/types";

export interface IdeologyStyle {
  label: string;
  short: string;
  /** Main colour used for chips, bars and badges. */
  color: string;
  /** Readable text colour on the dark UI. */
  text: string;
  tagline: string;
}

/** Ideology colours are used only for ideology information — the rest of the UI stays dark and gold. */
export const IDEOLOGY_STYLES: Record<ResourceType, IdeologyStyle> = {
  capitalism: { label: "Capitalism", short: "CAP", color: "#2f9e57", text: "#7fdc9d", tagline: "Markets, business & growth" },
  idealism: { label: "Idealism", short: "IDE", color: "#e3b928", text: "#f5d766", tagline: "Ethics, welfare & transparency" },
  conservatism: { label: "Conservatism", short: "CON", color: "#e0761f", text: "#f5a766", tagline: "Religion, community & tradition" },
  supremacy: { label: "Supremacy", short: "SUP", color: "#8c1d2f", text: "#e0707f", tagline: "Strong state, order & national pride" },
};

/** Player colours avoid the four ideology colours. */
export const PLAYER_COLORS = ["#5aa7ff", "#b18cff", "#ff7ab8", "#3fd1c7", "#d9dee7"];

export function playerColor(index: number) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
