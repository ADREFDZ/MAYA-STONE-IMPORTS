"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export type UserRole = "admin" | "sales_agent" | "architect" | "client";

export async function createUserAction(formData: FormData) {
  const guard = await requireAdmin();
  if (!guard.authorized) return { success: false, error: guard.error };

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const country_code = formData.get("country_code") as string;
  const role = (formData.get("role") as UserRole) || "client";

  const supabaseAdmin = createAdminClient();

  // 1. Crear el usuario en Supabase Auth
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, country_code },
    });

  if (authError) return { success: false, error: authError.message };

  // 2. Actualizar datos completos en public.profiles
  if (authData.user) {
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ name, email, phone, country_code, role })
      .eq("id", authData.user.id);

    if (profileError) return { success: false, error: profileError.message };
  }

  revalidatePath("/[lang]/admin/users", "page");
  return { success: true };
}

export async function updateUserAction(userId: string, formData: FormData) {
  const guard = await requireAdmin();
  if (!guard.authorized) return { success: false, error: guard.error };

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const country_code = formData.get("country_code") as string;
  const role = formData.get("role") as UserRole;
  const newPassword = formData.get("newPassword") as string;

  const supabaseAdmin = createAdminClient();

  // 1. Actualizar datos en la tabla public.profiles
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      name,
      email,
      phone,
      country_code,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) return { success: false, error: profileError.message };

  // 2. Sincronizar email y/o contraseña en Supabase Auth
  const authUpdates: {
    email?: string;
    password?: string;
    email_confirm?: boolean;
  } = {};

  if (email) {
    authUpdates.email = email;
    authUpdates.email_confirm = true;
  }

  if (newPassword && newPassword.trim() !== "") {
    authUpdates.password = newPassword;
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      authUpdates,
    );

    if (authError) return { success: false, error: authError.message };
  }

  revalidatePath("/[lang]/admin/users", "page");
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const guard = await requireAdmin();
  if (!guard.authorized) return { success: false, error: guard.error };

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/[lang]/admin/users", "page");
  return { success: true };
}
