import type { SchemaReference } from "@/content/schema/reference";
import type { Phase, CapstoneProject } from "@/lib/exercises/types";
import type { Scenario } from "@/lib/scenarios/types";

export type BuiltinThemeId =
  | "serious"
  | "silly"
  | "professional"
  | "scifi"
  | "fantasy";

export type CustomThemeId = `custom-${string}`;

export type ThemeId = BuiltinThemeId | CustomThemeId;

export interface ThemeDefinition {
  readonly id: ThemeId;
  readonly name: string;
  readonly tagline: string;
  readonly icon: string;
  readonly dbSchema: string;
  readonly schemaReference: SchemaReference;
  readonly phases: readonly Phase[];
  readonly capstones: readonly CapstoneProject[];
  readonly scenarios: readonly Scenario[];
}

/** Lightweight info for theme picker UI (no exercise content) */
export interface ThemeInfo {
  readonly id: ThemeId;
  readonly name: string;
  readonly tagline: string;
  readonly icon: string;
  readonly tablePreview: readonly string[];
}

export const BUILTIN_THEME_IDS: readonly BuiltinThemeId[] = [
  "serious",
  "silly",
  "professional",
  "scifi",
  "fantasy",
] as const;

/** Validate a theme ID is a known builtin theme */
export function isBuiltinThemeId(id: string): id is BuiltinThemeId {
  return (BUILTIN_THEME_IDS as readonly string[]).includes(id);
}

/** Validate a theme ID is a valid custom theme */
export function isCustomThemeId(id: string): id is CustomThemeId {
  return id.startsWith("custom-") && id.length > 7;
}

/** Validate any theme ID */
export function isValidThemeId(id: string): id is ThemeId {
  return isBuiltinThemeId(id) || isCustomThemeId(id);
}
