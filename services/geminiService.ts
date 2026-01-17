
import { GoogleGenAI, Type } from "@google/genai";
import { SCENERIES, STYLES, POSES, CAMERA_ANGLES, EXPRESSIONS, SYSTEM_INSTRUCTION, WORKFLOW_ANGLES, PRODUCT_ANGLES } from '../constants';
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
    { label: '1. THUMBNAIL (The Hook)', prompt: `SLIDE 1: THUMBNAIL Hook. Large Times New Roman. Hook: ${productText}`, refs: [modelOnly, productOnly] },
    { label: '2. THE SOLUTION (Educational)', prompt: `SLIDE 2: EDUCATIONAL. Benefit from: ${productText}`, refs: [modelXProduct] },
    { label: '3. THE TRANSFORMATION (FOMO)', prompt: `SLIDE 3: FOMO shot. results from: ${productText}`, refs: [modelOnly, productOnly] },
    { label: '4. THE CRAFT (Product Hero)', prompt: `SLIDE 4: PRODUCT Detail. From: ${productText}`, refs: [productOnly] },
    { label: '5. THE CALL (CTA)', prompt: `SLIDE 5: CTA. Join elite. From: ${productText}`, refs: [modelXProduct, productOnly] }
  ];

  const promises = slideConfigs.map(async (config, index) => {
    try {
      const fullPrompt = `${SYSTEM_INSTRUCTION} ${config.prompt} ${themeInfo} CORE TYPOGRAPHY: Elegant Times New Roman, large for mobile. 3:4 ratio.`;
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
    contents: `Write luxury marketing copy for "${product}". Context: ${context}. Target Audience: ${audience}. Return a JSON object with keys: productName, emailContent, socialContent, salesPageContent. Keep email content professional, social content catchy with emojis, and sales page content persuasive.`,
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
    const data = JSON.parse(response.text || "{}");
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      productName: data.productName || product,
      emailContent: data.emailContent || "Copy generation failed.",
      socialContent: data.socialContent || "Copy generation failed.",
      salesPageContent: data.salesPageContent || "Copy generation failed."
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
