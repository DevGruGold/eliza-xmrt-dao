import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationMemoryRequest {
  action: 'store' | 'retrieve' | 'clear';
  message?: {
    content: string;
    sender: 'user' | 'eliza';
    timestamp: string;
    type?: string;
  };
  neuralContext?: any;
  multimodalData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP address
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1';
    
    // Create session fingerprint from User-Agent and other headers
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const acceptLanguage = req.headers.get('accept-language') || 'en';
    const sessionFingerprint = btoa(`${userAgent}-${acceptLanguage}`).slice(0, 50);

    const { action, message, neuralContext, multimodalData }: ConversationMemoryRequest = await req.json();

    switch (action) {
      case 'store':
        if (!message) {
          throw new Error('Message is required for store action');
        }

        const { data: storeResult, error: storeError } = await supabase.rpc('update_conversation_memory', {
          p_ip_address: clientIP,
          p_session_fingerprint: sessionFingerprint,
          p_message: message,
          p_neural_context: neuralContext,
          p_multimodal_data: multimodalData
        });

        if (storeError) throw storeError;

        return new Response(JSON.stringify({ 
          success: true, 
          memoryId: storeResult,
          sessionFingerprint 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'retrieve':
        const { data: retrieveResult, error: retrieveError } = await supabase
          .from('conversation_memory')
          .select('*')
          .eq('ip_address', clientIP)
          .eq('session_fingerprint', sessionFingerprint)
          .single();

        if (retrieveError && retrieveError.code !== 'PGRST116') {
          throw retrieveError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          memory: retrieveResult || null,
          sessionFingerprint 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'clear':
        const { data: clearResult, error: clearError } = await supabase.rpc('clear_conversation_memory', {
          p_ip_address: clientIP,
          p_session_fingerprint: sessionFingerprint
        });

        if (clearError) throw clearError;

        return new Response(JSON.stringify({ 
          success: true, 
          cleared: clearResult,
          sessionFingerprint 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in conversation-memory function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});