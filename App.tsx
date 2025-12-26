
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Camera, Heart, Palette, MessageSquare, LayoutGrid, Trash2, History, Video, ShoppingBag, Plus, Tag, Clapperboard, Maximize2, X, LayoutTemplate, Layers, Megaphone, Copy, Check, FileVideo, ExternalLink, Link2, Settings2 } from 'lucide-react';
import { generateAvatarVariations, generateAngleVariations, generateProductMockup, fileToGenerativePart, generateProductVariations, generateDirectorsCut, generateIGCarousel, generateMarketingCopy, generateModelProductVariations } from './services/geminiService';
import { GeneratedImage, GeneratedCopy, GenerationStatus } from './types';
import { Button } from './components/Button';
import { ColorSwatch } from './components/ColorSwatch';
import { SCENERIES, STYLES, COLORS } from './constants';
import { saveImagesToDB, getImagesFromDB, deleteImageFromDB, clearDB } from './services/db';

const App: React.FC = () => {
  const [view, setView] = useState<'studio' | 'gallery'>('studio');
  const [studioMode, setStudioMode] = useState<'model' | 'product' | 'model_product' | 'carousel' | 'copy'>('model');
  const [generationType, setGenerationType] = useState<'creative' | 'directors'>('creative');
  const [showTweakPanel, setShowTweakPanel] = useState(false);
  
  // Model Studio Upload
  const [file, setFile] = useState<File | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Product Studio Uploads (Multiple)
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [productBase64s, setProductBase64s] = useState<string[]>([]);

  // Carousel Upload State
  const [carouselModelFile, setCarouselModelFile] = useState<File | null>(null);
  const [carouselModelPreview, setCarouselModelPreview] = useState<string | null>(null);
  const [carouselModelBase64, setCarouselModelBase64] = useState<string | null>(null);

  const [carouselProductFiles, setCarouselProductFiles] = useState<File[]>([]);
  const [carouselProductPreviews, setCarouselProductPreviews] = useState<string[]>([]);
  const [carouselProductBase64s, setCarouselProductBase64s] = useState<string[]>([]);

  const [carouselThemeColor, setCarouselThemeColor] = useState<string | null>(null);

  // Marketing Copy State
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
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [processingId, setProcessingId] = useState<string | null>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageForProduct, setSelectedImageForProduct] = useState<GeneratedImage | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [videoPromptCopied, setVideoPromptCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productStudioInputRef = useRef<HTMLInputElement>(null);
  const carouselModelInputRef = useRef<HTMLInputElement>(null);
  const carouselProductInputRef = useRef<HTMLInputElement>(null);

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

  const switchStudioMode = (mode: 'model' | 'product' | 'model_product' | 'carousel' | 'copy') => {
    if (studioMode === mode) return;
    setStudioMode(mode);
    setFile(null);
    setPreviewUrl(null);
    setOriginalBase64(null);
    setProductFiles([]);
    setProductPreviews([]);
    setProductBase64s([]);
    setCarouselModelFile(null);
    setCarouselModelPreview(null);
    setCarouselModelBase64(null);
    setCarouselProductFiles([]);
    setCarouselProductPreviews([]);
    setCarouselProductBase64s([]);
    setResults([]);
    resetSelection();
    setGenerationType('creative');
    setStatus(GenerationStatus.IDLE);
    setMarketingProduct('');
    setMarketingContext('');
    setMarketingAudience('');
    setCopyResult(null);
    setShowTweakPanel(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      fileToGenerativePart(selectedFile).then(setOriginalBase64).catch(console.error);
      setResults([]);
      setStatus(GenerationStatus.IDLE);
      setView('studio');
    }
  };

  const handleProductStudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      const newPreviews = newFiles.map((f: File) => URL.createObjectURL(f));
      const newBase64s = await Promise.all(newFiles.map(fileToGenerativePart));
      
      setProductFiles(prev => [...prev, ...newFiles]);
      setProductPreviews(prev => [...prev, ...newPreviews]);
      setProductBase64s(prev => [...prev, ...newBase64s]);
      setResults([]);
      setStatus(GenerationStatus.IDLE);
    }
  };

  const removeProductFromStudio = (index: number) => {
    setProductFiles(prev => prev.filter((_, i) => i !== index));
    setProductPreviews(prev => prev.filter((_, i) => i !== index));
    setProductBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const handleCarouselModelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCarouselModelFile(selectedFile);
      setCarouselModelPreview(URL.createObjectURL(selectedFile));
      fileToGenerativePart(selectedFile).then(setCarouselModelBase64).catch(console.error);
    }
  };

  const handleCarouselProductChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      const newPreviews = newFiles.map((f: File) => URL.createObjectURL(f));
      const newBase64s = await Promise.all(newFiles.map(fileToGenerativePart));
      
      setCarouselProductFiles(prev => [...prev, ...newFiles]);
      setCarouselProductPreviews(prev => [...prev, ...newPreviews]);
      setCarouselProductBase64s(prev => [...prev, ...newBase64s]);
    }
  };

  const removeProductFromCarousel = (index: number) => {
    setCarouselProductFiles(prev => prev.filter((_, i) => i !== index));
    setCarouselProductPreviews(prev => prev.filter((_, i) => i !== index));
    setCarouselProductBase64s(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };
  
  const copyVideoPrompt = (text: string) => {
      navigator.clipboard.writeText(text);
      setVideoPromptCopied(true);
      setTimeout(() => setVideoPromptCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (studioMode === 'carousel') {
        if (!carouselModelBase64 || carouselProductBase64s.length === 0 || !carouselThemeColor) return;
    } else if (studioMode === 'copy') {
        if (!marketingProduct || !marketingContext) return;
    } else if (studioMode === 'product') {
        if (productBase64s.length === 0) return;
    } else if (studioMode === 'model_product') {
        if (!originalBase64 || productBase64s.length === 0) return;
    } else {
        if (!file || !originalBase64) return;
    }
    
    setResults([]);
    setCopyResult(null);
    setStatus(GenerationStatus.UPLOADING);
    setShowTweakPanel(false);
    
    try {
      setStatus(GenerationStatus.GENERATING);
      let generatedImages: GeneratedImage[] = [];

      if (studioMode === 'copy') {
          const result = await generateMarketingCopy(marketingProduct, marketingContext, marketingAudience);
          setCopyResult(result);
          setStatus(GenerationStatus.COMPLETE);
          return;
      }
      else if (studioMode === 'carousel') {
          const productMime = (carouselProductFiles[0] as any)?.type || 'image/jpeg';
          generatedImages = await generateIGCarousel(
              carouselModelBase64!, 
              carouselModelFile!.type,
              carouselProductBase64s.map(data => ({ data, mimeType: productMime })),
              carouselThemeColor!, 
              COLORS.find(c => c.hex === carouselThemeColor)?.name || 'Theme'
          );
      } else if (studioMode === 'product') {
          const productMime = (productFiles[0] as any)?.type || 'image/jpeg';
          if (generationType === 'directors') {
              generatedImages = await generateDirectorsCut(
                  productBase64s.map(data => ({ data, mimeType: productMime })),
                  'product'
              );
          } else {
              generatedImages = await generateProductVariations(
                  productBase64s.map(data => ({ data, mimeType: productMime })),
                  { sceneryId: selectedScenery, styleId: selectedStyle, customPrompt: customPrompt.trim() || undefined }
              );
          }
      } else if (studioMode === 'model_product') {
          const modelMime = file?.type || 'image/jpeg';
          const productMime = (productFiles[0] as any)?.type || 'image/jpeg';
          
          if (generationType === 'directors') {
              generatedImages = await generateDirectorsCut(
                  [
                    { data: originalBase64!, mimeType: modelMime },
                    ...productBase64s.map(data => ({ data, mimeType: productMime }))
                  ],
                  'model_product'
              );
          } else {
              generatedImages = await generateModelProductVariations(
                  { data: originalBase64!, mimeType: modelMime },
                  productBase64s.map(data => ({ data, mimeType: productMime })),
                  { sceneryId: selectedScenery, styleId: selectedStyle, customPrompt: customPrompt.trim() || undefined }
              );
          }
      } else {
          const mimeType = file?.type || 'image/jpeg';
          if (generationType === 'directors') {
              generatedImages = await generateDirectorsCut([{ data: originalBase64!, mimeType }], 'avatar');
          } else {
              generatedImages = await generateAvatarVariations(originalBase64!, mimeType, {
                  sceneryId: selectedScenery,
                  styleId: selectedStyle,
                  customPrompt: customPrompt.trim() || undefined
              });
          }
      }
      
      setResults(generatedImages);
      await addToHistory(generatedImages);
      setStatus(GenerationStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleDirectorCut = async (img: GeneratedImage) => {
    setProcessingId(img.id);
    setLightboxImage(null);
    try {
        const angleVariations = await generateAngleVariations(
            [{ data: img.url.split(',')[1], mimeType: 'image/png' }], 
            img.scenario, 
            img.category
        );
        if (view === 'studio') setResults(prev => [...angleVariations, ...prev]);
        await addToHistory(angleVariations);
    } catch (e) { alert("Failed to generate angles."); }
    finally { setProcessingId(null); }
  };

  const triggerProductUpload = (img: GeneratedImage) => {
    setSelectedImageForProduct(img);
    productInputRef.current?.click();
    setLightboxImage(null);
  };

  const handleProductMockupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && selectedImageForProduct && originalBase64 && file) {
        const prodFiles = Array.from(e.target.files) as File[];
        setProcessingId(selectedImageForProduct.id);
        try {
            const prodBase64s = await Promise.all(prodFiles.map(fileToGenerativePart));
            const mockupResults = await generateProductMockup(
                originalBase64,
                file.type,
                prodBase64s.map((data, i) => ({ data, mimeType: prodFiles[i].type })),
                selectedImageForProduct.scenario
            );
            if (view === 'studio') setResults(prev => [...mockupResults, ...prev]);
            await addToHistory(mockupResults);
        } catch (error) { alert("Failed to create product mockup."); }
        finally {
            setProcessingId(null);
            setSelectedImageForProduct(null);
        }
    }
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `luxe-aura-${id}.png`;
    link.click();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    setResults(prev => prev.filter(item => item.id !== id));
    if (lightboxImage?.id === id) setLightboxImage(null);
    await deleteImageFromDB(id);
  };

  const clearHistory = async () => {
    if (window.confirm("Clear collection?")) {
      setHistory([]);
      await clearDB();
    }
  };

  const resetSelection = () => {
    setSelectedScenery(undefined);
    setSelectedStyle(undefined);
    setCustomPrompt('');
    setCarouselThemeColor(null);
  };

  const startNewSession = () => {
    setResults([]);
    setFile(null);
    setOriginalBase64(null);
    setPreviewUrl(null);
    setProductFiles([]);
    setProductPreviews([]);
    setProductBase64s([]);
    setCarouselModelFile(null);
    setCarouselModelPreview(null);
    setCarouselModelBase64(null);
    setCarouselProductFiles([]);
    setCarouselProductPreviews([]);
    setCarouselProductBase64s([]);
    resetSelection();
    setStatus(GenerationStatus.IDLE);
    setMarketingProduct('');
    setMarketingContext('');
    setMarketingAudience('');
    setCopyResult(null);
    setShowTweakPanel(false);
  };

  const renderImageCard = (img: GeneratedImage) => (
    <div key={img.id} className="group relative flex flex-col space-y-3 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-warm-taupe aspect-[3/4] cursor-pointer" onClick={() => setLightboxImage(img)}>
            <img src={img.url} alt={img.scenario} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {processingId === img.id && (
                <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs font-bold tracking-widest uppercase text-center px-4">Processing...</span>
                </div>
            )}
            <button onClick={(e) => handleDelete(img.id, e)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-red-400 opacity-0 group-hover:opacity-100 z-20 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none transition-opacity">
                <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full text-white pointer-events-auto shadow-xl"><Maximize2 className="w-6 h-6" /></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 z-20 transition-opacity">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-espresso text-white">{img.category.replace('_', ' X ')}</span>
                   <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.id); }} className="bg-white/90 p-2 rounded-full text-espresso shadow-lg hover:bg-dusty-rose hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                        {(originalBase64 || productBase64s.length > 0) && studioMode !== 'carousel' && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handleDirectorCut(img); }} className="bg-white/90 p-2 rounded-full text-espresso shadow-lg hover:bg-sage-green hover:text-white transition-all"><Video className="w-4 h-4" /></button>
                                {(img.category === 'avatar' || img.category === 'model_product') && <button onClick={(e) => { e.stopPropagation(); triggerProductUpload(img); }} className="bg-white/90 p-2 rounded-full text-espresso shadow-lg hover:bg-almond-buff hover:text-white transition-all"><ShoppingBag className="w-4 h-4" /></button>}
                            </>
                        )}
                   </div>
                </div>
            </div>
        </div>
        <div className="px-2">
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase text-sage-green leading-relaxed line-clamp-2">{img.scenario}</span>
                <Heart className="w-4 h-4 text-dusty-rose ml-2 flex-shrink-0" />
            </div>
        </div>
    </div>
  );

  const renderCopySection = (title: string, content: string, sectionKey: string) => (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-warm-taupe/30 space-y-4">
          <div className="flex justify-between items-center border-b border-warm-taupe/20 pb-3">
              <h3 className="font-serif text-xl text-espresso flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#9370DB]" />
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

  return (
    <div className="min-h-screen bg-alabaster text-espresso font-sans pb-20 relative selection:bg-dusty-rose selection:text-white">
      <input type="file" ref={productInputRef} onChange={handleProductMockupChange} className="hidden" accept="image/*" multiple />

      <nav className="sticky top-0 z-40 bg-alabaster/90 backdrop-blur-md border-b border-warm-taupe/30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('studio')}>
          <Sparkles className="text-dusty-rose w-6 h-6" />
          <h1 className="font-serif text-2xl font-bold tracking-tighter text-espresso">LUXE<span className="text-dusty-rose">AURA</span></h1>
        </div>
        <div className="flex bg-warm-taupe/10 p-1 rounded-full overflow-x-auto hide-scrollbar max-w-[60%]">
            <button onClick={() => setView('studio')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${view === 'studio' ? 'bg-espresso text-white shadow-md' : 'text-cool-slate'}`}><Camera className="w-4 h-4" />Studio</button>
            <button onClick={() => setView('gallery')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${view === 'gallery' ? 'bg-dusty-rose text-white shadow-md' : 'text-cool-slate'}`}><LayoutGrid className="w-4 h-4" />History ({history.length})</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'studio' && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex justify-center mb-8">
                <div className="bg-white border border-warm-taupe p-1.5 rounded-full flex gap-1 overflow-x-auto shadow-sm hide-scrollbar max-w-full">
                    {[
                      { id: 'model', label: 'MODEL STUDIO' },
                      { id: 'product', label: 'PRODUCT STUDIO' },
                      { id: 'model_product', label: 'MODEL X PRODUCT' },
                      { id: 'carousel', label: 'CAROUSEL STUDIO' },
                      { id: 'copy', label: 'MARKETING AI' }
                    ].map((m) => (
                        <button key={m.id} onClick={() => switchStudioMode(m.id as any)} className={`px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${studioMode === m.id ? 'bg-dusty-rose text-white shadow-md' : 'text-cool-slate hover:bg-warm-taupe/20'}`}>
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center mb-12 max-w-2xl mx-auto space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl text-espresso">
                {studioMode === 'copy' ? 'Campaign Command Center' : 
                 studioMode === 'model_product' ? 'Model X Product Studio' :
                 `${studioMode.charAt(0).toUpperCase() + studioMode.slice(1)} Aesthetic Studio`}
              </h2>
              <p className="text-cool-slate text-lg font-light italic">
                {studioMode === 'model' ? "Refine your personal soft-life identity." : 
                 studioMode === 'product' ? "Elevate your commercial product photography." : 
                 studioMode === 'model_product' ? "Integrated lifestyle shots featuring model and products." :
                 studioMode === 'carousel' ? "Curate high-conversion Instagram feeds." : 
                 "Research trends and generate viral marketing copy."}
              </p>
              {studioMode !== 'copy' && <ColorSwatch />}
            </div>

            {((results.length === 0 && !copyResult) || showTweakPanel) && (
              <div className="max-w-2xl mx-auto space-y-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                {studioMode === 'copy' ? (
                     <div className="bg-white rounded-2xl p-8 shadow-md border border-warm-taupe/30 space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Product Name</label>
                            <input type="text" value={marketingProduct} onChange={(e) => setMarketingProduct(e.target.value)} placeholder="e.g. Nutriplus Collagen" className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm focus:outline-none focus:border-dusty-rose transition-all" />
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Benefits & Campaign Context</label>
                            <textarea value={marketingContext} onChange={(e) => setMarketingContext(e.target.value)} placeholder="Describe key benefits or sale details..." className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm h-32 focus:outline-none focus:border-dusty-rose transition-all" />
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate block">Target Audience</label>
                            <input type="text" value={marketingAudience} onChange={(e) => setMarketingAudience(e.target.value)} placeholder="e.g. Modern moms interested in skincare" className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm focus:outline-none focus:border-dusty-rose transition-all" />
                        </div>
                     </div>
                ) : (studioMode === 'carousel' || studioMode === 'model_product') ? (
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Model Upload */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate ml-2">{studioMode === 'model_product' ? 'Subject / Model' : 'Carousel Model'}</label>
                                <div className="h-64 border-2 border-dashed border-warm-taupe rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden bg-oatmeal/20 transition-all hover:bg-oatmeal/30" onClick={() => (studioMode === 'model_product' ? fileInputRef : carouselModelInputRef).current?.click()}>
                                    <input type="file" ref={studioMode === 'model_product' ? fileInputRef : carouselModelInputRef} onChange={studioMode === 'model_product' ? handleFileChange : handleCarouselModelChange} className="hidden" accept="image/*" />
                                    {(studioMode === 'model_product' ? previewUrl : carouselModelPreview) ? (
                                        <div className="relative w-full h-full group">
                                            <img src={studioMode === 'model_product' ? previewUrl! : carouselModelPreview!} className="w-full h-full object-cover rounded-xl" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Change Image</div>
                                        </div>
                                    ) : <div className="text-center opacity-60"><Camera className="mx-auto text-dusty-rose mb-2" /><p className="text-xs font-bold">Upload Model</p></div>}
                                </div>
                            </div>

                            {/* Multi-Product Upload */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate ml-2">{studioMode === 'model_product' ? 'Product Kit' : 'Carousel Products'}</label>
                                <div className="h-64 border-2 border-dashed border-warm-taupe rounded-2xl flex flex-col p-4 bg-oatmeal/20 transition-all hover:bg-oatmeal/30 overflow-y-auto hide-scrollbar">
                                    <input type="file" ref={studioMode === 'model_product' ? productStudioInputRef : carouselProductInputRef} onChange={studioMode === 'model_product' ? handleProductStudioChange : handleCarouselProductChange} className="hidden" accept="image/*" multiple />
                                    
                                    {(studioMode === 'model_product' ? productPreviews : carouselProductPreviews).length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {(studioMode === 'model_product' ? productPreviews : carouselProductPreviews).map((p, i) => (
                                                <div key={i} className="relative aspect-square">
                                                    <img src={p} className="w-full h-full object-cover rounded-lg border-2 border-white shadow-sm" />
                                                    <button onClick={(e) => { e.stopPropagation(); studioMode === 'model_product' ? removeProductFromStudio(i) : removeProductFromCarousel(i); }} className="absolute -top-1 -right-1 bg-espresso text-white p-1 rounded-full shadow-md hover:bg-red-500 transition-all">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => (studioMode === 'model_product' ? productStudioInputRef : carouselProductInputRef).current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-warm-taupe flex flex-col items-center justify-center bg-white/50 hover:bg-white transition-all">
                                                <Plus className="w-5 h-5 text-sage-green" />
                                                <span className="text-[10px] font-bold mt-1 uppercase">Add</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center cursor-pointer" onClick={() => (studioMode === 'model_product' ? productStudioInputRef : carouselProductInputRef).current?.click()}>
                                            <Tag className="mx-auto text-sage-green mb-2" />
                                            <p className="text-xs font-bold opacity-60">Upload Product(s)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                         
                         {(studioMode === 'carousel' && carouselModelPreview && carouselProductPreviews.length > 0) && (
                             <div className="bg-white rounded-2xl p-6 border border-warm-taupe/30 animate-in fade-in">
                                 <h3 className="font-bold text-[10px] text-espresso uppercase tracking-widest mb-4 flex items-center gap-2"><Palette className="w-3 h-3" /> Brand Theme Color</h3>
                                 <div className="flex flex-wrap gap-3 justify-center">
                                     {COLORS.map((color) => (
                                         <button key={color.hex} onClick={() => setCarouselThemeColor(color.hex)} className={`w-10 h-10 rounded-full border-2 transition-transform ${carouselThemeColor === color.hex ? 'ring-2 ring-espresso border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color.hex }} title={color.name} />
                                     ))}
                                 </div>
                             </div>
                         )}
                    </div>
                ) : studioMode === 'product' ? (
                    <div className="space-y-6">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate ml-4">Product Collection (Up to 5)</label>
                        <div className="min-h-64 border-2 border-dashed border-warm-taupe rounded-[2rem] flex flex-col p-8 bg-oatmeal/20 transition-all hover:bg-oatmeal/30">
                            <input type="file" ref={productStudioInputRef} onChange={handleProductStudioChange} className="hidden" accept="image/*" multiple />
                            
                            {productPreviews.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {productPreviews.map((p, i) => (
                                        <div key={i} className="relative aspect-[3/4] group">
                                            <img src={p} className="w-full h-full object-cover rounded-xl border-4 border-white shadow-md" />
                                            <button onClick={(e) => { e.stopPropagation(); removeProductFromStudio(i); }} className="absolute -top-2 -right-2 bg-espresso text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {productPreviews.length < 5 && (
                                        <button onClick={() => productStudioInputRef.current?.click()} className="aspect-[3/4] rounded-xl border-2 border-dashed border-warm-taupe flex flex-col items-center justify-center bg-white/50 hover:bg-white transition-all">
                                            <Plus className="w-6 h-6 text-sage-green mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Add Product</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center cursor-pointer" onClick={() => productStudioInputRef.current?.click()}>
                                    <ShoppingBag className="mx-auto text-sage-green w-16 h-16 mb-4 opacity-40" />
                                    <h3 className="font-serif text-xl text-espresso">Upload Your Products</h3>
                                    <p className="text-sm text-cool-slate mt-2">Combine multiple products into high-end kit shots.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-64 border-2 border-dashed border-warm-taupe rounded-[2rem] flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden bg-oatmeal/20 transition-all hover:bg-oatmeal/30 shadow-inner" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        {previewUrl ? (
                            <div className="relative group">
                                <img src={previewUrl} className="w-48 h-full object-cover rounded-xl shadow-2xl border-4 border-white" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs rounded-xl transition-opacity">Change Photo</div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Camera className="mx-auto text-dusty-rose w-12 h-12 mb-2 opacity-40" />
                                <h3 className="font-serif text-xl text-espresso">Upload Portrait</h3>
                                <p className="text-sm text-cool-slate mt-2">Selfie or photoshoot portrait</p>
                            </div>
                        )}
                    </div>
                )}

                {(studioMode !== 'copy' && (file || productFiles.length > 0 || carouselModelFile)) && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-warm-taupe/30 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                    {(studioMode === 'model' || studioMode === 'product' || studioMode === 'model_product') && (
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate mb-4 block">Generation Mode</label>
                            <div className="flex gap-4">
                                {['creative', 'directors'].map(t => (
                                    <button key={t} onClick={() => setGenerationType(t as any)} className={`flex-1 p-4 border rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${generationType === t ? 'border-dusty-rose bg-alabaster ring-1 ring-dusty-rose text-espresso shadow-md' : 'border-warm-taupe/30 text-cool-slate hover:bg-alabaster/50'}`}>
                                        {t === 'creative' ? <Sparkles className="w-4 h-4" /> : <Clapperboard className="w-4 h-4" />}
                                        {t.toUpperCase()} VARIATIONS
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {generationType === 'creative' && studioMode !== 'carousel' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate mb-3 block">Style Aesthetic</label>
                                <div className="flex flex-wrap gap-2">
                                    {STYLES.map(s => (
                                        <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all ${selectedStyle === s.id ? 'bg-espresso text-white border-espresso shadow-md' : 'bg-alabaster border-warm-taupe/30 text-cool-slate hover:border-dusty-rose'}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate mb-3 block">Luxury Scenery</label>
                                <div className="flex flex-wrap gap-2">
                                    {SCENERIES.map(s => (
                                        <button key={s.id} onClick={() => setSelectedScenery(s.id)} className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all ${selectedScenery === s.id ? 'bg-sage-green text-white border-sage-green shadow-md' : 'bg-alabaster border-warm-taupe/30 text-cool-slate hover:border-sage-green'}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cool-slate mb-3 block">Custom Directives (Optional)</label>
                                <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="e.g. Holding a pink tulip, soft bokeh lighting, extremely high detail..." className="w-full bg-alabaster border border-warm-taupe/30 rounded-xl p-4 text-sm h-24 focus:outline-none focus:border-dusty-rose transition-all resize-none" />
                            </div>
                        </div>
                    )}
                    
                    {generationType === 'directors' && (
                        <div className="p-4 bg-alabaster rounded-xl border border-warm-taupe/20 text-center">
                            <p className="text-xs text-cool-slate italic">"Director's Cut will generate 5 professional camera angles of your source, preserving all details 100%."</p>
                        </div>
                    )}
                  </div>
                )}

                <div className="flex justify-center pt-6">
                  {status === GenerationStatus.GENERATING || status === GenerationStatus.UPLOADING ? (
                    <div className="text-center space-y-4 animate-pulse">
                        <div className="w-16 h-16 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="font-serif italic text-espresso text-lg">Curating Your Aesthetic...</p>
                        <p className="text-[10px] uppercase tracking-widest text-sage-green font-bold">Luxe Aura Engine Working</p>
                    </div>
                  ) : (
                    <Button onClick={handleGenerate} className="w-full md:w-auto min-w-[280px] shadow-xl hover:scale-105 transition-transform" variant={studioMode === 'product' || studioMode === 'model_product' ? 'secondary' : 'primary'}>
                        {status === GenerationStatus.ERROR ? 'RETRY GENERATION' : `GENERATE ${studioMode.replace('_', ' X ').toUpperCase()} ASSETS`}
                    </Button>
                  )}
                </div>
                {status === GenerationStatus.ERROR && <p className="text-red-400 text-center text-xs font-bold">Generation failed. Please check your image or connection.</p>}
              </div>
            )}

            {(copyResult && !showTweakPanel) && (
                <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <div className="flex justify-between items-center border-b border-warm-taupe/30 pb-4">
                        <div className="space-y-2">
                          <h3 className="font-serif text-2xl text-espresso">Marketing Campaign: {marketingProduct}</h3>
                          {copyResult.groundingUrls && copyResult.groundingUrls.length > 0 && (
                            <div className="flex flex-wrap gap-3 items-center">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-cool-slate">Sources:</span>
                              {copyResult.groundingUrls.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-dusty-rose hover:underline flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" /> {source.title || 'Source'}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowTweakPanel(true)} className="text-xs py-1.5 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Tweak & Redo</Button>
                            <Button variant="outline" onClick={startNewSession} className="text-xs py-1.5">New Session</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {renderCopySection("Email Strategy", copyResult.emailContent, 'email')}
                        {renderCopySection("Social Scripts", copyResult.socialContent, 'social')}
                        {renderCopySection("Sales Copy", copyResult.salesPageContent, 'sales')}
                    </div>
                </div>
            )}

            {(results.length > 0 && !showTweakPanel) && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-warm-taupe/30 pb-4 gap-4">
                    <div>
                        <h3 className="font-serif text-3xl text-espresso">Studio Workflow</h3>
                        <p className="text-sage-green italic text-sm">Select an image to expand with Director's Cut or create mockups.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setShowTweakPanel(true)} className="text-xs py-2 px-6 flex items-center gap-2"><Settings2 className="w-3 h-3" /> Tweak Directives</Button>
                        <Button onClick={handleGenerate} className="text-xs py-2 px-6 flex items-center gap-2"><RefreshCw className="w-3 h-3" /> Regenerate</Button>
                        <Button variant="outline" onClick={startNewSession} className="text-xs py-2 px-6">New Session</Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-10">
                    {results.map(renderImageCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'gallery' && (
           <div className="min-h-[60vh] animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-10 border-b border-warm-taupe/30 pb-4">
                  <div>
                      <h2 className="font-serif text-4xl text-espresso">Session History</h2>
                      <p className="text-xs text-cool-slate mt-1 uppercase tracking-widest">Recent 25 items saved in local browser</p>
                  </div>
                  <button onClick={clearHistory} className="text-[10px] text-red-400 font-bold uppercase hover:text-red-600 transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear All</button>
              </div>
              {history.length === 0 ? (
                  <div className="text-center py-32 flex flex-col items-center opacity-40">
                      <History className="w-16 h-16 mb-4" />
                      <p className="font-serif text-2xl italic">Your collection is empty.</p>
                      <Button variant="outline" onClick={() => setView('studio')} className="mt-6">Go to Studio</Button>
                  </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {history.map(renderImageCard)}
                </div>
              )}
           </div>
        )}
      </main>

      <footer className="text-center py-20 border-t border-warm-taupe/20 opacity-60">
        <p className="font-serif italic text-2xl text-almond-buff mb-4">"Live beautifully. Brand intentionally."</p>
        <p className="text-[10px] uppercase tracking-widest font-bold">Luxe Aura AI • Soft Life Aesthetic Engine</p>
      </footer>

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-alabaster/95 backdrop-blur-xl flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
            <button onClick={() => setLightboxImage(null)} className="absolute top-6 right-6 p-3 bg-espresso/10 hover:bg-espresso/20 rounded-full transition-colors z-50"><X className="w-8 h-8" /></button>
            <div className="flex-1 flex items-center justify-center relative group max-w-5xl mx-auto w-full">
                <img src={lightboxImage.url} className="max-h-full max-w-full object-contain shadow-2xl rounded-2xl border-4 border-white" />
                
                <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 md:px-10 py-4 md:py-5 rounded-full shadow-2xl border border-warm-taupe/20 flex items-center gap-4 md:gap-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <button onClick={() => handleDownload(lightboxImage.url, lightboxImage.id)} className="flex flex-col items-center gap-1 text-espresso hover:text-dusty-rose transition-colors">
                        <Download className="w-6 h-6" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">SAVE</span>
                    </button>
                    
                    <div className="w-px h-8 bg-warm-taupe/30"></div>
                    
                    {lightboxImage.videoPrompt && (
                        <button onClick={() => copyVideoPrompt(lightboxImage.videoPrompt!)} className="flex flex-col items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors">
                            {videoPromptCopied ? <Check className="w-6 h-6 text-green-500" /> : <FileVideo className="w-6 h-6" />}
                            <span className="text-[9px] font-bold uppercase tracking-widest">VEO PROMPT</span>
                        </button>
                    )}
                    
                    <div className="w-px h-8 bg-warm-taupe/30"></div>
                    <button onClick={() => handleDirectorCut(lightboxImage)} className="flex flex-col items-center gap-1 text-sage-green hover:text-espresso transition-colors">
                        <Video className="w-6 h-6" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">RESHOOT</span>
                    </button>

                    {(lightboxImage.category === 'avatar' || lightboxImage.category === 'model_product') && (
                        <>
                            <div className="w-px h-8 bg-warm-taupe/30"></div>
                            <button onClick={() => triggerProductUpload(lightboxImage)} className="flex flex-col items-center gap-1 text-almond-buff hover:text-espresso transition-colors">
                                <ShoppingBag className="w-6 h-6" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">MOCKUP</span>
                            </button>
                        </>
                    )}
                    
                    <div className="w-px h-8 bg-warm-taupe/30"></div>
                    <button onClick={(e) => handleDelete(lightboxImage.id, e)} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">DELETE</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
