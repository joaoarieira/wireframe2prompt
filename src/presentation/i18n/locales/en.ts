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
    empty: "No wireframes yet. Create one.",
    delete: "Delete {{name}}",
    tagline:
      "Sketch your screen on an ASCII grid and copy it as a prompt for any AI — no design tools required.",
    taglineLink: "Learn how it works",
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
    borderStyle: "Border style",
    borderStyleField: "Element border style",
    sheetLabel: "Element inspector",
  },
  borderStyle: {
    square: "Square",
    rounded: "Rounded",
    cross: "Cross",
  },
  layers: {
    empty: "No elements yet.",
    bringForward: "Bring {{name}} forward",
    sendBackward: "Send {{name}} backward",
    panelTitle: "Layers",
  },
  canvas: {
    resize: "Resize element",
    resizeCanvas: "Resize canvas",
    saveSize: "Save canvas size",
    cancelResize: "Cancel canvas resize",
    defaultBorder: "Default border",
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
    layers: "Layers",
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
  seo: {
    homeTitle: "Draw ASCII wireframes for AI prompts",
    homeDescription:
      "Free online ASCII wireframe editor. Drag buttons, inputs and cards onto a text grid, then copy the result as a prompt so an AI can build your interface — no design skills needed.",
    aboutTitle: "About",
    aboutDescription:
      "What wireframe2prompt is, how to sketch a screen in seconds and how to turn the ASCII wireframe into an AI prompt. For developers, designers and anyone with an idea.",
    editorTitle: "Editor",
    editorDescription:
      "Sketch your screen on an ASCII grid and copy it as a prompt for any AI.",
  },
  about: {
    back: "Back",
    title: "About",
    summary:
      "wireframe2prompt is an ASCII wireframe editor that exports your layouts as plain text, ready to feed to any LLM.",
    howToUseTitle: "How to use",
    howToUseIntro: "Three steps, no learning curve:",
    howToUseStep1: "Select a component from the palette.",
    howToUseStep2: "Enrich its position, size, text.",
    howToUseStep3: "Export everything as plain text.",
    whereToUseTitle: "Where to use it",
    whereToUse1: "As a prompt for an AI to build the real UI.",
    whereToUse2: "Inside a GitHub issue to describe a layout.",
    whereToUse3: "As a comment in your code, next to the implementation.",
    philosophyTitle: "Fast prototyping first",
    philosophyBody1: "The point is speed, not fidelity.",
    philosophyBody2:
      "An ASCII wireframe communicates structure in seconds and lives anywhere text lives.",
    philosophyBody3: "No tools or exports required.",
    examplesTitle: "Examples",
    exampleGoogleTitle: "Google landing page",
    exampleGoogleAscii: `                          Google

┌──────────────────────────────────────────────────────────┐
│ ┌───┐                                        ┌───┐ ┌───┐ │
│ │ L │                                        │ V │ │ I │ │
│ └───┘                                        └───┘ └───┘ │
└──────────────────────────────────────────────────────────┘
           ┌───────────────┐  ┌───────────────────┐
           │ Google Search │  │ I'm Feeling Lucky │
           └───────────────┘  └───────────────────┘`,
    exampleSpotifyTitle: "Spotify playlist card",
    exampleSpotifyAscii: `┌─────────────────────────────┐
│ Create your first playlist. │
│                             │
│ It's easy, we'll help you.  │
│                             │
│ ┌─────────────────┐         │
│ │ Create playlist │         │
│ └─────────────────┘         │
└─────────────────────────────┘`,
    copyExample: "Copy",
    copied: "Copied!",
    contributeTitle: "Contribute",
    contributeBody:
      "wireframe2prompt is open source. New languages, new components and tools, bug fixes, features, every contribution is welcome.",
    contributeLink: "Open the repository on GitHub",
    startNow: "Start now",
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
