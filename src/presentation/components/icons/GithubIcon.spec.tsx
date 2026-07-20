import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GithubIcon } from "./GithubIcon";

afterEach(cleanup);

describe("GithubIcon", () => {
  test("renders an svg that inherits the current text color", () => {
    const { container } = render(<GithubIcon className="size-4" />);
    const svg = container.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("size-4");
    expect(svg).toHaveAttribute("fill", "currentColor");
  });

  test("forwards svg props such as aria-hidden", () => {
    const { container } = render(<GithubIcon aria-hidden />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
