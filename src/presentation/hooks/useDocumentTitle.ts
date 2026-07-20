import { useEffect } from "react";

/**
 * Sets the browser tab title (`document.title`) while the component is mounted.
 * The title is not translated — it carries the product name and user data.
 *
 * @example useDocumentTitle(`${wireframe.name} - wireframe2prompt`);
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
