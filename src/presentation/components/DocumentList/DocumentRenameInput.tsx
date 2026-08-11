import { useRef, useState } from "react";
import { TextInput } from "../../ui/text-input/TextInput";

interface DocumentRenameInputProps {
  /** Name the field starts with, pre-selected so typing replaces it. */
  name: string;
  /** Accessible name for the field (the feature passes a `t(...)`). */
  label: string;
  /** Called with the typed draft when the user confirms (Enter or blur). */
  onCommit(draft: string): void;
  /** Called when the user backs out with Escape. */
  onCancel(): void;
}

/**
 * Inline rename field shown in place of a document's name in the list. Enter or
 * a blur confirms, Escape backs out; whichever happens first wins, so the blur
 * that follows Escape (or the unmount after Enter) can't fire a second outcome.
 *
 * @example <DocumentRenameInput name="Login" label="Rename Login" onCommit={rename} onCancel={close} />
 */
export function DocumentRenameInput({
  name,
  label,
  onCommit,
  onCancel,
}: DocumentRenameInputProps) {
  const [draft, setDraft] = useState(name);
  const settled = useRef(false);

  const settle = (outcome: () => void) => {
    if (settled.current) {
      return;
    }
    settled.current = true;
    outcome();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      settle(() => onCommit(draft));
    }
    if (event.key === "Escape") {
      settle(onCancel);
    }
  };

  return (
    <TextInput
      type="text"
      // The field only exists because the user just picked "Rename", so taking
      // focus (and selecting the old name) is exactly what they asked for.
      autoFocus
      aria-label={label}
      className="w-full"
      value={draft}
      onFocus={(event) => event.target.select()}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => settle(() => onCommit(draft))}
    />
  );
}
