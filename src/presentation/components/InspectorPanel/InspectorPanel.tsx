import type { ChangeEvent, KeyboardEvent } from "react";
import { useEditorStore } from "../../state/app-store/appStore";
import { selectedElementOf } from "../../state/editor-store/editorStore";
import type { Element } from "../../../domain/entities/element/Element";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";

function integerFrom(event: ChangeEvent<HTMLInputElement>): number | null {
  const value = Number(event.target.value);
  return Number.isInteger(value) ? value : null;
}

/** Edits the selected element; closeable, only rendered while one exists. */
export function InspectorPanel() {
  const document = useEditorStore((state) => state.document);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const closeInspector = useEditorStore((state) => state.closeInspector);
  const removeSelectedElement = useEditorStore(
    (state) => state.removeSelectedElement,
  );
  const element = selectedElementOf({ document, selectedElementId });

  if (element === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">
          {element.kind}{" "}
          <span className="opacity-50">#{element.id.slice(0, 8)}</span>
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          aria-label="Close inspector"
          onClick={closeInspector}
        >
          ✕
        </button>
      </div>
      <SelectedElementFields element={element} />
      <button
        type="button"
        className="btn btn-outline btn-error btn-sm mt-2"
        onClick={removeSelectedElement}
      >
        Delete
      </button>
    </div>
  );
}

function SelectedElementFields({ element }: { element: Element }) {
  const moveElementTo = useEditorStore((state) => state.moveElementTo);
  const resizeElementTo = useEditorStore((state) => state.resizeElementTo);
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);

  const moveTo = (col: number, row: number) =>
    moveElementTo(element.id, Position.create(col, row));
  const resizeTo = (width: number, height: number) => {
    if (width >= 1 && height >= 1) {
      resizeElementTo(element.id, Size.create(width, height));
    }
  };

  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Name</legend>
        <input
          type="text"
          aria-label="Element name"
          className="input input-sm w-full"
          value={element.name ?? ""}
          onChange={(event) =>
            editElementProps(element.id, {
              name: event.target.value === "" ? null : event.target.value,
            })
          }
          onFocus={() => beginTextEditing(element.id)}
          onBlur={endTextEditing}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Position</legend>
        <div className="flex items-center gap-2">
          <label className="label" htmlFor="inspector-col">
            col
          </label>
          <input
            id="inspector-col"
            type="number"
            className="input input-sm w-16"
            value={element.position.col}
            onChange={(event) => {
              const col = integerFrom(event);
              if (col !== null) moveTo(col, element.position.row);
            }}
          />
          <label className="label" htmlFor="inspector-row">
            row
          </label>
          <input
            id="inspector-row"
            type="number"
            className="input input-sm w-16"
            value={element.position.row}
            onChange={(event) => {
              const row = integerFrom(event);
              if (row !== null) moveTo(element.position.col, row);
            }}
          />
        </div>
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Size</legend>
        <div className="flex items-center gap-2">
          <label className="label" htmlFor="inspector-width">
            w
          </label>
          <input
            id="inspector-width"
            type="number"
            min={1}
            className="input input-sm w-16"
            value={element.size.width}
            onChange={(event) => {
              const width = integerFrom(event);
              if (width !== null) resizeTo(width, element.size.height);
            }}
          />
          <label className="label" htmlFor="inspector-height">
            h
          </label>
          <input
            id="inspector-height"
            type="number"
            min={1}
            className="input input-sm w-16"
            value={element.size.height}
            onChange={(event) => {
              const height = integerFrom(event);
              if (height !== null) resizeTo(element.size.width, height);
            }}
          />
        </div>
      </fieldset>
      {element instanceof TextElement && <TextContentField element={element} />}
      {element instanceof LineElement && (
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Orientation</legend>
          <select
            aria-label="Line orientation"
            className="select select-sm w-full"
            value={element.orientation}
            onChange={(event) =>
              editElementProps(element.id, { orientation: event.target.value })
            }
          >
            <option value="h">horizontal</option>
            <option value="v">vertical</option>
          </select>
        </fieldset>
      )}
    </>
  );
}

/**
 * Text editor for TextElements. While focused it holds the store's
 * text-editing session (single-key shortcuts suspended); Enter ends the
 * session, Shift+Enter inserts a line break (the element auto-fits).
 */
function TextContentField({ element }: { element: TextElement }) {
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.blur();
      endTextEditing(); // explicit — blur may not fire when unfocused (jsdom)
    }
  };

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Text</legend>
      <textarea
        aria-label="Text content"
        className="textarea textarea-sm w-full"
        rows={3}
        value={element.text}
        onChange={(event) =>
          editElementProps(element.id, { text: event.target.value })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
        onKeyDown={handleKeyDown}
      />
    </fieldset>
  );
}
