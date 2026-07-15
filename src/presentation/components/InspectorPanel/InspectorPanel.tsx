import type { ChangeEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { selectedElementOf } from "../../state/editor-store/editorStore";
import type { Element } from "../../../domain/entities/element/Element";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";
import { Button } from "../../ui/button/Button";
import { Field, FieldLabel } from "../../ui/field/Field";
import { TextInput } from "../../ui/text-input/TextInput";
import { TextArea } from "../../ui/text-area/TextArea";
import { Select } from "../../ui/select/Select";

function integerFrom(event: ChangeEvent<HTMLInputElement>): number | null {
  const value = Number(event.target.value);
  return Number.isInteger(value) ? value : null;
}

/** Edits the selected element; closeable, only rendered while one exists. */
export function InspectorPanel() {
  const { t } = useTranslation();
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
          {t(`elementKind.${element.kind}`)}{" "}
          <span className="opacity-50">#{element.id.slice(0, 8)}</span>
        </h2>
        <Button
          variant="ghost"
          size="xs"
          aria-label={t("inspector.close")}
          onClick={closeInspector}
        >
          ✕
        </Button>
      </div>
      <SelectedElementFields element={element} />
      <Button
        variant="danger"
        size="sm"
        className="mt-2"
        onClick={removeSelectedElement}
      >
        {t("inspector.delete")}
      </Button>
    </div>
  );
}

function SelectedElementFields({ element }: { element: Element }) {
  const { t } = useTranslation();
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
      <Field legend={t("inspector.name")}>
        <TextInput
          type="text"
          aria-label={t("inspector.nameField")}
          className="w-full"
          value={element.name ?? ""}
          onChange={(event) =>
            editElementProps(element.id, {
              name: event.target.value === "" ? null : event.target.value,
            })
          }
          onFocus={() => beginTextEditing(element.id)}
          onBlur={endTextEditing}
        />
      </Field>
      <Field legend={t("inspector.position")}>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="inspector-col">{t("inspector.col")}</FieldLabel>
          <TextInput
            id="inspector-col"
            type="number"
            className="w-16"
            value={element.position.col}
            onChange={(event) => {
              const col = integerFrom(event);
              if (col !== null) moveTo(col, element.position.row);
            }}
          />
          <FieldLabel htmlFor="inspector-row">{t("inspector.row")}</FieldLabel>
          <TextInput
            id="inspector-row"
            type="number"
            className="w-16"
            value={element.position.row}
            onChange={(event) => {
              const row = integerFrom(event);
              if (row !== null) moveTo(element.position.col, row);
            }}
          />
        </div>
      </Field>
      <Field legend={t("inspector.size")}>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="inspector-width">
            {t("inspector.width")}
          </FieldLabel>
          <TextInput
            id="inspector-width"
            type="number"
            min={1}
            className="w-16"
            value={element.size.width}
            onChange={(event) => {
              const width = integerFrom(event);
              if (width !== null) resizeTo(width, element.size.height);
            }}
          />
          <FieldLabel htmlFor="inspector-height">
            {t("inspector.height")}
          </FieldLabel>
          <TextInput
            id="inspector-height"
            type="number"
            min={1}
            className="w-16"
            value={element.size.height}
            onChange={(event) => {
              const height = integerFrom(event);
              if (height !== null) resizeTo(element.size.width, height);
            }}
          />
        </div>
      </Field>
      {element instanceof TextElement && <TextContentField element={element} />}
      {element instanceof LineElement && (
        <Field legend={t("inspector.orientation")}>
          <Select
            aria-label={t("inspector.orientationField")}
            className="w-full"
            value={element.orientation}
            onChange={(event) =>
              editElementProps(element.id, { orientation: event.target.value })
            }
          >
            <option value="h">{t("inspector.horizontal")}</option>
            <option value="v">{t("inspector.vertical")}</option>
          </Select>
        </Field>
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
  const { t } = useTranslation();
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
    <Field legend={t("inspector.text")}>
      <TextArea
        aria-label={t("inspector.textContent")}
        className="w-full"
        rows={3}
        value={element.text}
        onChange={(event) =>
          editElementProps(element.id, { text: event.target.value })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
        onKeyDown={handleKeyDown}
      />
    </Field>
  );
}
