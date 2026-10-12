import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const SuperAdmin = lazy(() => import("../tratto/saas/SuperAdmin"));

export const Route = createFileRoute("/super")({
  head: () => ({ meta: [{ title: "Super admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}><SuperAdmin /></Suspense>
    </ClientOnly>
  ),
});
