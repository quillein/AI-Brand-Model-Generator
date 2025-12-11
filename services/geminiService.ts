import { GoogleGenAI } from "@google/genai";
import { SCENERIES, STYLES, POSES, CAMERA_ANGLES, EXPRESSIONS, SYSTEM_INSTRUCTION } from '../constants';
import { GeneratedImage } from '../types';

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateAvatarVariations = async (
  base64Image: string,
  imageMimeType: string,
  options: {
    sceneryId?: string;
    styleId?: string;
    customPrompt?: string;
  } = {}
): Promise<GeneratedImage[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Resolve Scenery
  let scenery = SCENERIES.find(s => s.id === options.sceneryId);
  // Resolve Style
  let style = STYLES.find(s => s.id === options.styleId);

  // Randomize attributes to ensure variety.
  const shuffledPoses = [...POSES].sort(() => 0.5 - Math.random());
  const shuffledAngles = [...CAMERA_ANGLES].sort(() => 0.5 - Math.random());
  const shuffledExpressions = [...EXPRESSIONS].sort(() => 0.5 - Math.random());
  
  // Generate 5 variations
  const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
    try {
      // If no specific preset selected, pick a random one to ensure high quality baseline
      const currentScenery = scenery || SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
      const currentStyle = style || STYLES[Math.floor(Math.random() * STYLES.length)];

      const pose = shuffledPoses[index % shuffledPoses.length];
      const angle = shuffledAngles[index % shuffledAngles.length];
      const expression = shuffledExpressions[index % shuffledExpressions.length];

      const customInstruction = options.customPrompt 
        ? `USER CUSTOM INSTRUCTION: "${options.customPrompt}". (IMPORTANT: If this instruction describes a specific scene, style, or outfit, PRIORITIZE IT over the random Scenery/Style below.)` 
        : '';

      const prompt = `
        Transform the person in this image into a HYPER-REALISTIC high-fashion model while strictly PRESERVING their facial identity and skin tone.
        
        CRITICAL INSTRUCTIONS:
        1. IDENTITY: DO NOT change the facial features or skin color of the subject. They must remain exactly as in the original photo.
        2. STYLE: Hair and makeup must be modern (2024-2025 trends), sexy, and glamorous.
        3. REALISM: This must look like a real photo. No cartoons, no illustrations.
        4. VIBE: Sexy, confident, "Instagram Baddie", expensive. Showing skin (legs, midriff) is encouraged if it fits the outfit.
        5. PERSONALITY: Capture the requested facial expression and vibe authentically.

        ${customInstruction}

        THEME DETAILS (Use these as a base, unless overridden by User Custom Instruction):
        - STYLE: ${currentStyle.prompt}
        - SCENERY: ${currentScenery.prompt}
        - ACTION/POSE: ${pose}
        - CAMERA ANGLE: ${angle}
        - FACIAL EXPRESSION: ${expression}
        
        COLOR PALETTE: 
        - Core Color: Dusty Rose (#D99BA3) MUST be present.
        - Palette: Warm Taupe (#D0C0B2), Alabaster (#F8F4EC), Oatmeal (#E5D3C5), Almond Buff (#BFA898), Flamingo Pink (#F2B6B6), Sage Green (#6E7A63), Espresso (#46352D), Cool Slate (#929496).
        
        Ensure the final output is a high-resolution, photorealistic image suitable for a luxury beauty campaign.
      `;

      // Switch to 'gemini-2.5-flash-image' (Nano Banana) which is generally more accessible/free tier friendly.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageMimeType,
                data: base64Image
              }
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4", 
            // imageSize is not supported in gemini-2.5-flash-image
          },
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error("No image generated");
      }

      return {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: options.customPrompt ? `Custom: ${options.customPrompt}` : `Style: ${currentStyle.label}`,
        scenario: options.customPrompt ? "Custom Vibe" : `${currentStyle.label} in ${currentScenery.label}`,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Error generating variation ${index}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((img): img is GeneratedImage => img !== null);
};