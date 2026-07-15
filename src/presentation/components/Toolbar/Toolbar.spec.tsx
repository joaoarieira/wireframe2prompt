import { afterEach, describe, expect, test } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import i18n from "../../i18n/i18n";

// The setup file pins "en"; restore it so this file's PT switch stays local.
afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

describe("Toolbar i18n", () => {
  test("renders the English labels by default", () => {
    render(<Toolbar />);

    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.getByText("Redo")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  test("re-renders in Portuguese after changeLanguage", async () => {
    render(<Toolbar />);

    await act(async () => {
      await i18n.changeLanguage("pt");
    });

    expect(screen.getByText("Desfazer")).toBeInTheDocument();
    expect(screen.getByText("Salvar")).toBeInTheDocument();
  });
});
