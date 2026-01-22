
import { GoogleGenAI, Type } from "@google/genai";
import { SCENERIES, STYLES, SYSTEM_INSTRUCTION } from '../constants';
import { GeneratedImage, GeneratedCopy } from '../types';

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const extractImageFromResponse = (response: any, scenario: string, category: any): GeneratedImage | null => {
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  if (!part?.inlineData) return null;

  return {
    id: crypto.randomUUID(),
    url: `data:image/png;base64,${part.inlineData.data}`,
    prompt: scenario,
    scenario: scenario,
    timestamp: Date.now(),
    category: category
  };
};

export const generateAvatarVariations = async (
  base64: string,
  mimeType: string,
  options: { sceneryId?: string; styleId?: string; customPrompt?: string; aspectRatio: string }
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `${SYSTEM_INSTRUCTION} Create a high-fashion portrait. SCENERY: ${options.sceneryId}. STYLE: ${options.styleId}. ASPECT RATIO: ${options.aspectRatio}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }] },
    config: { imageConfig: { aspectRatio: options.aspectRatio as any } }
  });
  const result = extractImageFromResponse(response, "Avatar Variation", "avatar");
  return result ? [result] : [];
};

export const generateBackground = async (
  options: { 
    sceneryId?: string; 
    styleId?: string; 
    customPrompt?: string; 
    colorHex?: string;
    aspectRatio: string 
  }
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scenery = SCENERIES.find(s => s.id === options.sceneryId)?.prompt || "luxury environment";
  const style = STYLES.find(s => s.id === options.styleId)?.prompt || "minimalist aesthetic";
  const color = options.colorHex ? `Dominant color palette: ${options.colorHex}.` : "";
  
  const prompt = `
    ${SYSTEM_INSTRUCTION}
    CATEGORY: Environmental Background / Texture Study.
    SCENERY: ${scenery}.
    STYLE: ${style}.
    CUSTOM DETAILS: ${options.customPrompt || "A clean, high-end editorial background shot."}
    ${color}
    
    VISUAL RULES:
    - NO PEOPLE or models. Focus solely on environment, objects, textures, and lighting.
    - If "macro" is mentioned, focus on extreme texture (silk ripples, water droplets, cream swirls, stone grain).
    - Maintain a "Soft Life" pinterest aesthetic.
    - Lighting should be soft, natural, and expensive-looking.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: options.aspectRatio as any } }
  });
  
  const result = extractImageFromResponse(response, options.customPrompt || "Aesthetic Background", "background");
  return result ? [result] : [];
};

export const generateContextualCarousel = async (
  productText: string,
  modelXProduct: { data: string; mimeType: string },
  modelOnly: { data: string; mimeType: string },
  productOnly: { data: string; mimeType: string },
  options: { themeColorHex?: string; themeColorName?: string } = {}
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const themeInfo = options.themeColorHex ? `THEME COLOR: ${options.themeColorName} (${options.themeColorHex})` : "THEME COLOR: Use colors from product.";
  const slideConfigs = [
    { label: '1. THUMBNAIL (The Hook)', prompt: `SLIDE 1: THUMBNAIL Hook. Large Times New Roman font. Hook: ${productText}`, refs: [modelOnly, productOnly] },
    { label: '2. THE SOLUTION (Educational)', prompt: `SLIDE 2: EDUCATIONAL. Benefit from: ${productText}`, refs: [modelXProduct] },
    { label: '3. THE TRANSFORMATION (FOMO)', prompt: `SLIDE 3: FOMO shot. results from: ${productText}`, refs: [modelOnly, productOnly] },
    { label: '4. THE CRAFT (Product Hero)', prompt: `SLIDE 4: PRODUCT Detail. From: ${productText}`, refs: [productOnly] },
    { label: '5. THE CALL (CTA)', prompt: `SLIDE 5: CTA. Join elite. From: ${productText}`, refs: [modelXProduct, productOnly] }
  ];

  const promises = slideConfigs.map(async (config) => {
    try {
      const fullPrompt = `${SYSTEM_INSTRUCTION} ${config.prompt} ${themeInfo} CORE TYPOGRAPHY: Elegant Times New Roman font, large size for mobile accessibility. 3:4 ratio.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }, ...config.refs.map(r => ({ inlineData: { mimeType: r.mimeType, data: r.data } }))] },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });
      return extractImageFromResponse(response, config.label, 'carousel');
    } catch (e) { return null; }
  });
  const results = await Promise.all(promises);
  return results.filter((img): img is GeneratedImage => img !== null);
};

export const generateMarketingCopy = async (
  product: string,
  context: string,
  audience: string
): Promise<GeneratedCopy> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a world-class luxury marketing strategist and copywriter. Write elite-tier, long-form copy for: "${product}". 
    CONTEXT: ${context}. 
    AUDIENCE: ${audience}. 
    
    CRITICAL FORMATTING:
    - DO NOT USE BOLDING OR ASTERISKS (**). Use clear spacing and capitalized headers instead.
    - Provide deep, descriptive, and nuanced content.
    - Return a JSON object with keys: productName, emailContent, socialContent, salesPageContent.

    SPECIFIC CONTENT REQUIREMENTS:
    
    1. socialContent (Social Media Scripts):
       - Structure as "Script A: The Main Character Energy" and "Script B: The Durability/Educational Test".
       - Include sections for VISUAL, AUDIO/VOICEOVER, ON-SCREEN TEXT, and CAPTION for each script.
       - Use a high-conversion, viral storytelling tone.

    2. emailContent (The Luxury Multi-Step Sequence):
       - Provide a 4-Email Sequence: Email 1 (The Tease), Email 2 (The Scent/Product Architecture), Email 3 (Quiet Luxury Social Proof), Email 4 (The Closing).
       - Include SUBJECT and BODY for each email.

    3. salesPageContent (Signature Sales Copy):
       - Include a compelling HEADLINE and SUB-HEADLINE.
       - Provide an "OLFACTORY PYRAMID" or "PRODUCT HIERARCHY" section (Top/Heart/Base notes).
       - Use sensory language (e.g., 'velvety heart', 'luminous symphony', 'sanctuary of warmth').
       - Explain the artisanal craftsmanship and why it is a 'must-have' luxury.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          emailContent: { type: Type.STRING },
          socialContent: { type: Type.STRING },
          salesPageContent: { type: Type.STRING },
        },
        required: ["productName", "emailContent", "socialContent", "salesPageContent"]
      }
    }
  });

  try {
    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      productName: data.productName || product,
      emailContent: data.emailContent || "Generation failed.",
      socialContent: data.socialContent || "Generation failed.",
      salesPageContent: data.salesPageContent || "Generation failed."
    };
  } catch (e) {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      productName: product,
      emailContent: response.text || "Parsing error.",
      socialContent: "Please try again.",
      salesPageContent: "Please try again."
    };
  }
};

export const generateAngleVariations = async (images: any[], scenario: string, category: any, aspectRatio: string) => { return []; };
export const generateProductVariations = async (products: any[], options: any) => { return []; };
export const generateModelProductVariations = async (model: any, products: any[], options: any) => { return []; };
export const generateProductMockup = async (modelBase64: string, modelMime: string, products: any[], scenario: string, aspectRatio: string) => { return []; };
export const generateDirectorsCut = async (refs: any[], category: any, aspectRatio: string) => { return []; };
export const generateIGCarousel = async (modelBase64: string, modelMime: string, products: any[], themeColor: string, themeName: string) => { return []; };
