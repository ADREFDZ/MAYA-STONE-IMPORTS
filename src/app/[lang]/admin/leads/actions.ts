"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncLeadToCrm } from "@/lib/crm/webLeads";
import { getDictionary } from "@/app/dictionaries";

/**
 * Reenvía al CRM un lead del formulario que no llegó (p. ej. el CRM no
 * respondía). Si ya se había creado, el CRM devuelve el mismo lead (no duplica).
 */
export async function resendLeadToCrmAction(leadId: string) {
  const guard = await requireAdmin();
  if (!guard.authorized) return { success: false, error: guard.error };

  const supabase = createAdminClient();
  const { data: lead, error } = await supabase
    .from("contact_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (error || !lead) return { success: false, error: "Lead no encontrado." };

  const es = (await getDictionary("es")).contact.form;
  const result = await syncLeadToCrm(lead.id, {
    web_lead_id: lead.id,
    name: lead.name,
    company: lead.company,
    project_name: lead.project_name,
    location: lead.location,
    email: lead.email,
    phone: lead.phone,
    client_type: lead.profile_type,
    contact_reason: lead.contact_reason,
    reason_label:
      (es.reason_options as Record<string, string>)[lead.contact_reason] ||
      lead.contact_reason,
    category_interest: lead.category_interest,
    interest_label: lead.category_interest,
    preferred_date: lead.preferred_date,
    preferred_time_label: lead.preferred_time
      ? (es.time_options as Record<string, string>)[lead.preferred_time] ||
        lead.preferred_time
      : null,
    message: lead.message,
    lang: "es",
  });

  return result.ok
    ? { success: true, code: result.code }
    : { success: false, error: result.error };
}
