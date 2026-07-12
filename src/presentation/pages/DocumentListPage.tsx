import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEditorStore } from "../state/app-store/appStore";

/** Home screen: create a wireframe document or open/delete an existing one. */
export function DocumentListPage() {
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
      <div className="join">
        <input
          type="text"
          className="input join-item flex-1"
          placeholder="New wireframe name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleCreate();
          }}
        />
        <button
          type="button"
          className="btn join-item btn-primary"
          onClick={() => void handleCreate()}
        >
          Create
        </button>
      </div>
      {summaries.length === 0 ? (
        <p className="text-sm opacity-60">No documents yet — create one.</p>
      ) : (
        <ul className="list rounded-box bg-base-200">
          {summaries.map((summary) => (
            <li key={summary.id} className="list-row items-center">
              <Link
                to="/editor/$documentId"
                params={{ documentId: summary.id }}
                className="link list-col-grow link-hover"
              >
                {summary.name}
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label={`Delete ${summary.name}`}
                onClick={() => void deleteDocument(summary.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
