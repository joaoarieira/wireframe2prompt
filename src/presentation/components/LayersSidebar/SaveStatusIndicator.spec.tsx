import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { editorStore } from "../../state/app-store/appStore";

afterEach(() => {
  cleanup();
  editorStore.setState({ saveStatus: "hidden" });
});

describe("SaveStatusIndicator", () => {
  test("renders nothing while the status is hidden", () => {
    editorStore.setState({ saveStatus: "hidden" });
    const { container } = render(<SaveStatusIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows "Saving" with a spinner while the autosave runs', () => {
    editorStore.setState({ saveStatus: "saving" });
    render(<SaveStatusIndicator />);

    expect(screen.getByText("Saving")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test('shows "Saved" once the autosave lands', () => {
    editorStore.setState({ saveStatus: "saved" });
    render(<SaveStatusIndicator />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("compact mode drops the text label but keeps it as the accessible name", () => {
    editorStore.setState({ saveStatus: "saved" });
    render(<SaveStatusIndicator compact />);

    // Label text is not rendered inline, but rides on title/aria-label.
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Saved")).toHaveAttribute("title", "Saved");
  });
});
