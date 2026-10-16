import { AuthForm } from "@/components/auth/AuthForm";
import TopographyBackground from "@/components/ui/TopographyBackground";

type Props = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function LoginPage({ params }: Props) {
  const resolvedParams = await params;

  const lang = resolvedParams.lang === "en" ? "en" : "es";

  return (
    <main className="relative min-h-screen bg-gray-cool text-black-neutral flex flex-col items-center justify-center px-4 py-12 overflow-hidden select-none">
      <TopographyBackground opacity="opacity-[0.7]" />

      <div className="relative z-20 w-full max-w-md space-y-6">
        <AuthForm type="login" redirectTo={`/${lang}/admin/dashboard`} />

        <p className="text-center font-mono text-[10px] text-black-neutral/80 uppercase tracking-data">
          PLATAFORMA DE CONTROL PRIVADA
        </p>
      </div>
    </main>
  );
}
