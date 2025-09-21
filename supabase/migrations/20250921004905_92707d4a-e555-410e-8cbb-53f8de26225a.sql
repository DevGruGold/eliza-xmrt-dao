-- Create conversation memory system with IP-based tracking
CREATE TABLE public.conversation_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  session_fingerprint TEXT NOT NULL,
  conversation_context JSONB NOT NULL DEFAULT '[]'::jsonb,
  neural_embeddings JSONB DEFAULT NULL,
  multimodal_context JSONB DEFAULT '{}' ::jsonb,
  total_interactions INTEGER DEFAULT 0,
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, session_fingerprint)
);

-- Enable RLS
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation memory
CREATE POLICY "Anyone can access conversation memory by IP" 
ON public.conversation_memory 
FOR ALL 
USING (true);

-- Create function for updating conversation memory
CREATE OR REPLACE FUNCTION public.update_conversation_memory(
  p_ip_address INET,
  p_session_fingerprint TEXT,
  p_message JSONB,
  p_neural_context JSONB DEFAULT NULL,
  p_multimodal_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
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
AS $$
BEGIN
  DELETE FROM public.conversation_memory 
  WHERE ip_address = p_ip_address AND session_fingerprint = p_session_fingerprint;
  
  RETURN FOUND;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversation_memory_updated_at
BEFORE UPDATE ON public.conversation_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();