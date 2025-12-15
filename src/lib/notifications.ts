import { supabase } from "@/integrations/supabase/client";

/**
 * Notify all admins about an event
 */
export const notifyAdmins = async (
  type: 'ticket_message' | 'ticket_status' | 'chat_message' | 'new_ticket',
  title: string,
  message: string,
  referenceId?: string
) => {
  try {
    // Get all admin user IDs
    const { data: adminRoles, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (error || !adminRoles || adminRoles.length === 0) {
      console.error('Could not fetch admin users:', error);
      return;
    }

    // Create notifications for all admins
    const notifications = adminRoles.map((role) => ({
      user_id: role.user_id,
      type,
      title,
      message,
      reference_id: referenceId || null
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Could not create admin notifications:', insertError);
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
};
