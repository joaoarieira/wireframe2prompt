import type { LocaleDictionary } from "./en";

/**
 * Brazilian Portuguese dictionary. Typed against `LocaleDictionary`, so `tsc`
 * breaks if a key present in `en.ts` is missing (or a stray key is added) here.
 */
export const pt: LocaleDictionary = {
  documentList: {
    namePlaceholder: "Nome do novo wireframe",
    create: "Criar",
    empty: "Nenhum wireframe ainda. Crie um.",
    delete: "Excluir {{name}}",
    tagline:
      "Esboce sua tela numa grade ASCII e copie como prompt para qualquer IA — sem ferramentas de design.",
    taglineLink: "Saiba como funciona",
  },
  editor: {
    notFound: "Wireframe não encontrado.",
    backToDocuments: "Voltar aos wireframes",
    documentsShort: "← Wireframes",
  },
  toolbar: {
    undo: "Desfazer",
    redo: "Refazer",
    saving: "Salvando",
    saved: "Salvo",
  },
  tools: {
    select: "Selecionar",
    box: "Retângulo",
    line: "Linha",
    multiline: "Multilinha",
    text: "Texto",
    arrow: "Seta",
    card: "Card",
    table: "Tabela",
    modal: "Modal",
    tabs: "Abas",
    input: "Input",
    dropdown: "Dropdown",
    pencil: "Lápis",
    eraser: "Borracha",
    hand: "Mão",
  },
  copyOutput: {
    idle: "COPIAR RESULTADO",
    copied: "COPIADO!",
  },
  inspector: {
    close: "Fechar inspetor",
    name: "Nome",
    nameField: "Nome do elemento",
    position: "Posição",
    col: "col",
    row: "lin",
    size: "Tamanho",
    width: "l",
    height: "a",
    text: "Texto",
    textContent: "Conteúdo de texto",
    orientation: "Orientação",
    orientationField: "Orientação da linha",
    horizontal: "horizontal",
    vertical: "vertical",
    delete: "Excluir",
    direction: "Direção",
    directionField: "Direção da seta",
    left: "esquerda",
    right: "direita",
    up: "cima",
    down: "baixo",
    title: "Título",
    titleField: "Texto do título",
    tableColumns: "Colunas",
    tableRows: "Linhas",
    tabs: "Abas",
    tabsField: "Uma aba por linha",
    activeTab: "Aba ativa",
    activeTabField: "Aba ativa",
    textEditHint:
      "Dê dois cliques diretamente no elemento para alterar seu texto.",
    label: "Rótulo",
    labelField: "Texto do rótulo",
    placeholder: "Placeholder",
    placeholderField: "Texto do placeholder",
    hint: "Dica",
    hintField: "Texto da dica",
    fieldEditHint:
      "Dê dois cliques no rótulo, no placeholder ou na dica no canvas para editá-los.",
    borderStyle: "Estilo da borda",
    borderStyleField: "Estilo da borda do elemento",
    sheetLabel: "Inspetor do elemento",
  },
  borderStyle: {
    square: "Quadrada",
    rounded: "Arredondada",
    cross: "Cruz",
  },
  layers: {
    empty: "Nenhum elemento ainda.",
    bringForward: "Trazer {{name}} para frente",
    sendBackward: "Enviar {{name}} para trás",
    panelTitle: "Camadas",
  },
  canvas: {
    resize: "Redimensionar elemento",
    resizeCanvas: "Redimensionar canvas",
    saveSize: "Salvar tamanho do canvas",
    cancelResize: "Cancelar redimensionamento do canvas",
    defaultBorder: "Borda padrão",
    editElement: "Editar elemento",
    deleteElement: "Excluir elemento",
  },
  elementKind: {
    box: "retângulo",
    line: "linha",
    multiline: "multilinha",
    text: "texto",
    arrow: "seta",
    card: "card",
    table: "tabela",
    modal: "modal",
    tabs: "abas",
    input: "input",
    dropdown: "dropdown",
    freedraw: "desenho",
  },
  footer: {
    pencilChar: "Caractere do lápis",
    shapes: "Formas",
    containers: "Contêineres",
    draw: "Desenho",
    moreTools: "Mais ferramentas de {{name}}",
    toolWithShortcut: "{{name}} ({{shortcut}})",
    layers: "Camadas",
  },
  contextMenu: {
    edit: "Editar",
    copy: "Copiar",
    paste: "Colar",
    duplicate: "Duplicar",
    delete: "Excluir",
    selectAll: "Selecionar todos",
    copyShortcut: "ctrl + c",
    pasteShortcut: "ctrl + v",
    duplicateShortcut: "ctrl + d",
    deleteShortcut: "del",
    selectAllShortcut: "ctrl + a",
  },
  sidebar: {
    about: "Sobre",
    github: "GitHub",
    openGithub: "Abrir repositório no GitHub",
    switchTheme: "Mudar tema",
    switchLanguage: "Mudar idioma",
  },
  theme: {
    system: "Sistema",
    light: "Claro",
    dark: "Escuro",
  },
  // Language names are endonyms — the same in every locale.
  language: {
    en: "English",
    pt: "Português",
  },
  seo: {
    homeTitle: "Desenhe wireframes ASCII para prompts de IA",
    homeDescription:
      "Editor online e gratuito de wireframes em ASCII. Arraste botões, inputs e cards para uma grade de texto e copie o resultado como prompt para uma IA construir sua interface — sem precisar saber design.",
    aboutTitle: "Sobre",
    aboutDescription:
      "O que é o wireframe2prompt, como esboçar uma tela em segundos e como transformar o wireframe ASCII em um prompt de IA. Para devs, designers e qualquer pessoa com uma ideia.",
    editorTitle: "Editor",
    editorDescription:
      "Esboce sua tela numa grade ASCII e copie como prompt para qualquer IA.",
  },
  about: {
    back: "Voltar",
    title: "Sobre",
    summary:
      "O wireframe2prompt é um editor de wireframes em ASCII que exporta seus layouts como texto puro, pronto para ser usado em qualquer LLM.",
    howToUseTitle: "Como usar",
    howToUseIntro: "Três passos, sem curva de aprendizado:",
    howToUseStep1: "Selecione um componente na paleta.",
    howToUseStep2: "Enriqueça sua posição, tamanho, texto.",
    howToUseStep3: "Exporte tudo como texto puro.",
    whereToUseTitle: "Onde usar",
    whereToUse1: "Como prompt para uma IA construir a UI de verdade.",
    whereToUse2: "Dentro de uma issue do GitHub para descrever um layout.",
    whereToUse3: "Como comentário no seu código, ao lado da implementação.",
    philosophyTitle: "Prototipagem rápida em primeiro lugar",
    philosophyBody1: "O foco é velocidade, não fidelidade.",
    philosophyBody2:
      "Um wireframe ASCII comunica a estrutura em segundos e vive em qualquer lugar onde texto vive.",
    philosophyBody3: "Sem ferramentas nem exportações.",
    examplesTitle: "Exemplos",
    exampleGoogleTitle: "Página inicial do Google",
    exampleGoogleAscii: `                          Google

┌──────────────────────────────────────────────────────────┐
│ ┌───┐                                        ┌───┐ ┌───┐ │
│ │ L │                                        │ V │ │ I │ │
│ └───┘                                        └───┘ └───┘ │
└──────────────────────────────────────────────────────────┘
           ┌─────────────────┐  ┌─────────────────┐
           │ Pesquisa Google │  │ Estou com sorte │
           └─────────────────┘  └─────────────────┘`,
    exampleSpotifyTitle: "Card de playlist do Spotify",
    exampleSpotifyAscii: `┌─────────────────────────────┐
│ Crie sua primeira playlist. │
│                             │
│ É fácil, vamos te ajudar.   │
│                             │
│ ┌────────────────┐          │
│ │ Criar playlist │          │
│ └────────────────┘          │
└─────────────────────────────┘`,
    copyExample: "Copiar",
    copied: "Copiado!",
    contributeTitle: "Contribua",
    contributeBody:
      "O wireframe2prompt é open source. Novos idiomas, novos componentes e ferramentas, correções, funcionalidades, toda contribuição é bem-vinda.",
    contributeLink: "Abrir o repositório no GitHub",
    startNow: "Começar agora",
  },
};
