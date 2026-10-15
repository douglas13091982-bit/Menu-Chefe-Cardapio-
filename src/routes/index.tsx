import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "../tratto/components/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuChef | Cardápio digital para seu restaurante" },
      { name: "description", content: "Crie um cardápio digital profissional, organize pedidos e compartilhe um link exclusivo para sua loja." },
      { property: "og:title", content: "MenuChef | Cardápio digital para seu restaurante" },
      { property: "og:description", content: "Cardápios digitais e pedidos para restaurantes e lanchonetes." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});
