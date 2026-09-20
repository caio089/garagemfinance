import type { Metadata } from "next";
import { FilaPageContent } from "@/components/fila/fila-page-content";

export const metadata: Metadata = {
  title: "Fila de Lavagem · Garagem Federal",
  description: "Cadastro de veículos e fila de lavagem para a equipe",
};

export default function FilaPage() {
  return <FilaPageContent />;
}
