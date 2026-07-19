import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { List, ListCell, ListRow } from "../../ui/list/List";
import { ButtonGroup } from "../../ui/button-group/ButtonGroup";
import { Button } from "../../ui/button/Button";

/**
 * Stacking order of the document, topmost first. Clicking a row selects the
 * element and opens the inspector; Shift+clicking toggles it without opening
 * the inspector. The arrows nudge z-index (higher z wins overlapping cells).
 */
export function LayersPanel() {
  const { t } = useTranslation();
  const document = useEditorStore((state) => state.document);
  const selectedElementIds = useEditorStore(
    (state) => state.selectedElementIds,
  );
  const selectElement = useEditorStore((state) => state.selectElement);
  const toggleElementSelection = useEditorStore(
    (state) => state.toggleElementSelection,
  );
  const openInspector = useEditorStore((state) => state.openInspector);
  const changeElementZIndex = useEditorStore(
    (state) => state.changeElementZIndex,
  );
  const openContextMenu = useEditorStore((state) => state.openContextMenu);

  if (document === null) {
    return null;
  }
  const topmostFirst = [...document.elementsByZIndex()].reverse();

  if (topmostFirst.length === 0) {
    return <p className="p-4 text-sm opacity-60">{t("layers.empty")}</p>;
  }

  const handleRowClick = (event: MouseEvent, elementId: string) => {
    if (event.shiftKey) {
      toggleElementSelection(elementId);
    } else {
      selectElement(elementId);
      openInspector();
    }
  };

  const handleRowContextMenu = (event: MouseEvent, elementId: string) => {
    event.preventDefault();
    if (!selectedElementIds.includes(elementId)) {
      selectElement(elementId);
    }
    openContextMenu({
      clientX: event.clientX,
      clientY: event.clientY,
      cell: null,
      target: "element",
    });
  };

  return (
    // select-none: shift+click multi-selects rows; without it the browser
    // extends a text selection from the previously clicked row instead.
    <List className="p-2 select-none">
      {topmostFirst.map((element) => {
        // Custom name if the user gave one, else the translated element kind.
        const displayName = element.name ?? t(`elementKind.${element.kind}`);
        const isSelected = selectedElementIds.includes(element.id);
        return (
          <ListRow
            key={element.id}
            className={`cursor-pointer items-center p-2 ${
              isSelected ? "bg-base-300" : ""
            }`}
            onClick={(event) => handleRowClick(event, element.id)}
            onContextMenu={(event) => handleRowContextMenu(event, element.id)}
          >
            <ListCell
              grow
              className="min-w-0 truncate text-sm"
              title={displayName}
            >
              {displayName}
            </ListCell>
            <span className="text-xs opacity-50">z{element.zIndex}</span>
            <ButtonGroup>
              <Button
                variant="ghost"
                size="xs"
                aria-label={t("layers.bringForward", { name: displayName })}
                onClick={(event) => {
                  event.stopPropagation();
                  changeElementZIndex(element.id, element.zIndex + 1);
                }}
              >
                ▲
              </Button>
              <Button
                variant="ghost"
                size="xs"
                aria-label={t("layers.sendBackward", { name: displayName })}
                onClick={(event) => {
                  event.stopPropagation();
                  changeElementZIndex(element.id, element.zIndex - 1);
                }}
              >
                ▼
              </Button>
            </ButtonGroup>
          </ListRow>
        );
      })}
    </List>
  );
}
