import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AboutPage } from "./AboutPage";

const back = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ history: { back } }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AboutPage", () => {
  test("renders the product name in the header", () => {
    render(<AboutPage />);
    expect(screen.getByText("wireframe2prompt")).toBeInTheDocument();
  });

  test("the back button returns to the previous route via history", () => {
    render(<AboutPage />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(back).toHaveBeenCalledOnce();
  });

  test("renders the section headings and the summary", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "About wireframe2prompt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What is wireframe2prompt?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How to use" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tech stack" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/exports your layouts as plain text/),
    ).toBeInTheDocument();
  });
});
