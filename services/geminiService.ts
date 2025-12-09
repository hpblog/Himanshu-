import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GeneratedIdea } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set. The app will not function correctly.");
}

// Helper to get client with latest key
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generateVideoIdeasPrompt = (topic: string) => `
You are an expert content strategist for social media. Your task is to generate creative and engaging video ideas for a given topic.
Please provide 3 ideas for YouTube and 3 ideas for Instagram.
The output MUST be a valid JSON array of objects. Do not include any text outside of the JSON array. Do not use markdown backticks.

Each object in the array should have the following structure:
{
  "platform": "YouTube" | "Instagram",
  "title": "A catchy and SEO-friendly title for the video.",
  "description": "A detailed script outline or a step-by-step description for the video. Use newline characters (\\n) for formatting.",
  "hashtags": ["relevant", "hashtags", "without", "the", "#", "symbol"],
  "imagePrompt": "A descriptive prompt for an AI image generator to create a compelling thumbnail. This should only be present for the FIRST YouTube idea."
}

Topic: "${topic}"

JSON Array:
`;

export const generateVideoIdeas = async (topic: string): Promise<GeneratedIdea[]> => {
  const ai = getAiClient();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: generateVideoIdeasPrompt(topic),
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.95,
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    if (!Array.isArray(parsedData)) {
      throw new Error("API did not return a valid array of ideas.");
    }

    // Further validation can be added here to ensure objects match the GeneratedIdea interface
    return parsedData as GeneratedIdea[];

  } catch (error) {
    console.error("Error generating video ideas:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("The provided API key is not valid. Please check your configuration.");
    }
    throw new Error("Failed to parse or fetch ideas from the AI model.");
  }
};

export interface BlogPostIdea {
    title: string;
    summary: string;
    seoKeywords: string[];
}

export const generateBlogIdeas = async (topic: string): Promise<BlogPostIdea[]> => {
    const ai = getAiClient();
    try {
        const prompt = `
        You are a professional blog editor. Generate 5 creative and SEO-friendly blog post ideas based on the topic: "${topic}".
        
        Return a valid JSON array of objects. Each object must have:
        - title: Catchy, clickable title.
        - summary: A 1-sentence summary of what the post covers.
        - seoKeywords: An array of 5 SEO keywords.
        
        Do not include markdown backticks.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        let jsonStr = response.text.trim();
         const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        return JSON.parse(jsonStr) as BlogPostIdea[];
    } catch (error) {
        console.error("Error generating blog ideas:", error);
        throw new Error("Failed to generate blog ideas.");
    }
};

export const generateBlogPost = async (title: string, keywords: string[], tone: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const prompt = `
        Write a comprehensive, human-friendly, and SEO-optimized blog post for the title: "${title}".
        Target Keywords: ${keywords.join(', ')}.
        Tone: ${tone} (Ensure it sounds natural, engaging, and not robotic).

        Structure the post with Markdown:
        1. **H1 Title**
        2. **Introduction**: Engaging hook, problem statement, and what the reader will learn.
        3. **Body Paragraphs**: Use H2 and H3 subheadings. Use bullet points where appropriate.
        4. **Conclusion**: Summary and a call to action.
        5. **FAQ Section**: 3 common questions and answers.

        Length: Approximately 800-1000 words.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.8, // Slightly higher for creativity/human-like tone
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating blog post:", error);
        throw new Error("Failed to write blog post.");
    }
};

export const generateHtmlBlogPost = async (title: string, keywords: string[], tone: string): Promise<string> => {
    const ai = getAiClient();
    const cssTemplate = `
<style>
  /* Custom CSS for Human-Friendly Reading & Mobile Responsiveness */
  .post-body {
    font-family: 'Georgia', sans-serif;
    line-height: 1.8;
    font-size: 18px;
    color: #222;
  }
  h2 {
    color: #cc0000; /* Sale Red */
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
    margin-top: 40px;
    font-family: 'Arial', sans-serif;
    font-weight: 700;
  }
  h3 {
    color: #2d2d2d;
    margin-top: 30px;
    font-family: 'Arial', sans-serif;
  }
  /* SEO Friendly Table Styling */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 16px;
  }
  th {
    background-color: #f8f9fa;
    color: #333;
    font-weight: bold;
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }
  td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }
  /* Mobile Scroll for Tables - Critical for SEO */
  .table-container {
    overflow-x: auto;
    white-space: nowrap;
    margin-bottom: 20px;
    border: 1px solid #eee;
  }
  /* Highlight Box for Pro Tips */
  .pro-tip-box {
    background-color: #e8f4f8;
    border-left: 5px solid #007bff;
    padding: 20px;
    margin: 20px 0;
    font-style: italic;
  }
  .alert-box {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    padding: 15px;
    border-radius: 5px;
    color: #856404;
  }
  ul, ol {
    margin-bottom: 20px;
  }
  li {
    margin-bottom: 10px;
  }
  .cta-button {
    display: inline-block;
    background-color: #ff9900;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
    margin: 10px 0;
  }
</style>

<div class="post-body">
`;

    try {
        const prompt = `
        Write a comprehensive, human-friendly, and SEO-optimized blog post for the title: "${title}".
        Target Keywords: ${keywords.join(', ')}.
        Tone: ${tone}.

        IMPORTANT: You must output RAW HTML code that fits inside the <div class="post-body"> tag.
        
        Formatting Rules based on the provided CSS:
        1. Wrap the entire content in a <div class="post-body">...</div> (I will prepend the style, you just provide the div and content).
        2. Use <h2> tags for main sections (Introduction, Main Points, Conclusion).
        3. Use <h3> tags for sub-points.
        4. Create at least one detailed HTML Table relevant to the topic. Wrap the <table> in a <div class="table-container"> for mobile responsiveness.
        5. Include 2-3 "Pro Tips" wrapped in <div class="pro-tip-box">.
        6. Include a "Warning" or "Note" wrapped in <div class="alert-box">.
        7. End with a Conclusion and a Call to Action button: <a href="#" class="cta-button">Learn More</a> (or relevant text).
        8. Do not use Markdown. Use only HTML.
        9. Ensure the content is high quality, conversational, and fast-loading (clean semantic HTML).

        Output ONLY the HTML code starting with <div class="post-body"> and ending with </div>.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.7,
            },
        });

        const content = response.text.trim().replace(/```html|```/g, '');
        return cssTemplate + content + "\n</div>"; // Ensure closing div if model forgets or for safety with template
    } catch (error) {
        console.error("Error generating HTML post:", error);
        throw new Error("Failed to write HTML blog post.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: '16:9' | '1:1' | '9:16' = '16:9'): Promise<string> => {
    const ai = getAiClient();
    try {
        // Simplified prompt enhancement to avoid confusing the model into generating text
        const enhancedPrompt = `${prompt} . High resolution, photorealistic, cinematic lighting, 4k.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: enhancedPrompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                },
            },
        });

        let textRefusal = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            if (part.text) {
                textRefusal += part.text;
            }
        }
        
        if (textRefusal) {
            console.warn("Model generated text instead of image:", textRefusal);
            throw new Error(`The model could not generate the image: ${textRefusal.substring(0, 100)}...`);
        }

        throw new Error("No image data returned from API.");
    } catch (error: any) {
        console.error("Error generating image:", error);
        throw new Error(error.message || "Failed to generate image.");
    }
};

export const enhanceVideoPrompt = async (script: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Rewrite the following video script or idea into a concise, highly detailed visual prompt suitable for an AI video generator (like Veo). 
            Focus on describing the scene, lighting, camera angle, and subject movement. Do not include audio instructions.
            Keep it under 60 words.
            
            Input Script: "${script}"`
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        return script; // Fallback to original if enhancement fails
    }
};

export const generateDetailedScript = async (topic: string, videoType: string, tone: string, audience: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const prompt = `
        Create a professional, engaging video script for a ${videoType} video.
        Topic: "${topic}"
        Tone: ${tone}
        Target Audience: ${audience}

        Structure the response clearly with the following sections (use Markdown for formatting):
        1. **Title**: Catchy and SEO optimized.
        2. **Hook (0-10s)**: Grab attention immediately.
        3. **Intro**: Briefly introduce the topic.
        4. **Body**: Key points or steps (broken down).
        5. **Conclusion**: Summary.
        6. **Call to Action**: What should the viewer do next?

        Write the script in a way that is easy to read aloud for a voiceover.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.8,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating detailed script:", error);
        throw new Error("Failed to generate script.");
    }
}

interface VideoScriptData {
    visualPrompt: string;
    voiceoverScript: string;
}

export const generateVideoScript = async (topic: string): Promise<VideoScriptData> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a video script for the following topic: "${topic}".
            
            Return a JSON object with two fields:
            1. "voiceoverScript": A short, engaging spoken script for a narrator (max 30 seconds spoken).
            2. "visualPrompt": A highly detailed visual description of the video scene for an AI video generator (Veo). Describe the subject, environment, lighting, and movement. Keep it under 60 words.

            Output JSON only.`,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text.trim();
        // Basic cleanup just in case
        const jsonStr = text.startsWith('```json') ? text.replace(/```json|```/g, '') : text;
        return JSON.parse(jsonStr) as VideoScriptData;
    } catch (e) {
        console.error("Error generating script:", e);
        throw new Error("Failed to generate script");
    }
}

// PCM to WAV converter
function createWavFile(samples: Uint8Array, sampleRate: number): Blob {
    const dataLength = samples.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
  
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count (mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sampleRate * blockAlign)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataLength, true);
  
    // Write PCM samples
    const byteView = new Uint8Array(buffer, 44);
    byteView.set(samples);
  
    return new Blob([buffer], { type: 'audio/wav' });
}
  
function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data generated");

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Gemini TTS uses 24kHz sample rate
        const wavBlob = createWavFile(bytes, 24000);
        return URL.createObjectURL(wavBlob);

    } catch (e) {
        console.error("Error generating speech:", e);
        throw new Error("Failed to generate speech");
    }
}

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', inputImage?: string): Promise<string> => {
    const aiVideo = getAiClient();
    
    try {
        const requestOptions: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        };

        // If an input image is provided, add it to the request for Image-to-Video
        if (inputImage) {
            const matches = inputImage.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                requestOptions.image = {
                    mimeType: matches[1],
                    imageBytes: matches[2]
                };
            }
        }

        let operation = await aiVideo.models.generateVideos(requestOptions);

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await aiVideo.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed but no video URI was returned.");
        }

        // Fetch the video bytes using the API Key
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video content: ${response.statusText}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error: any) {
        console.error("Error generating video:", error);
        
        let errorMessage = '';

        // Try to get the message from various places.
        // We do this elaborately because SDK errors can be structured differently.
        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        // Append stringified error to catch cases where the error message is buried in a JSON response
        try {
            const errorObj = error instanceof Error ? error : { ...error };
            const jsonError = JSON.stringify(errorObj, Object.getOwnPropertyNames(errorObj));
            errorMessage += ' ' + jsonError;
        } catch (e) {
            // Ignore stringify errors
        }

        if (errorMessage.includes("Requested entity was not found")) {
            throw new Error("Requested entity was not found");
        }
        
        // Return a clean error message if possible, otherwise generic
        if (error instanceof Error) {
             throw new Error(error.message);
        }
        
        throw new Error("Failed to generate video.");
    }
};