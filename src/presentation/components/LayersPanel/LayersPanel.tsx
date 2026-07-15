import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { List, ListCell, ListRow } from "../../ui/list/List";
import { ButtonGroup } from "../../ui/button-group/ButtonGroup";
import { Button } from "../../ui/button/Button";

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
    <List className="p-2">
      {topmostFirst.map((element) => {
        // Custom name if the user gave one, else the translated element kind.
        const displayName = element.name ?? t(`elementKind.${element.kind}`);
        return (
          <ListRow
            key={element.id}
            className={`cursor-pointer items-center p-2 ${
              element.id === selectedElementId ? "bg-base-300" : ""
            }`}
            onClick={() => {
              // click = press already released, so opening here is fine
              selectElement(element.id);
              openInspector();
            }}
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
