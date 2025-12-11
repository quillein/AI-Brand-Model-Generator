import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Camera, Heart, Palette, MessageSquare, LayoutGrid, Trash2, History } from 'lucide-react';
import { generateAvatarVariations, fileToGenerativePart } from './services/geminiService';
import { GeneratedImage, GenerationStatus } from './types';
import { Button } from './components/Button';
import { ColorSwatch } from './components/ColorSwatch';
import { SCENERIES, STYLES } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'studio' | 'gallery'>('studio');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  
  // Selection State
  const [selectedScenery, setSelectedScenery] = useState<string | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<string | undefined>(undefined);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('luxe_aura_gallery');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('luxe_aura_gallery', JSON.stringify(history));
    } catch (e) {
      console.warn("Storage quota exceeded. Oldest images may be lost if not manually managed.", e);
    }
  }, [history]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResults([]);
      setStatus(GenerationStatus.IDLE);
      setView('studio');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResults([]);
      setStatus(GenerationStatus.IDLE);
      setView('studio');
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    
    setResults([]);
    setStatus(GenerationStatus.UPLOADING);
    
    try {
      setStatus(GenerationStatus.GENERATING);
      const base64Data = await fileToGenerativePart(file);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      const generatedImages = await generateAvatarVariations(base64Data, mimeType, {
        sceneryId: selectedScenery,
        styleId: selectedStyle,
        customPrompt: customPrompt.trim() !== '' ? customPrompt : undefined
      });
      
      setResults(generatedImages);
      // Add new results to history (newest first)
      setHistory(prev => [...generatedImages, ...prev]);
      setStatus(GenerationStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);
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
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire collection?")) {
      setHistory([]);
      localStorage.removeItem('luxe_aura_gallery');
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
    setPreviewUrl(null);
    resetSelection();
    setStatus(GenerationStatus.IDLE);
  }

  return (
    <div className="min-h-screen bg-alabaster text-espresso font-sans selection:bg-dusty-rose selection:text-white pb-20">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 bg-alabaster/90 backdrop-blur-md border-b border-warm-taupe/30 px-6 py-4 flex justify-between items-center shadow-sm">
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
            {/* Hero / Intro */}
            <div className="text-center mb-12 max-w-2xl mx-auto space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl text-espresso mb-2">
                Soft Life Visualization
              </h2>
              <p className="text-cool-slate text-lg font-light">
                Upload your portrait and customize your aesthetic. We'll style you in the luxurious, self-care aesthetic you deserve.
              </p>
              <ColorSwatch />
            </div>

            {/* Upload Section */}
            {results.length === 0 && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div 
                  className={`
                    relative group border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300
                    ${previewUrl ? 'border-dusty-rose bg-white' : 'border-warm-taupe bg-oatmeal/20 hover:bg-oatmeal/40 hover:border-sage-green'}
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
                        <Camera className="w-10 h-10 text-dusty-rose" />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif text-espresso">Upload Portrait</h3>
                        <p className="text-sm text-cool-slate mt-1">Drag & drop or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customization Controls */}
                {file && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-warm-taupe/30 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg text-espresso flex items-center gap-2">
                        <Palette className="w-4 h-4 text-dusty-rose" />
                        Customize Your Aesthetic
                      </h3>
                      <button onClick={resetSelection} className="text-xs text-sage-green hover:underline">Reset</button>
                    </div>
                    
                    <div className="space-y-6">
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
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-center pt-4">
                  {status === GenerationStatus.GENERATING || status === GenerationStatus.UPLOADING ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 border-4 border-oatmeal border-t-dusty-rose rounded-full animate-spin"></div>
                        <p className="font-serif italic text-sage-green animate-pulse">
                            Curating your soft life aesthetic...
                        </p>
                    </div>
                  ) : (
                    <Button 
                        onClick={handleGenerate} 
                        disabled={!file}
                        className="w-full md:w-auto min-w-[200px]"
                    >
                        {status === GenerationStatus.ERROR ? 'Try Again' : 'Generate Styles'}
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
                    <h3 className="font-serif text-3xl text-espresso">Your Edit</h3>
                    <p className="text-sage-green font-light italic">5 unique variations, curated just for you.</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {results.map((img) => (
                    <div key={img.id} className="group relative flex flex-col space-y-3">
                      <div className="relative overflow-hidden rounded-2xl shadow-xl bg-warm-taupe aspect-[3/4]">
                        <img 
                          src={img.url} 
                          alt={img.scenario} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                          <button 
                            onClick={() => handleDownload(img.url, img.id)}
                            className="self-end bg-white text-espresso p-3 rounded-full hover:bg-dusty-rose hover:text-white transition-colors shadow-lg"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
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
                  ))}
                </div>
                
                <div className="text-center pt-8">
                    <p className="text-cool-slate text-sm">
                        Like these? Check your <span className="text-dusty-rose font-bold cursor-pointer underline" onClick={() => setView('gallery')}>Collection</span> to see all past generations.
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
                      <h2 className="font-serif text-3xl md:text-4xl text-espresso">My Collection</h2>
                      <p className="text-sage-green mt-2 font-light">
                        A curated archive of your best soft life moments.
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
                      <p className="text-xl font-serif text-espresso">No images yet</p>
                      <p className="text-sm text-cool-slate mb-6">Start generating to build your collection.</p>
                      <Button onClick={() => setView('studio')}>Go to Studio</Button>
                  </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {history.map((img) => (
                        <div key={img.id} className="group relative">
                             <div className="relative overflow-hidden rounded-xl bg-warm-taupe aspect-[3/4] shadow-md hover:shadow-xl transition-shadow">
                                <img 
                                    src={img.url} 
                                    alt={img.scenario} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                     <button 
                                        onClick={() => handleDownload(img.url, img.id)}
                                        className="bg-white/90 p-2 rounded-full text-espresso hover:bg-white hover:scale-110 transition-all"
                                        title="Download"
                                     >
                                         <Download className="w-4 h-4" />
                                     </button>
                                     <button 
                                        onClick={(e) => handleDelete(img.id, e)}
                                        className="bg-white/90 p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-all"
                                        title="Delete"
                                     >
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                </div>
                             </div>
                             <div className="mt-2 px-1">
                                <p className="text-[10px] uppercase tracking-widest text-cool-slate truncate">
                                    {new Date(img.timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-xs font-bold text-espresso truncate">
                                    {img.scenario}
                                </p>
                             </div>
                        </div>
                    ))}
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
    </div>
  );
};

export default App;