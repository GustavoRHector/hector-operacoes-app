import { redirect } from "next/navigation";

// Redireciona a raiz do sistema para a primeira tela protegida.
export default function HomePage() {
  redirect("/dashboard");
}
