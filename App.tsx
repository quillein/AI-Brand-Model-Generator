import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Camera, Heart, Palette, MessageSquare, LayoutGrid, Trash2, History, Video, ShoppingBag, Plus, Tag, Clapperboard, Maximize2, X } from 'lucide-react';
import { generateAvatarVariations, generateAngleVariations, generateProductMockup, fileToGenerativePart, generateProductVariations, generateDirectorsCut } from './services/geminiService';
import { GeneratedImage, GenerationStatus } from './types';
import { Button } from './components/Button';
import { ColorSwatch } from './components/ColorSwatch';
import { SCENERIES, STYLES } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'studio' | 'gallery'>('studio');
  const [studioMode, setStudioMode] = useState<'model' | 'product'>('model');
  const [generationType, setGenerationType] = useState<'creative' | 'directors'>('creative');
  
  const [file, setFile] = useState<File | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  
  // Selection State
  const [selectedScenery, setSelectedScenery] = useState<string | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<string | undefined>(undefined);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Workflow State
  const [processingId, setProcessingId] = useState<string | null>(null); // To show loading on specific cards
  const productInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageForProduct, setSelectedImageForProduct] = useState<GeneratedImage | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from sessionStorage on mount (Session only)
  useEffect(() => {
    const savedSession = sessionStorage.getItem('luxe_aura_session');
    if (savedSession) {
      try {
        setHistory(JSON.parse(savedSession));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('luxe_aura_session', JSON.stringify(history));
    } catch (e) {
      console.warn("Session Storage quota exceeded.", e);
    }
  }, [history]);

  const updateHistory = (newImages: GeneratedImage[]) => {
    setHistory(prev => {
        const updated = [...newImages, ...prev];
        return updated.slice(0, 20); // Limit to 20 most recent images
    });
  };

  const switchStudioMode = (mode: 'model' | 'product') => {
    if (studioMode === mode) return;
    setStudioMode(mode);
    // Reset current session when switching context
    setFile(null);
    setPreviewUrl(null);
    setOriginalBase64(null);
    setResults([]);
    resetSelection();
    setGenerationType('creative');
    setStatus(GenerationStatus.IDLE);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      // Store base64 immediately for reuse in workflows
      try {
        const base64 = await fileToGenerativePart(selectedFile);
        setOriginalBase64(base64);
      } catch (e) {
        console.error("Failed to process image", e);
      }

      setResults([]);
      setStatus(GenerationStatus.IDLE);
      setView('studio');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      try {
        const base64 = await fileToGenerativePart(selectedFile);
        setOriginalBase64(base64);
      } catch (error) {
        console.error("Failed to process dropped image", error);
      }

      setResults([]);
      setStatus(GenerationStatus.IDLE);
      setView('studio');
    }
  };

  const handleGenerate = async () => {
    if (!file || !originalBase64) return;
    
    setResults([]);
    setStatus(GenerationStatus.UPLOADING);
    
    try {
      setStatus(GenerationStatus.GENERATING);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      let generatedImages: GeneratedImage[] = [];

      if (generationType === 'directors') {
        // Director's Cut: Strict angle variations of original upload
        generatedImages = await generateDirectorsCut(originalBase64, mimeType, studioMode);
      } else {
        // Creative Mode: Style/Scenery variations
        if (studioMode === 'model') {
            generatedImages = await generateAvatarVariations(originalBase64, mimeType, {
                sceneryId: selectedScenery,
                styleId: selectedStyle,
                customPrompt: customPrompt.trim() !== '' ? customPrompt : undefined
            });
        } else {
            generatedImages = await generateProductVariations(originalBase64, mimeType, {
                sceneryId: selectedScenery,
                styleId: selectedStyle,
                customPrompt: customPrompt.trim() !== '' ? customPrompt : undefined
            });
        }
      }
      
      setResults(generatedImages);
      updateHistory(generatedImages);
      setStatus(GenerationStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // --- Workflow: 4 Camera Angles ---
  const handleDirectorCut = async (img: GeneratedImage) => {
    if (!originalBase64 || !file) return;
    setProcessingId(img.id);
    setLightboxImage(null); // Close lightbox if open
    
    try {
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        // Pass category to handle angle logic
        const angleVariations = await generateAngleVariations(
            originalBase64,
            mimeType,
            img.scenario,
            img.category 
        );
        
        // Add to history and update current view slightly to show something happened
        updateHistory(angleVariations);
        if (view === 'studio') {
             setResults(prev => [...angleVariations, ...prev]);
        }
        alert("Director's Cut complete! 4 new variations added to your collection.");
    } catch (e) {
        console.error(e);
        alert("Failed to generate angles.");
    } finally {
        setProcessingId(null);
    }
  };

  // --- Workflow: Product Mockup ---
  const triggerProductUpload = (img: GeneratedImage) => {
    setSelectedImageForProduct(img);
    productInputRef.current?.click();
    setLightboxImage(null); // Close lightbox if open
  };

  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedImageForProduct && originalBase64 && file) {
        const productFile = e.target.files[0];
        setProcessingId(selectedImageForProduct.id);
        
        try {
            const productBase64 = await fileToGenerativePart(productFile);
            const faceMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const productMime = productFile.type === 'image/png' ? 'image/png' : 'image/jpeg';

            const mockupResults = await generateProductMockup(
                originalBase64,
                faceMime,
                productBase64,
                productMime,
                selectedImageForProduct.scenario
            );

            updateHistory(mockupResults);
            if (view === 'studio') {
                setResults(prev => [...mockupResults, ...prev]);
            }
            alert("Product Mockup generated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to create product mockup.");
        } finally {
            setProcessingId(null);
            setSelectedImageForProduct(null);
            if (productInputRef.current) productInputRef.current.value = '';
        }
    }
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `luxe-aura-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove from history
    setHistory(prev => prev.filter(item => item.id !== id));
    // Remove from current results if present
    setResults(prev => prev.filter(item => item.id !== id));
    
    // If it was open in lightbox, close it
    if (lightboxImage?.id === id) {
        setLightboxImage(null);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire collection?")) {
      setHistory([]);
      sessionStorage.removeItem('luxe_aura_session');
    }
  };

  const resetSelection = () => {
    setSelectedScenery(undefined);
    setSelectedStyle(undefined);
    setCustomPrompt('');
  };

  const startNewSession = () => {
    setResults([]);
    setFile(null);
    setOriginalBase64(null);
    setPreviewUrl(null);
    resetSelection();
    setStatus(GenerationStatus.IDLE);
    sessionStorage.removeItem('luxe_aura_session');
    setHistory([]);
  }

  // --- Render Helpers ---
  const renderImageCard = (img: GeneratedImage) => (
    <div key={img.id} className="group relative flex flex-col space-y-3">
        <div 
            className="relative overflow-hidden rounded-2xl shadow-xl bg-warm-taupe aspect-[3/4] cursor-pointer"
            onClick={() => setLightboxImage(img)}
        >
            <img 
                src={img.url} 
                alt={img.scenario} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Processing Overlay */}
            {processingId === img.id && (
                <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-bold tracking-widest uppercase">Designing...</span>
                </div>
            )}

            {/* QUICK DELETE (Top Right) */}
            <button 
                onClick={(e) => handleDelete(img.id, e)}
                className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg opacity-0 group-hover:opacity-100 z-20 scale-90 hover:scale-100"
                title="Delete Image"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* FULL SCREEN TRIGGER (Center) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full text-white pointer-events-auto hover:bg-black/50 transition-colors transform scale-90 hover:scale-110 shadow-xl" onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}>
                    <Maximize2 className="w-6 h-6" />
                </div>
            </div>

            {/* Bottom Actions Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end z-20">
                <div className="flex justify-between items-end">
                   {/* Tag */}
                   <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold mb-1 inline-block ${img.category === 'product' ? 'bg-sage-green text-white' : 'bg-espresso text-white'}`}>
                      {img.category === 'product' ? 'Product' : 'Model'}
                   </span>
                   
                   <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.id); }}
                            className="bg-white/90 p-2 rounded-full text-espresso hover:bg-dusty-rose hover:text-white transition-all shadow-lg"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        
                        {/* Context Actions (Director / Product) */}
                        {/* Only show these if we are in Studio mode generally, or if we have an original file to work with. 
                            However, the logic requires 'originalBase64' which might be missing if we are in gallery view from a previous session.
                            We'll conditionally render if originalBase64 exists. */}
                        {originalBase64 && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDirectorCut(img); }}
                                    className="bg-white/90 p-2 rounded-full text-espresso hover:bg-sage-green hover:text-white transition-all shadow-lg"
                                    title="Director's Cut: 4 Angles"
                                >
                                    <Video className="w-4 h-4" />
                                </button>

                                {img.category === 'avatar' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); triggerProductUpload(img); }}
                                        className="bg-white/90 p-2 rounded-full text-espresso hover:bg-almond-buff hover:text-white transition-all shadow-lg"
                                        title="Add Product Mockup"
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                   </div>
                </div>
            </div>
        </div>
        
        {/* Simple Label */}
        <div className="px-2">
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold tracking-widest uppercase text-sage-green leading-relaxed line-clamp-2">
                    {img.scenario}
                </span>
                <Heart className="w-4 h-4 text-dusty-rose flex-shrink-0 ml-2" />
            </div>
             <div className="mt-2 flex gap-2">
                <div className="w-full h-1 bg-gradient-to-r from-dusty-rose to-oatmeal rounded-full opacity-50"></div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-alabaster text-espresso font-sans selection:bg-dusty-rose selection:text-white pb-20 relative">
      
      {/* Hidden input for product uploads */}
      <input 
        type="file" 
        ref={productInputRef}
        onChange={handleProductFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />

      {/* Sticky Header */}
      <nav className="sticky top-0 z-40 bg-alabaster/90 backdrop-blur-md border-b border-warm-taupe/30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('studio')}>
          <Sparkles className="text-dusty-rose w-6 h-6" />
          <h1 className="font-serif text-2xl font-bold tracking-tighter text-espresso">
            LUXE<span className="text-dusty-rose">AURA</span>
          </h1>
        </div>
        
        {/* Mobile/Desktop Tab Switcher in Nav */}
        <div className="flex bg-warm-taupe/10 p-1 rounded-full">
            <button 
                onClick={() => setView('studio')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'studio' ? 'bg-espresso text-white shadow-md' : 'text-cool-slate hover:text-espresso'}`}
            >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Studio</span>
            </button>
            <button 
                onClick={() => setView('gallery')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'gallery' ? 'bg-dusty-rose text-white shadow-md' : 'text-cool-slate hover:text-dusty-rose'}`}
            >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Collection</span>
                <span className="ml-1 text-xs opacity-80">({history.length})</span>
            </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* VIEW: STUDIO */}
        {view === 'studio' && (
          <div className="animate-in fade-in duration-500">
            {/* Studio Mode Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-white border border-warm-taupe p-1.5 rounded-full flex shadow-sm">
                    <button
                        onClick={() => switchStudioMode('model')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${studioMode === 'model' ? 'bg-dusty-rose text-white shadow-md' : 'text-cool-slate hover:bg-warm-taupe/20'}`}
                    >
                        <Heart className="w-4 h-4" />
                        Model Studio
                    </button>
                    <button
                        onClick={() => switchStudioMode('product')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${studioMode === 'product' ? 'bg-sage-green text-white shadow-md' : 'text-cool-slate hover:bg-warm-taupe/20'}`}
                    >
                        <Tag className="w-4 h-4" />
                        Product Studio
                    </button>
                </div>
            </div>

            {/* Hero / Intro */}
            <div className="text-center mb-12 max-w-2xl mx-auto space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl text-espresso mb-2">
                {studioMode === 'model' ? 'Soft Life Visualization' : 'Luxury Product Studio'}
              </h2>
              <p className="text-cool-slate text-lg font-light">
                {studioMode === 'model' 
                    ? "Upload your portrait and customize your aesthetic. We'll style you in the luxurious, self-care aesthetic you deserve."
                    : "Generate high-end, commercial-grade product mockups. Perfect for Instagram campaigns and brand visuals."
                }
              </p>
              <ColorSwatch />
            </div>

            {/* Upload Section */}
            {results.length === 0 && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div 
                  className={`
                    relative group border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300
                    ${previewUrl ? (studioMode === 'product' ? 'border-sage-green bg-white' : 'border-dusty-rose bg-white') : 'border-warm-taupe bg-oatmeal/20 hover:bg-oatmeal/40 hover:border-sage-green'}
                  `}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp"
                  />
                  
                  {previewUrl ? (
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-48 h-64 object-cover rounded-xl mx-auto shadow-xl border-4 border-white"
                      />
                      <button 
                        onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                            setResults([]);
                            setOriginalBase64(null);
                        }}
                        className="absolute -top-3 -right-3 bg-espresso text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                        className="cursor-pointer space-y-4"
                        onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition-transform">
                        {studioMode === 'model' ? <Camera className="w-10 h-10 text-dusty-rose" /> : <ShoppingBag className="w-10 h-10 text-sage-green" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-serif text-espresso">
                            {studioMode === 'model' ? 'Upload Portrait' : 'Upload Product'}
                        </h3>
                        <p className="text-sm text-cool-slate mt-1">Drag & drop or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customization Controls */}
                {file && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-warm-taupe/30 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-center justify-between border-b border-warm-taupe/20 pb-4">
                      <h3 className="font-serif text-lg text-espresso flex items-center gap-2">
                        <Palette className="w-4 h-4 text-dusty-rose" />
                        Studio Settings
                      </h3>
                      <button onClick={resetSelection} className="text-xs text-sage-green hover:underline">Reset</button>
                    </div>

                    {/* Generation Type Toggle */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-cool-slate mb-3 block">Generation Mode</label>
                        <div className="flex gap-4">
                            <label className={`
                                flex-1 cursor-pointer rounded-xl p-4 border transition-all duration-300
                                ${generationType === 'creative' ? 'bg-alabaster border-dusty-rose ring-1 ring-dusty-rose' : 'border-warm-taupe/40 hover:bg-alabaster'}
                            `}>
                                <div className="flex items-center gap-2 mb-2">
                                    <input 
                                        type="radio" 
                                        name="genType" 
                                        className="hidden" 
                                        checked={generationType === 'creative'} 
                                        onChange={() => setGenerationType('creative')}
                                    />
                                    <Sparkles className={`w-5 h-5 ${generationType === 'creative' ? 'text-dusty-rose' : 'text-cool-slate'}`} />
                                    <span className="font-bold text-sm text-espresso">Creative Styling</span>
                                </div>
                                <p className="text-xs text-cool-slate leading-relaxed">
                                    Generates 5 variations with different high-fashion styles and luxury scenarios. Best for exploring new looks.
                                </p>
                            </label>

                            <label className={`
                                flex-1 cursor-pointer rounded-xl p-4 border transition-all duration-300
                                ${generationType === 'directors' ? 'bg-alabaster border-sage-green ring-1 ring-sage-green' : 'border-warm-taupe/40 hover:bg-alabaster'}
                            `}>
                                <div className="flex items-center gap-2 mb-2">
                                    <input 
                                        type="radio" 
                                        name="genType" 
                                        className="hidden" 
                                        checked={generationType === 'directors'} 
                                        onChange={() => setGenerationType('directors')}
                                    />
                                    <Clapperboard className={`w-5 h-5 ${generationType === 'directors' ? 'text-sage-green' : 'text-cool-slate'}`} />
                                    <span className="font-bold text-sm text-espresso">Director's Cut</span>
                                </div>
                                <p className="text-xs text-cool-slate leading-relaxed">
                                    Generates 4 professional camera angles of your <b>exact upload</b>. Preserves details, outfit, and background with 0 changes.
                                </p>
                            </label>
                        </div>
                    </div>
                    
                    {/* Creative Mode Settings */}
                    {generationType === 'creative' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Style Selector */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-cool-slate mb-2 block">Style Explorer</label>
                            <div className="flex flex-wrap gap-2">
                            {STYLES.map(style => (
                                <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id === selectedStyle ? undefined : style.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm transition-all duration-200 border
                                    ${selectedStyle === style.id 
                                    ? 'bg-espresso text-white border-espresso shadow-md' 
                                    : 'bg-alabaster text-espresso border-warm-taupe/50 hover:border-dusty-rose hover:bg-white'}
                                `}
                                >
                                {style.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        {/* Scenery Selector */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-cool-slate mb-2 block">Scenery Customizer</label>
                            <div className="flex flex-wrap gap-2">
                            {SCENERIES.map(scenery => (
                                <button
                                key={scenery.id}
                                onClick={() => setSelectedScenery(scenery.id === selectedScenery ? undefined : scenery.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm transition-all duration-200 border
                                    ${selectedScenery === scenery.id 
                                    ? 'bg-dusty-rose text-white border-dusty-rose shadow-md' 
                                    : 'bg-alabaster text-espresso border-warm-taupe/50 hover:border-dusty-rose hover:bg-white'}
                                `}
                                >
                                {scenery.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        {/* Custom Vibe Input */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-cool-slate mb-2 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" />
                                Custom Vibe
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="e.g., Wearing a silk white dress at a sunset vineyard in Tuscany..."
                                className="w-full bg-alabaster/50 border border-warm-taupe/50 rounded-xl p-4 text-sm text-espresso placeholder:text-cool-slate/70 focus:outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/50 transition-all resize-none h-24"
                            />
                        </div>
                        </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-center pt-4">
                  {status === GenerationStatus.GENERATING || status === GenerationStatus.UPLOADING ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className={`w-16 h-16 border-4 border-oatmeal rounded-full animate-spin ${studioMode === 'product' ? 'border-t-sage-green' : 'border-t-dusty-rose'}`}></div>
                        <p className="font-serif italic text-sage-green animate-pulse">
                            {generationType === 'directors' ? 'Filming director\'s cut...' : `Curating your ${studioMode} aesthetic...`}
                        </p>
                    </div>
                  ) : (
                    <Button 
                        onClick={handleGenerate} 
                        disabled={!file}
                        className={`w-full md:w-auto min-w-[200px] ${studioMode === 'product' ? 'bg-sage-green hover:bg-[#5d6854]' : ''}`}
                    >
                        {status === GenerationStatus.ERROR ? 'Try Again' : (generationType === 'directors' ? 'Generate Director\'s Cut' : 'Generate Styles')}
                    </Button>
                  )}
                </div>
                
                {status === GenerationStatus.ERROR && (
                    <p className="text-red-500 text-center mt-4 text-sm">
                        Something went wrong. Please check your API key or try a different photo.
                    </p>
                )}
              </div>
            )}

            {/* Results Gallery (Current Session) */}
            {results.length > 0 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-warm-taupe pb-4 gap-4">
                  <div>
                    <h3 className="font-serif text-3xl text-espresso">Studio Workflow</h3>
                    <p className="text-sage-green font-light italic">
                        Select an image to expand via Director's Cut {studioMode === 'model' && 'or add products'}.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleGenerate} className="text-sm py-2 px-6">
                      <RefreshCw className="w-4 h-4 mr-2 inline" />
                      Generate Again
                    </Button>
                    <Button variant="outline" onClick={startNewSession} className="text-sm py-2 px-6">
                      New Session
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                  {results.map(img => renderImageCard(img))}
                </div>
                
                <div className="text-center pt-8">
                    <p className="text-cool-slate text-sm">
                        View your full session history in <span className="text-dusty-rose font-bold cursor-pointer underline" onClick={() => setView('gallery')}>Collection</span>.
                    </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: GALLERY */}
        {view === 'gallery' && (
           <div className="animate-in fade-in duration-500 min-h-[60vh]">
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-warm-taupe/30 pb-4">
                  <div>
                      <h2 className="font-serif text-3xl md:text-4xl text-espresso">Session Collection</h2>
                      <p className="text-sage-green mt-2 font-light">
                        Temporary gallery. Limited to 20 recent items. Clears on session end.
                      </p>
                  </div>
                  {history.length > 0 && (
                      <button 
                        onClick={clearHistory}
                        className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 mt-4 md:mt-0"
                      >
                        <Trash2 className="w-3 h-3" /> Clear History
                      </button>
                  )}
              </div>

              {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                      <History className="w-16 h-16 text-warm-taupe mb-4" />
                      <p className="text-xl font-serif text-espresso">No images in session</p>
                      <p className="text-sm text-cool-slate mb-6">Start creating in the Studio.</p>
                      <Button onClick={() => setView('studio')}>Go to Studio</Button>
                  </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {history.map(img => renderImageCard(img))}
                </div>
              )}
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center border-t border-warm-taupe/30 pt-10 pb-6 mt-12">
        <p className="font-serif text-2xl italic text-almond-buff mb-4">
          "Romanticize your life."
        </p>
        <p className="text-xs text-cool-slate uppercase tracking-widest">
          Luxe Aura AI • Powered by Gemini
        </p>
      </footer>

      {/* LIGHTBOX OVERLAY */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-alabaster/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Close Button */}
            <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-6 right-6 p-2 bg-espresso/10 hover:bg-espresso/20 rounded-full text-espresso transition-colors z-50"
            >
                <X className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-8 relative group w-full h-full">
                <img 
                    src={lightboxImage.url} 
                    alt="Full Screen" 
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-lg"
                />
                
                {/* Floating Action Bar (Bottom) */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-warm-taupe/20 flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <button 
                        onClick={() => handleDownload(lightboxImage.url, lightboxImage.id)}
                        className="flex flex-col items-center gap-1 text-espresso hover:text-dusty-rose transition-colors"
                    >
                        <div className="p-2 bg-warm-taupe/20 rounded-full"><Download className="w-5 h-5" /></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest">Save</span>
                    </button>
                    
                    {originalBase64 && (
                        <>
                            <div className="w-px h-8 bg-warm-taupe/50"></div>
                            
                            <button 
                                onClick={() => handleDirectorCut(lightboxImage)}
                                className="flex flex-col items-center gap-1 text-espresso hover:text-sage-green transition-colors"
                            >
                                <div className="p-2 bg-warm-taupe/20 rounded-full"><Video className="w-5 h-5" /></div>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Director's Cut</span>
                            </button>

                            {lightboxImage.category === 'avatar' && (
                                <button 
                                    onClick={() => triggerProductUpload(lightboxImage)}
                                    className="flex flex-col items-center gap-1 text-espresso hover:text-almond-buff transition-colors"
                                >
                                    <div className="p-2 bg-warm-taupe/20 rounded-full"><ShoppingBag className="w-5 h-5" /></div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Add Product</span>
                                </button>
                            )}
                        </>
                    )}

                    <div className="w-px h-8 bg-warm-taupe/50"></div>

                    <button 
                        onClick={(e) => handleDelete(lightboxImage.id, e)}
                        className="flex flex-col items-center gap-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                        <div className="p-2 bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest">Delete</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;