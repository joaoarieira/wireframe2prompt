/**
 * English dictionary — the source of truth for every user-facing string in
 * Presentation. `pt.ts` is typed against this shape, so `tsc` breaks if a key
 * is missing there. Keys are grouped by UI area (`area.item`).
 *
 * Do NOT translate: the product name, the exported ASCII, or user data
 * (document/element names, ids).
 */
export const en = {
  documentList: {
    namePlaceholder: "New wireframe name",
    create: "Create",
    empty: "No wireframes yet — create one.",
    delete: "Delete {{name}}",
  },
  editor: {
    notFound: "Wireframe not found.",
    backToDocuments: "Back to wireframes",
    documentsShort: "← Wireframes",
  },
  toolbar: {
    undo: "Undo",
    redo: "Redo",
    save: "Save",
  },
  tools: {
    select: "Select",
    box: "Box",
    line: "Line",
    text: "Text",
  },
  copyOutput: {
    idle: "COPY OUTPUT",
    copied: "COPIED!",
  },
  inspector: {
    close: "Close inspector",
    name: "Name",
    nameField: "Element name",
    position: "Position",
    col: "col",
    row: "row",
    size: "Size",
    width: "w",
    height: "h",
    text: "Text",
    textContent: "Text content",
    orientation: "Orientation",
    orientationField: "Line orientation",
    horizontal: "horizontal",
    vertical: "vertical",
    delete: "Delete",
  },
  layers: {
    empty: "No elements yet.",
    bringForward: "Bring {{name}} forward",
    sendBackward: "Send {{name}} backward",
  },
  canvas: {
    resize: "Resize element",
  },
  elementKind: {
    box: "box",
    line: "line",
    text: "text",
  },
} as const;

/**
 * Same shape as `en` but with widened `string` leaves, so other locales can
 * hold real translations while `tsc` still flags any missing/extra key.
 */
export type LocaleDictionary = {
  [Area in keyof typeof en]: {
    [Key in keyof (typeof en)[Area]]: string;
  };
};
