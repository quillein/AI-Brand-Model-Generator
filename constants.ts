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

export const SCENERIES: Scenery[] = [
  // --- High Luxury ---
  { 
    id: 'minimalist_luxury', 
    label: 'Minimalist Penthouse', 
    prompt: 'inside a high-end minimalist luxury penthouse with cream furniture, marble details, and natural sunlight' 
  },
  { 
    id: 'beach_club', 
    label: 'Exclusive Beach Club', 
    prompt: 'at a luxury private beach club in Tulum or Amalfi, with white sand, cabanas, and turquoise water background' 
  },
  { 
    id: 'urban_rooftop', 
    label: 'City Rooftop Lounge', 
    prompt: 'on a chic rooftop lounge at sunset with modern glass architecture and blurred city skyline views' 
  },
  { 
    id: 'hotel_suite', 
    label: 'Parisian Hotel Suite', 
    prompt: 'inside an opulent hotel suite with a balcony, plush velvet furniture, gold accents, and fresh roses' 
  },
  {
    id: 'private_jet',
    label: 'Private Jet Cabin',
    prompt: 'inside a private jet cabin with cream leather seats, champagne glass on table, and window view of clouds'
  },
  {
    id: 'luxury_yacht',
    label: 'Superyacht Deck',
    prompt: 'on the teak deck of a luxury superyacht with white railing, deep blue ocean view, and sun deck chairs'
  },
  
  // --- Everyday Luxury (Relatable & Aesthetic) ---
  {
    id: 'luxury_grocery',
    label: 'Luxury Grocery Run',
    prompt: 'candid shot browsing the aisles of a high-end organic grocery store (like Erewhon), holding a green juice, wearing stylish athleisure, clean aesthetic'
  },
  {
    id: 'chic_cafe',
    label: 'Chic Cafe Date',
    prompt: 'sitting at a marble table in a trendy minimalist cafe, with an iced latte and designer bag on the table, soft natural lighting'
  },
  {
    id: 'flower_market',
    label: 'Flower Market Sunday',
    prompt: 'standing at an outdoor flower market surrounded by buckets of pink and white peonies, holding a bouquet, wearing a soft summer outfit'
  },
  {
    id: 'car_interior',
    label: 'Luxury Car Interior',
    prompt: 'sitting in the driver seat of a high-end car with beige leather interior, sunlight streaming in, wearing sunglasses, expensive lifestyle vibe'
  },
  {
    id: 'city_stroll',
    label: 'City Street Walk',
    prompt: 'walking down a clean, aesthetic city street or brownstone neighborhood, holding a coffee cup, "that girl" daily routine vibe'
  },
  {
    id: 'vanity_mirror',
    label: 'Vanity Skincare Routine',
    prompt: 'sitting at a white marble vanity table doing skincare, wearing a silk robe, surrounded by aesthetic beauty products, clean girl vibe'
  },
  {
    id: 'pilates_studio',
    label: 'Elite Pilates Studio',
    prompt: 'inside a high-end private pilates studio with reformer machines, mirrors, and soft natural morning light'
  },
  {
    id: 'art_gallery',
    label: 'Modern Art Gallery',
    prompt: 'in a modern art gallery with abstract paintings, white walls, and polished concrete floors'
  },
  {
    id: 'italian_villa',
    label: 'Italian Villa Garden',
    prompt: 'in the manicured garden of an Italian villa with cypress trees, stone pathways, and blooming bougainvillea'
  }
];

export const STYLES: StyleTheme[] = [
  { 
    id: 'clean_girl', 
    label: 'Clean Girl Aesthetic', 
    prompt: 'Clean Girl aesthetic, 2024 trend, minimal makeup, slicked back hair, expensive matching set or silk loungewear, glowing skin, pilates princess vibe' 
  },
  { 
    id: 'poolside_baddie', 
    label: 'Poolside Baddie', 
    prompt: 'Poolside Baddie aesthetic, luxury designer swimwear, sheer cover-up, body oil, wet hair look, oversized sunglasses, sun-kissed skin, showing skin confidently' 
  },
  { 
    id: 'night_luxe', 
    label: 'Night Luxe', 
    prompt: 'Night Luxe aesthetic, flash photography, satin slip dress with cut-outs, strappy heels, sultry evening makeup, diamonds, party girl vibe' 
  },
  { 
    id: 'off_duty', 
    label: 'Off-Duty Model', 
    prompt: 'Off-Duty Model aesthetic, street style, oversized blazer with bralette, baggy denim or leather trousers, designer handbag, effortless cool, midriff showing' 
  },
  { 
    id: 'old_money', 
    label: 'Old Money Summer', 
    prompt: 'Old Money aesthetic, quiet luxury, linen vest and skirt, silk scarf, gold jewelry, sophisticated, rich vacation vibe' 
  },
  {
    id: 'tennis_chic',
    label: 'Tennis Court Chic',
    prompt: 'Tennis Chic aesthetic, white pleated mini skirt, sports bra, sweater over shoulders, country club baddie, holding racket, sun visor, sporty but sexy'
  },
  {
    id: 'airport_leisure',
    label: 'Airport Leisure',
    prompt: 'Airport Leisure aesthetic, luxury cashmere sweat suit, crop top showing midriff, designer luggage, oversized sunglasses, messy bun, jet-setter vibe'
  },
  {
    id: 'gala_glam',
    label: 'Gala Glam',
    prompt: 'Gala Glam aesthetic, floor-length silk gown with high slit showing leg, sparkling diamond choker, red carpet flash photography, sleek hollywood hair'
  },
  {
    id: 'business_baddie',
    label: 'Business Baddie',
    prompt: 'Business Baddie aesthetic, oversized blazer with lace bralette underneath, tailored trousers, sleek bun, office with view, CEO energy'
  },
  {
    id: 'morning_matcha',
    label: 'Morning Matcha',
    prompt: 'Morning Matcha aesthetic, silk robe slipping off shoulder, lace lingerie peeking through, kitchen island, holding matcha latte, fresh face glow'
  }
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
You are a world-class fashion photographer and creative director for a luxury skincare and lifestyle brand. 
Your goal is to transform a user's portrait into a hyper-realistic, high-fashion lifestyle photo.

CRITICAL VISUAL RULES:
- PERSONALITY & EMOTION: The subject should NOT always look like a static mannequin. Capture CANDID moments: laughing, fixing hair, looking away, walking. Make it feel alive and spontaneous.
- CAMERA ANGLES: Use varied camera angles (low, high, side, wide). Avoid repetitive front-facing passport-style shots. Change the line of sight (looking at camera vs looking away).
- REALISM: The result must look like a REAL photograph taken with a professional camera (Sony A7R or Leica). ABSOLUTELY NO cartoon, 3D render, painting, or illustration styles.
- FASHION: Strictly 2020-2025 trends seen on Instagram influencers, models, and celebrities (e.g., Kylie Jenner, Hailey Bieber, Bella Hadid styles).
- VIBE: Sexy, Baddie, Classy, Quiet Luxury. The subject should look expensive, pampered, and confident.
- SKIN: Emphasize glowing, hydrated skin texture. It is appropriate and encouraged to show skin (legs, midriff, shoulders, cleavage) in a tasteful, fashion-forward way consistent with "Instagram baddie" culture.
- LIGHTING: Use professional photography lighting (golden hour, flash photography, or soft studio light).

- STRICT COLOR ENFORCEMENT: You must prioritize the color Dusty Rose (#D99BA3) in the styling, makeup, or environment. 
- Use the provided color palette for all elements: #D0C0B2, #F8F4EC, #E5D3C5, #BFA898, #D99BA3, #F2B6B6, #6E7A63, #46352D, #929496.
`;