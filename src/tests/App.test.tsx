import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../presentation/router";

test("boots the app on the document list page", async () => {
  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading")).toHaveTextContent(
    "wireframe2prompt",
  );
});
