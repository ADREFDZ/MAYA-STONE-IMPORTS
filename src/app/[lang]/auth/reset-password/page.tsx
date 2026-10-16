"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // Clave dinámica de idioma y parámetro de clave desde .env
  const lang = (params?.lang as string) || "es";
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_PORTAL_KEY || "";
  const loginPath = adminKey
    ? `/${lang}/login?key=${adminKey}`
    : `/${lang}/login`;

  const supabase = createClient();

  useEffect(() => {
    const urlError =
      searchParams.get("error_description") || searchParams.get("error");
    const errorCode = searchParams.get("error_code");

    if (urlError || errorCode) {
      if (errorCode === "otp_expired" || urlError?.includes("expired")) {
        setError(
          "El enlace de recuperación ha expirado o ya fue utilizado. Por favor, solicite uno nuevo.",
        );
      } else {
        setError(urlError || "Enlace de recuperación inválido.");
      }
      setIsChecking(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setError(null);
          setIsChecking(false);
        }
      },
    );

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsChecking(false);
      } else {
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (!retryData.session && !searchParams.get("code")) {
            setError(
              "No se detectó una sesión válida. Solicite un nuevo enlace de recuperación.",
            );
          }
          setIsChecking(false);
        }, 1200);
      }
    };

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setIsDone(true);

      setTimeout(() => {
        router.push(loginPath);
      }, 2500);
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="text-center py-8 font-mono text-xs text-black-neutral/60 uppercase tracking-widest">
        Verificando enlace de acceso...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-black-neutral/15 p-8 md:p-10 shadow-sm space-y-8 font-sans">
      <div className="text-center space-y-2 border-b border-black-neutral/10 pb-6">
        <span className="text-[9px] uppercase tracking-[0.3em] text-accent-ink font-medium block">
          MAYA STONE IMPORT
        </span>
        <h2 className="text-xl md:text-2xl font-light tracking-editorial text-black-neutral uppercase">
          {isDone ? "Acceso Restablecido" : "Nueva Contraseña"}
        </h2>
      </div>

      {isDone ? (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent-ink border border-accent/20 text-sm">
            ✓
          </div>
          <p className="text-xs text-black-neutral/70 leading-relaxed font-mono px-4">
            Contraseña actualizada correctamente. Redirigiendo al inicio de
            sesión...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs font-mono leading-relaxed space-y-2">
              <span className="font-bold block uppercase text-[10px] tracking-wider">
                ⚠️ Aviso de Recuperación
              </span>
              <p>{error}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push(loginPath)}
                  className="text-[10px] uppercase font-bold tracking-wider text-red-900 underline hover:text-black-neutral cursor-pointer"
                >
                  Solicitar un nuevo enlace →
                </button>
              </div>
            </div>
          )}

          {!error && (
            <>
              <div className="relative">
                <Input
                  label="Nueva Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-[29px] text-black-neutral/40 hover:text-black-neutral transition-colors cursor-pointer focus:outline-none z-10"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <Input
                label="Confirmar Contraseña"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-black-neutral text-gray-warm font-sans text-xs uppercase tracking-data py-3.5 px-6 font-medium hover:bg-black-pure transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>
                  {loading ? "Actualizando..." : "Guardar Contraseña"}
                </span>
                {!loading && (
                  <span className="text-accent-ink group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                )}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-cool/20 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono">Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
