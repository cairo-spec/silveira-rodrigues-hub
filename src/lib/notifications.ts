import { supabase } from "@/integrations/supabase/client";

/**
 * Notify all admins about an event using database function
 * This bypasses RLS by using a SECURITY DEFINER function
 */
export const notifyAdmins = async (
  type: 'ticket_message' | 'ticket_status' | 'chat_message' | 'new_ticket',
  title: string,
  message: string,
  referenceId?: string
) => {
  try {
    const { error } = await supabase.rpc('notify_admins', {
      _type: type,
      _title: title,
      _message: message,
      _reference_id: referenceId || null
    });

    if (error) {
      console.error('Could not create admin notifications:', error);
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
};
