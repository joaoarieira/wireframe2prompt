import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  MoveRight,
  MoveDown,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { selectedElementOf } from "../../state/editor-store/editorStore";
import type { Element } from "../../../domain/entities/element/Element";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";
import { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { TableElement } from "../../../domain/entities/element/TableElement";
import { TabsElement } from "../../../domain/entities/element/TabsElement";
import { FieldElement } from "../../../domain/entities/element/FieldElement";
import type { FieldName } from "../../../domain/entities/element/FieldElement";
import { ButtonElement } from "../../../domain/entities/element/ButtonElement";
import { FreeDrawElement } from "../../../domain/entities/element/FreeDrawElement";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";
import type { BorderStyleName } from "../../../domain/value-objects/border-style/BorderStyle";
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
  const selectedElementIds = useEditorStore(
    (state) => state.selectedElementIds,
  );
  const closeInspector = useEditorStore((state) => state.closeInspector);
  const removeSelectedElements = useEditorStore(
    (state) => state.removeSelectedElements,
  );
  const element = selectedElementOf({ document, selectedElementIds });

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
        onClick={removeSelectedElements}
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
      {element instanceof ArrowElement && (
        <Field legend={t("inspector.direction")}>
          <Select
            aria-label={t("inspector.directionField")}
            className="w-full"
            value={element.direction}
            onChange={(event) =>
              editElementProps(element.id, { direction: event.target.value })
            }
          >
            <option value="right">{t("inspector.right")}</option>
            <option value="left">{t("inspector.left")}</option>
            <option value="up">{t("inspector.up")}</option>
            <option value="down">{t("inspector.down")}</option>
          </Select>
        </Field>
      )}
      {element instanceof CardElement && <CardTitleField element={element} />}
      {element instanceof ModalElement && <ModalTitleField element={element} />}
      {element instanceof TableElement && (
        <TableShapeFields element={element} />
      )}
      {element instanceof TabsElement && (
        <TabsFields key={element.id} element={element} />
      )}
      {element instanceof FieldElement && (
        <FieldSlotsFields element={element} />
      )}
      {element instanceof ButtonElement && (
        <ButtonTextField element={element} />
      )}
      {element.hasBorder && <BorderStyleField element={element} />}
      <Field legend={t("inspector.position")}>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="inspector-col">
            <MoveRight className="size-4" aria-hidden="true" />
          </FieldLabel>
          <TextInput
            id="inspector-col"
            type="number"
            aria-label={t("inspector.col")}
            className="w-16"
            value={element.position.col}
            onChange={(event) => {
              const col = integerFrom(event);
              if (col !== null) moveTo(col, element.position.row);
            }}
          />
          <FieldLabel htmlFor="inspector-row">
            <MoveDown className="size-4" aria-hidden="true" />
          </FieldLabel>
          <TextInput
            id="inspector-row"
            type="number"
            aria-label={t("inspector.row")}
            className="w-16"
            value={element.position.row}
            onChange={(event) => {
              const row = integerFrom(event);
              if (row !== null) moveTo(element.position.col, row);
            }}
          />
        </div>
      </Field>
      {!(element instanceof FreeDrawElement) && (
        <Field legend={t("inspector.size")}>
          <div className="flex items-center gap-2">
            <FieldLabel htmlFor="inspector-width">
              <MoveHorizontal className="size-4" aria-hidden="true" />
            </FieldLabel>
            <TextInput
              id="inspector-width"
              type="number"
              min={1}
              aria-label={t("inspector.width")}
              className="w-16"
              value={element.size.width}
              onChange={(event) => {
                const width = integerFrom(event);
                if (width !== null) resizeTo(width, element.size.height);
              }}
            />
            <FieldLabel htmlFor="inspector-height">
              <MoveVertical className="size-4" aria-hidden="true" />
            </FieldLabel>
            <TextInput
              id="inspector-height"
              type="number"
              min={1}
              aria-label={t("inspector.height")}
              className="w-16"
              value={element.size.height}
              onChange={(event) => {
                const height = integerFrom(event);
                if (height !== null) resizeTo(element.size.width, height);
              }}
            />
          </div>
        </Field>
      )}
    </>
  );
}

/** Border-style picker shown for every bordered element (box, card, table, …). */
function BorderStyleField({ element }: { element: Element }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const current: BorderStyleName =
    BorderStyle.nameOf(element.borderStyle) ?? "square";

  return (
    <Field legend={t("inspector.borderStyle")}>
      <Select
        aria-label={t("inspector.borderStyleField")}
        className="w-full"
        value={current}
        onChange={(event) =>
          editElementProps(element.id, {
            borderStyle: BorderStyle.named(
              event.target.value as BorderStyleName,
            ),
          })
        }
      >
        <option value="square">{t("borderStyle.square")}</option>
        <option value="rounded">{t("borderStyle.rounded")}</option>
        <option value="cross">{t("borderStyle.cross")}</option>
      </Select>
    </Field>
  );
}

/**
 * Label / placeholder / hint editors for field elements (input, dropdown). The
 * hint is a textarea (it wraps and may span lines); the other two are single
 * line. Empty input clears the slot (stored as null).
 */
function FieldSlotsFields({ element }: { element: FieldElement }) {
  const { t } = useTranslation();
  return (
    <>
      <FieldSlotInput
        element={element}
        field="label"
        legend={t("inspector.label")}
        ariaLabel={t("inspector.labelField")}
      />
      <FieldSlotInput
        element={element}
        field="placeholder"
        legend={t("inspector.placeholder")}
        ariaLabel={t("inspector.placeholderField")}
      />
      <FieldSlotHint element={element} />
      <p className="text-xs opacity-70">{t("inspector.fieldEditHint")}</p>
    </>
  );
}

function FieldSlotInput({
  element,
  field,
  legend,
  ariaLabel,
}: {
  element: FieldElement;
  field: FieldName;
  legend: string;
  ariaLabel: string;
}) {
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);
  const value = field === "label" ? element.label : element.placeholder;

  return (
    <Field legend={legend}>
      <TextInput
        type="text"
        aria-label={ariaLabel}
        className="w-full"
        value={value ?? ""}
        onChange={(event) =>
          editElementProps(element.id, {
            [field]: event.target.value === "" ? null : event.target.value,
          })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
      />
    </Field>
  );
}

function FieldSlotHint({ element }: { element: FieldElement }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);

  return (
    <Field legend={t("inspector.hint")}>
      <TextArea
        aria-label={t("inspector.hintField")}
        className="w-full"
        rows={2}
        value={element.hint ?? ""}
        onChange={(event) =>
          editElementProps(element.id, {
            hint: event.target.value === "" ? null : event.target.value,
          })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
      />
    </Field>
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
      <p className="text-xs opacity-70">{t("inspector.textEditHint")}</p>
    </Field>
  );
}

/**
 * Multi-line label editor for ButtonElements. Reuses the text-editing session
 * (single-key shortcuts suspended while focused); the label stays centered and
 * the button grows to fit as it is typed. The on-canvas double-click editor is
 * the primary path, so a short hint points there too.
 */
function ButtonTextField({ element }: { element: ButtonElement }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);

  return (
    <Field legend={t("inspector.text")}>
      <TextArea
        aria-label={t("inspector.textContent")}
        className="w-full"
        rows={2}
        value={element.text}
        onChange={(event) =>
          editElementProps(element.id, { text: event.target.value })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
      />
      <p className="text-xs opacity-70">{t("inspector.textEditHint")}</p>
    </Field>
  );
}

function CardTitleField({ element }: { element: CardElement }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);

  return (
    <Field legend={t("inspector.title")}>
      <TextInput
        type="text"
        aria-label={t("inspector.titleField")}
        className="w-full"
        value={element.title ?? ""}
        onChange={(event) =>
          editElementProps(element.id, {
            title: event.target.value === "" ? null : event.target.value,
          })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
      />
    </Field>
  );
}

function ModalTitleField({ element }: { element: ModalElement }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);

  return (
    <Field legend={t("inspector.title")}>
      <TextInput
        type="text"
        aria-label={t("inspector.titleField")}
        className="w-full"
        value={element.title ?? ""}
        onChange={(event) =>
          editElementProps(element.id, {
            title: event.target.value === "" ? null : event.target.value,
          })
        }
        onFocus={() => beginTextEditing(element.id)}
        onBlur={endTextEditing}
      />
    </Field>
  );
}

function TableShapeFields({ element }: { element: TableElement }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);

  return (
    <>
      <Field legend={t("inspector.tableColumns")}>
        <TextInput
          type="number"
          min={1}
          className="w-16"
          value={element.columns}
          onChange={(event) => {
            const columns = integerFrom(event);
            if (columns !== null && columns >= 1) {
              editElementProps(element.id, { columns });
            }
          }}
        />
      </Field>
      <Field legend={t("inspector.tableRows")}>
        <TextInput
          type="number"
          min={1}
          className="w-16"
          value={element.rows}
          onChange={(event) => {
            const rows = integerFrom(event);
            if (rows !== null && rows >= 1) {
              editElementProps(element.id, { rows });
            }
          }}
        />
      </Field>
    </>
  );
}

function TabsFields({ element }: { element: TabsElement }) {
  const { t } = useTranslation();
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const beginTextEditing = useEditorStore((state) => state.beginTextEditing);
  const endTextEditing = useEditorStore((state) => state.endTextEditing);
  // While focused, the textarea shows exactly what was typed. Binding it to
  // element.tabs.join("\n") would swallow a trailing Shift+Enter line break
  // (blank lines are filtered out of the committed tabs), snapping the caret
  // back before the user can type the new tab's name.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <>
      <Field legend={t("inspector.tabs")}>
        <TextArea
          aria-label={t("inspector.tabsField")}
          className="w-full"
          rows={3}
          value={draft ?? element.tabs.join("\n")}
          onChange={(event) => {
            setDraft(event.target.value);
            const tabs = event.target.value
              .split("\n")
              .filter((s) => s.length > 0);
            if (tabs.length > 0) {
              editElementProps(element.id, { tabs });
            }
          }}
          onFocus={() => {
            setDraft(element.tabs.join("\n"));
            beginTextEditing(element.id);
          }}
          onBlur={() => {
            setDraft(null);
            endTextEditing();
          }}
        />
      </Field>
      <Field legend={t("inspector.activeTab")}>
        <Select
          aria-label={t("inspector.activeTabField")}
          className="w-full"
          value={element.active}
          onChange={(event) => {
            editElementProps(element.id, {
              active: parseInt(event.target.value, 10),
            });
          }}
        >
          {element.tabs.map((tab, i) => (
            // eslint-disable-next-line react-x/no-array-index-key -- tab index IS the value here
            <option key={i} value={i}>
              {tab}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
