
import { GoogleGenAI } from "@google/genai";
import { SCENERIES, STYLES, POSES, CAMERA_ANGLES, EXPRESSIONS, SYSTEM_INSTRUCTION, WORKFLOW_ANGLES, PRODUCT_ANGLES } from '../constants';
import { GeneratedImage, GeneratedCopy } from '../types';

const VIDEO_BASE_FORMULA = `You are a professional film director, VFX supervisor, and motion continuity engineer.

Your task is to generate a video from the provided reference image with maximum consistency, physical realism, and motion stability.

The uploaded image is the absolute canonical source of truth for:
- Character identity, facial structure, and body proportions.
- CLOTHING & ACCESSORIES: Texture, fit, and movement physics.
- OBJECTS & PRODUCTS: Logos, text, shape, and label details must remain 100% static and distinct.

STRICT VISUAL CONSTRAINTS:
1. PRODUCT SOLIDITY: Objects (bottles, jars, phones) must be solid rigid bodies. They must NOT morph, melt, breathe, double, or warp. Labels and logos must remain tack-sharp and legible.
2. NO HALLUCINATIONS: Do not generate extra fingers, extra hands, or duplicate phantom objects floating nearby.
3. PHYSICS: Liquids in bottles/cups must move naturally with gravity. Fabric must drape and fold correctly during movement.
4. INTERACTION: If the model holds an object, the hand grip must remain solid and fixed. The object moves *with* the hand, not independently.

MOTION STYLE:
- SPEED: Extreme slow-motion, cinematic, elegant (0.25x to 0.5x speed). Dreamy and high-end luxury feel.
- FLOW: Smooth, organic, fluid movements. Avoid jerky, robotic, or snap-zoom shifts.
- CAMERA: Steady, professional stabilization (gimbal, dolly, or tripod).

Treat this as a high-budget commercial luxury shot where every frame must maintain brand integrity.`;

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

const generateVideoNarrative = async (
    ai: GoogleGenAI, 
    base64Image: string,
    mimeType: string,
    scenario: string, 
    angle: string, 
    category: string
): Promise<string> => {
    try {
        const prompt = `
            You are a Cinematographer and VFX Director for a high-end luxury beauty commercial.
            TASK: Write a precise "Director's Narrative" text prompt for a video generation model (Veo).
            
            INPUT CONTEXT:
            - Subject Type: ${category === 'product' ? 'Commercial Product Bundle' : 'High Fashion Model'}
            - Scene/Setting: ${scenario}
            - Camera Angle: ${angle}

            VISUAL ANALYSIS TASK:
            Analyze the provided reference image. 
            1. If there is a model: Is she laughing, walking, or applying a product? 
            2. If there are products: How are they arranged?
            
            WRITE THE NARRATIVE:
            - The movement must be SLOW, deliberate, and expensive-looking.
            - Focus on natural flow: "The camera orbits slowly... hair flows gently in the breeze... light glints off the product label without distorting it."
            - Ensure interaction is described: "Subject's fingers hold the bottle firmly. The label stays perfectly legible as she tilts it slowly."
            - Use terms like "Fluid motion", "Cinematic glide", "Steady frame".
            
            OUTPUT: A single, descriptive paragraph. No markdown. Focus on maintaining 1:1 shape consistency of products.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Image } }
                ]
            }
        });
        return response.text || `Slow, cinematic camera glide with perfectly stable product details and natural subject flow.`;
    } catch (e) {
        return `Slow, cinematic camera glide with perfectly stable product details and natural subject flow.`;
    }
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let scenery = SCENERIES.find(s => s.id === options.sceneryId);
  let style = STYLES.find(s => s.id === options.styleId);

  const shuffledPoses = [...POSES].sort(() => 0.5 - Math.random());
  const shuffledAngles = [...CAMERA_ANGLES].sort(() => 0.5 - Math.random());
  const shuffledExpressions = [...EXPRESSIONS].sort(() => 0.5 - Math.random());
  
  const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
    try {
      const currentScenery = scenery || SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
      const currentStyle = style || STYLES[Math.floor(Math.random() * STYLES.length)];
      const pose = shuffledPoses[index % shuffledPoses.length];
      const angle = shuffledAngles[index % shuffledAngles.length];
      const expression = shuffledExpressions[index % shuffledExpressions.length];

      const prompt = `
        Transform the person in this image into a HYPER-REALISTIC high-fashion model.
        Facial identity must be preserved exactly. Skin tone must remain identical.
        STYLE: ${currentStyle.prompt}
        SCENERY: ${currentScenery.prompt}
        POSE: ${pose}, ANGLE: ${angle}, EXPRESSION: ${expression}
        ${options.customPrompt ? `CUSTOM: ${options.customPrompt}` : ''}
        Luxury aesthetic. Dusty Rose core color. High-end film grain and lighting.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: {
          parts: [{ text: prompt }, { inlineData: { mimeType: imageMimeType, data: base64Image } }]
        },
        config: { imageConfig: { aspectRatio: "3:4" }, systemInstruction: SYSTEM_INSTRUCTION }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!part?.inlineData) throw new Error("No image");

      return {
        id: crypto.randomUUID(),
        url: `data:image/png;base64,${part.inlineData.data}`,
        prompt: options.customPrompt || `Style: ${currentStyle.label}`,
        scenario: `${currentStyle.label} in ${currentScenery.label}`,
        timestamp: Date.now(),
        category: 'avatar'
      };
    } catch (error) { return null; }
  });

  return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
};

export const generateProductVariations = async (
    productImages: Array<{ data: string; mimeType: string }>,
    options: {
      sceneryId?: string;
      styleId?: string;
      customPrompt?: string;
    } = {}
  ): Promise<GeneratedImage[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let scenery = SCENERIES.find(s => s.id === options.sceneryId);
    let style = STYLES.find(s => s.id === options.styleId);
  
    const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
      try {
        const currentScenery = scenery || SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
        const currentStyle = style || STYLES[Math.floor(Math.random() * STYLES.length)];
        const currentAngle = PRODUCT_ANGLES[index % PRODUCT_ANGLES.length];
  
        const prompt = `
          You are a LUXURY PRODUCT PHOTOGRAPHER.
          TASK: Create a commercial shot featuring the ${productImages.length} PRODUCT(S) provided.
          
          STRICT CONSTRAINTS ON PRODUCT ACCURACY:
          - Every product provided in the reference images must appear exactly.
          - DO NOT alter the labels, logos, or text on the packaging. 
          - Preserve the 1:1 shape and color (especially brand Dusty Rose #D99BA3).
          - If multiple products are provided, arrange them as a high-end "Beauty Kit" or "Luxury Bundle".
          - No hallucinated products. No morphing.
          
          THEME: ${currentStyle.prompt}
          SCENERY: ${currentScenery.prompt}
          ANGLE: ${currentAngle}
          ${options.customPrompt ? `CUSTOM: ${options.customPrompt}` : ''}
          
          STRICT CONSTRAINT: NO HUMANS. NO HANDS.
        `;
  
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image', 
          contents: {
            parts: [
              { text: prompt },
              ...productImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } }))
            ]
          },
          config: { imageConfig: { aspectRatio: "3:4" }, systemInstruction: SYSTEM_INSTRUCTION }
        });
  
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!part?.inlineData) throw new Error("No image");
  
        return {
          id: crypto.randomUUID(),
          url: `data:image/png;base64,${part.inlineData.data}`,
          prompt: options.customPrompt || `Products in ${currentScenery.label}`,
          scenario: `${currentStyle.label} Product Bundle`,
          timestamp: Date.now(),
          category: 'product'
        };
      } catch (error) { return null; }
    });
  
    return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
  };

export const generateAngleVariations = async (
    referenceImages: Array<{ data: string; mimeType: string }>,
    originalScenarioLabel: string,
    category: 'avatar' | 'product' | 'carousel' = 'avatar'
): Promise<GeneratedImage[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const anglesToUse = category === 'product' ? PRODUCT_ANGLES : WORKFLOW_ANGLES;

    const promises = anglesToUse.map(async (angle): Promise<GeneratedImage | null> => {
        try {
            const prompt = `
                REFERENCE: Provided source image(s). Re-generate this SAME subject/product kit in the SAME scenario: "${originalScenarioLabel}".
                CHANGE: Shot must use CAMERA ANGLE: "${angle}".
                
                STRICT PRODUCT ACCURACY:
                - Maintain 100% accurate labels, shapes, and branding for ALL products in the kit.
                - Do not add, remove, or morph any products.
                
                ${category === 'product' ? 'STRICT CONSTRAINT: NO HUMANS. NO HANDS.' : 'PRESERVE SUBJECT IDENTITY STRICTLY.'}
            `;
            const [imageResponse, videoNarrative] = await Promise.all([
                ai.models.generateContent({
                    model: 'gemini-2.5-flash-image', 
                    contents: {
                      parts: [
                          { text: prompt }, 
                          ...referenceImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } }))
                      ]
                    },
                    config: { imageConfig: { aspectRatio: "3:4" }, systemInstruction: SYSTEM_INSTRUCTION }
                }),
                generateVideoNarrative(ai, referenceImages[0].data, referenceImages[0].mimeType, originalScenarioLabel, angle, category)
            ]);

            const part = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!part?.inlineData) return null;

            return {
                id: crypto.randomUUID(),
                url: `data:image/png;base64,${part.inlineData.data}`,
                prompt: `Angle: ${angle}`,
                scenario: `${originalScenarioLabel} (${angle})`,
                timestamp: Date.now(),
                category: category,
                videoPrompt: `${VIDEO_BASE_FORMULA}\n\nDIRECTOR'S NARRATIVE:\n${videoNarrative}`
            };
        } catch (error) { return null; }
    });

    return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
};

export const generateDirectorsCut = async (
  referenceImages: Array<{ data: string; mimeType: string }>,
  category: 'avatar' | 'product' | 'carousel' = 'avatar'
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let anglesToUse = category === 'product' ? [...PRODUCT_ANGLES] : [...WORKFLOW_ANGLES];
  if (category === 'avatar') anglesToUse = ["Front Facing, Direct Eye Contact", ...anglesToUse];

  const promises = anglesToUse.map(async (angle): Promise<GeneratedImage | null> => {
      try {
          const prompt = `
          DIRECTOR'S CUT: Generate the EXACT SAME subject/product kit in the SAME environment but from a different angle: ${angle}. 
          
          STRICT CONSISTENCY:
          - For Products: 100% accurate branding, labels, and geometry. No morphing. No doubling.
          - For Model: PRESERVE IDENTITY/OUTFIT 100%. No changes to makeup or features.
          
          ${category === 'product' ? 'NO HUMANS. NO HANDS. Keep the exact products in the kit unchanged.' : ''}
          `;
          const [imageResponse, videoNarrative] = await Promise.all([
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image', 
                contents: {
                  parts: [
                      { text: prompt }, 
                      ...referenceImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } }))
                  ]
                },
                config: { imageConfig: { aspectRatio: "3:4" }, systemInstruction: SYSTEM_INSTRUCTION }
            }),
            generateVideoNarrative(ai, referenceImages[0].data, referenceImages[0].mimeType, "Original Context", angle, category)
          ]);
          const part = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
          if (!part?.inlineData) return null;

          return {
              id: crypto.randomUUID(),
              url: `data:image/png;base64,${part.inlineData.data}`,
              prompt: `Director's Cut: ${angle}`,
              scenario: `Original Shot (${angle})`,
              timestamp: Date.now(),
              category: category,
              videoPrompt: `${VIDEO_BASE_FORMULA}\n\nDIRECTOR'S NARRATIVE:\n${videoNarrative}`
          };
      } catch (error) { return null; }
  });

  return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
};

export const generateProductMockup = async (
    originalFaceBase64: string,
    faceMimeType: string,
    productImages: Array<{ data: string; mimeType: string }>,
    scenarioLabel: string
): Promise<GeneratedImage[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `
            COMPOSITE TASK: Model + Product(s) Bundle.
            Create a high-fashion shot of the MODEL interacting with the provided COLLECTION of ${productImages.length} PRODUCT(S).
            SCENARIO: ${scenarioLabel}.
            
            STRICT PRODUCT ACCURACY:
            - Every product provided in the reference images must appear exactly as a solid object.
            - Do not morph the labels or logos. 
            - If it's a kit, she should be using one item while others are placed elegantly nearby.
            
            VIBE: Luxury Ad Campaign. Preserve model's facial identity perfectly.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: faceMimeType, data: originalFaceBase64 } },
                ...productImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } }))
              ]
            },
            config: { imageConfig: { aspectRatio: "3:4" }, systemInstruction: SYSTEM_INSTRUCTION }
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!part?.inlineData) return [];

        return [{
            id: crypto.randomUUID(),
            url: `data:image/png;base64,${part.inlineData.data}`,
            prompt: `Product Kit Mockup`,
            scenario: `${scenarioLabel} w/ Products`,
            timestamp: Date.now(),
            category: 'avatar'
        }];
    } catch (error) { return []; }
};

export const generateIGCarousel = async (
  modelBase64: string,
  modelMimeType: string,
  productImages: Array<{ data: string; mimeType: string }>,
  themeColorHex: string,
  themeColorName: string
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const tasks = [
    { label: 'Cover Thumbnail', prompt: 'COVER IMAGE: High-impact collage of Model + the entire Product Kit. VIBE: Scroll-stopping. Ensure all product logos are crisp and accurate.' },
    { label: 'Pure Product Set', prompt: 'COMMERCIAL SHOT: Feature the products as a full cohesive kit. NO HUMANS. Accurate branding. Arranged as a high-end display. 100% brand color accuracy.' },
    { label: 'Lifestyle Action', prompt: 'LIFESTYLE: Model using or holding the products naturally. She is interacting with the bundle without obscuring the labels. Soft Life vibe.' },
    { label: 'Background Texture', prompt: 'BACKGROUND: Abstract luxury texture matching the theme color. No products/people.' },
    { label: 'Detailed Macro', prompt: 'MACRO: Extreme close-up of the key product label or texture. Light reflects off the surface elegantly.' }
  ];

  const promises = tasks.map(async (task, index): Promise<GeneratedImage | null> => {
    try {
      const parts: any[] = [{ text: `${task.prompt} Theme Color: ${themeColorName} (${themeColorHex}).` }];
      if (task.label !== 'Background Texture') {
        if (task.label.includes('Model') || task.label.includes('Lifestyle') || task.label.includes('Cover')) {
          parts.push({ inlineData: { mimeType: modelMimeType, data: modelBase64 } });
        }
        productImages.forEach(img => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio: "3:4" }, systemInstruction: SYSTEM_INSTRUCTION }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!part?.inlineData) return null;

      return {
        id: crypto.randomUUID(),
        url: `data:image/png;base64,${part.inlineData.data}`,
        prompt: `IG: ${task.label}`,
        scenario: task.label,
        timestamp: Date.now() + index,
        category: 'carousel'
      };
    } catch (error) { return null; }
  });

  return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
};

export const generateMarketingCopy = async (
    productName: string,
    context: string,
    targetAudience: string
): Promise<GeneratedCopy> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `SOCIAL MEDIA SEO & COPYWRITER: Research trends for "${productName}". Context: ${context}. Target: ${targetAudience}. 
    Provide the response using the following section headers exactly:
    ### SECTION 1
    (Email Strategy content)
    ### SECTION 2
    (Social Media Scripts content)
    ### SECTION 3
    (Sales Page content)
    
    Tone: Elegant & Persuasive. Focus on conversion and brand loyalty.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }], systemInstruction: "Conversion-optimized luxury copywriter." }
    });
    const text = response.text || "";
    const emailMatch = text.match(/### SECTION 1([\s\S]*?)### SECTION 2/);
    const socialMatch = text.match(/### SECTION 2([\s\S]*?)### SECTION 3/);
    const salesMatch = text.match(/### SECTION 3([\s\S]*)/);

    // Extract grounding chunks as required by the Google GenAI SDK guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingUrls = groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || chunk.maps?.uri,
      title: chunk.web?.title || chunk.maps?.title
    })).filter((item: any) => item.uri) || [];

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        productName: productName,
        emailContent: emailMatch ? emailMatch[1].trim() : text.slice(0, 500),
        socialContent: socialMatch ? socialMatch[1].trim() : text.slice(500, 1000),
        salesPageContent: salesMatch ? salesMatch[1].trim() : text.slice(1000),
        groundingUrls
    };
};
