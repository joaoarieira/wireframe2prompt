import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A pointer-positioned context menu rendered at fixed screen coordinates.
 * Closes on outside pointerdown or Escape.
 *
 * @example
 * <ContextMenu x={event.clientX} y={event.clientY} onClose={close}>
 *   <ContextMenuItem onClick={copy}>Copy</ContextMenuItem>
 * </ContextMenu>
 */
export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const ref = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <ul
      ref={ref}
      role="menu"
      className="menu fixed z-50 w-40 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      {children}
    </ul>
  );
}

/**
 * A single item inside a {@link ContextMenu}.
 *
 * @example <ContextMenuItem onClick={copy}>Copy</ContextMenuItem>
 */
export function ContextMenuItem({
  disabled,
  className,
  ...rest
}: ComponentProps<"button">) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        className={disabled ? "menu-disabled" : className}
        {...rest}
      />
    </li>
  );
}
