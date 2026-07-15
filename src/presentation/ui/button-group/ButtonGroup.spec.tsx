import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "./ButtonGroup";
import { Button } from "../button/Button";

describe("ButtonGroup", () => {
  test("wraps its children in a daisyUI join and stamps join-item on each", () => {
    render(
      <ButtonGroup aria-label="history">
        <Button>Undo</Button>
        <Button>Redo</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group", { name: "history" })).toHaveClass("join");
    expect(screen.getByRole("button", { name: "Undo" })).toHaveClass(
      "join-item",
    );
    expect(screen.getByRole("button", { name: "Redo" })).toHaveClass(
      "join-item",
    );
  });

  test("preserves each child's own classes while adding join-item", () => {
    render(
      <ButtonGroup>
        <Button variant="primary">Create</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", { name: "Create" })).toHaveClass(
      "btn-primary",
      "join-item",
    );
  });

  test("passes non-element children through untouched", () => {
    render(<ButtonGroup>plain text</ButtonGroup>);
    expect(screen.getByText("plain text")).toHaveClass("join");
  });
});
