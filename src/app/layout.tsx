import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@/app/globals.css";

// Fonte da marca Hector Studios, carregada localmente pelo Next (sem @import remoto).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Hector Operações",
  description: "Gestão de agenda, tarefas, processos e pendências recorrentes."
};

// Define a estrutura global do HTML para todas as páginas do sistema.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={montserrat.className}>
      <body>{children}</body>
    </html>
  );
}
