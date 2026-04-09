import type { Metadata } from "next";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Yeni şifre",
};

export default async function SifreSifirlaPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const p = searchParams ? await searchParams : {};
  const token = typeof p.token === "string" ? p.token : "";

  return (
    <AuthFlowShell heading="Yeni şifre belirle" subline="Güvenli bir şifre seçin (en az 6 karakter).">
      <ResetPasswordForm token={token} />
    </AuthFlowShell>
  );
}
