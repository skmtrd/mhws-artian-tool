const STORAGE_KEY = "wilds-artian-tool";

export interface StoredState {
  count: number;
  types: number;
  partsCount: number;
  columnConfigs: Record<number, { weapon?: string; attribute?: string }>;
  cellData: Record<
    string,
    { groupSkill?: string; seriesSkill?: string; skipped?: boolean }
  >;
  isStarted: boolean;
  cursor: { col: number; row: number } | null;
}

const DEFAULT_STATE: StoredState = {
  count: 1,
  types: 1,
  partsCount: 3,
  columnConfigs: {},
  cellData: {},
  isStarted: false,
  cursor: null,
};

export function loadState(): StoredState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<StoredState>;
      const count = parsed.count ?? DEFAULT_STATE.count;
      const types = parsed.types ?? DEFAULT_STATE.types;
      const cursor = parsed.cursor ?? DEFAULT_STATE.cursor;
      const validCursor =
        cursor &&
        cursor.col >= 0 &&
        cursor.col < types &&
        cursor.row >= 0 &&
        cursor.row < count
          ? cursor
          : null;
      return {
        count,
        types,
        partsCount: parsed.partsCount ?? DEFAULT_STATE.partsCount,
        columnConfigs: parsed.columnConfigs ?? DEFAULT_STATE.columnConfigs,
        cellData: parsed.cellData ?? DEFAULT_STATE.cellData,
        isStarted: parsed.isStarted ?? DEFAULT_STATE.isStarted,
        cursor: validCursor,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota exceeded etc.
  }
}
