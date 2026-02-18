import { useEffect, useRef, useState } from "react";
import { ATTRIBUTES, ATTRIBUTE_IMAGE_MAP } from "./data/attributes";
import { GROUP_SKILLS } from "./data/groupSkills";
import { SERIES_SKILLS } from "./data/seriesSkills";
import { WEAPONS, WEAPON_IMAGE_MAP } from "./data/weapons";
import { loadState, saveState } from "./storage";

interface ColumnConfig {
  weapon?: string;
  attribute?: string;
}

interface CellData {
  groupSkill?: string;
  seriesSkill?: string;
  skipped?: boolean;
}

function App() {
  const [count, setCount] = useState(() => loadState().count);
  const [types, setTypes] = useState(() => loadState().types);
  const [partsCount, setPartsCount] = useState(() => loadState().partsCount);
  const [columnConfigs, setColumnConfigs] = useState<
    Record<number, ColumnConfig>
  >(() => loadState().columnConfigs);
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(() => loadState().isStarted);
  const [cursor, setCursor] = useState<{ col: number; row: number } | null>(
    () => loadState().cursor,
  );
  const [cellData, setCellData] = useState<Record<string, CellData>>(
    () => loadState().cellData,
  );
  const [selectedGroupSkill, setSelectedGroupSkill] = useState("");
  const [selectedSeriesSkill, setSelectedSeriesSkill] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 1000);
  };

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    saveState({
      count,
      types,
      partsCount,
      columnConfigs,
      cellData,
      isStarted,
      cursor,
    });
  }, [count, types, partsCount, columnConfigs, cellData, isStarted, cursor]);

  useEffect(() => {
    if (showResetModal) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showResetModal]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        editingColumn !== null &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setEditingColumn(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingColumn]);

  const updateColumnConfig = (
    colIndex: number,
    updates: Partial<ColumnConfig>,
  ) => {
    setColumnConfigs((prev) => ({
      ...prev,
      [colIndex]: { ...prev[colIndex], ...updates },
    }));
  };

  const getHeaderLabel = (colIndex: number) => {
    const config = columnConfigs[colIndex];
    const parts: string[] = [];
    if (config?.weapon) parts.push(config.weapon);
    if (config?.attribute) parts.push(config.attribute);
    return parts.length > 0 ? parts.join(" × ") : `種類${colIndex + 1}`;
  };

  const getHeaderImages = (colIndex: number) => {
    const config = columnConfigs[colIndex];
    const weaponSrc = config?.weapon ? WEAPON_IMAGE_MAP[config.weapon] : null;
    const attributeSrc = config?.attribute
      ? ATTRIBUTE_IMAGE_MAP[config.attribute]
      : null;
    return { weaponSrc, attributeSrc };
  };

  const cellKey = (col: number, row: number) => `${col}_${row}`;

  const handleStart = () => {
    setIsStarted(true);
    setCursor({ col: 0, row: 0 });
    setCellData({});
    setSelectedGroupSkill("");
    setSelectedSeriesSkill("");
  };

  const moveToNext = () => {
    if (!cursor) return;
    const { col, row } = cursor;
    if (row < count - 1) {
      setCursor({ col, row: row + 1 });
    } else if (col < types - 1) {
      setCursor({ col: col + 1, row: 0 });
    } else {
      setCursor(null);
    }
    setSelectedGroupSkill("");
    setSelectedSeriesSkill("");
  };

  const moveToPrev = () => {
    if (!cursor) return;
    const { col, row } = cursor;
    let prevCol: number;
    let prevRow: number;
    if (row > 0) {
      prevCol = col;
      prevRow = row - 1;
    } else if (col > 0) {
      prevCol = col - 1;
      prevRow = count - 1;
    } else {
      return;
    }
    const prevData = cellData[cellKey(prevCol, prevRow)];
    setCursor({ col: prevCol, row: prevRow });
    setSelectedGroupSkill(prevData?.groupSkill ?? "");
    setSelectedSeriesSkill(prevData?.seriesSkill ?? "");
  };

  const canGoBack = cursor && (cursor.row > 0 || cursor.col > 0);

  const handleCellClick = (colIndex: number, rowIndex: number) => {
    setIsStarted(true);
    setCursor({ col: colIndex, row: rowIndex });
    const data = cellData[cellKey(colIndex, rowIndex)];
    setSelectedGroupSkill(data?.groupSkill ?? "");
    setSelectedSeriesSkill(data?.seriesSkill ?? "");
  };

  const handleNext = () => {
    if (!cursor) return;
    const label = [selectedGroupSkill, selectedSeriesSkill]
      .filter(Boolean)
      .join(" / ");
    setCellData((prev) => ({
      ...prev,
      [cellKey(cursor.col, cursor.row)]: {
        groupSkill: selectedGroupSkill || undefined,
        seriesSkill: selectedSeriesSkill || undefined,
      },
    }));
    showToast(`${label} が入力されました`);
    moveToNext();
  };

  const handleSkip = () => {
    if (!cursor) return;
    setCellData((prev) => ({
      ...prev,
      [cellKey(cursor.col, cursor.row)]: { skipped: true },
    }));
    showToast("スキップしました");
    moveToNext();
  };

  const isComplete = cursor === null && isStarted;

  const canProceed = selectedGroupSkill !== "" && selectedSeriesSkill !== "";

  const showInputBar = isStarted && cursor !== null;

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = () => {
    setCellData({});
    setSelectedGroupSkill("");
    setSelectedSeriesSkill("");
    setIsStarted(false);
    setCursor(null);
    setShowResetModal(false);
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  return (
    <div
      className={`min-h-screen bg-white p-6 text-gray-900 ${showInputBar ? "pb-48" : ""}`}
    >
      <div className="mb-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label
              htmlFor="partsCount"
              className="font-medium text-gray-700 text-sm"
            >
              現在持っているパーツの数
            </label>
            <select
              id="partsCount"
              value={partsCount}
              onChange={(e) => setPartsCount(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm"
            >
              {Array.from({ length: 2000 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="count"
              className="font-medium text-gray-700 text-sm"
            >
              何回やるか
            </label>
            <select
              id="count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm"
            >
              {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="types"
              className="font-medium text-gray-700 text-sm"
            >
              いくつの種類でやるか
            </label>
            <select
              id="types"
              value={types}
              onChange={(e) => setTypes(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isStarted ? (
            <button
              type="button"
              onClick={handleResetClick}
              className="rounded border border-gray-300 bg-white px-6 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
            >
              取り消し
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="rounded border border-gray-300 bg-white px-6 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
            >
              スタート
            </button>
          )}
          <button
            type="button"
            onClick={handleResetClick}
            className="rounded border border-gray-300 bg-white px-6 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
          >
            リセット
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={handleResetCancel}
        onClose={handleResetCancel}
        className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 m-0 max-h-[90vh] w-full max-w-sm rounded-lg border border-gray-300 bg-white p-6 shadow-lg backdrop:bg-black/30"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 id="reset-dialog-title" className="font-medium text-gray-900">
            リセットしますか？
          </h2>
          <p className="text-gray-600 text-sm">
            表の中身のみリセットされます。回数や種類、武器種・属性の設定はそのままです。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResetCancel}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              className="rounded border border-red-300 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100"
            >
              リセット
            </button>
          </div>
        </div>
      </dialog>

      <p className="mb-2 text-gray-500 text-xs">
        種類Nをクリックすると武器種と属性を選択可能
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-left font-medium text-gray-600 text-sm">
                #
              </th>
              {Array.from({ length: types }, (_, i) => (
                <th
                  key={i}
                  className="relative border border-gray-200 bg-gray-50 px-4 py-2 text-center font-medium text-gray-600 text-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEditingColumn(editingColumn === i ? null : i)
                    }
                    className="flex w-full items-center justify-center gap-1 rounded px-2 py-1 transition-colors hover:bg-gray-200"
                    title={getHeaderLabel(i)}
                  >
                    {(() => {
                      const { weaponSrc, attributeSrc } = getHeaderImages(i);
                      if (weaponSrc || attributeSrc) {
                        return (
                          <span className="flex items-center gap-1">
                            {weaponSrc && (
                              <img
                                src={weaponSrc}
                                alt=""
                                className="size-6 object-contain"
                              />
                            )}
                            {attributeSrc && (
                              <img
                                src={attributeSrc}
                                alt=""
                                className="size-6 object-contain"
                              />
                            )}
                          </span>
                        );
                      }
                      return (
                        <span className="text-left text-gray-600 text-sm">
                          {getHeaderLabel(i)}
                        </span>
                      );
                    })()}
                  </button>
                  {editingColumn === i && (
                    <div
                      ref={popoverRef}
                      className="absolute top-full left-0 z-10 mt-1 min-w-[200px] rounded border border-gray-200 bg-white p-3 shadow-lg"
                    >
                      <div className="space-y-2">
                        <div>
                          <label
                            htmlFor={`weapon-${i}`}
                            className="mb-1 block text-gray-600 text-xs"
                          >
                            武器種
                          </label>
                          <select
                            id={`weapon-${i}`}
                            value={columnConfigs[i]?.weapon ?? ""}
                            onChange={(e) =>
                              updateColumnConfig(i, {
                                weapon: e.target.value || undefined,
                              })
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-gray-900 text-sm"
                          >
                            <option value="">未選択</option>
                            {WEAPONS.map((w) => (
                              <option key={w.ja} value={w.ja}>
                                {w.ja}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`attribute-${i}`}
                            className="mb-1 block text-gray-600 text-xs"
                          >
                            属性
                          </label>
                          <select
                            id={`attribute-${i}`}
                            value={columnConfigs[i]?.attribute ?? ""}
                            onChange={(e) =>
                              updateColumnConfig(i, {
                                attribute: e.target.value || undefined,
                              })
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-gray-900 text-sm"
                          >
                            <option value="">未選択</option>
                            {ATTRIBUTES.map((a) => (
                              <option key={a.ja} value={a.ja}>
                                {a.ja}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }, (_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="border border-gray-200 bg-gray-50 px-4 py-2 font-medium text-gray-600 text-sm">
                  {rowIndex + 1}回目
                </td>
                {Array.from({ length: types }, (_, colIndex) => {
                  const data = cellData[cellKey(colIndex, rowIndex)];
                  const isActive =
                    cursor?.col === colIndex && cursor?.row === rowIndex;
                  return (
                    <td
                      key={colIndex}
                      className={`border border-gray-200 ${
                        isActive
                          ? "bg-amber-100 ring-2 ring-amber-400"
                          : "bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCellClick(colIndex, rowIndex)}
                        className="w-full cursor-pointer px-4 py-2 text-left text-gray-900 text-sm transition-colors hover:bg-gray-50"
                      >
                        {data?.skipped ? (
                          <span className="text-gray-400">×</span>
                        ) : data?.groupSkill || data?.seriesSkill ? (
                          <span>
                            {[data.groupSkill, data.seriesSkill]
                              .filter(Boolean)
                              .join(" / ")}
                          </span>
                        ) : (
                          " "
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInputBar && cursor && (
        <div className="fixed right-0 bottom-0 left-0 z-50 flex flex-col gap-4 border-gray-200 border-t bg-white p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="mx-auto w-full max-w-6xl text-center text-gray-600 text-sm">
            推定される現在のパーツの合計 : {partsCount - cursor.row * 3}{" "}
            (回数確認用)
          </div>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="group-skill" className="text-gray-500 text-sm">
                グループスキル
              </label>
              <select
                id="group-skill"
                value={selectedGroupSkill}
                onChange={(e) => setSelectedGroupSkill(e.target.value)}
                className="min-w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
              >
                <option value="">未選択</option>
                {GROUP_SKILLS.map((s) => (
                  <option key={s.ja} value={s.ja}>
                    {s.ja}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="series-skill" className="text-gray-500 text-sm">
                シリーズスキル
              </label>
              <select
                id="series-skill"
                value={selectedSeriesSkill}
                onChange={(e) => setSelectedSeriesSkill(e.target.value)}
                className="min-w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
              >
                <option value="">未選択</option>
                {SERIES_SKILLS.map((s) => (
                  <option key={s.ja} value={s.ja}>
                    {s.ja} / {s.subJa}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="flex h-[52px] items-center rounded-lg border border-gray-400 bg-white px-6 text-base text-gray-600 transition-colors hover:bg-gray-100"
              title="メモするほどでもない結果"
            >
              スキップ
            </button>
            {canGoBack && (
              <button
                type="button"
                onClick={moveToPrev}
                className="flex h-[52px] items-center rounded-lg border border-gray-400 bg-white px-6 text-base text-gray-600 transition-colors hover:bg-gray-100"
              >
                一つ戻る
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="flex h-[52px] items-center rounded-lg bg-amber-500 px-6 font-medium text-base text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
          入力が完了しました。
        </div>
      )}

      {toastMessage && (
        <output
          className="toast-enter -translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-[200]"
          aria-live="polite"
        >
          <div className="flex min-w-[280px] max-w-[90vw] flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white px-10 py-8 shadow-xl ring-1 ring-black/5">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="size-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <title>完了</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-center font-semibold text-gray-900 text-xl">
              {toastMessage}
            </p>
          </div>
        </output>
      )}
    </div>
  );
}

export default App;
