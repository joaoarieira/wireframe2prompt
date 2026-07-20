import { afterEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { AboutExample } from "./AboutExample";

const writeText = vi.fn().mockResolvedValue(undefined);

vi.stubGlobal("navigator", { clipboard: { writeText } });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("AboutExample", () => {
  test("renders the title and the ASCII block", () => {
    render(<AboutExample title="Google" ascii="+--+\n|  |\n+--+" />);

    expect(screen.getByRole("heading", { name: "Google" })).toBeInTheDocument();
    expect(screen.getByText(/\+--\+/)).toBeInTheDocument();
  });

  test("copies the ASCII, shows Copied!, then reverts to Copy", async () => {
    vi.useFakeTimers();
    render(<AboutExample title="Google" ascii="ascii-content" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });

    expect(writeText).toHaveBeenCalledWith("ascii-content");
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
