
import { ColorPalette, Scenery, StyleTheme } from './types';

export const COLORS: ColorPalette[] = [
  { name: 'Warm Taupe', hex: '#D0C0B2' },
  { name: 'Alabaster', hex: '#F8F4EC' },
  { name: 'Oatmeal', hex: '#E5D3C5' },
  { name: 'Almond Buff', hex: '#BFA898' },
  { name: 'Dusty Rose', hex: '#D99BA3' }, // Core Color
  { name: 'Flamingo Pink', hex: '#F2B6B6' },
  { name: 'Sage Green', hex: '#6E7A63' },
  { name: 'Espresso', hex: '#46352D' },
  { name: 'Cool Slate', hex: '#929496' },
];

export const CORE_COLOR = '#D99BA3'; // Dusty Rose

export const WORKFLOW_ANGLES = [
  "Extreme Close-Up (Focus on makeup/skin)",
  "Side Profile (Cinematic/Candid)",
  "Low Angle (Power/Fashion Stance)",
  "Wide Angle (Full Environment Context)"
];

export const PRODUCT_ANGLES = [
  "Top-Down Flat Lay (Editorial Composition)",
  "Macro Detail Shot (Texture/Label Focus)",
  "Eye-Level Hero Shot (Clean Studio)",
  "Lifestyle Context (In Use/On Surface)"
];

export const SCENERIES: Scenery[] = [
  { id: 'pinterest_penthouse', label: 'Minimalist Penthouse', prompt: 'inside a high-end minimalist luxury penthouse with cream furniture, marble details, and natural sunlight' },
  { id: 'amalfi_beach', label: 'Amalfi Beach Club', prompt: 'at a luxury private beach club in Amalfi, with white sand, cabanas, and turquoise water background' },
  { id: 'manhattan_rooftop', label: 'Manhattan Rooftop', prompt: 'on a chic Manhattan rooftop overlooking Central Park at golden hour with glass railings' },
  { id: 'parisian_balcony', label: 'Parisian Balcony', prompt: 'on a classic limestone balcony in Paris with wrought iron railings, overlooking the Eiffel Tower at sunset' },
  { id: 'pilates_loft', label: 'Aesthetic Pilates Studio', prompt: 'inside a bright, high-end Reformer Pilates studio with wooden floors, large mirrors, and luxury equipment' },
  { id: 'botanical_greenhouse', label: 'Glass Greenhouse', prompt: 'inside a modern architectural glass greenhouse filled with lush green tropical plants and soft diffused sunlight' },
  { id: 'lake_como_veranda', label: 'Lake Como Estate', prompt: 'on the stone veranda of a luxury Lake Como villa at dawn, mist over the water, designer outdoor furniture' },
  { id: 'minimalist_office', label: 'Home Office Sanctuary', prompt: 'at a sleek minimalist oak desk in a bright home office with a designer lamp and a view of a city skyline' },
  { id: 'st_moritz_chalet', label: 'Swiss Alps Chalet', prompt: 'inside a luxury wooden chalet in the Alps with a stone fireplace and snowy mountain views' },
  { id: 'milanese_cafe', label: 'Milanese Sidewalk Cafe', prompt: 'sitting at a marble table in a trendy cafe in Milan, with a porcelain coffee cup and a leather handbag' },
  { id: 'marrakech_riad', label: 'Marrakech Riad', prompt: 'in a serene riad courtyard with a teal pool, intricate tilework, and climbing bougainvillea' },
  { id: 'tuscany_vineyard', label: 'Tuscan Vineyard', prompt: 'overlooking the sun-drenched vineyards of Tuscany at a rustic stone estate at golden hour' },
  { id: 'scandi_cabin', label: 'Scandi Glass Cabin', prompt: 'inside a minimalist glass-walled cabin in a pine forest, cozy textures, and soft natural light' },
  { id: 'london_library', label: 'English Manor Library', prompt: 'in a quiet mansion library with floor-to-ceiling bookshelves, a rolling ladder, and large leather chairs' },
  { id: 'malibu_villa', label: 'Malibu Infinity Pool', prompt: 'at a modern Malibu villa with an infinity pool merging into the Pacific Ocean at sunset' },
  { id: 'tokyo_loft', label: 'Ginza High-Rise', prompt: 'inside a sleek, glass-walled high-rise in Ginza with minimalist black and white decor' },
  { id: 'cote_d_azur', label: 'French Riviera Deck', prompt: 'on a sun-drenched stone terrace overlooking the Mediterranean with white linen umbrellas' },
  { id: 'equestrian_ranch', label: 'Boutique Horse Ranch', prompt: 'standing by a beautiful wooden stable at a boutique luxury horse ranch in the countryside' },
  { id: 'cotswolds_manor', label: 'Cotswolds Stone Estate', prompt: 'in the manicured rose garden of a honey-colored stone cottage in the English countryside' },
  { id: 'wellness_spa', label: 'Minimalist Wellness Spa', prompt: 'inside a serene luxury spa with dark stone walls, steam, and soft candlelight' }
];

export const STYLES: StyleTheme[] = [
  { id: 'vanilla_girl', label: 'Vanilla Girl', prompt: 'Vanilla Girl aesthetic, creamy whites and beige tones, soft textures, knitwear, cozy but expensive vibe, fresh-faced makeup' },
  { id: 'clean_girl', label: 'Clean Girl', prompt: 'Clean Girl aesthetic, minimal makeup, slicked back hair, matching cream matching set, glowing dewy skin' },
  { id: 'old_money', label: 'Old Money / Quiet Luxury', prompt: 'Old Money aesthetic, quiet luxury, linen vest, silk scarf, pearl earrings, sophisticated and timeless' },
  { id: 'balletcore', label: 'Balletcore Luxe', prompt: 'Balletcore aesthetic, silk ribbons, soft pink tulle, leg warmers, delicate hair bows, graceful high-fashion' },
  { id: 'corporate_chic', label: 'Corporate Siren', prompt: 'Sophisticated corporate chic, tailored pinstripe blazer, sharp spectacles, silk blouse, powerful model vibe' },
  { id: 'cottagecore', label: 'Elevated Cottagecore', prompt: 'High-end cottagecore, vintage-inspired linen dresses, picnic in a manicured meadow, expensive straw accessories' },
  { id: 'downtown_girl', label: 'Downtown Girl', prompt: 'City chic, vintage denim, leather trench coat, designer boots, modern urban vibe, cool-girl energy' },
  { id: 'night_luxe', label: 'Night Luxe', prompt: 'Night Luxe aesthetic, flash photography, satin slip dress, evening makeup, martini glasses, fine jewelry' },
  { id: 'soft_minimalist', label: 'Soft Minimalist', prompt: 'Minimalist high-fashion, clean lines, neutral colors, architectural clothing shapes, understated elegance' },
  { id: 'coquette', label: 'Coquette Aesthetic', prompt: 'Coquette vibe, pink lace, heart-shaped accessories, vintage hair clips, playful and ultra-feminine' },
  { id: 'off_duty', label: 'Off-Duty Model', prompt: 'Off-Duty Model look, tailored oversized blazer, crisp white t-shirt, denim, structured luxury handbag' },
  { id: 'dark_academia', label: 'Dark Academia', prompt: 'Dark Academia, tailored wool blazer, pleated skirt, loafers, sophisticated, intellectual and moody' },
  { id: 'coastal_grandma', label: 'Coastal Chic', prompt: 'Coastal aesthetic, white button-down, linen trousers, canvas tote, effortless beach luxury' },
  { id: 'mob_wife', label: 'Luxe Glamour', prompt: 'High-glamour aesthetic, tailored faux fur, bold gold jewelry, perfect voluminous blowout hair' },
  { id: 'gorpcore', label: 'Luxury Gorpcore', prompt: 'Elevated gorpcore, high-end technical fabrics, designer puffer jacket, outdoor luxury gear, stylishly practical' },
  { id: 'indie_sleaze', label: 'Indie Sleaze Edit', prompt: 'Indie Sleaze aesthetic, smudged eyeliner, metallic textures, high-fashion messy cool, vintage filter vibe' },
  { id: 'y2k_luxe', label: 'Y2K Cyber Glam', prompt: 'Y2K aesthetic, baby tees, tinted shades, butterfly clips, futuristic metallic fabrics, high-gloss lips' },
  { id: 'boho_luxe', label: 'Boho Chic', prompt: 'Boho Luxe aesthetic, crochet textures, layered gold jewelry, flowing silks, desert festival luxury' },
  { id: 'equestrian', label: 'Equestrian Editorial', prompt: 'High-fashion equestrian style, tailored riding jacket, boots, leather accents, polished and outdoorsy' },
  { id: 'royalcore', label: 'Modern Royalcore', prompt: 'Royalcore aesthetic, corseted gowns, pearl necklaces, white gloves, princess-like grace and elegance' }
];

export const POSES = [
  "walking confidently towards the camera",
  "leaning back casually against a surface",
  "sitting with legs crossed or extended on a comfortable surface",
  "twirling or moving dynamically, caught in motion",
  "lounging deeply in a relaxed state",
  "standing with one hip popped, power stance",
  "crouching or squatting fashionably",
  "resting chin on hand, looking relaxed",
  "adjusting hair or sunglasses, candid moment",
  "looking over the shoulder while walking away"
];

export const CAMERA_ANGLES = [
  "Low angle (worm's eye view) to make her look powerful and statuesque",
  "High angle / Selfie perspective, intimate and cute",
  "Eye-level straight on, direct connection",
  "Side profile / 3/4 view, not looking at camera",
  "Wide shot capturing the full luxury environment around her",
  "Dutch angle (slight tilt) for a dynamic, editorial vibe",
  "Close-up beauty shot focusing on glowing skin and makeup details"
];

export const EXPRESSIONS = [
  "Genuine, candid laughter with head thrown back",
  "Looking away distantly, mysterious and pensive",
  "Playful smirk, looking directly at camera",
  "Soft, gentle smile, looking down or to the side shyly",
  "Intense, confident 'model gaze' (smize)",
  "Eyes closed, soaking up the moment/sun, pure bliss",
  "Caught in motion, mouth slightly open like speaking or laughing",
  "Winking or playful tongue-out expression, showing personality"
];

export const SYSTEM_INSTRUCTION = `
You are a world-class fashion photographer and creative director specializing in "Pinterest Aesthetic" luxury lifestyle branding.
Your goal is to transform reference images into hyper-realistic, high-fashion lifestyle photos that look like they belong in a viral mood board.

STRICT NON-NEGOTIABLE PRODUCT RULES:
- When products (bottles, jars, kits) are present, you MUST NOT alter any color, shape, branding, packaging, or labelling.
- The product in the output must be a 1:1 identical match to the product in the reference image.
- NO MORPHING, NO HALOING, NO FANTASY ADDITIONS TO PRODUCTS.
- Ensure product labels are crisp, sharp, and perfectly legible as per the original source.
- Products must appear as solid, rigid objects.

MODEL X PRODUCT INTERACTION:
- In the "Model X Product" category, the model MUST be naturally interacting with the products.
- Examples: Holding a bottle elegantly, applying a cream to her face, sitting next to the product kit, or holding the kit with a confident gaze.
- The interaction must feel organic and high-end, not forced.
- Preserve the model's identity and the product's integrity simultaneously.

CRITICAL VISUAL RULES:
- IDENTITY: Always preserve the facial features, skin tone, and core identity of the subject from the reference image.
- CLOTHING & COLOR: Use the brand color palette (#D0C0B2, #F8F4EC, #E5D3C5, #BFA898, #D99BA3, #F2B6B6, #6E7A63, #46352D, #929496). Dusty Rose (#D99BA3) is the primary accent.
- REALISM: All results must be strictly realistic. NO 3D renders, no illustrations. The image must look like it was shot on a Leica or Sony A7R.
- VIBE: Pinterest-ready, expensive, "Soft Life", sophisticated, and extremely aesthetic.
`;
