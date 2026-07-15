import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../state/app-store/appStore";
import { ButtonGroup } from "../ui/button-group/ButtonGroup";
import { Button } from "../ui/button/Button";
import { TextInput } from "../ui/text-input/TextInput";
import { List, ListRow } from "../ui/list/List";
import { TextLink } from "../ui/text-link/TextLink";

/** Home screen: create a wireframe document or open/delete an existing one. */
export function DocumentListPage() {
  const { t } = useTranslation();
  const summaries = useEditorStore((state) => state.summaries);
  const refreshDocuments = useEditorStore((state) => state.refreshDocuments);
  const createDocument = useEditorStore((state) => state.createDocument);
  const deleteDocument = useEditorStore((state) => state.deleteDocument);
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (trimmed === "") {
      return;
    }
    const id = await createDocument(trimmed);
    await navigate({ to: "/editor/$documentId", params: { documentId: id } });
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">wireframe2prompt</h1>
      <ButtonGroup>
        <TextInput
          type="text"
          className="flex-1"
          placeholder={t("documentList.namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleCreate();
          }}
        />
        <Button variant="primary" size="sm" onClick={() => void handleCreate()}>
          {t("documentList.create")}
        </Button>
      </ButtonGroup>
      {summaries.length === 0 ? (
        <p className="text-sm opacity-60">{t("documentList.empty")}</p>
      ) : (
        <List rounded className="bg-base-200">
          {summaries.map((summary) => (
            <ListRow key={summary.id} className="items-center">
              <TextLink
                to="/editor/$documentId"
                params={{ documentId: summary.id }}
                grow
              >
                {summary.name}
              </TextLink>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("documentList.delete", { name: summary.name })}
                onClick={() => void deleteDocument(summary.id)}
              >
                ✕
              </Button>
            </ListRow>
          ))}
        </List>
      )}
    </div>
  );
}
