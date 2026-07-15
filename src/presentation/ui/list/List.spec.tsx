import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { List, ListCell, ListRow } from "./List";

describe("List", () => {
  test("renders a daisyUI list, optionally rounded", () => {
    const { rerender } = render(<List aria-label="docs" />);
    const list = screen.getByRole("list", { name: "docs" });
    expect(list).toHaveClass("list");
    expect(list).not.toHaveClass("rounded-box");

    rerender(<List aria-label="docs" rounded className="bg-base-200" />);
    expect(screen.getByRole("list", { name: "docs" })).toHaveClass(
      "rounded-box",
      "bg-base-200",
    );
  });
});

describe("ListRow", () => {
  test("renders a list-row list item", () => {
    render(
      <ul>
        <ListRow className="items-center">row</ListRow>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveClass(
      "list-row",
      "items-center",
    );
  });
});

describe("ListCell", () => {
  test("only carries list-col-grow when grow is set", () => {
    const { rerender } = render(<ListCell className="truncate">a</ListCell>);
    expect(screen.getByText("a")).not.toHaveClass("list-col-grow");

    rerender(<ListCell grow>b</ListCell>);
    expect(screen.getByText("b")).toHaveClass("list-col-grow");
  });
});
