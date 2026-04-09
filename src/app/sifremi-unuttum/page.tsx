import type { Metadata } from "next";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi unuttum",
};

export default function SifremiUnuttumPage() {
  return (
    <AuthFlowShell
      heading="Şifremi unuttum"
      subline="Hesabınıza kayıtlı e-posta adresini girin; sıfırlama bağlantısı gönderilir."
    >
      <ForgotPasswordForm />
    </AuthFlowShell>
  );
}
