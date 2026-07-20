import { LayersPanel } from "../LayersPanel/LayersPanel";
import { LayersSidebarHeader } from "./LayersSidebarHeader";
import { LayersSidebarFooter } from "./LayersSidebarFooter";

/**
 * The editor's left column: actions on top, layer list in the middle
 * (scrolls), app-level shortcuts at the bottom.
 */
export function LayersSidebar() {
  return (
    <div className="flex h-full flex-col">
      <LayersSidebarHeader />
      <div className="min-h-0 flex-1 overflow-auto">
        <LayersPanel />
      </div>
      <LayersSidebarFooter />
    </div>
  );
}
