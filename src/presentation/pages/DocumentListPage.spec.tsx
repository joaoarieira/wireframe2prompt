import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { DocumentListPage } from "./DocumentListPage";
import { editorStore } from "../state/app-store/appStore";

const navigate = vi.fn();

// Only createLink (TextLink) and useNavigate touch the router here; both are
// mocked to plain stand-ins so no RouterProvider is required (see EditorPage.spec).
vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({
      to,
      params: _params,
      ...rest
    }: { to?: string; params?: unknown } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
  useNavigate: () => navigate,
}));

const refreshDocuments = vi.fn(async () => {});
const createDocument = vi.fn(async () => "new-id");
const deleteDocument = vi.fn(async () => {});

function setSummaries(
  summaries: { id: string; name: string; lastEdit?: number }[],
) {
  editorStore.setState({
    summaries: summaries.map((s) => ({ lastEdit: 0, ...s })),
    refreshDocuments,
    createDocument,
    deleteDocument,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  editorStore.setState({ summaries: [] });
});

describe("DocumentListPage", () => {
  test("refreshes documents on mount and shows the empty hint", () => {
    setSummaries([]);
    render(<DocumentListPage />);

    expect(refreshDocuments).toHaveBeenCalled();
    expect(
      screen.getByText("No wireframes yet. Create one."),
    ).toBeInTheDocument();
  });

  test("sets the home tab title and renders the indexable tagline", () => {
    setSummaries([]);
    render(<DocumentListPage />);

    expect(document.title).toBe(
      "Draw ASCII wireframes for AI prompts — wireframe2prompt",
    );
    expect(
      screen.getByText(/Sketch your screen on an ASCII grid/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Learn how it works" }),
    ).toBeInTheDocument();
  });

  test("lists existing documents as rows with an actions menu", () => {
    setSummaries([{ id: "a", name: "Alpha" }]);
    render(<DocumentListPage />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actions for Alpha" }),
    ).toBeInTheDocument();
  });

  test("shows how long ago each document was edited", () => {
    setSummaries([
      { id: "a", name: "Alpha", lastEdit: Date.now() - 5 * 60_000 },
    ]);
    render(<DocumentListPage />);

    expect(screen.getByText("Edited 5m ago")).toBeInTheDocument();
  });

  test("a blank name neither creates nor navigates", async () => {
    setSummaries([]);
    render(<DocumentListPage />);

    fireEvent.change(screen.getByPlaceholderText("New wireframe name"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createDocument).not.toHaveBeenCalled());
    expect(navigate).not.toHaveBeenCalled();
  });

  test("creating a document navigates to its editor route", async () => {
    setSummaries([]);
    render(<DocumentListPage />);

    fireEvent.change(screen.getByPlaceholderText("New wireframe name"), {
      target: { value: "  Login  " },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("New wireframe name"), {
      key: "Enter",
    });

    await waitFor(() => expect(createDocument).toHaveBeenCalledWith("Login"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/editor/$documentId",
      params: { documentId: "new-id" },
    });
  });

  test("a non-Enter key press does not submit", () => {
    setSummaries([]);
    render(<DocumentListPage />);

    fireEvent.keyDown(screen.getByPlaceholderText("New wireframe name"), {
      key: "a",
    });
    expect(createDocument).not.toHaveBeenCalled();
  });
});
