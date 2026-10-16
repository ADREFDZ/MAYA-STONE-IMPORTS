import { createClient } from "@/lib/supabase/server";

export type RequireAdminResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

/**
 * Verifica que quien invoca la Server Action sea un usuario autenticado
 * con role = "admin" en la tabla public.profiles.
 *
 * Debe llamarse como PRIMERA línea de cualquier Server Action que use
 * createAdminClient() (el cliente service-role), para no depender
 * únicamente del middleware (src/proxy.ts) como única capa de protección.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "No autenticado." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== "admin") {
    return {
      authorized: false,
      error: "No tienes permisos para realizar esta acción.",
    };
  }

  return { authorized: true, userId: user.id };
}
