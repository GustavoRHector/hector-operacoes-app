import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google";

// Inicia o fluxo OAuth: exige login e redireciona para o consentimento do Google.
// O state carrega o id do usuário para conferência no callback.
export async function GET() {
  const user = await requireUser();
  const authUrl = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(authUrl);
}
