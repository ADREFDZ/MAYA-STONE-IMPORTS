import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendLeadToMonday,
  type MondaySendResult,
  type MondayWebLead,
} from "@/lib/monday/monday";

/** Envía el lead a Monday y deja el resultado en contact_leads (admin). */
export async function syncLeadToMonday(
  leadId: string,
  lead: MondayWebLead,
): Promise<MondaySendResult> {
  const result = await sendLeadToMonday(lead);
  try {
    const supabase = createAdminClient();
    await supabase
      .from("contact_leads")
      .update(
        result.ok
          ? {
              monday_item_id: result.itemId,
              monday_synced_at: new Date().toISOString(),
              monday_error: null,
            }
          : { monday_error: result.error },
      )
      .eq("id", leadId);
  } catch (err) {
    console.error("[monday] No se pudo registrar el estado del envío:", err);
  }
  if (!result.ok) console.error("[monday] Lead no enviado a Monday:", result.error);
  return result;
}
