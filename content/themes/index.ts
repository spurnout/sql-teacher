import type {
  ThemeDefinition,
  ThemeInfo,
  ThemeId,
  BuiltinThemeId,
} from "./types";
import { isBuiltinThemeId, BUILTIN_THEME_IDS } from "./types";
import { seriousTheme } from "./serious";
import { sillyTheme } from "./silly";
import { professionalTheme } from "./professional";
import { scifiTheme } from "./scifi";
import { fantasyTheme } from "./fantasy";

const BUILTIN_THEMES: ReadonlyMap<BuiltinThemeId, ThemeDefinition> = new Map([
  ["serious", seriousTheme],
  ["silly", sillyTheme],
  ["professional", professionalTheme],
  ["scifi", scifiTheme],
  ["fantasy", fantasyTheme],
]);

/** Get a builtin theme by ID. Returns undefined for custom themes. */
export function getBuiltinTheme(
  id: string
): ThemeDefinition | undefined {
  if (!isBuiltinThemeId(id)) return undefined;
  return BUILTIN_THEMES.get(id);
}

/** Get any theme by ID (builtin only for now; custom themes loaded from DB). */
export function getTheme(id: ThemeId): ThemeDefinition | undefined {
  return getBuiltinTheme(id);
}

/** Get the PostgreSQL schema name for a theme. Returns undefined if unknown. */
export function getThemeDbSchema(id: ThemeId): string | undefined {
  const theme = getBuiltinTheme(id);
  if (theme) return theme.dbSchema;
  // Custom themes use pattern: theme_custom_{slug}
  if (id.startsWith("custom-")) {
    return `theme_${id.replace(/-/g, "_")}`;
  }
  return undefined;
}

/** Get lightweight theme info for the theme picker UI */
export function getAllThemeInfos(): readonly ThemeInfo[] {
  return BUILTIN_THEME_IDS.map((id) => {
    const theme = BUILTIN_THEMES.get(id)!;
    return {
      id: theme.id,
      name: theme.name,
      tagline: theme.tagline,
      icon: theme.icon,
      tablePreview: theme.schemaReference.tables.map((t) => t.name),
    };
  });
}

/** Get all builtin themes */
export function getAllBuiltinThemes(): readonly ThemeDefinition[] {
  return BUILTIN_THEME_IDS.map((id) => BUILTIN_THEMES.get(id)!);
}

/** Validate that a schema name is in the allowed set (prevents SQL injection) */
export function isAllowedSchema(schemaName: string): boolean {
  // Builtin themes
  for (const theme of BUILTIN_THEMES.values()) {
    if (theme.dbSchema === schemaName) return true;
  }
  // Custom themes follow pattern theme_custom_*
  if (/^theme_custom_[a-z0-9_]+$/.test(schemaName)) return true;
  return false;
}
