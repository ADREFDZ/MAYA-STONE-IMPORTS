"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { resolveRoute, type Locale } from "@/lib/i18n/routes";

interface AuthFormProps {
  type?: "login" | "signup";
  redirectTo?: string;
}

type AuthView = "login" | "signup" | "forgotPassword" | "recoverySent";

export const AuthForm: React.FC<AuthFormProps> = ({
  type = "login",
  redirectTo,
}) => {
  const [authView, setAuthView] = useState<AuthView>(type);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const router = useRouter();
  const pathname = usePathname() || "/es/login";
  const supabase = createClient();
  const currentLocale: Locale = resolveRoute(pathname).lang;

  const targetRedirect = redirectTo || `/${currentLocale}/admin/dashboard`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (failedAttempts >= 5) {
      setError(
        "Demasiados intentos erróneos. Espere 1 minuto antes de reintentar.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (authView === "login") {
        const { data: authData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;
        if (!authData.user) {
          throw new Error("No se pudo obtener la información de usuario.");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError || !profile || profile.role !== "admin") {
          await supabase.auth.signOut();
          throw new Error(
            "Acceso denegado. Se requieren permisos de administrador.",
          );
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;

        setSuccessMessage(
          "Cuenta creada. Verifique su correo si es necesario.",
        );
      }

      if (authView === "login") {
        setFailedAttempts(0);
        router.refresh();
        router.push(targetRedirect);
      }
    } catch (err: unknown) {
      setFailedAttempts((prev) => prev + 1);
      const message =
        err instanceof Error ? err.message : "Error al autenticar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/${currentLocale}/auth/reset-password`,
        },
      );

      if (resetError) throw resetError;
      setAuthView("recoverySent");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo enviar el correo de recuperación.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => {
    let title = "";
    const subtitle = "MAYA STONE IMPORT";

    switch (authView) {
      case "signup":
        title = "Crear Perfil";
        break;
      case "forgotPassword":
        title = "Recuperar Acceso";
        break;
      case "recoverySent":
        title = "Correo Enviado";
        break;
      default:
        title = "Acceso Administrador";
        break;
    }

    return (
      <div className="text-center space-y-2 border-b border-black-neutral/10 pb-6">
        <span className="text-[9px] uppercase tracking-[0.3em] text-accent-ink font-medium block">
          {subtitle}
        </span>
        <h2 className="text-xl md:text-2xl font-light tracking-editorial text-black-neutral uppercase">
          {title}
        </h2>
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-black-neutral/15 p-8 md:p-10 shadow-sm space-y-8 font-sans">
      {renderHeader()}

      {authView === "recoverySent" && (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent-ink border border-accent/20">
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
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm text-black-neutral font-medium">
              Instrucciones enviadas
            </p>
            <p className="text-xs text-black-neutral/70 leading-relaxed max-w-sm mx-auto font-mono">
              Si existe una cuenta asociada a{" "}
              <span className="text-black-neutral font-bold">{email}</span>,
              recibirá un correo con un enlace seguro para restablecer su
              contraseña.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAuthView("login")}
            className="text-xs uppercase tracking-data text-black-neutral/60 hover:text-accent-ink transition-colors"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      )}

      {authView !== "recoverySent" && (
        <form
          onSubmit={
            authView === "forgotPassword" ? handleForgotPassword : handleSubmit
          }
          className="space-y-5"
        >
          {error && (
            <div className="p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs font-mono leading-relaxed space-y-1">
              <span className="font-bold block uppercase text-[10px] tracking-wider">
                ⚠️ Error
              </span>
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-green-50/80 border border-green-200 text-green-800 text-xs font-mono leading-relaxed">
              <p>{successMessage}</p>
            </div>
          )}

          {authView === "signup" && (
            <Input
              label="Nombre Completo"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ana Rossi"
              required
            />
          )}

          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mayastone.com"
            required
          />

          {authView !== "forgotPassword" && (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  label="Contraseña"
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

              {authView === "login" && (
                <div className="text-right px-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setAuthView("forgotPassword");
                    }}
                    className="text-[10px] font-mono uppercase tracking-wide text-black-neutral/50 hover:text-accent-ink transition-colors cursor-pointer"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-black-neutral text-gray-warm font-sans text-xs uppercase tracking-data py-3.5 px-6 font-medium hover:bg-black-pure transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>
              {loading
                ? "Procesando..."
                : authView === "forgotPassword"
                  ? "Enviar Instrucciones"
                  : authView === "login"
                    ? "Ingresar al Panel"
                    : "Registrar Perfil"}
            </span>

            {!loading && (
              <span className="text-accent-ink group-hover:translate-x-1 transition-transform">
                →
              </span>
            )}
          </button>

          {authView === "forgotPassword" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthView("login");
                }}
                className="text-xs text-black-neutral/60 hover:text-black-neutral transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
      )}

      <div className="pt-4 border-t border-black-neutral/20 text-center">
        <span className="text-[9px] font-mono text-black-neutral/60 uppercase tracking-data block">
          ACCESO RESTRINGIDO
        </span>
      </div>
    </div>
  );
};
