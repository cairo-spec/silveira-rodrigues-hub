import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the user from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create a client with the user's token to get their ID
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("User not found");
    }

    // Use service role to update the profile (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has trial or subscription active
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("trial_active, subscription_active, trial_expires_at, created_at")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw new Error("Profile not found");
    }

    // If already has active subscription, don't re-activate
    if (profile.subscription_active) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User already has active subscription",
          alreadyActive: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already has active trial, don't re-activate
    if (profile.trial_active) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User already has active trial",
          alreadyActive: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: If user already had a trial before (trial_expires_at is set), don't allow re-activation
    // This prevents existing users from getting a new trial by visiting /experimente
    if (profile.trial_expires_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Trial already used",
          alreadyUsed: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Only allow trial activation for accounts created in the last 5 minutes
    // This prevents existing users from gaming the system by visiting /experimente
    const accountCreatedAt = new Date(profile.created_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (accountCreatedAt < fiveMinutesAgo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Trial only available for new accounts",
          accountTooOld: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Activate trial for 30 days
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        trial_active: true,
        trial_expires_at: trialExpiresAt.toISOString(),
        access_authorized: true,
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error("Failed to activate trial: " + updateError.message);
    }

    // Get user email for notification
    const userEmail = user.email || "Email não informado";
    const userName = user.user_metadata?.full_name || user.user_metadata?.nome || "Usuário";

    // Notify admins about trial activation
    await supabaseAdmin.rpc("notify_admins", {
      _type: "new_account",
      _title: "Trial ativado (Google OAuth)",
      _message: `Novo trial de 30 dias ativado para: ${userEmail} (${userName})`,
      _reference_id: user.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Trial activated successfully",
        expiresAt: trialExpiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error activating trial:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
