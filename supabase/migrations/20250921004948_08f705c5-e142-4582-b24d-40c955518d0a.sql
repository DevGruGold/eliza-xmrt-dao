-- Fix security warnings: Set proper search_path for functions
DROP FUNCTION IF EXISTS public.update_conversation_memory(INET, TEXT, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.clear_conversation_memory(INET, TEXT);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_conversation_memory(
  p_ip_address INET,
  p_session_fingerprint TEXT,
  p_message JSONB,
  p_neural_context JSONB DEFAULT NULL,
  p_multimodal_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  memory_id UUID;
  current_context JSONB;
BEGIN
  -- Try to get existing conversation
  SELECT id, conversation_context INTO memory_id, current_context
  FROM public.conversation_memory 
  WHERE ip_address = p_ip_address AND session_fingerprint = p_session_fingerprint;
  
  IF memory_id IS NULL THEN
    -- Create new conversation memory
    INSERT INTO public.conversation_memory (
      ip_address, 
      session_fingerprint, 
      conversation_context,
      neural_embeddings,
      multimodal_context,
      total_interactions
    ) VALUES (
      p_ip_address,
      p_session_fingerprint,
      jsonb_build_array(p_message),
      p_neural_context,
      COALESCE(p_multimodal_data, '{}'),
      1
    ) RETURNING id INTO memory_id;
  ELSE
    -- Update existing conversation
    UPDATE public.conversation_memory 
    SET 
      conversation_context = conversation_context || jsonb_build_array(p_message),
      neural_embeddings = COALESCE(p_neural_context, neural_embeddings),
      multimodal_context = multimodal_context || COALESCE(p_multimodal_data, '{}'),
      total_interactions = total_interactions + 1,
      last_interaction = now(),
      updated_at = now()
    WHERE id = memory_id;
  END IF;
  
  RETURN memory_id;
END;
$$;

-- Create function to clear conversation memory
CREATE OR REPLACE FUNCTION public.clear_conversation_memory(
  p_ip_address INET,
  p_session_fingerprint TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.conversation_memory 
  WHERE ip_address = p_ip_address AND session_fingerprint = p_session_fingerprint;
  
  RETURN FOUND;
END;
$$;