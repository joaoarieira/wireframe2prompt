import { describe, expect, test } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

describe("router", () => {
  test("navigates to the About page", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate({ to: "/about" });
    });

    expect(
      await screen.findByRole("heading", { name: "About wireframe2prompt" }),
    ).toBeInTheDocument();
  });

  test("the editor route loader opens the requested document", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate({
        to: "/editor/$documentId",
        params: { documentId: "does-not-exist" },
      });
    });

    // Unknown id resolves through the loader to the not-found state.
    await waitFor(() =>
      expect(screen.getByText("Wireframe not found.")).toBeInTheDocument(),
    );
  });
});
