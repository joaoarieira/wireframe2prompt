import { useStore } from "zustand";
import { createContainer } from "../../../di/container";
import { createEditorStore } from "../editor-store/editorStore";
import type { EditorStoreState } from "../editor-store/editorStore";

/**
 * Presentation composition root: the app-wide editor store bound to the real
 * container (browser localStorage, default tool set). Everything React reads
 * or mutates goes through {@link useEditorStore}; non-React code (e.g. route
 * loaders) may use {@link editorStore} directly.
 */
export const editorStore = createEditorStore(createContainer());

/**
 * Selector hook over the app-wide editor store.
 *
 * @example
 * const activeToolId = useEditorStore((state) => state.activeToolId);
 */
export function useEditorStore<T>(selector: (state: EditorStoreState) => T): T {
  return useStore(editorStore, selector);
}
