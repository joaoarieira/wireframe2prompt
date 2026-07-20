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
    saving: "Saving",
    saved: "Saved",
  },
  tools: {
    select: "Select",
    box: "Box",
    line: "Line",
    text: "Text",
    arrow: "Arrow",
    card: "Card",
    table: "Table",
    modal: "Modal",
    tabs: "Tabs",
    input: "Input",
    dropdown: "Dropdown",
    pencil: "Pencil",
    eraser: "Eraser",
    hand: "Hand",
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
    direction: "Direction",
    directionField: "Arrow direction",
    left: "left",
    right: "right",
    up: "up",
    down: "down",
    title: "Title",
    titleField: "Title text",
    tableColumns: "Columns",
    tableRows: "Rows",
    tabs: "Tabs",
    tabsField: "One tab per line",
    activeTab: "Active tab",
    activeTabField: "Active tab",
    textEditHint: "Double-click the element on the canvas to edit its text.",
    label: "Label",
    labelField: "Label text",
    placeholder: "Placeholder",
    placeholderField: "Placeholder text",
    hint: "Hint",
    hintField: "Hint text",
    fieldEditHint:
      "Double-click the label, placeholder, or hint on the canvas to edit it.",
  },
  layers: {
    empty: "No elements yet.",
    bringForward: "Bring {{name}} forward",
    sendBackward: "Send {{name}} backward",
  },
  canvas: {
    resize: "Resize element",
    resizeCanvas: "Resize canvas",
    saveSize: "Save canvas size",
    cancelResize: "Cancel canvas resize",
  },
  elementKind: {
    box: "box",
    line: "line",
    text: "text",
    arrow: "arrow",
    card: "card",
    table: "table",
    modal: "modal",
    tabs: "tabs",
    input: "input",
    dropdown: "dropdown",
    freedraw: "drawing",
  },
  footer: {
    pencilChar: "Pencil character",
    shapes: "Shapes",
    containers: "Containers",
    draw: "Draw",
    moreTools: "More {{name}} tools",
    toolWithShortcut: "{{name}} ({{shortcut}})",
  },
  contextMenu: {
    copy: "Copy",
    paste: "Paste",
    duplicate: "Duplicate",
    delete: "Delete",
    selectAll: "Select all",
    copyShortcut: "ctrl + c",
    pasteShortcut: "ctrl + v",
    duplicateShortcut: "ctrl + d",
    deleteShortcut: "del",
    selectAllShortcut: "ctrl + a",
  },
  sidebar: {
    about: "About",
    github: "GitHub",
    openGithub: "Open GitHub repository",
    switchTheme: "Change theme",
    switchLanguage: "Switch language",
  },
  theme: {
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  language: {
    en: "English",
    pt: "Português",
  },
  about: {
    back: "Back",
    title: "About wireframe2prompt",
    summary:
      "wireframe2prompt is an ASCII wireframe editor that exports your layouts as plain text, ready to feed to any LLM.",
    whatIsTitle: "What is wireframe2prompt?",
    whatIsBody:
      "A browser-based tool for designing low-fidelity wireframes using a character grid. Drag ready-made components onto the canvas, adjust their position and size, and export the result as a raw ASCII string to use as a prompt.",
    howToUseTitle: "How to use",
    howToUseBody:
      'Create a wireframe from the home screen, pick tools from the floating palette at the bottom of the canvas, and click "COPY OUTPUT" to grab the ASCII string for your LLM prompt.',
    techStackTitle: "Tech stack",
    techStackBody:
      "React 19 · TypeScript · Vite · Zustand · TanStack Router · daisyUI · Tailwind CSS · Vitest.",
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
