import { supabase } from "@/integrations/supabase/client";

/**
 * Notify all admins about an event using database function
 * This bypasses RLS by using a SECURITY DEFINER function
 */
export const notifyAdmins = async (
  type: 'ticket_message' | 'ticket_status' | 'chat_message' | 'new_ticket' | 'message_deleted',
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

/**
 * Clear all notifications for current user with a specific reference_id
 * Used when user views the content (ticket, chat) to remove related notifications
 */
export const clearNotificationsByReference = async (referenceId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('reference_id', referenceId);

    if (error) {
      console.error('Could not clear notifications:', error);
    }
  } catch (err) {
    console.error('Error clearing notifications:', err);
  }
};
