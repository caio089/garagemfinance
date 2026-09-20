import type { Metadata } from "next";
import { ClientesPageContent } from "@/components/clientes/clientes-page-content";

export const metadata: Metadata = {
  title: "Clientes · Garagem Federal",
  description: "Lista de clientes cadastrados na fila de lavagem",
};

export default function ClientesPage() {
  return <ClientesPageContent />;
}
