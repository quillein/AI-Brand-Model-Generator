
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Camera, Heart, Palette, MessageSquare, LayoutGrid, Trash2, History, Video, ShoppingBag, Plus, Tag, Clapperboard, Maximize2, X, LayoutTemplate, Layers, Megaphone, Copy, Check, FileVideo, ExternalLink, Link2, Settings2, Smartphone, Square, Monitor, Type, FileText, Image as ImageIcon, RefreshCw, Download } from 'lucide-react';
import { generateAvatarVariations, fileToGenerativePart, generateMarketingCopy, generateContextualCarousel, generateBackground } from './services/geminiService';
import { GeneratedImage, GeneratedCopy, GenerationStatus } from './types';
import { Button } from './components/Button';
import { ColorSwatch } from './components/ColorSwatch';
import { SCENERIES, STYLES, COLORS } from './constants';
import { saveImagesToDB, getImagesFromDB, deleteImageFromDB, clearDB } from './services/db';

type AspectRatio = "9:16" | "1:1" | "3:4";
type StudioMode = 'model' | 'product' | 'background' | 'carousel' | 'contextual_carousel' | 'copy';

const App: React.FC = () => {
  const [view, setView] = useState<'studio' | 'gallery'>('studio');
  const [studioMode, setStudioMode] = useState<StudioMode>('model');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [showTweakPanel, setShowTweakPanel] = useState(false);
  
  const [contextText, setContextText] = useState('');
  const [ctxModelXProduct, setCtxModelXProduct] = useState<{file: File, preview: string, b64: string} | null>(null);
  const [ctxModelOnly, setCtxModelOnly] = useState<{file: File, preview: string, b64: string} | null>(null);
  const [ctxProductOnly, setCtxProductOnly] = useState<{file: File, preview: string, b64: string} | null>(null);
  const [ctxColor, setCtxColor] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [productBase64s, setProductBase64s] = useState<string[]>([]);

  const [marketingProduct, setMarketingProduct] = useState('');
  const [marketingContext, setMarketingContext] = useState('');
  const [marketingAudience, setMarketingAudience] = useState('');
  const [copyResult, setCopyResult] = useState<GeneratedCopy | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  
  const [selectedScenery, setSelectedScenery] = useState<string | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productStudioInputRef = useRef<HTMLInputElement>(null);
  const ctxMXPInputRef = useRef<HTMLInputElement>(null);
  const ctxModelInputRef = useRef<HTMLInputElement>(null);
  const ctxProductInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getImagesFromDB().then(setHistory).catch(console.error);
  }, []);

  const addToHistory = async (newImages: GeneratedImage[]) => {
    try {
      await saveImagesToDB(newImages);
      const savedImages = await getImagesFromDB();
      setHistory(savedImages);
    } catch (e) {
      setHistory(prev => [...newImages, ...prev]);
    }
  };

  const switchStudioMode = (mode: StudioMode) => {
    if (studioMode === mode) return;
    setStudioMode(mode);
    setFile(null); setPreviewUrl(null); setOriginalBase64(null);
    setProductFiles([]); setProductPreviews([]); setProductBase64s([]);
    setResults([]);
    setAspectRatio(mode === 'contextual_carousel' ? "3:4" : "9:16");
    setStatus(GenerationStatus.IDLE);
    setMarketingProduct(''); setMarketingContext(''); setMarketingAudience('');
    setCopyResult(null); setShowTweakPanel(false);
    setContextText(''); setCtxModelXProduct(null); setCtxModelOnly(null); setCtxProductOnly(null); setCtxColor(null);
    setSelectedScenery(undefined); setSelectedStyle(undefined); setSelectedColor(undefined); setCustomPrompt('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const selectedFile = selectedFiles[0];
      // Type safety check for selectedFile being a File
      if (selectedFile instanceof File) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        const b64 = await fileToGenerativePart(selectedFile);
        setOriginalBase64(b64);
      }
    }
  };

  const handleProductStudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (filesList && filesList.length > 0) {
      const files = Array.from(filesList);
      setProductFiles(files);
      setProductPreviews(files.map(f => URL.createObjectURL(f)));
      const b64s = await Promise.all(files.map(f => fileToGenerativePart(f)));
      setProductBase64s(b64s);
    }
  };

  const startNewSession = () => {
    setResults([]);
    setFile(null);
    setPreviewUrl(null);
    setOriginalBase64(null);
    setProductFiles([]);
    setProductPreviews([]);
    setProductBase64s([]);
    setStatus(GenerationStatus.IDLE);
    setShowTweakPanel(false);
  };

  const handleCtxFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'mxp' | 'model' | 'product') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file instanceof File) {
        const b64 = await fileToGenerativePart(file);
        const data = { file, preview: URL.createObjectURL(file), b64 };
        if (type === 'mxp') setCtxModelXProduct(data);
        if (type === 'model') setCtxModelOnly(data);
        if (type === 'product') setCtxProductOnly(data);
      }
    }
  };

  const handleGenerate = async () => {
    if (studioMode === 'copy') {
      if (!marketingProduct || !marketingContext) {
        alert("Please provide product name and context.");
        return;
      }
    } else if (studioMode === 'contextual_carousel') {
      if (!contextText || !ctxModelXProduct || !ctxModelOnly || !ctxProductOnly) {
        alert("Please upload all required assets for the carousel.");
        return;
      }
    } else if (studioMode === 'background') {
        if (!selectedScenery && !selectedStyle && !customPrompt) {
            alert("Please choose a scenery, style, or provide a detail description.");
            return;
        }
    }
    
    setResults([]);
    setCopyResult(null);
    setStatus(GenerationStatus.UPLOADING);
    setShowTweakPanel(false);
    
    try {
      setStatus(GenerationStatus.GENERATING);
      if (studioMode === 'copy') {
          const result = await generateMarketingCopy(marketingProduct, marketingContext, marketingAudience);
          setCopyResult(result);
          setStatus(GenerationStatus.COMPLETE);
          return;
      }
      
      let generatedImages: GeneratedImage[] = [];
      if (studioMode === 'contextual_carousel') {
        generatedImages = await generateContextualCarousel(
          contextText,
          { data: ctxModelXProduct!.b64, mimeType: ctxModelXProduct!.file.type },
          { data: ctxModelOnly!.b64, mimeType: ctxModelOnly!.file.type },
          { data: ctxProductOnly!.b64, mimeType: ctxProductOnly!.file.type },
          { themeColorHex: ctxColor || undefined, themeColorName: COLORS.find(c => c.hex === ctxColor)?.name }
        );
      } else if (studioMode === 'background') {
          generatedImages = await generateBackground({
              sceneryId: selectedScenery,
              styleId: selectedStyle,
              customPrompt: customPrompt,
              colorHex: selectedColor,
              aspectRatio
          });
      } else if (studioMode === 'product') {
        // Simple placeholder for existing product studio logic logic
        alert("Product studio variation logic not fully connected in this view.");
        setStatus(GenerationStatus.IDLE);
        return;
      } else {
        const mimeType = file?.type || 'image/jpeg';
        generatedImages = await generateAvatarVariations(originalBase64!, mimeType, { sceneryId: selectedScenery, styleId: selectedStyle, customPrompt: customPrompt.trim() || undefined, aspectRatio });
      }
      
      setResults(generatedImages);
      await addToHistory(generatedImages);
      setStatus(GenerationStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const renderCopySection = (title: string, content: string, sectionKey: string) => (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-warm-taupe/30 space-y-4">
          <div className="flex justify-between items-center border-b border-warm-taupe/20 pb-3">
              <h3 className="font-serif text-xl text-espresso flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-dusty-rose" />
                  {title}
              </h3>
              <button onClick={() => copyToClipboard(content, sectionKey)} className="text-xs flex items-center gap-1 text-sage-green hover:text-espresso font-bold uppercase transition-colors">
                  {copiedSection === sectionKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedSection === sectionKey ? 'Copied' : 'Copy'}
              </button>
          </div>
          <div className="text-sm text-espresso/80 leading-relaxed whitespace-pre-wrap font-sans">{content}</div>
      </div>
  );

  const renderImageCard = (img: GeneratedImage) => (
    <div key={img.id} className="group relative flex flex-col space-y-3">
        <div className={`relative overflow-hidden rounded-2xl shadow-xl bg-warm-taupe cursor-pointer ${img.category === 'carousel' ? 'aspect-[3/4]' : 'aspect-[9/16]'}`} onClick={() => setLightboxImage(img)}>
            <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full text-white shadow-xl"><Maximize2 className="w-6 h-6" /></div>
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
               <button onClick={(e) => { e.stopPropagation(); handleDelete(img.id, e); }} className="bg-white/90 p-2 rounded-full text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
        </div>
        <div className="px-2">
            <span className="text-xs font-bold uppercase text-sage-green line-clamp-2">{img.scenario}</span>
        </div>
    </div>
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    setResults(prev => prev.filter(item => item.id !== id));
    if (lightboxImage?.id === id) setLightboxImage(null);
    await deleteImageFromDB(id);
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `luxe-aura-${id}.png`;
    link.click();
  };

  const clearHistory = async () => {
    if (window.confirm("Clear collection?")) {
      setHistory([]);
      await clearDB();
    }
  };

  return (
    <div className="min-h-screen bg-alabaster text-espresso font-sans pb-20 relative selection:bg-dusty-rose selection:text-white">
      <nav className="sticky top-0 z-40 bg-alabaster/90 backdrop-blur-md border-b border-warm-taupe/30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('studio')}>
          <Sparkles className="text-dusty-rose w-6 h-6" />
          <h1 className="font-serif text-2xl font-bold tracking-tighter text-espresso">LUXE<span className="text-dusty-rose">AURA</span></h1>
        </div>
        <div className="flex bg-warm-taupe/10 p-1 rounded-full">
            <button onClick={() => setView('studio')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'studio' ? 'bg-espresso text-white shadow-md' : 'text-cool-slate'}`}>Studio</button>
            <button onClick={() => setView('gallery')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'gallery' ? 'bg-dusty-rose text-white shadow-md' : 'text-cool-slate'}`}>History ({history.length})</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'studio' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-center mb-8">
                <div className="bg-white border border-warm-taupe p-1.5 rounded-full flex gap-1 overflow-x-auto shadow-sm hide-scrollbar">
                    {['model', 'product', 'background', 'carousel', 'contextual_carousel', 'copy'].map((m) => (
                        <button key={m} onClick={() => switchStudioMode(m as any)} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${studioMode === m ? 'bg-dusty-rose text-white shadow-md' : 'text-cool-slate hover:bg-warm-taupe/20'}`}>
                            {m.toUpperCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center mb-8 max-w-2xl mx-auto space-y-2">
              <h2 className="font-serif text-3xl md:text-4xl text-espresso uppercase tracking-tight">
                {studioMode === 'copy' ? 'Marketing Command Center' : studioMode.replace('_', ' ') + ' Studio'}
              </h2>
              <p className="text-cool-slate italic">Crafting your visual narrative with precision.</p>
            </div>

            {(status === GenerationStatus.IDLE || showTweakPanel) && (
              <div className="max-w-4xl mx-auto space-y-8 mb-12">
                
                {/* Mode Specific Inputs */}
                {studioMode === 'background' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2rem] shadow-sm border border-warm-taupe/30">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block mb-3">Vibe & Detail</label>
                                <textarea 
                                    value={customPrompt} 
                                    onChange={(e) => setCustomPrompt(e.target.value)} 
                                    placeholder="e.g. Macro detail of white silk ripples with soft amber lighting..." 
                                    className="w-full bg-alabaster border border-warm-taupe/30 rounded-2xl p-4 text-sm h-32 focus:outline-none focus:border-dusty-rose resize-none transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block mb-3">Color Palette</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c.hex}
                                            onClick={() => setSelectedColor(c.hex)}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === c.hex ? 'border-espresso scale-110 shadow-md' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.name}
                                        />
                                    ))}
                                    <button 
                                        onClick={() => setSelectedColor(undefined)}
                                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${!selectedColor ? 'border-espresso scale-110 shadow-md' : 'border-warm-taupe/30 bg-alabaster'}`}
                                    >
                                        <X className="w-4 h-4 opacity-40" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block mb-3">Environment (Scenery)</label>
                                <select 
                                    value={selectedScenery} 
                                    onChange={(e) => setSelectedScenery(e.target.value)}
                                    className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-3 text-sm focus:outline-none focus:border-dusty-rose"
                                >
                                    <option value="">Select Scenery...</option>
                                    {SCENERIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block mb-3">Aesthetic Style</label>
                                <select 
                                    value={selectedStyle} 
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-3 text-sm focus:outline-none focus:border-dusty-rose"
                                >
                                    <option value="">Select Style...</option>
                                    {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block mb-3">Orientation</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: "9:16", icon: Smartphone, label: "Story" },
                                        { id: "1:1", icon: Square, label: "Square" },
                                        { id: "3:4", icon: Monitor, label: "Post" }
                                    ].map(ratio => (
                                        <button 
                                            key={ratio.id} 
                                            onClick={() => setAspectRatio(ratio.id as AspectRatio)}
                                            className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${aspectRatio === ratio.id ? 'bg-espresso text-white border-espresso shadow-md' : 'bg-alabaster border-warm-taupe/30 text-cool-slate hover:border-dusty-rose'}`}
                                        >
                                            <ratio.icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">{ratio.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : studioMode === 'copy' ? (
                     <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-8 shadow-md border border-warm-taupe/30 space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Product Name</label>
                            <input type="text" value={marketingProduct} onChange={(e) => setMarketingProduct(e.target.value)} placeholder="e.g. Nutriplus Serum" className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm focus:outline-none focus:border-dusty-rose" />
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Benefits & Context</label>
                            <textarea value={marketingContext} onChange={(e) => setMarketingContext(e.target.value)} placeholder="What makes it unique?" className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm h-32 focus:outline-none focus:border-dusty-rose resize-none" />
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Target Audience</label>
                            <input type="text" value={marketingAudience} onChange={(e) => setMarketingAudience(e.target.value)} placeholder="e.g. Gen Z skincare enthusiasts" className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm focus:outline-none focus:border-dusty-rose" />
                        </div>
                     </div>
                ) : studioMode === 'contextual_carousel' ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-warm-taupe/30 space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Product Context (Text)</label>
                            <textarea value={contextText} onChange={(e) => setContextText(e.target.value)} placeholder="Explain the product flow for the educational slides..." className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm h-24 focus:outline-none focus:border-dusty-rose resize-none" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold uppercase block text-center">Model X Product</span>
                                <div onClick={() => ctxMXPInputRef.current?.click()} className="h-32 border-2 border-dashed border-warm-taupe rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-oatmeal/20">
                                    <input type="file" ref={ctxMXPInputRef} onChange={(e) => handleCtxFile(e, 'mxp')} className="hidden" accept="image/*" />
                                    {ctxModelXProduct ? <img src={ctxModelXProduct.preview} className="w-full h-full object-cover" /> : <Layers className="opacity-30" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold uppercase block text-center">Model Only</span>
                                <div onClick={() => ctxModelInputRef.current?.click()} className="h-32 border-2 border-dashed border-warm-taupe rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-oatmeal/20">
                                    <input type="file" ref={ctxModelInputRef} onChange={(e) => handleCtxFile(e, 'model')} className="hidden" accept="image/*" />
                                    {ctxModelOnly ? <img src={ctxModelOnly.preview} className="w-full h-full object-cover" /> : <Camera className="opacity-30" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold uppercase block text-center">Product Only</span>
                                <div onClick={() => ctxProductInputRef.current?.click()} className="h-32 border-2 border-dashed border-warm-taupe rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-oatmeal/20">
                                    <input type="file" ref={ctxProductInputRef} onChange={(e) => handleCtxFile(e, 'product')} className="hidden" accept="image/*" />
                                    {ctxProductOnly ? <img src={ctxProductOnly.preview} className="w-full h-full object-cover" /> : <ShoppingBag className="opacity-30" />}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="h-64 border-2 border-dashed border-warm-taupe rounded-[2rem] flex flex-col items-center justify-center p-8 cursor-pointer bg-oatmeal/20" onClick={() => (studioMode === 'product' ? productStudioInputRef.current : fileInputRef.current)?.click()}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <input type="file" ref={productStudioInputRef} onChange={handleProductStudioChange} className="hidden" accept="image/*" multiple />
                            {studioMode === 'product' ? (
                                productPreviews.length > 0 ? <div className="grid grid-cols-3 gap-2">{productPreviews.map((p, i) => <img key={i} src={p} className="w-16 h-16 object-cover rounded-lg" />)}</div> : <ShoppingBag className="opacity-40 w-12 h-12" />
                            ) : (
                                previewUrl ? <img src={previewUrl} className="w-32 h-48 object-cover rounded-xl shadow-lg" /> : <Camera className="opacity-40 w-12 h-12" />
                            )}
                        </div>
                        {/* Common Controls for Avatar/Product */}
                        <div className="grid grid-cols-2 gap-4">
                            <select value={selectedScenery} onChange={(e) => setSelectedScenery(e.target.value)} className="bg-white border border-warm-taupe/30 rounded-xl p-3 text-sm">
                                <option value="">Scenery...</option>
                                {SCENERIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="bg-white border border-warm-taupe/30 rounded-xl p-3 text-sm">
                                <option value="">Style...</option>
                                {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-center pt-4">
                    <Button onClick={handleGenerate} disabled={status === GenerationStatus.GENERATING} className="min-w-[240px] text-lg py-4">
                        {status === GenerationStatus.GENERATING ? (
                            <div className="flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Curating...</span>
                            </div>
                        ) : 'Start Session'}
                    </Button>
                </div>
              </div>
            )}

            {(status === GenerationStatus.GENERATING || status === GenerationStatus.UPLOADING) && results.length === 0 && (
                <div className="flex flex-col items-center py-20 animate-pulse">
                    <div className="w-16 h-16 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="font-serif italic text-xl text-cool-slate">Crafting the high-end vision...</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-warm-taupe mt-2">Leica Optics Simulating</p>
                </div>
            )}

            {copyResult && (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="flex justify-between items-center border-b border-warm-taupe/30 pb-4">
                        <h3 className="font-serif text-2xl">Campaign: {copyResult.productName}</h3>
                        <Button variant="outline" onClick={() => setShowTweakPanel(true)} className="text-xs py-1.5">Tweak Copy</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {renderCopySection("Email Strategy", copyResult.emailContent, 'email')}
                        {renderCopySection("Social Scripts", copyResult.socialContent, 'social')}
                        {renderCopySection("Sales Page", copyResult.salesPageContent, 'sales')}
                    </div>
                </div>
            )}

            {results.length > 0 && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex justify-between items-end border-b border-warm-taupe/30 pb-4">
                    <h3 className="font-serif text-2xl">Visual Assets</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowTweakPanel(true)} className="text-xs py-1.5">Tweak Narrative</Button>
                        <Button onClick={startNewSession} className="text-xs py-1.5">New Session</Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {results.map(renderImageCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'gallery' && (
           <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="font-serif text-3xl">Collection</h2>
                  <button onClick={clearHistory} className="text-xs text-red-400 font-bold uppercase flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center py-32 space-y-4 opacity-30">
                    <History className="w-16 h-16" />
                    <p className="text-center italic">No assets saved in your boutique history yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">{history.map(renderImageCard)}</div>
              )}
           </div>
        )}
      </main>

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-alabaster/95 backdrop-blur-xl flex flex-col p-8 items-center justify-center animate-in fade-in duration-300">
            <button onClick={() => setLightboxImage(null)} className="absolute top-6 right-6 p-2 bg-espresso/10 rounded-full hover:bg-espresso hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            <div className="max-w-4xl w-full flex flex-col items-center">
                <img src={lightboxImage.url} className="max-h-[75vh] object-contain shadow-2xl rounded-2xl border-4 border-white mb-8" />
                <div className="flex gap-4">
                    <Button onClick={() => handleDownload(lightboxImage.url, lightboxImage.id)} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>Download PNG</span>
                    </Button>
                    <Button variant="outline" onClick={(e) => handleDelete(lightboxImage.id, e)} className="text-red-500 border-red-200 hover:bg-red-50">Delete Asset</Button>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cool-slate">Prompt Signature</p>
                    <p className="text-sm italic text-espresso/60 mt-1">"{lightboxImage.scenario}"</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
