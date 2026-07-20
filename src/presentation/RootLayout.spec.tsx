import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RootLayout } from "./RootLayout";
import { useAppCursors } from "./hooks/useAppCursors";

vi.mock("@tanstack/react-router", () => ({
  Outlet: () => <div data-testid="outlet" />,
}));
vi.mock("./hooks/useAppCursors", () => ({
  useAppCursors: vi.fn(),
}));

afterEach(() => cleanup());

describe("RootLayout", () => {
  test("installs the app-wide cursors and renders the route outlet", () => {
    render(<RootLayout />);
    expect(useAppCursors).toHaveBeenCalled();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });
});
