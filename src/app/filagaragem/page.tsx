import type { Metadata } from "next";
import { FilaPageContent } from "@/components/fila/fila-page-content";

export const metadata: Metadata = {
  title: "Fila Garagem · Atendimento",
  description:
    "Fila de lavagem para a equipe operacional — sem acesso ao painel financeiro",
};

export default function FilaGaragemPage() {
  return <FilaPageContent />;
}
