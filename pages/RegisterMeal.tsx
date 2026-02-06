import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Plus, Loader2, Image as ImageIcon, X, PenTool, Scale, Calendar, Clock, Trash2, Calculator, History, Eye, Copy, Edit2, ChevronRight, ScanLine } from 'lucide-react';
import { Meal } from '../types';
import { analyzeFoodImage, calculateNutritionalInfo } from '../services/geminiService';
import BarcodeScanner from '../components/BarcodeScanner';
import { BarcodeProduct, calculateNutritionForServing } from '../services/barcodeService';

interface RegisterMealProps {
  onSave: (meal: Omit<Meal, 'id'>) => Promise<void>;
  onUpdate: (meal: Meal) => Promise<void>;
  history?: Meal[];
}

interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

const RegisterMeal: React.FC<RegisterMealProps> = ({ onSave, onUpdate, history = [] }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'none' | 'camera' | 'gallery' | 'manual'>('none');

  // State for Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // State for Viewing Details Modal
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);

  // State for List (Used for both Manual and AI Edited)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [currentFood, setCurrentFood] = useState({ name: '', quantity: '', unit: 'g' });
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  const [mealData, setMealData] = useState({
    name: '',
    weight: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    type: 'breakfast' as const
  });

  // Barcode Scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const resetForm = () => {
    setMealData({
      name: '',
      weight: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      type: 'breakfast'
    });
    setPreviewImage(null);
    setInputMode('none');
    setFoodItems([]);
    setEditingId(null);
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  };

  // Helper function to compress image if too large
  const compressImage = (file: File, maxSizeKB: number = 1024): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio
          let { width, height } = img;
          const maxDimension = 1280; // Max width or height

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress with quality reduction if needed
          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // If still too large, reduce quality further
          while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve({
            base64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg'
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setIsAnalyzing(true);
    // Switch to manual mode immediately to show the editing form while analyzing or after
    setInputMode('manual');
    setEditingId(null); // Ensure we are creating new unless explicitly editing

    try {
      // Always convert to JPEG using canvas to ensure compatibility
      // This handles HEIC (iPhone), WebP, and other formats that may not be supported
      console.log(`Processing image: ${file.name}, size: ${(file.size / 1024).toFixed(0)}KB, type: ${file.type || 'unknown'}`);

      const { base64, mimeType } = await compressImage(file);
      console.log(`Converted to JPEG, final size: ${(base64.length / 1024 * 0.75).toFixed(0)}KB`);

      try {
        const analysis = await analyzeFoodImage(base64, mimeType);

        if (analysis) {
          setMealData(prev => ({
            ...prev,
            name: analysis.name,
            calories: analysis.calories.toString(),
            protein: analysis.protein.toString(),
            carbs: analysis.carbs.toString(),
            fats: analysis.fats.toString(),
            weight: analysis.weight.toString(),
          }));

          // Populate ingredients list from AI analysis
          if (analysis.ingredients && analysis.ingredients.length > 0) {
            const items: FoodItem[] = analysis.ingredients.map((ing, idx) => ({
              id: `ai-${Date.now()}-${idx}`,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit
            }));
            setFoodItems(items);
          }
        }
      } catch (error) {
        console.error("Erro na análise:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        alert(`Erro na análise: ${errorMsg}\n\nVocê pode preencher manualmente.`);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Erro ao processar imagem: ${errorMsg}`);
      setIsAnalyzing(false);
    }
  };

  const handleManualClick = () => {
    resetForm();
    setInputMode('manual');
  };

  const loadMealIntoForm = (meal: Meal, mode: 'edit' | 'copy') => {
    setMealData({
      name: meal.name + (mode === 'copy' ? ' (Cópia)' : ''),
      weight: meal.weight?.toString() || '',
      calories: meal.calories.toString(),
      protein: meal.macros.protein.toString(),
      carbs: meal.macros.carbs.toString(),
      fats: meal.macros.fats.toString(),
      type: meal.type
    });

    if (meal.image) setPreviewImage(meal.image);
    else setPreviewImage(null);

    if (meal.ingredients) {
      setFoodItems(meal.ingredients.map((ing, idx) => ({
        id: `hist-${Date.now()}-${idx}`,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      })));
    } else {
      setFoodItems([]);
    }

    if (mode === 'edit') {
      setEditingId(meal.id);
      // Keep original date/time for edits unless user changes it
      if (meal.date) setManualDate(meal.date.split('T')[0]);
      setManualTime(meal.time);
    } else {
      setEditingId(null);
      // Reset to now for copies
      setManualDate(new Date().toISOString().split('T')[0]);
      setManualTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }

    setInputMode('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage(null);
    setInputMode('none');
    setFoodItems([]);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const addFoodItem = () => {
    if (!currentFood.name || !currentFood.quantity) return;
    const newItem: FoodItem = {
      id: Date.now().toString(),
      ...currentFood
    };
    setFoodItems([...foodItems, newItem]);
    setCurrentFood({ name: '', quantity: '', unit: 'g' });
  };

  const removeFoodItem = (id: string) => {
    setFoodItems(foodItems.filter(item => item.id !== id));
  };

  const calculateTotalNutrition = async () => {
    if (foodItems.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await calculateNutritionalInfo(foodItems);
      if (result) {
        setMealData(prev => ({
          ...prev,
          calories: result.calories.toString(),
          protein: result.protein.toString(),
          carbs: result.carbs.toString(),
          fats: result.fats.toString(),
        }));
      }
    } catch (error) {
      alert("Erro ao calcular nutrientes. Verifique sua conexão.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit: Starting submission...');

    let currentData = { ...mealData };
    console.log('handleSubmit: Initial data:', {
      name: currentData.name,
      type: currentData.type,
      calories: currentData.calories,
      foodItemsCount: foodItems.length
    });

    // SMART FEATURE: 
    // If user has added ingredients but hasn't entered/calculated nutrition data (0 or empty),
    // automatically trigger the calculation before saving.
    const hasIngredients = foodItems.length > 0;
    const missingCalories = !currentData.calories || Number(currentData.calories) === 0;

    if (hasIngredients && missingCalories) {
      console.log('handleSubmit: Auto-calculating nutrition...');
      setIsAnalyzing(true);
      try {
        const result = await calculateNutritionalInfo(foodItems);
        if (result) {
          currentData = {
            ...currentData,
            calories: result.calories.toString(),
            protein: result.protein.toString(),
            carbs: result.carbs.toString(),
            fats: result.fats.toString(),
          };
          // Update visual state too so user sees it if the save fails or for continuity
          setMealData(currentData);
          console.log('handleSubmit: Auto-calculation successful:', result);
        }
      } catch (error) {
        console.error("handleSubmit: Auto-calculation failed:", error);
        // Show error to user but allow manual save
        alert("Não foi possível calcular automaticamente. Por favor, insira as calorias manualmente.");
        setIsAnalyzing(false);
        return; // STOP - don't save without calories!
      } finally {
        setIsAnalyzing(false);
      }
    }

    // VALIDATION: Ensure we have a name
    const mealName = currentData.name?.trim() ||
      (foodItems.length > 0 ? foodItems[0].name : null) ||
      'Refeição sem nome';

    console.log('handleSubmit: Using meal name:', mealName);

    // VALIDATION: Warn if no calories (manual entry without calculation)
    // Skip confirmation if user explicitly entered 0 or has no ingredients
    const hasNoCalories = !currentData.calories || Number(currentData.calories) === 0;
    if (hasNoCalories && !hasIngredients) {
      // No ingredients and no calories = probably intentional, just warn once
      console.log('handleSubmit: No calories, no ingredients - proceeding anyway');
    }

    const commonData = {
      name: mealName,
      time: manualTime,
      date: manualDate,
      calories: Number(currentData.calories) || 0,
      weight: Number(currentData.weight) || undefined,
      ingredients: foodItems.map(f => ({ name: f.name, quantity: f.quantity, unit: f.unit })),
      macros: {
        protein: Number(currentData.protein) || 0,
        carbs: Number(currentData.carbs) || 0,
        fats: Number(currentData.fats) || 0
      },
      type: currentData.type,
      image: previewImage || undefined
    };

    console.log('handleSubmit: Prepared data for save:', {
      name: commonData.name,
      type: commonData.type,
      calories: commonData.calories,
      date: commonData.date,
      time: commonData.time
    });

    // Set loading state during save
    setIsAnalyzing(true);

    try {
      if (editingId) {
        console.log('handleSubmit: Updating existing meal:', editingId);
        // Update existing - onUpdate is async in App.tsx
        await onUpdate({
          id: editingId,
          ...commonData
        });
      } else {
        console.log('handleSubmit: Creating new meal...');
        // Create new - onSave is async in App.tsx
        await onSave(commonData);
      }
      console.log('handleSubmit: Save successful, resetting form');
      // Only reset form AFTER successful save
      resetForm();
    } catch (error) {
      console.error("handleSubmit: Error saving meal:", error);
      // The toast error is already shown in App.tsx handleAddMeal
      // Don't reset form on error so user can try again
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle product found from barcode scanner
  const handleBarcodeProduct = (product: BarcodeProduct, servingGrams: number) => {
    const nutrition = calculateNutritionForServing(product, servingGrams);

    setMealData({
      name: product.name,
      weight: servingGrams.toString(),
      calories: nutrition.calories.toString(),
      protein: nutrition.protein.toString(),
      carbs: nutrition.carbs.toString(),
      fats: nutrition.fats.toString(),
      type: 'snack' // Default to snack for scanned products
    });

    // Add product as single ingredient
    setFoodItems([{
      id: `barcode-${Date.now()}`,
      name: product.brand ? `${product.name} (${product.brand})` : product.name,
      quantity: servingGrams.toString(),
      unit: 'g'
    }]);

    if (product.image) {
      setPreviewImage(product.image);
    }

    setInputMode('manual');
    setShowBarcodeScanner(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header and Input Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingId ? 'Editar Refeição' : 'Registrar Refeição'}
          </h1>
          {inputMode === 'manual' && (
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X size={16} /> Cancelar
            </button>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {inputMode === 'none' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-nutri-100 bg-nutri-50 text-nutri-700 hover:bg-nutri-100 hover:shadow-md transition group"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Camera size={28} className="text-nutri-600" />
              </div>
              <span className="font-bold">Tirar Foto</span>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md transition group"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ImageIcon size={28} className="text-blue-600" />
              </div>
              <span className="font-bold">Galeria</span>
            </button>

            <button
              onClick={handleManualClick}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md transition group"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <PenTool size={28} className="text-gray-600" />
              </div>
              <span className="font-bold">Manual</span>
            </button>

            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:shadow-md transition group"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ScanLine size={28} className="text-orange-600" />
              </div>
              <span className="font-bold">Código de Barras</span>
            </button>
          </div>
        )}

        {/* Unified Editing Form (Manual or AI Result) */}
        {inputMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">

            {/* Image Preview if exists */}
            {previewImage && (
              <div className="relative h-48 rounded-xl overflow-hidden bg-gray-900 border border-gray-200 mb-6">
                <img src={previewImage} alt="Meal" className="w-full h-full object-cover opacity-80" />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                      <Loader2 className="animate-spin text-nutri-500" />
                      <span className="font-medium text-gray-800">Analisando prato...</span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* General Info */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">Detalhes da Refeição</h4>
                {editingId && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium border border-yellow-200">Editando</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Prato</label>
                  <input
                    type="text"
                    value={mealData.name}
                    onChange={(e) => setMealData({ ...mealData, name: e.target.value })}
                    placeholder={isAnalyzing ? "Identificando..." : "Ex: Salada Caesar"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={mealData.type}
                    onChange={(e) => setMealData({ ...mealData, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white"
                  >
                    <option value="breakfast">Café da Manhã</option>
                    <option value="lunch">Almoço</option>
                    <option value="dinner">Jantar</option>
                    <option value="snack">Lanche</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar size={16} /> Data
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Clock size={16} /> Horário
                  </label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  {/* Overlay to prevent editing while AI is thinking */}
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700">Ingredientes</h4>
                {previewImage && !isAnalyzing && (
                  <span className="text-xs bg-nutri-100 text-nutri-700 px-2 py-1 rounded-md">Detectado por IA - Você pode editar</span>
                )}
              </div>

              {/* Input Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 items-end">
                <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                  <input
                    type="text"
                    value={currentFood.name}
                    onChange={(e) => setCurrentFood({ ...currentFood, name: e.target.value })}
                    placeholder="Adicionar ingrediente..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 outline-none text-sm bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && addFoodItem()}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
                  <input
                    type="number"
                    value={currentFood.quantity}
                    onChange={(e) => setCurrentFood({ ...currentFood, quantity: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 outline-none text-sm bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && addFoodItem()}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Un</label>
                  <select
                    value={currentFood.unit}
                    onChange={(e) => setCurrentFood({ ...currentFood, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 outline-none text-sm bg-white"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="colher">colher</option>
                    <option value="xicara">xícara</option>
                    <option value="unidade">unid.</option>
                    <option value="fatia">fatia</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={addFoodItem}
                    className="w-full py-2.5 bg-nutri-500 text-white rounded-lg hover:bg-nutri-600 transition flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 mb-4">
                {foodItems.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm bg-white">
                    {isAnalyzing ? "Aguardando análise..." : "Nenhum ingrediente listado"}
                  </div>
                ) : (
                  foodItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-nutri-50 text-nutri-600 flex items-center justify-center text-[10px] font-bold">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFoodItem(item.id)} className="text-gray-400 hover:text-red-500 p-2 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Action: Estimate Calories */}
              {foodItems.length > 0 && !isAnalyzing && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={calculateTotalNutrition}
                    className={`text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition ${!mealData.calories || Number(mealData.calories) === 0
                      ? 'bg-nutri-100 text-nutri-700 hover:bg-nutri-200 animate-pulse'
                      : 'text-nutri-600 hover:bg-nutri-50'
                      }`}
                  >
                    <Calculator size={16} /> Recalcular Nutrientes
                  </button>
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-nutri-500" />
                </div>
              )}
              <h4 className="font-semibold text-gray-800 mb-4 border-l-4 border-nutri-500 pl-3">Totais da Refeição</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Calorias (kcal)</label>
                  <input
                    type="number"
                    value={mealData.calories}
                    onChange={(e) => setMealData({ ...mealData, calories: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-bold focus:border-nutri-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Proteínas (g)</label>
                  <input
                    type="number"
                    value={mealData.protein}
                    onChange={(e) => setMealData({ ...mealData, protein: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-blue-50/50 text-blue-900 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Carboidratos (g)</label>
                  <input
                    type="number"
                    value={mealData.carbs}
                    onChange={(e) => setMealData({ ...mealData, carbs: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-yellow-50/50 text-yellow-900 focus:border-yellow-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gorduras (g)</label>
                  <input
                    type="number"
                    value={mealData.fats}
                    onChange={(e) => setMealData({ ...mealData, fats: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-red-50/50 text-red-900 focus:border-red-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isAnalyzing}
                className={`w-full text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isAnalyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-nutri-500 to-nutri-600 hover:shadow-lg hover:shadow-nutri-200'
                  }`}
              >
                <Save size={20} />
                {isAnalyzing ? 'Calculando & Salvando...' : (editingId ? 'Atualizar Refeição' : 'Salvar Refeição')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <History size={24} className="text-nutri-500" />
          Histórico de Refeições
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma refeição registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.slice(0, 5).map((meal, index) => (
              <div key={meal.id + index} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-nutri-50/50 transition border border-gray-100 group">
                <div className="flex items-start gap-4 mb-3 md:mb-0 cursor-pointer flex-1" onClick={() => setViewingMeal(meal)}>
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm overflow-hidden flex-shrink-0">
                    {meal.image ? (
                      <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                    ) : (
                      meal.type === 'breakfast' ? '☕' : meal.type === 'lunch' ? '🥗' : meal.type === 'dinner' ? '🍲' : '🍎'
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{meal.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> {meal.time}</span>
                      <span className="flex items-center gap-1"><Scale size={12} /> {meal.weight ? `${meal.weight}g` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pl-16 md:pl-0">
                  <div className="text-right mr-4">
                    <span className="block font-bold text-nutri-600">{meal.calories} kcal</span>
                    <div className="flex gap-2 text-[10px] text-gray-400">
                      <span className="text-blue-400">P: {meal.macros.protein}g</span>
                      <span className="text-yellow-500">C: {meal.macros.carbs}g</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingMeal(meal)}
                      className="p-2 rounded-lg text-gray-400 hover:text-nutri-600 hover:bg-white shadow-sm border border-transparent hover:border-gray-200 transition"
                      title="Ver Detalhes"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => loadMealIntoForm(meal, 'copy')}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white shadow-sm border border-transparent hover:border-gray-200 transition"
                      title="Duplicar / Copiar"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => loadMealIntoForm(meal, 'edit')}
                      className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-white shadow-sm border border-transparent hover:border-gray-200 transition"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

            {/* Modal Header & Image */}
            <div className="relative h-48 bg-gray-100 flex-shrink-0">
              {viewingMeal.image ? (
                <img src={viewingMeal.image} alt={viewingMeal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-nutri-50 text-nutri-200">
                  <ImageIcon size={64} />
                </div>
              )}
              <button
                onClick={() => setViewingMeal(null)}
                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h2 className="text-2xl font-bold text-white">{viewingMeal.name}</h2>
                <p className="text-white/80 text-sm flex items-center gap-2">
                  <Clock size={14} /> {viewingMeal.date?.split('T')[0]} às {viewingMeal.time}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">

              {/* Macros Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Calorias</div>
                  <div className="font-bold text-gray-900">{viewingMeal.calories}</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Proteínas</div>
                  <div className="font-bold text-blue-900">{viewingMeal.macros.protein}g</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                  <div className="text-xs text-yellow-600 mb-1">Carboid.</div>
                  <div className="font-bold text-yellow-900">{viewingMeal.macros.carbs}g</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                  <div className="text-xs text-red-600 mb-1">Gorduras</div>
                  <div className="font-bold text-red-900">{viewingMeal.macros.fats}g</div>
                </div>
              </div>

              {/* Ingredients List */}
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                Ingredientes <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{(viewingMeal.ingredients || []).length} itens</span>
              </h3>

              <div className="space-y-2 mb-6">
                {(viewingMeal.ingredients && viewingMeal.ingredients.length > 0) ? (
                  viewingMeal.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                      <span className="text-gray-700 font-medium">{ing.name}</span>
                      <span className="text-gray-500">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">Ingredientes não detalhados.</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50 mt-auto">
              <button
                onClick={() => {
                  loadMealIntoForm(viewingMeal, 'edit');
                  setViewingMeal(null);
                }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-white hover:border-yellow-200 hover:text-yellow-600 transition flex items-center justify-center gap-2"
              >
                <Edit2 size={18} /> Editar
              </button>
              <button
                onClick={() => {
                  loadMealIntoForm(viewingMeal, 'copy');
                  setViewingMeal(null);
                }}
                className="flex-1 py-3 rounded-xl bg-nutri-500 text-white font-semibold hover:bg-nutri-600 transition flex items-center justify-center gap-2"
              >
                <Copy size={18} /> Duplicar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductFound={handleBarcodeProduct}
      />

    </div>
  );
};

export default RegisterMeal;