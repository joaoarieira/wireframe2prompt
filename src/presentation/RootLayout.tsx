import { Outlet } from "@tanstack/react-router";
import { useAppCursors } from "./hooks/useAppCursors";

/**
 * The router's root component: installs the app-wide themed cursors, then
 * renders the matched route via <Outlet />.
 */
export function RootLayout() {
  useAppCursors();
  return <Outlet />;
}
