import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Hector Operações",
  description: "Gestão de agenda, tarefas, processos e pendências recorrentes."
};

// Define a estrutura global do HTML para todas as páginas do sistema.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
