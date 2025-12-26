
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
  
  const selectedScenery = SCENERIES.find(s => s.id === options.sceneryId);
  const selectedStyle = STYLES.find(s => s.id === options.styleId);
  const customDirective = options.customPrompt?.trim();

  const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
    try {
      let promptPrefix = `Transform the person in this image into a HYPER-REALISTIC high-fashion model. Preserve facial identity and skin tone strictly.`;
      let corePrompt = "";

      if (customDirective && !options.sceneryId && !options.styleId) {
        corePrompt = `STRICT CUSTOM DIRECTIVE: ${customDirective}\n(IGNORE all other style and environment presets. Follow these instructions ONLY. Ensure the model from reference image is the protagonist.)`;
      } else if (selectedScenery || selectedStyle || customDirective) {
        if (selectedStyle) corePrompt += `\nAESTHETIC: ${selectedStyle.prompt}`;
        if (selectedScenery) corePrompt += `\nSCENERY: ${selectedScenery.prompt}`;
        if (customDirective) corePrompt += `\nADDITIONAL INSTRUCTIONS: ${customDirective}`;
      } else {
        const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
        const randomScenery = SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
        corePrompt = `\nAESTHETIC: ${randomStyle.prompt}\nSCENERY: ${randomScenery.prompt}`;
      }

      const prompt = `${promptPrefix}\n${corePrompt}\nPOSE: ${POSES[index % POSES.length]}\nANGLE: ${CAMERA_ANGLES[index % CAMERA_ANGLES.length]}\nEXPRESSION: ${EXPRESSIONS[index % EXPRESSIONS.length]}`;

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
        prompt: customDirective || `Style Variation`,
        scenario: selectedScenery?.label || "Studio Session",
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
    
    const selectedScenery = SCENERIES.find(s => s.id === options.sceneryId);
    const selectedStyle = STYLES.find(s => s.id === options.styleId);
    const customDirective = options.customPrompt?.trim();
  
    const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
      try {
        let promptPrefix = `You are a LUXURY PRODUCT PHOTOGRAPHER. Create a high-end commercial shot featuring the provided PRODUCT(S). NO HUMANS. NO HANDS.`;
        let corePrompt = "";

        const productConstraint = `CRITICAL NON-NEGOTIABLE RULE: You MUST NOT alter any color, product shape, branding, packaging, text, or labelling from the original uploaded images. The product output must be 100% physically identical to the source. NO MORPHING. NO TEXT HALLUCINATIONS.`;

        if (customDirective && !options.sceneryId && !options.styleId) {
            corePrompt = `STRICT CUSTOM DIRECTIVE: ${customDirective}\n(IGNORE style presets. Follow these instructions ONLY while maintaining product integrity.)`;
        } else if (selectedScenery || selectedStyle || customDirective) {
            if (selectedStyle) corePrompt += `\nTHEME: ${selectedStyle.prompt}`;
            if (selectedScenery) corePrompt += `\nSCENERY: ${selectedScenery.prompt}`;
            if (customDirective) corePrompt += `\nADDITIONAL REQUEST: ${customDirective}`;
        } else {
            const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
            const randomScenery = SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
            corePrompt = `\nTHEME: ${randomStyle.prompt}\nSCENERY: ${randomScenery.prompt}`;
        }

        const prompt = `${promptPrefix}\n${productConstraint}\n${corePrompt}\nANGLE: ${PRODUCT_ANGLES[index % PRODUCT_ANGLES.length]}\nSTRICT REALISM: This must look like a real photograph, not a render.`;
  
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
          prompt: customDirective || `Commercial Bundle`,
          scenario: selectedScenery?.label || "Product Lab",
          timestamp: Date.now(),
          category: 'product'
        };
      } catch (error) { return null; }
    });
  
    return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
  };

export const generateModelProductVariations = async (
    modelImage: { data: string; mimeType: string },
    productImages: Array<{ data: string; mimeType: string }>,
    options: {
      sceneryId?: string;
      styleId?: string;
      customPrompt?: string;
    } = {}
  ): Promise<GeneratedImage[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const selectedScenery = SCENERIES.find(s => s.id === options.sceneryId);
    const selectedStyle = STYLES.find(s => s.id === options.styleId);
    const customDirective = options.customPrompt?.trim();
  
    const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
      try {
        let promptPrefix = `You are a LUXURY CREATIVE DIRECTOR. Create a high-end shot of the MODEL interacting with the PRODUCT(S) provided.`;
        let corePrompt = "";

        const constraint = `STRICT NON-NEGOTIABLE RULE: The model provided in the reference image MUST ALWAYS be present in the generation as the primary PROTAGONIST. Even if additional people are requested, the reference model MUST be the central focus. You MUST NOT alter any product color, shape, branding, or labelling. The reference model should be holding or applying the product kit naturally. Any extra people requested should be diverse background characters or companions, but the reference model's identity MUST match the source 1:1.`;

        if (customDirective && !options.sceneryId && !options.styleId) {
            corePrompt = `STRICT CUSTOM DIRECTIVE: ${customDirective}\n(IGNORE style presets. Follow these instructions ONLY while maintaining the reference model as the hero.)`;
        } else if (selectedScenery || selectedStyle || customDirective) {
            if (selectedStyle) corePrompt += `\nSTYLE AESTHETIC: ${selectedStyle.prompt}`;
            if (selectedScenery) corePrompt += `\nLUXURY SCENERY: ${selectedScenery.prompt}`;
            if (customDirective) corePrompt += `\nADDITIONAL REQUEST: ${customDirective}`;
        } else {
            const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
            const randomScenery = SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
            corePrompt = `\nSTYLE AESTHETIC: ${randomStyle.prompt}\nLUXURY SCENERY: ${randomScenery.prompt}`;
        }

        const prompt = `${promptPrefix}\n${constraint}\n${corePrompt}\nPOSE: ${POSES[index % POSES.length]}\nANGLE: ${CAMERA_ANGLES[index % CAMERA_ANGLES.length]}`;
  
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image', 
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: modelImage.mimeType, data: modelImage.data } },
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
          prompt: customDirective || `Model X Product`,
          scenario: selectedScenery?.label || "Integrated Set",
          timestamp: Date.now(),
          category: 'model_product'
        };
      } catch (error) { return null; }
    });
  
    return (await Promise.all(promises)).filter((img): img is GeneratedImage => img !== null);
  };

export const generateAngleVariations = async (
    referenceImages: Array<{ data: string; mimeType: string }>,
    originalScenarioLabel: string,
    category: 'avatar' | 'product' | 'carousel' | 'model_product' = 'avatar'
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
  category: 'avatar' | 'product' | 'carousel' | 'model_product' = 'avatar'
): Promise<GeneratedImage[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let anglesToUse = category === 'product' ? [...PRODUCT_ANGLES] : [...WORKFLOW_ANGLES];
  if (category === 'avatar' || category === 'model_product') anglesToUse = ["Front Facing, Direct Eye Contact", ...anglesToUse];

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
