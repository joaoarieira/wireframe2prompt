import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  test("defaults to the info variant", () => {
    render(<Alert>hi</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("alert", "alert-info");
  });

  test("maps the warning variant and keeps its children", () => {
    render(
      <Alert variant="warning">
        <span>Not found</span>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("alert", "alert-warning");
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });
});
