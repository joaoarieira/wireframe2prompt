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
    save: "Salvar",
  },
  tools: {
    select: "Selecionar",
    box: "Quadrado",
    line: "Linha",
    text: "Texto",
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
  },
};
