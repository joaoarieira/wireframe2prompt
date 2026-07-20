import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { editorStore } from "./state/app-store/appStore";
import { RootLayout } from "./RootLayout";
import { DocumentListPage } from "./pages/DocumentListPage";
import { EditorPage } from "./pages/EditorPage";
import { AboutPage } from "./pages/AboutPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const documentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DocumentListPage,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/$documentId",
  // The loader (not the component) opens the document, so the editor never
  // renders against a stale store when navigating between documents.
  loader: ({ params }) =>
    editorStore.getState().openDocument(params.documentId),
  component: EditorPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const routeTree = rootRoute.addChildren([
  documentListRoute,
  editorRoute,
  aboutRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
