import type { LocaleDictionary } from "./en";

/**
 * Brazilian Portuguese dictionary. Typed against `LocaleDictionary`, so `tsc`
 * breaks if a key present in `en.ts` is missing (or a stray key is added) here.
 */
export const pt: LocaleDictionary = {
  documentList: {
    namePlaceholder: "Nome do novo wireframe",
    create: "Criar",
    empty: "Nenhum wireframe ainda — crie um.",
    delete: "Excluir {{name}}",
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
    box: "Quadrado",
    line: "Linha",
    text: "Texto",
    arrow: "Seta",
    card: "Cartão",
    table: "Tabela",
    modal: "Modal",
    tabs: "Abas",
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
  },
  layers: {
    empty: "Nenhum elemento ainda.",
    bringForward: "Trazer {{name}} para frente",
    sendBackward: "Enviar {{name}} para trás",
  },
  canvas: {
    resize: "Redimensionar elemento",
  },
  elementKind: {
    box: "quadrado",
    line: "linha",
    text: "texto",
    arrow: "seta",
    card: "cartão",
    table: "tabela",
    modal: "modal",
    tabs: "abas",
    freedraw: "desenho",
  },
  footer: {
    pencilChar: "Caractere do lápis",
    shapes: "Formas",
    containers: "Contêineres",
    draw: "Desenho",
    moreTools: "Mais ferramentas de {{name}}",
  },
  contextMenu: {
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
  about: {
    back: "Voltar",
    title: "Sobre o wireframe2prompt",
    summary:
      "O wireframe2prompt é um editor de wireframes em ASCII que exporta seus layouts como texto puro, pronto para ser usado em qualquer LLM.",
    whatIsTitle: "O que é o wireframe2prompt?",
    whatIsBody:
      "Uma ferramenta web para criar wireframes de baixa fidelidade em uma grade de caracteres. Arraste componentes prontos para o canvas, ajuste posição e tamanho, e exporte o resultado como uma string ASCII para usar como prompt.",
    howToUseTitle: "Como usar",
    howToUseBody:
      'Crie um wireframe na tela inicial, escolha ferramentas na paleta flutuante na parte inferior do canvas e clique em "COPIAR RESULTADO" para copiar a string ASCII para o seu prompt.',
    techStackTitle: "Tecnologias",
    techStackBody:
      "React 19 · TypeScript · Vite · Zustand · TanStack Router · daisyUI · Tailwind CSS · Vitest.",
  },
};
