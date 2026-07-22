import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../state/app-store/appStore";
import { usePageMetadata } from "../seo/usePageMetadata";
import { LayersSidebarFooter } from "../components/LayersSidebar/LayersSidebarFooter";
import { ButtonGroup } from "../ui/button-group/ButtonGroup";
import { Button } from "../ui/button/Button";
import { TextInput } from "../ui/text-input/TextInput";
import { List, ListRow } from "../ui/list/List";
import { TextLink } from "../ui/text-link/TextLink";
import { relativeEditLabel } from "./relativeEditLabel";

/** Home screen: create a wireframe document or open/delete an existing one. */
export function DocumentListPage() {
  const { t } = useTranslation();
  const summaries = useEditorStore((state) => state.summaries);
  const refreshDocuments = useEditorStore((state) => state.refreshDocuments);
  const createDocument = useEditorStore((state) => state.createDocument);
  const deleteDocument = useEditorStore((state) => state.deleteDocument);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  // Snapshot "now" once per mount so the relative-edit labels are computed from
  // a stable, pure value instead of calling Date.now() during render.
  const [renderedAt] = useState(() => Date.now());
  usePageMetadata({
    titleKey: "seo.homeTitle",
    descriptionKey: "seo.homeDescription",
  });

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
    // Full-height column so the shared footer sits at the bottom of the page,
    // not directly under the (short) document list.
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">wireframe2prompt</h1>
          {/* One value sentence + link so the landing has indexable copy; the
              long-form content lives on /about. */}
          <p className="text-sm opacity-70">
            {t("documentList.tagline")}{" "}
            <TextLink to="/about">{t("documentList.taglineLink")}</TextLink>
          </p>
        </div>
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
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleCreate()}
          >
            {t("documentList.create")}
          </Button>
        </ButtonGroup>
        {summaries.length === 0 ? (
          <p className="text-sm opacity-60">{t("documentList.empty")}</p>
        ) : (
          <List rounded className="bg-base-200">
            {summaries.map((summary) => {
              const edited = relativeEditLabel(summary.lastEdit, renderedAt);
              return (
                <ListRow key={summary.id} className="items-center gap-4">
                  <TextLink
                    to="/editor/$documentId"
                    params={{ documentId: summary.id }}
                    grow
                    className="truncate"
                  >
                    {summary.name}
                  </TextLink>
                  <span className="shrink-0 text-sm opacity-60">
                    {t(edited.key, { count: edited.count })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("documentList.delete", {
                      name: summary.name,
                    })}
                    onClick={() => void deleteDocument(summary.id)}
                  >
                    ✕
                  </Button>
                </ListRow>
              );
            })}
          </List>
        )}
      </div>
      <LayersSidebarFooter />
    </div>
  );
}
