import { GoogleGenAI } from "@google/genai";
import { SCENERIES, STYLES, POSES, CAMERA_ANGLES, EXPRESSIONS, SYSTEM_INSTRUCTION, WORKFLOW_ANGLES, PRODUCT_ANGLES } from '../constants';
import { GeneratedImage, GeneratedCopy } from '../types';

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
        timestamp: Date.now(),
        category: 'avatar'
      };

    } catch (error) {
      console.error(`Error generating variation ${index}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((img): img is GeneratedImage => img !== null);
};

export const generateProductVariations = async (
    base64Image: string,
    imageMimeType: string,
    options: {
      sceneryId?: string;
      styleId?: string;
      customPrompt?: string;
    } = {}
  ): Promise<GeneratedImage[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    
    // Resolve Scenery
    let scenery = SCENERIES.find(s => s.id === options.sceneryId);
    // Resolve Style
    let style = STYLES.find(s => s.id === options.styleId);
  
    const promises = Array.from({ length: 5 }).map(async (_, index): Promise<GeneratedImage | null> => {
      try {
        const currentScenery = scenery || SCENERIES[Math.floor(Math.random() * SCENERIES.length)];
        const currentStyle = style || STYLES[Math.floor(Math.random() * STYLES.length)];
        
        // Pick a product angle for variety if not specified
        const currentAngle = PRODUCT_ANGLES[index % PRODUCT_ANGLES.length];
  
        const customInstruction = options.customPrompt 
          ? `USER CUSTOM INSTRUCTION: "${options.customPrompt}".` 
          : '';
  
        const prompt = `
          You are an expert LUXURY PRODUCT PHOTOGRAPHER. 
          Task: Create a high-end commercial product mockup using the provided product image.
          
          STRICT CONSTRAINT: NO HUMANS. NO MODELS. NO HANDS. NO BODY PARTS.
          The image must be a pure product photography shot.

          THE PRODUCT:
          - Use the uploaded image as the product. 
          - Preserve the brand name, text, and logo on the product strictly. 
          - Do not warp or distort the product packaging.
          - If the product is a bottle/jar, ensure it looks 3D with realistic reflections.
  
          THE SETTING:
          - VIBE: ${currentStyle.prompt}
          - LOCATION: ${currentScenery.prompt}
          - COMPOSITION: ${currentAngle}
          
          CONTEXTUAL INTEGRATION:
          - Place the product naturally in the scene (e.g., on a marble table, on a velvet cushion, floating in water, on a stone pedestal).
          - If the scene implies a location (like "Walking in city"), place the product on a relevant surface (e.g., a cafe table, a park bench, a concrete ledge) with the environment blurred in the background. DO NOT show any people.
  
          LIGHTING:
          - Soft, expensive, commercial studio lighting or golden hour natural light.
          - Sharp focus on the product, creamy bokeh (blur) on background.
  
          COLOR PALETTE: 
          - Adhere strictly to the brand palette: Dusty Rose (#D99BA3) as accent, with Warm Taupe, Cream, and Sage Green.
          
          ${customInstruction}
        `;
  
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image', 
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: imageMimeType, data: base64Image } }
            ]
          },
          config: {
            imageConfig: { aspectRatio: "3:4" },
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
  
        if (!imageUrl) throw new Error("No image generated");
  
        return {
          id: crypto.randomUUID(),
          url: imageUrl,
          prompt: options.customPrompt ? `Product: ${options.customPrompt}` : `Product in ${currentScenery.label}`,
          scenario: `${currentStyle.label} Product Shot`,
          timestamp: Date.now(),
          category: 'product'
        };
  
      } catch (error) {
        console.error(`Error generating product variation ${index}:`, error);
        return null;
      }
    });
  
    const results = await Promise.all(promises);
    return results.filter((img): img is GeneratedImage => img !== null);
  };

export const generateAngleVariations = async (
    originalBase64: string,
    imageMimeType: string,
    originalScenarioLabel: string,
    category: 'avatar' | 'product' | 'carousel' = 'avatar'
): Promise<GeneratedImage[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    // Select the appropriate angle set based on category
    const anglesToUse = category === 'product' ? PRODUCT_ANGLES : WORKFLOW_ANGLES;

    const promises = anglesToUse.map(async (angle, index): Promise<GeneratedImage | null> => {
        try {
            let prompt = "";
            
            if (category === 'avatar') {
                prompt = `
                    REFERENCE: Use the provided portrait to maintain the subject's identity strictly.
                    TASK: Re-generate a hyper-realistic photo of this SAME person in the SAME scenario: "${originalScenarioLabel}".
                    CRITICAL CHANGE: This specific shot must use the following CAMERA ANGLE: "${angle}".
                    Ensure the lighting, makeup, and outfit match the luxury/aesthetic vibe.
                `;
            } else {
                prompt = `
                    REFERENCE: Use the provided product image.
                    TASK: Re-generate a hyper-realistic commercial shot of this SAME product in the SAME scenario: "${originalScenarioLabel}".
                    CRITICAL CHANGE: This specific shot must use the following COMPOSITION/ANGLE: "${angle}".
                    Keep the brand name/logo legible and the product distortion-free.
                    STRICT CONSTRAINT: NO HUMANS. NO MODELS. NO HANDS. Pure product photography.
                `;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image', 
                contents: {
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: imageMimeType, data: originalBase64 } }
                  ]
                },
                config: {
                  imageConfig: { aspectRatio: "3:4" },
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

            if (!imageUrl) throw new Error("No image generated");

            return {
                id: crypto.randomUUID(),
                url: imageUrl,
                prompt: `Angle Variation: ${angle}`,
                scenario: `${originalScenarioLabel} (${angle})`,
                timestamp: Date.now(),
                category: category
            };
        } catch (error) {
            console.error(`Error generating angle ${index}:`, error);
            return null;
        }
    });

    const results = await Promise.all(promises);
    return results.filter((img): img is GeneratedImage => img !== null);
};

export const generateDirectorsCut = async (
  originalBase64: string,
  imageMimeType: string,
  category: 'avatar' | 'product' | 'carousel' = 'avatar'
): Promise<GeneratedImage[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  let anglesToUse = category === 'product' ? [...PRODUCT_ANGLES] : [...WORKFLOW_ANGLES];

  // Add mandatory direct eye contact angle for avatars
  if (category === 'avatar') {
    anglesToUse = ["Front Facing, Direct Eye Contact (Subject looking directly at camera)", ...anglesToUse];
  }

  const promises = anglesToUse.map(async (angle, index): Promise<GeneratedImage | null> => {
      try {
          const prompt = `
              TECHNICAL TASK: Director's Cut Generation.
              INPUT: A reference image.
              OUTPUT: A new image of the EXACT SAME SUBJECT/OBJECT in the EXACT SAME ENVIRONMENT, but from a different camera angle.

              TARGET ANGLE: ${angle}.

              STRICT CONSTRAINTS (ZERO CHANGES IN DETAILS):
              1. PRESERVE THE SUBJECT: ${category === 'avatar' ? 'Same face, same makeup, same hair, same skin tone.' : 'Same product details, label, and shape. NO HUMANS/HANDS allowed.'}
              2. PRESERVE THE OUTFIT/SURFACE: ${category === 'avatar' ? 'Exact same clothing.' : 'Exact same surface material.'}
              3. PRESERVE THE BACKGROUND: Exact same location/setting.
              4. PRESERVE THE LIGHTING: Exact same lighting conditions.
              
              ONLY CHANGE THE PERSPECTIVE/CAMERA ANGLE.
              ${angle.includes("Direct Eye Contact") ? "IMPORTANT: For this specific shot, ensure the subject makes direct eye contact with the camera lens." : ""}
              The goal is to provide a "Director's Cut" set of angles for the original uploaded image.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image', 
              contents: {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: imageMimeType, data: originalBase64 } }
                ]
              },
              config: {
                imageConfig: { aspectRatio: "3:4" },
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

          if (!imageUrl) throw new Error("No image generated");

          return {
              id: crypto.randomUUID(),
              url: imageUrl,
              prompt: `Director's Cut: ${angle}`,
              scenario: `Original ${category === 'avatar' ? 'Look' : 'Product'} (${angle})`,
              timestamp: Date.now(),
              category: category
          };
      } catch (error) {
          console.error(`Error generating Director's Cut angle ${index}:`, error);
          return null;
      }
  });

  const results = await Promise.all(promises);
  return results.filter((img): img is GeneratedImage => img !== null);
};

export const generateProductMockup = async (
    originalFaceBase64: string,
    faceMimeType: string,
    productBase64: string,
    productMimeType: string,
    scenarioLabel: string
): Promise<GeneratedImage[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    // Generate 1 composite image (can be increased if needed)
    try {
        const prompt = `
            COMPOSITE TASK: You are given TWO images. 
            Image 1: The MODEL (Subject).
            Image 2: The PRODUCT (Object).

            TASK: Create a photorealistic high-fashion image of the Model (Image 1) INTERACTING with the Product (Image 2).
            CONTEXT/SCENE: ${scenarioLabel}.

            INSTRUCTIONS:
            1. IDENTIFY THE PRODUCT: Determine if it is a beverage, cosmetic, bag, shoe, etc.
            2. INTERACTION: 
               - If cosmetic: She should be applying it or holding it near her face.
               - If beverage: She should be sipping it or holding it elegantly.
               - If fashion item: She should be wearing it or holding it.
            3. REALISM: The product must look naturally integrated into the scene (lighting, shadows, hands holding it).
            4. IDENTITY: Preserve the facial features of the Model in Image 1.

            VIBE: Expensive, Soft Life, Luxury Ad Campaign.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: faceMimeType, data: originalFaceBase64 } },
                { inlineData: { mimeType: productMimeType, data: productBase64 } }
              ]
            },
            config: {
              imageConfig: { aspectRatio: "3:4" },
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

        if (!imageUrl) throw new Error("No image generated");

        return [{
            id: crypto.randomUUID(),
            url: imageUrl,
            prompt: `Product Mockup`,
            scenario: `${scenarioLabel} w/ Product`,
            timestamp: Date.now(),
            category: 'avatar' // Since it's a person holding a product, we classify as avatar for now
        }];

    } catch (error) {
        console.error("Error generating product mockup:", error);
        return [];
    }
};

export const generateIGCarousel = async (
  modelBase64: string,
  modelMimeType: string,
  productBase64: string,
  productMimeType: string,
  themeColorHex: string,
  themeColorName: string
): Promise<GeneratedImage[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const tasks = [
    {
      type: 'thumbnail',
      label: 'Main Carousel Thumbnail',
      prompt: `
        TASK: Create a MAIN COVER IMAGE (Thumbnail) for an Instagram Carousel.
        
        INPUTS: 
        - Model (Image 1)
        - Product (Image 2)
        
        COMPOSITION: Dynamic and Eye-Catching.
        CONTENT: Show the Model interacting with the Product OR a creative collage style blending the two.
        COLOR FOCUS: Maximize the use of the theme color: ${themeColorName} (${themeColorHex}).
        VIBE: High-end luxury ad campaign, "Stop Scrolling" impact.
      `
    },
    {
      type: 'product_accurate',
      label: 'Pure Product Shot',
      prompt: `
        TASK: Create a COMMERCIAL PRODUCT PHOTOGRAPHY shot.
        
        INPUTS:
        - Product (Image 2) - IGNORE THE MODEL IMAGE for this specific shot.
        
        STRICT CONSTRAINTS:
        1. PRODUCT ACCURACY: The product must look EXACTLY like the input image (logos, text, shape). 100% Accuracy.
        2. NO ALTERATION: Do not change the product's appearance.
        3. ENVIRONMENT: Place it in a luxury setting that matches the theme color: ${themeColorName} (${themeColorHex}).
        4. NO HUMANS: This is a standalone product shot.
      `
    },
    {
      type: 'interaction',
      label: 'Model Interaction',
      prompt: `
        TASK: Create a LIFESTYLE SHOT of the Model using the Product.
        
        INPUTS:
        - Model (Image 1)
        - Product (Image 2)
        
        ACTION: The model should be holding, applying, or using the product naturally.
        STYLE: Candid, "Soft Life", aspirational.
        COLOR: Ensure the outfit or background complements the theme color: ${themeColorName} (${themeColorHex}).
        PRESERVE FACIAL IDENTITY of the model.
      `
    },
    {
      type: 'background',
      label: 'Textured Background',
      prompt: `
        TASK: Create a HIGH-QUALITY BACKGROUND IMAGE for text overlays.
        
        INPUTS: None needed (Pure generation based on vibe).
        
        VISUALS: Abstract luxury texture (e.g., silk, water ripples, blurred marble, bokeh lights).
        COLOR: Dominant use of the theme color: ${themeColorName} (${themeColorHex}).
        FOCUS: Semi-blurred out to allow for post-processing text addition (CTA).
        NO PEOPLE, NO PRODUCTS. Just atmosphere.
      `
    },
    {
      type: 'closeup',
      label: 'Artistic Close-Up',
      prompt: `
        TASK: Create a MACRO CLOSE-UP shot of the Product.
        
        INPUTS: 
        - Product (Image 2) - IGNORE MODEL.
        
        VISUALS: Focus on texture, packaging details, and light reflection.
        AESTHETIC: Add attractive visual elements (water droplets, flower petals, light streaks) that match the theme color: ${themeColorName} (${themeColorHex}).
        Goal: Satisfying, sensory visual (ASMR visual).
      `
    }
  ];

  const promises = tasks.map(async (task, index): Promise<GeneratedImage | null> => {
    try {
      // For background, we don't strictly need input images, but passing them doesn't hurt as reference for "vibe"
      // However, to keep it clean, we'll pass both for most, or just prompt for background.
      
      const parts: any[] = [{ text: task.prompt }];
      
      if (task.type !== 'background') {
         // Pass product for product shots
         if (task.type === 'product_accurate' || task.type === 'closeup') {
            parts.push({ inlineData: { mimeType: productMimeType, data: productBase64 } });
         } 
         // Pass both for interaction/thumbnail
         else {
            parts.push({ inlineData: { mimeType: modelMimeType, data: modelBase64 } });
            parts.push({ inlineData: { mimeType: productMimeType, data: productBase64 } });
         }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: "3:4" }, // Vertical for IG Stories/Reels/Carousel
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

      if (!imageUrl) throw new Error("No image generated");

      return {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: `IG Carousel: ${task.label}`,
        scenario: task.label,
        timestamp: Date.now() + index, // slight offset to order them
        category: 'carousel'
      };

    } catch (error) {
      console.error(`Error generating carousel item ${task.label}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((img): img is GeneratedImage => img !== null);
};

export const generateMarketingCopy = async (
    productName: string,
    context: string,
    targetAudience: string
): Promise<GeneratedCopy> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are a top-tier Social Media SEO & Copywriting Expert specializing in the **Farmasi US** market.
        
        **YOUR PERSONA:**
        - Tone: Elegantly Sassy, Persuasive, Urgent, FOMO-inducing, High-End "Girl Boss/Beauty Biz".
        - Expertise: Viral Marketing, Consumer Psychology, Direct Response Copywriting.
        
        **TASK:**
        Perform deep research using Google Search (web crawling) on current social media trends, Farmasi US demographics, and viral hashtags for the following product context. 
        Then, generate 3 distinct marketing assets.

        **INPUTS:**
        - Product Name: ${productName}
        - Context/Benefits: ${context}
        - Target Audience: ${targetAudience} (If empty, default to Farmasi US core demographic: Beauty enthusiasts, Moms, Aspiring Entrepreneurs).

        **REQUIRED OUTPUTS (Markdown Format):**
        
        ### SECTION 1: EMAIL MARKETING
        - **Subject Line A:** (High Open Rate style)
        - **Subject Line B:** (Curiosity gap style)
        - **Preview Text:** Short & punchy.
        - **Body Content:** Engaging storytelling, focus on benefits, creating urgency.
        - **CTA Button:** A compelling, action-oriented button text.

        ### SECTION 2: SOCIAL MEDIA MARKETING (TikTok/IG/Reels)
        - **Audio Script:** A 20-second persuasive script for a "Siren Sexy Black Woman" voiceover. Sassy, confident, commanding attention.
        - **Caption:** Irresistibly persuasive text.
        - **Flexible CTAs:** 3 variations (e.g., "Comment GLOWUP", "Link in Bio", "DM for info").
        - **Hashtags:** A mix of 15 trending, niche, and SEO-optimized hashtags based on current research.

        ### SECTION 3: SALES PAGE MAKER
        - **Headline:** Hook-driven.
        - **Bundle Description:** Frictionless, smooth-as-butter copy.
        - **Urgency/FOMO:** Why they need it NOW.
        - **Final CTA:** The closing push.

        **RESEARCH REQUIREMENT:**
        Use the Google Search tool to find:
        1. Current trending beauty/wellness hashtags.
        2. Competitor copywriting angles for similar products.
        3. Specific pain points of the Farmasi US demographic currently discussing this topic.
    `;

    // Use gemini-2.5-flash which supports Search Grounding and high quality text generation
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "You are a master copywriter for the beauty industry. You optimize for conversion and engagement."
        }
    });

    const text = response.text || "Failed to generate copy.";

    // Simple parsing to split sections if needed, or just return the whole markdown block.
    // For this implementation, we will split by headers to make it cleaner in UI.
    
    // We will do a basic split for the UI data structure, but keep the raw text available.
    // NOTE: This parsing is fragile if the model drifts, but 2.5 is usually good with "### SECTION" instructions.
    
    const emailMatch = text.match(/### SECTION 1: EMAIL MARKETING([\s\S]*?)### SECTION 2:/);
    const socialMatch = text.match(/### SECTION 2: SOCIAL MEDIA MARKETING([\s\S]*?)### SECTION 3:/);
    const salesMatch = text.match(/### SECTION 3: SALES PAGE MAKER([\s\S]*)/);

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        productName: productName,
        emailContent: emailMatch ? emailMatch[1].trim() : "See full result below...",
        socialContent: socialMatch ? socialMatch[1].trim() : "See full result below...",
        salesPageContent: salesMatch ? salesMatch[1].trim() : "See full result below..."
    };
};