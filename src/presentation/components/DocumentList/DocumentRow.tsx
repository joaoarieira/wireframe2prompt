import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DocumentSummary } from "../../../domain/ports/IDocumentRepository";
import { useEditorStore } from "../../state/app-store/appStore";
import { ListCell, ListRow } from "../../ui/list/List";
import { TextLink } from "../../ui/text-link/TextLink";
import { Dropdown, DropdownItem } from "../../ui/dropdown/Dropdown";
import { DocumentRenameInput } from "./DocumentRenameInput";
import { relativeEditLabel } from "./relativeEditLabel";

interface DocumentRowProps {
  summary: DocumentSummary;
  /** "Now" snapshot the relative edit label is measured against. */
  nowMs: number;
}

/**
 * One wireframe in the home listing: its name links to the editor, the right
 * side shows how long ago it was edited, and an actions menu (revealed on hover
 * or keyboard focus, so the resting row stays quiet) renames or deletes it.
 * Picking "Rename" swaps the name for an inline field.
 *
 * @example <DocumentRow summary={summary} nowMs={renderedAt} />
 */
export function DocumentRow({ summary, nowMs }: DocumentRowProps) {
  const { t } = useTranslation();
  const renameDocument = useEditorStore((state) => state.renameDocument);
  const deleteDocument = useEditorStore((state) => state.deleteDocument);
  const [renaming, setRenaming] = useState(false);
  const edited = relativeEditLabel(summary.lastEdit, nowMs);

  const commitRename = (draft: string) => {
    setRenaming(false);
    const name = draft.trim();
    if (name !== "" && name !== summary.name) {
      void renameDocument(summary.id, name);
    }
  };

  return (
    // `group` drives the hover/focus reveal of the actions trigger below.
    <ListRow className="group items-center gap-4">
      {renaming ? (
        <ListCell grow className="min-w-0">
          <DocumentRenameInput
            name={summary.name}
            label={t("documentList.renameLabel", { name: summary.name })}
            onCommit={commitRename}
            onCancel={() => setRenaming(false)}
          />
        </ListCell>
      ) : (
        <TextLink
          to="/editor/$documentId"
          params={{ documentId: summary.id }}
          grow
          className="truncate"
        >
          {summary.name}
        </TextLink>
      )}
      <span className="shrink-0 text-sm opacity-60">
        {t(edited.key, { count: edited.count })}
      </span>
      <Dropdown
        openDown
        trigger="⋮"
        triggerLabel={t("documentList.actions", { name: summary.name })}
        // Invisible rather than removed, so it keeps its place in the row and
        // stays reachable by Tab (which reveals it via group-focus-within).
        // Touch pointers have no hover, so there it is always visible.
        className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100"
      >
        <DropdownItem
          aria-label={t("documentList.renameLabel", { name: summary.name })}
          onClick={() => setRenaming(true)}
        >
          {t("documentList.rename")}
        </DropdownItem>
        <DropdownItem
          aria-label={t("documentList.deleteLabel", { name: summary.name })}
          onClick={() => void deleteDocument(summary.id)}
        >
          {t("documentList.delete")}
        </DropdownItem>
      </Dropdown>
    </ListRow>
  );
}
