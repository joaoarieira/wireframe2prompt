import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";

/**
 * Stacking order of the document, topmost first. Clicking a row selects the
 * element; the arrows nudge its z-index (higher z wins overlapping cells).
 */
export function LayersPanel() {
  const { t } = useTranslation();
  const document = useEditorStore((state) => state.document);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const openInspector = useEditorStore((state) => state.openInspector);
  const changeElementZIndex = useEditorStore(
    (state) => state.changeElementZIndex,
  );

  if (document === null) {
    return null;
  }
  const topmostFirst = [...document.elementsByZIndex()].reverse();

  if (topmostFirst.length === 0) {
    return <p className="p-4 text-sm opacity-60">{t("layers.empty")}</p>;
  }

  return (
    <ul className="list p-2">
      {topmostFirst.map((element) => {
        // Custom name if the user gave one, else the translated element kind.
        const displayName = element.name ?? t(`elementKind.${element.kind}`);
        return (
          <li
            key={element.id}
            className={`list-row cursor-pointer items-center p-2 ${
              element.id === selectedElementId ? "bg-base-300" : ""
            }`}
            onClick={() => {
              // click = press already released, so opening here is fine
              selectElement(element.id);
              openInspector();
            }}
          >
            <span
              className="list-col-grow min-w-0 truncate text-sm"
              title={displayName}
            >
              {displayName}
            </span>
            <span className="text-xs opacity-50">z{element.zIndex}</span>
            <span className="join">
              <button
                type="button"
                className="btn join-item btn-ghost btn-xs"
                aria-label={t("layers.bringForward", { name: displayName })}
                onClick={(event) => {
                  event.stopPropagation();
                  changeElementZIndex(element.id, element.zIndex + 1);
                }}
              >
                ▲
              </button>
              <button
                type="button"
                className="btn join-item btn-ghost btn-xs"
                aria-label={t("layers.sendBackward", { name: displayName })}
                onClick={(event) => {
                  event.stopPropagation();
                  changeElementZIndex(element.id, element.zIndex - 1);
                }}
              >
                ▼
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
