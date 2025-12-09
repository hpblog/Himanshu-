export const generateElevenLabsSpeech = async (text: string, voiceId: string, apiKey: string): Promise<string> => {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
      throw new Error("ElevenLabs API Key is missing.");
  }

  // Helper to attempt generation with a specific model
  const attemptGeneration = async (modelId: string) => {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': cleanKey
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
            throw new Error("Invalid API Key. Please check your ElevenLabs key.");
        }
        
        const message = errorData.detail?.message || errorData.detail?.status || `API Error: ${response.status}`;
        throw new Error(message);
      }
  
      return await response.blob();
  };

  try {
    // Try the newer multilingual model first
    const blob = await attemptGeneration("eleven_multilingual_v2");
    return URL.createObjectURL(blob);
  } catch (error: any) {
    // If auth error, fail immediately
    if (error.message.includes("Invalid API Key")) {
        throw error;
    }

    console.warn("ElevenLabs V2 failed, attempting fallback to V1...", error);

    try {
        // Fallback to monolingual v1 (legacy, often more stable on some tiers/voices)
        const blob = await attemptGeneration("eleven_monolingual_v1");
        return URL.createObjectURL(blob);
    } catch (retryError: any) {
        throw new Error(retryError.message || "Failed to generate speech with ElevenLabs.");
    }
  }
};