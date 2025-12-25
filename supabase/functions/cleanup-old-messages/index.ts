import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting cleanup of old lobby messages...')

    // Verify authorization - only allow calls from Supabase scheduler or with valid service key
    const authHeader = req.headers.get('Authorization')
    const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    // Allow calls with service role key (cron job) or anon key (scheduled via pg_cron)
    const isAuthorized = authHeader && (
      authHeader === `Bearer ${expectedKey}` || 
      authHeader === `Bearer ${anonKey}`
    )
    
    if (!isAuthorized) {
      console.error('Unauthorized cleanup attempt')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the cutoff time (72 hours ago)
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 72)
    const cutoffISO = cutoffTime.toISOString()

    console.log(`Deleting messages older than: ${cutoffISO}`)

    // First, get the lobby room(s)
    const { data: lobbyRooms, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('room_type', 'lobby')

    if (roomError) {
      console.error('Error fetching lobby rooms:', roomError)
      throw roomError
    }

    if (!lobbyRooms || lobbyRooms.length === 0) {
      console.log('No lobby rooms found')
      return new Response(
        JSON.stringify({ success: true, message: 'No lobby rooms found', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lobbyRoomIds = lobbyRooms.map(r => r.id)
    console.log(`Found ${lobbyRoomIds.length} lobby room(s)`)

    // Delete old messages from lobby rooms
    const { data: deletedMessages, error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .in('room_id', lobbyRoomIds)
      .lt('created_at', cutoffISO)
      .select('id')

    if (deleteError) {
      console.error('Error deleting old messages:', deleteError)
      throw deleteError
    }

    const deletedCount = deletedMessages?.length || 0
    console.log(`Successfully deleted ${deletedCount} old messages from lobby`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${deletedCount} messages older than 72 hours`,
        deleted: deletedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in cleanup-old-messages:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})