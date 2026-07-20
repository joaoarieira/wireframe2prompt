import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  test("defaults to the medium spinner", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("loading", "loading-spinner");
    expect(spinner).not.toHaveClass("loading-lg");
  });

  test("adds loading-lg for the large size", () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("loading-lg");
  });

  test("adds loading-xs for the extra-small size", () => {
    render(<Spinner size="xs" />);
    expect(screen.getByRole("status")).toHaveClass("loading-xs");
  });
});
