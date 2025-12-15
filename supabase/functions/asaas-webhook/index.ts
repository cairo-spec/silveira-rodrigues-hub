import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Rate limiting: track requests per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

interface AsaasWebhookPayload {
  id: string; // Event ID for idempotency
  event: string;
  dateCreated: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    billingType: string;
    customerEmail?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: string;
  };
}

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(clientIp);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return true;
  }
  
  return false;
}

function isTimestampValid(dateCreated: string): boolean {
  try {
    // Parse Asaas timestamp format: "YYYY-MM-DD HH:mm:ss"
    const eventDate = new Date(dateCreated.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - eventDate.getTime();
    const maxAgeMs = 5 * 60 * 1000; // 5 minutes
    
    if (diffMs < 0) {
      // Future timestamp - allow some clock skew (2 minutes)
      return diffMs > -2 * 60 * 1000;
    }
    
    return diffMs <= maxAgeMs;
  } catch (error) {
    console.error("Error parsing timestamp:", error);
    // Be lenient with parsing errors but log them
    return true;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Asaas webhook received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(clientIp)) {
      console.error(`Rate limit exceeded for: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify webhook token
    const webhookToken = req.headers.get("asaas-access-token");
    const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

    if (!webhookToken || webhookToken !== expectedToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: AsaasWebhookPayload = await req.json();
    // Log only non-sensitive event metadata (sanitized)
    console.log("Webhook received:", {
      event: payload.event,
      timestamp: payload.dateCreated,
      hasPayment: !!payload.payment,
      hasSubscription: !!payload.subscription,
    });

    // Validate timestamp to prevent replay attacks
    if (payload.dateCreated && !isTimestampValid(payload.dateCreated)) {
      console.error(`Webhook timestamp too old or invalid: ${payload.dateCreated}`);
      return new Response(JSON.stringify({ error: "Request expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Only process payment confirmation events
    const relevantEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
    if (!relevantEvents.includes(payload.event)) {
      console.log(`Event ${payload.event} ignored`);
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const customerEmail = payload.payment?.customerEmail;
    if (!customerEmail) {
      console.error("No customer email in payload");
      return new Response(JSON.stringify({ error: "No customer email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // IDEMPOTENCY CHECK: Verify this event hasn't been processed before
    const eventId = payload.id;
    const paymentId = payload.payment?.id;
    
    if (eventId) {
      const { data: existingEvent, error: checkError } = await supabase
        .from("processed_webhook_events")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing event:", checkError);
        // Continue processing but log the error
      } else if (existingEvent) {
        console.log(`Event ${eventId} already processed, skipping (idempotency check)`);
        return new Response(JSON.stringify({ message: "Event already processed" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Record this event as being processed
      const { error: insertError } = await supabase
        .from("processed_webhook_events")
        .insert({
          event_id: eventId,
          event_type: payload.event,
          payment_id: paymentId,
          customer_email: customerEmail,
        });

      if (insertError) {
        // If insert fails due to unique constraint, event was processed by another request
        if (insertError.code === '23505') {
          console.log(`Event ${eventId} already processed (concurrent request)`);
          return new Response(JSON.stringify({ message: "Event already processed" }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        console.error("Error recording processed event:", insertError);
      }
    }

    // Find user by email in profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nome, email")
      .eq("email", customerEmail)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for provided email");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Profile found, proceeding with update");

    // Update profile to mark contract as accepted
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        contract_accepted: true,
        pricing_accepted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", profile.user_id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Profile updated successfully");

    // Generate magic link
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: customerEmail,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/membros`,
      },
    });

    if (magicLinkError) {
      console.error("Error generating magic link:", magicLinkError);
      return new Response(JSON.stringify({ error: "Failed to generate magic link" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const magicLink = magicLinkData?.properties?.action_link;
    console.log("Magic link generated");

    // Send email with magic link
    const { error: emailError } = await resend.emails.send({
      from: "Silveira e Rodrigues <noreply@silveiraerodrigues.com.br>",
      to: [customerEmail],
      subject: "Sua assinatura foi confirmada! Acesse sua área de membro",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Raleway', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #25372c; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Silveira e Rodrigues</h1>
              <p style="color: #ebebeb; margin: 10px 0 0 0; font-size: 14px;">Advocacia Empresarial</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #25372c; margin: 0 0 20px 0; font-size: 20px;">
                Olá${profile.nome ? `, ${profile.nome}` : ''}!
              </h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Sua assinatura do <strong>Jornal de Licitações</strong> foi confirmada com sucesso!
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 30px 0;">
                Clique no botão abaixo para acessar sua área de membro:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background-color: #25372c; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Acessar Área de Membro
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              <p style="color: #25372c; font-size: 12px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${magicLink}
              </p>
              
              <p style="color: #999999; font-size: 12px; margin: 30px 0 0 0;">
                Este link é válido por 24 horas e pode ser usado apenas uma vez.
              </p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 20px 30px; text-align: center;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Silveira e Rodrigues Advogados. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Em caso de dúvidas, entre em contato pelo WhatsApp: (31) 99347-5792
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription activated and magic link sent" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);