import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import {
  ContextMenu,
  ContextMenuItem,
} from "../../ui/context-menu/ContextMenu";

/**
 * Context menu for canvas and layers-panel right-clicks. Rendered once in
 * EditorPage; reads position from the store so no prop drilling is needed.
 * Right-clicking an element shows the full menu; free canvas area ("empty"
 * target) shows only Paste and Select all.
 */
export function EditorContextMenu() {
  const { t } = useTranslation();
  const contextMenu = useEditorStore((s) => s.contextMenu);
  const clipboard = useEditorStore((s) => s.clipboard);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const autoOpenInspector = useEditorStore((s) => s.autoOpenInspector);
  const openInspector = useEditorStore((s) => s.openInspector);
  const copySelection = useEditorStore((s) => s.copySelection);
  const beginPastePreview = useEditorStore((s) => s.beginPastePreview);
  const duplicateSelection = useEditorStore((s) => s.duplicateSelection);
  const selectAllElements = useEditorStore((s) => s.selectAllElements);
  const documentIsEmpty = useEditorStore(
    (s) => (s.document?.elements.length ?? 0) === 0,
  );
  const removeSelectedElements = useEditorStore(
    (s) => s.removeSelectedElements,
  );
  const closeContextMenu = useEditorStore((s) => s.closeContextMenu);

  if (contextMenu === null) return null;

  const noSelection = selectedElementIds.length === 0;
  const noClipboard = clipboard.length === 0;

  const handle = (action: () => void) => () => {
    action();
    closeContextMenu();
  };

  const elementOnly = contextMenu.target === "element";

  return (
    <ContextMenu
      x={contextMenu.clientX}
      y={contextMenu.clientY}
      onClose={closeContextMenu}
    >
      {/* Edit only where the inspector isn't always available (phone/tablet):
          on desktop it opens on select, so the item would be redundant. */}
      {elementOnly && !autoOpenInspector && (
        <ContextMenuItem
          disabled={noSelection}
          onClick={handle(openInspector)}
        >
          {t("contextMenu.edit")}
        </ContextMenuItem>
      )}
      {elementOnly && (
        <ContextMenuItem
          disabled={noSelection}
          shortcut={t("contextMenu.copyShortcut")}
          onClick={handle(copySelection)}
        >
          {t("contextMenu.copy")}
        </ContextMenuItem>
      )}
      <ContextMenuItem
        disabled={noClipboard}
        shortcut={t("contextMenu.pasteShortcut")}
        onClick={handle(() => beginPastePreview(contextMenu.cell))}
      >
        {t("contextMenu.paste")}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={documentIsEmpty}
        shortcut={t("contextMenu.selectAllShortcut")}
        onClick={handle(selectAllElements)}
      >
        {t("contextMenu.selectAll")}
      </ContextMenuItem>
      {elementOnly && (
        <ContextMenuItem
          disabled={noSelection}
          shortcut={t("contextMenu.duplicateShortcut")}
          onClick={handle(duplicateSelection)}
        >
          {t("contextMenu.duplicate")}
        </ContextMenuItem>
      )}
      {elementOnly && (
        <ContextMenuItem
          disabled={noSelection}
          shortcut={t("contextMenu.deleteShortcut")}
          onClick={handle(removeSelectedElements)}
        >
          {t("contextMenu.delete")}
        </ContextMenuItem>
      )}
    </ContextMenu>
  );
}
