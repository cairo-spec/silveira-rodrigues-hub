import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT to verify authentication
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      console.log('Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { articleId } = await req.json();
    
    if (!articleId) {
      console.log('No articleId provided');
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching article:', articleId);

    // Use service role client for database queries
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the article
    const { data: article, error: articleError } = await adminClient
      .from('kb_articles')
      .select('id, title, file_url, is_published, category_id, views')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      console.log('Article error:', articleError?.message || 'Article not found');
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the category to check if it's premium
    const { data: category } = await adminClient
      .from('kb_categories')
      .select('is_premium')
      .eq('id', article.category_id)
      .single();

    const isPremium = category?.is_premium || false;

    console.log('Article found:', article.title, 'Premium:', isPremium);

    // Check if article is published
    if (!article.is_published) {
      // Only admins can view unpublished articles
      const { data: isAdmin } = await adminClient.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      
      if (!isAdmin) {
        console.log('User tried to access unpublished article');
        return new Response(
          JSON.stringify({ error: 'Article not available' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if premium content requires subscription
    if (isPremium) {
      // Check user's subscription status
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('subscription_active, trial_active')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.log('Profile error:', profileError.message);
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: isAdmin } = await adminClient.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

      const hasAccess = isAdmin || profile.subscription_active || profile.trial_active;
      
      if (!hasAccess) {
        console.log('User does not have premium access');
        return new Response(
          JSON.stringify({ error: 'Premium content requires subscription' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!article.file_url) {
      console.log('Article has no file');
      return new Response(
        JSON.stringify({ error: 'No file attached to this article' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract file path from the stored URL or use the path directly
    let filePath = article.file_url;
    
    // If it's a full URL, extract the path
    if (filePath.includes('/storage/v1/object/public/kb-files/')) {
      filePath = filePath.split('/storage/v1/object/public/kb-files/')[1];
    } else if (filePath.includes('/storage/v1/object/sign/kb-files/')) {
      filePath = filePath.split('/storage/v1/object/sign/kb-files/')[1].split('?')[0];
    }

    console.log('Generating signed URL for file path:', filePath);

    // Generate a signed URL with 1 hour expiry
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('kb-files')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.log('Signed URL error:', signedUrlError?.message || 'No signed URL generated');
      return new Response(
        JSON.stringify({ error: 'Could not generate file URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signed URL generated successfully');

    // Increment view count
    await adminClient
      .from('kb_articles')
      .update({ views: (article.views || 0) + 1 })
      .eq('id', articleId);

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-kb-file-url function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});