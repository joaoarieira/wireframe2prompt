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
 * target) shows only Paste.
 */
export function EditorContextMenu() {
  const { t } = useTranslation();
  const contextMenu = useEditorStore((s) => s.contextMenu);
  const clipboard = useEditorStore((s) => s.clipboard);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const copySelection = useEditorStore((s) => s.copySelection);
  const beginPastePreview = useEditorStore((s) => s.beginPastePreview);
  const duplicateSelection = useEditorStore((s) => s.duplicateSelection);
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
      {elementOnly && (
        <ContextMenuItem disabled={noSelection} onClick={handle(copySelection)}>
          {t("contextMenu.copy")}
        </ContextMenuItem>
      )}
      <ContextMenuItem
        disabled={noClipboard}
        onClick={handle(() => beginPastePreview(contextMenu.cell))}
      >
        {t("contextMenu.paste")}
      </ContextMenuItem>
      {elementOnly && (
        <ContextMenuItem
          disabled={noSelection}
          onClick={handle(duplicateSelection)}
        >
          {t("contextMenu.duplicate")}
        </ContextMenuItem>
      )}
      {elementOnly && (
        <ContextMenuItem
          disabled={noSelection}
          onClick={handle(removeSelectedElements)}
        >
          {t("contextMenu.delete")}
        </ContextMenuItem>
      )}
    </ContextMenu>
  );
}
