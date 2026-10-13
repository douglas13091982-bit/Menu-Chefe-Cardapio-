import { createFileRoute, redirect } from "@tanstack/react-router";

// O cadastro de lojas fica dentro do painel (/painel?cadastro).
export const Route = createFileRoute("/cadastro")({
  beforeLoad: () => {
    throw redirect({ href: "/painel?cadastro=1" });
  },
});
