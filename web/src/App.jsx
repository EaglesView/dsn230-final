import { lazy, Suspense } from "react";
import EyeView from "./pages/EyeView";

const Admin = lazy(() => import("./pages/Admin"));

// Two routes, no router needed: "/" = eye display, "/admin" = dashboard.
export default function App() {
  if (location.pathname.replace(/\/+$/, "").endsWith("/admin")) {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  }
  return <EyeView />;
}
