import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AboutCardGrid } from "./AboutCardGrid";

afterEach(cleanup);

describe("AboutCardGrid", () => {
  test("renders one card per item", () => {
    render(<AboutCardGrid items={["Alpha", "Beta"]} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  test("numbered prefixes each card with its 1-based position", () => {
    render(<AboutCardGrid numbered items={["First", "Second"]} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("without numbered no ordinal is shown", () => {
    render(<AboutCardGrid items={["Only"]} />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
