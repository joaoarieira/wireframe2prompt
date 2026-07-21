import { useEffect } from "react";
import type { ReactNode } from "react";
import { cx } from "../class-names/classNames";

interface BottomSheetProps {
  /** Whether the sheet is shown. Closed → nothing is mounted. */
  open: boolean;
  /** Called on backdrop click and on Escape. */
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** Sheet body (scrolls when it overflows the max height). */
  children: ReactNode;
  /** Layout only, merged onto the `modal-box`. */
  className?: string;
}

/**
 * A daisyUI bottom sheet (`modal modal-bottom`) driven by React state instead of
 * the native `<dialog>`, so the editor keeps a single source of truth for
 * open/close. Renders nothing while closed — the body (Layers/Inspector) is
 * never mounted hidden. Backdrop tap and Escape both call `onClose`; the box
 * caps at ~60vh and scrolls, with safe-area padding for the phone notch.
 *
 * @example
 * <BottomSheet open={layersPanelOpen} onClose={close} label="Layers">
 *   <LayersPanel />
 * </BottomSheet>
 */
export function BottomSheet({
  open,
  onClose,
  label,
  children,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal modal-open modal-bottom"
      role="dialog"
      aria-label={label}
    >
      <div
        className={cx(
          "modal-box max-h-[60vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        {children}
      </div>
      {/* A full-surface button so a tap outside the box closes the sheet; the
          box above sits over it and swallows taps on the content. */}
      <button
        type="button"
        aria-label={label}
        className="modal-backdrop"
        onClick={onClose}
      />
    </div>
  );
}
