import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Save, Plus, Loader2, Image as ImageIcon, X, PenTool, Scale, Calendar, Clock, Trash2, Calculator, History, Eye, Copy, Edit2, ChevronRight, ScanLine, Sparkles, ChevronDown, Filter } from 'lucide-react';
import { Meal } from '../types';
import { analyzeFoodImage, calculateNutritionalInfo } from '../services/geminiService';
import { getLocalDateString } from '../utils/dateUtils';
import { getMealsPaginated, deleteMeal as dbDeleteMeal } from '../services/mealService';
import { useAuth } from '../contexts/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';
import { BarcodeProduct, calculateNutritionForServing } from '../services/barcodeService';
import { searchIngredients } from '../data/brazilianIngredients';

type HistoryPeriod = 'today' | 'week' | 'month' | 'all';

interface RegisterMealProps {
  onSave: (meal: Omit<Meal, 'id'>) => Promise<void>;
  onUpdate: (meal: Meal) => Promise<void>;
  onDelete?: (mealId: string) => Promise<void>;
}

interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

function getDateRange(period: HistoryPeriod): { dateFrom?: string; dateTo?: string } {
  const today = getLocalDateString();
  if (period === 'today') return { dateFrom: today, dateTo: today };
  if (period === 'week') {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return { dateFrom: getLocalDateString(d), dateTo: today };
  }
  if (period === 'month') {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return { dateFrom: getLocalDateString(d), dateTo: today };
  }
  return {};
}

function formatDateLabel(dateStr: string): string {
  const today = getLocalDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterdayStr) return 'Ontem';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function groupByDate(meals: Meal[]): { date: string; label: string; meals: Meal[] }[] {
  const map = new Map<string, Meal[]>();
  meals.forEach(m => {
    const d = m.date || 'sem-data';
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(m);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, meals]) => ({ date, label: formatDateLabel(date), meals }));
}

const HISTORY_PAGE_SIZE = 20;

const RegisterMeal: React.FC<RegisterMealProps> = ({ onSave, onUpdate, onDelete }) => {
  const { authUser } = useAuth();
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
  const [manualDate, setManualDate] = useState(getLocalDateString());
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

  // Autocomplete state for ingredient suggestions
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  // State for editing individual ingredients
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editingIngredientData, setEditingIngredientData] = useState({ name: '', quantity: '', unit: 'g' });

  // === HISTORY STATE ===
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>('today');
  const [historyMeals, setHistoryMeals] = useState<Meal[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = useCallback(async (period: HistoryPeriod, offset: number, append = false) => {
    if (!authUser) return;
    setHistoryLoading(true);
    try {
      const range = getDateRange(period);
      const result = await getMealsPaginated(authUser.id, {
        ...range,
        limit: HISTORY_PAGE_SIZE,
        offset,
      });
      setHistoryMeals(prev => append ? [...prev, ...result.data] : result.data);
      setHistoryHasMore(result.hasMore);
      setHistoryOffset(offset + result.data.length);
    } catch (err) {
      console.error('Error loading meal history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [authUser]);

  // Load history on mount and when period changes
  useEffect(() => {
    loadHistory(historyPeriod, 0);
  }, [historyPeriod, loadHistory]);

  const handleLoadMore = () => {
    loadHistory(historyPeriod, historyOffset, true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    setDeletingId(mealId);
    try {
      const success = await dbDeleteMeal(mealId);
      if (success) {
        setHistoryMeals(prev => prev.filter(m => m.id !== mealId));
        if (onDelete) await onDelete(mealId);
      }
    } finally {
      setDeletingId(null);
    }
  };

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
    setManualDate(getLocalDateString());
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

      const dataUrl = `data:${mimeType};base64,${base64}`;
      setPreviewImage(dataUrl);

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
      setManualDate(getLocalDateString());
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
    // Reset autocomplete state
    setShowSuggestions(false);
    setIngredientSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  const removeFoodItem = (id: string) => {
    setFoodItems(foodItems.filter(item => item.id !== id));
  };

  // Functions for editing individual ingredients
  const startEditingIngredient = (item: FoodItem) => {
    setEditingIngredientId(item.id);
    setEditingIngredientData({ name: item.name, quantity: item.quantity, unit: item.unit });
  };

  const saveIngredientEdit = () => {
    if (!editingIngredientId || !editingIngredientData.name || !editingIngredientData.quantity) return;

    setFoodItems(foodItems.map(item =>
      item.id === editingIngredientId
        ? { ...item, ...editingIngredientData }
        : item
    ));
    setEditingIngredientId(null);
    setEditingIngredientData({ name: '', quantity: '', unit: 'g' });
  };

  const cancelIngredientEdit = () => {
    setEditingIngredientId(null);
    setEditingIngredientData({ name: '', quantity: '', unit: 'g' });
  };

  // Autocomplete handlers
  const handleIngredientInputChange = (value: string) => {
    setCurrentFood({ ...currentFood, name: value });

    if (value.length >= 2) {
      const suggestions = searchIngredients(value, 8);
      setIngredientSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setIngredientSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setCurrentFood({ ...currentFood, name: suggestion });
    setShowSuggestions(false);
    setIngredientSuggestions([]);
    setSelectedSuggestionIndex(-1);
    // Focus on quantity field after selection
    setTimeout(() => {
      const quantityInput = document.querySelector('input[placeholder="100"]') as HTMLInputElement;
      if (quantityInput) quantityInput.focus();
    }, 50);
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || ingredientSuggestions.length === 0) {
      if (e.key === 'Enter') addFoodItem();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < ingredientSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(ingredientSuggestions[selectedSuggestionIndex]);
        } else if (currentFood.name && currentFood.quantity) {
          addFoodItem();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
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
      } else {
        // result is null - API failed (quota exceeded, etc)
        alert("Não foi possível calcular nutrientes automaticamente. O limite da API Gemini pode ter sido atingido. Por favor, insira os valores manualmente.");
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
        } else {
          // result is null - API failed (quota exceeded, network error, etc)
          console.warn('handleSubmit: Auto-calculation returned null');
          alert("Não foi possível calcular os nutrientes automaticamente (limite da API ou conexão). Por favor, insira as calorias manualmente.");
          setIsAnalyzing(false);
          return; // STOP - don't save without calories!
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
      // Reload history to show the new/updated item
      setTimeout(() => loadHistory(historyPeriod, 0), 500);
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 md:pb-0 overflow-x-hidden w-full box-border">

      {/* Header and Input Selection */}
      <div className="bg-white md:rounded-2xl md:shadow-sm md:border border-gray-100 p-4 md:p-8 border-b md:border-b-0 space-y-6 overflow-hidden">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate pr-2">
            {editingId ? 'Editar Refeição' : 'Registrar Refeição'}
          </h1>
          {inputMode === 'manual' && (
            <button
              onClick={resetForm}
              className="min-h-[44px] px-3 text-sm text-gray-500 hover:text-red-500 active:text-red-600 flex items-center gap-1.5 rounded-lg hover:bg-gray-100 transition whitespace-nowrap"
            >
              <X size={18} /> Cancelar
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
          <div className="grid grid-cols-2 gap-3 w-full animate-fade-in">
            {/* Camera Button: Full width on mobile (col-span-2), prominent */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="col-span-2 w-full flex flex-col items-center justify-center gap-3 p-4 md:p-5 min-h-[100px] md:min-h-[120px] rounded-2xl bg-amber-gradient text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all duration-200 group relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform z-10 flex-shrink-0">
                <Camera size={24} className="text-white" />
              </div>
              <div className="text-center z-10 flex flex-col items-center min-w-0 max-w-full">
                <span className="font-bold text-lg block leading-tight">Tirar Foto</span>
                <span className="text-white/90 text-xs mt-0.5">IA identifica o prato</span>
              </div>
            </button>

            {/* Gallery Button */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="col-span-1 w-full flex flex-col items-center justify-center gap-2 p-3 md:p-4 min-h-[90px] md:min-h-[120px] rounded-2xl border-2 border-teal-100 bg-teal-50 text-teal-700 active:scale-[0.98] transition-all duration-200 group overflow-hidden"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                <ImageIcon size={20} className="text-teal-600" />
              </div>
              <span className="font-semibold text-xs md:text-sm text-center">Galeria</span>
            </button>

            {/* Manual Button */}
            <button
              onClick={handleManualClick}
              className="col-span-1 w-full flex flex-col items-center justify-center gap-2 p-3 md:p-4 min-h-[90px] md:min-h-[120px] rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-700 active:scale-[0.98] transition-all duration-200 group overflow-hidden"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                <PenTool size={20} className="text-slate-600" />
              </div>
              <span className="font-semibold text-xs md:text-sm text-center">Manual</span>
            </button>

            {/* Barcode Button: Full width on mobile */}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="col-span-2 w-full flex flex-row items-center justify-center gap-3 p-3 md:p-4 min-h-[52px] md:min-h-[64px] rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 active:scale-[0.98] transition-all duration-200 group overflow-hidden"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                <ScanLine size={18} className="text-amber-600" />
              </div>
              <span className="font-semibold text-sm">
                Escanear Código de Barras
              </span>
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

              <div className="space-y-4">
                {/* Nome e Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Prato</label>
                    <input
                      type="text"
                      value={mealData.name}
                      onChange={(e) => setMealData({ ...mealData, name: e.target.value })}
                      placeholder={isAnalyzing ? "Identificando..." : "Ex: Salada Caesar"}
                      className="w-full px-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition bg-white min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                    <select
                      value={mealData.type}
                      onChange={(e) => setMealData({ ...mealData, type: e.target.value as any })}
                      className="w-full px-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition bg-white min-h-[48px]"
                    >
                      <option value="breakfast">Café da Manhã</option>
                      <option value="lunch">Almoço</option>
                      <option value="dinner">Jantar</option>
                      <option value="snack">Lanche</option>
                    </select>
                  </div>
                </div>

                {/* Data e Hora - Side by Side on Mobile too */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <Calendar size={16} /> Data
                    </label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 md:px-4 py-3 text-sm md:text-base rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition bg-white min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <Clock size={16} /> Horário
                    </label>
                    <input
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full px-3 md:px-4 py-3 text-sm md:text-base rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition bg-white min-h-[48px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-100 relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  {/* Overlay to prevent editing while AI is thinking */}
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block"></span>
                  Ingredientes
                </h4>
                {previewImage && !isAnalyzing && (
                  <span className="text-[10px] md:text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-md font-medium border border-teal-200">✨ IA detectou · edite à vontade</span>
                )}
              </div>

              {/* Input Row - Mobile Optimized */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 mb-4 md:items-end">
                {/* Nome: Full width */}
                <div className="col-span-12 md:col-span-5 relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                  <input
                    ref={ingredientInputRef}
                    type="text"
                    value={currentFood.name}
                    onChange={(e) => handleIngredientInputChange(e.target.value)}
                    placeholder="Digite o ingrediente..."
                    className="w-full px-3 py-2.5 text-base rounded-lg border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none bg-white min-h-[44px]"
                    onKeyDown={handleIngredientKeyDown}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    autoComplete="off"
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && ingredientSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-teal-200 rounded-xl shadow-lg shadow-teal-100/50 max-h-60 overflow-y-auto">
                      {ingredientSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          className={`w-full px-3 py-2.5 text-left text-sm transition flex items-center gap-2 min-h-[44px] ${index === selectedSuggestionIndex
                            ? 'bg-teal-50 text-teal-700'
                            : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          onMouseDown={() => selectSuggestion(suggestion)}
                        >
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-100 to-emerald-200 flex items-center justify-center text-xs font-medium text-teal-700 flex-shrink-0">
                            {suggestion.charAt(0).toUpperCase()}
                          </span>
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qtd & Unit Row on Mobile */}
                <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
                    <input
                      type="number"
                      value={currentFood.quantity}
                      onChange={(e) => setCurrentFood({ ...currentFood, quantity: e.target.value })}
                      placeholder="100"
                      className="w-full px-3 py-2.5 text-base rounded-lg border-2 border-gray-200 focus:border-teal-400 outline-none bg-white min-h-[44px]"
                      onKeyDown={(e) => e.key === 'Enter' && addFoodItem()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Un</label>
                    <select
                      value={currentFood.unit}
                      onChange={(e) => setCurrentFood({ ...currentFood, unit: e.target.value })}
                      className="w-full px-2 py-2.5 text-base rounded-lg border-2 border-gray-200 focus:border-teal-400 outline-none bg-white min-h-[44px]"
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="colher">colher</option>
                      <option value="xicara">xícara</option>
                      <option value="unidade">unid.</option>
                      <option value="fatia">fatia</option>
                    </select>
                  </div>
                </div>

                {/* Add Button - Full Width on Mobile */}
                <div className="col-span-12 md:col-span-2">
                  <button
                    type="button"
                    onClick={addFoodItem}
                    className="w-full min-h-[44px] bg-teal-500 text-white rounded-lg hover:bg-teal-600 active:scale-[0.95] transition flex items-center justify-center shadow-sm font-medium gap-2 md:gap-0"
                  >
                    <Plus size={20} />
                    <span className="md:hidden">Adicionar</span>
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
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in overflow-hidden">
                      {editingIngredientId === item.id ? (
                        // Editing Mode
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-12 md:col-span-6">
                              <input
                                type="text"
                                value={editingIngredientData.name}
                                onChange={(e) => setEditingIngredientData({ ...editingIngredientData, name: e.target.value })}
                                placeholder="Nome do ingrediente"
                                className="w-full px-3 py-2.5 text-base rounded-lg border-2 border-teal-300 focus:border-teal-500 outline-none bg-white min-h-[44px]"
                                autoFocus
                              />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                              <input
                                type="number"
                                value={editingIngredientData.quantity}
                                onChange={(e) => setEditingIngredientData({ ...editingIngredientData, quantity: e.target.value })}
                                placeholder="Qtd"
                                className="w-full px-3 py-2.5 text-base rounded-lg border-2 border-gray-200 focus:border-teal-400 outline-none bg-white min-h-[44px]"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                              <select
                                value={editingIngredientData.unit}
                                onChange={(e) => setEditingIngredientData({ ...editingIngredientData, unit: e.target.value })}
                                className="w-full px-2 py-2.5 text-base rounded-lg border-2 border-gray-200 focus:border-teal-400 outline-none bg-white min-h-[44px]"
                              >
                                <option value="g">g</option>
                                <option value="ml">ml</option>
                                <option value="colher">colher</option>
                                <option value="xicara">xícara</option>
                                <option value="unidade">unid.</option>
                                <option value="fatia">fatia</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveIngredientEdit}
                              className="flex-1 py-2.5 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 active:scale-[0.98] transition flex items-center justify-center gap-1.5 min-h-[44px]"
                            >
                              <Save size={16} /> Salvar
                            </button>
                            <button
                              type="button"
                              onClick={cancelIngredientEdit}
                              className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition flex items-center justify-center gap-1.5 min-h-[44px]"
                            >
                              <X size={16} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditingIngredient(item)}
                              className="text-gray-400 hover:text-teal-600 hover:bg-teal-50 p-2.5 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Editar ingrediente"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFoodItem(item.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Remover ingrediente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action: Calculate with AI */}
              {foodItems.length > 0 && !isAnalyzing && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={calculateTotalNutrition}
                    className={`w-full font-medium flex items-center justify-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 ${!mealData.calories || Number(mealData.calories) === 0
                      ? 'bg-gradient-to-r from-nutri-500 to-emerald-500 text-white shadow-lg shadow-nutri-500/30 hover:shadow-nutri-500/50 hover:scale-[1.02] animate-pulse'
                      : 'bg-nutri-50 text-nutri-700 hover:bg-nutri-100 border border-nutri-200'
                      }`}
                  >
                    <Sparkles size={18} className={!mealData.calories || Number(mealData.calories) === 0 ? 'animate-spin' : ''} />
                    <span>{!mealData.calories || Number(mealData.calories) === 0 ? 'Calcular Nutrientes com IA' : 'Recalcular com IA'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-teal-500" />
                </div>
              )}
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Scale size={18} className="text-teal-500" />
                Totais da Refeição
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                  <label className="block text-xs font-medium text-orange-600 mb-1.5">🔥 Calorias</label>
                  <input
                    type="number"
                    value={mealData.calories}
                    onChange={(e) => setMealData({ ...mealData, calories: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border-2 border-orange-200 bg-white text-gray-900 font-bold focus:border-orange-400 outline-none min-h-[44px]"
                  />
                  <span className="text-[10px] text-orange-400 mt-1 block">kcal</span>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-100">
                  <label className="block text-xs font-medium text-blue-600 mb-1.5">💪 Proteínas</label>
                  <input
                    type="number"
                    value={mealData.protein}
                    onChange={(e) => setMealData({ ...mealData, protein: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border-2 border-blue-200 bg-white text-gray-900 font-bold focus:border-blue-400 outline-none min-h-[44px]"
                  />
                  <span className="text-[10px] text-blue-400 mt-1 block">gramas</span>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-100">
                  <label className="block text-xs font-medium text-amber-600 mb-1.5">⚡ Carboidratos</label>
                  <input
                    type="number"
                    value={mealData.carbs}
                    onChange={(e) => setMealData({ ...mealData, carbs: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border-2 border-amber-200 bg-white text-gray-900 font-bold focus:border-amber-400 outline-none min-h-[44px]"
                  />
                  <span className="text-[10px] text-amber-400 mt-1 block">gramas</span>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 border border-rose-100">
                  <label className="block text-xs font-medium text-rose-600 mb-1.5">🥑 Gorduras</label>
                  <input
                    type="number"
                    value={mealData.fats}
                    onChange={(e) => setMealData({ ...mealData, fats: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded-lg border-2 border-rose-200 bg-white text-gray-900 font-bold focus:border-rose-400 outline-none min-h-[44px]"
                  />
                  <span className="text-[10px] text-rose-400 mt-1 block">gramas</span>
                </div>
              </div>
            </div>

            {/* Save Button - Sticky on mobile */}
            <div className="sticky bottom-0 z-30 left-0 right-0 bg-white/95 backdrop-blur-sm pt-4 pb-6 -mx-4 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:relative md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none md:shadow-none md:pb-0 border-t border-gray-100 md:border-0 mt-6 md:mt-4">
              <button
                type="submit"
                disabled={isAnalyzing}
                className={`w-full text-white font-bold min-h-[56px] py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg ${isAnalyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amber-gradient hover:opacity-95 hover:shadow-xl hover:shadow-orange-200/50'
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
      <div className="bg-white md:rounded-2xl shadow-sm md:border border-gray-100 p-4 md:p-8 border-t md:border-t-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <History size={22} className="text-teal-500" />
            Histórico de Refeições
          </h2>
          {/* Period Filter Tabs - Scrollable on mobile */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {([['today', 'Hoje'], ['week', 'Semana'], ['month', 'Mês'], ['all', 'Todos']] as [HistoryPeriod, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setHistoryPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${historyPeriod === key
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {historyLoading && historyMeals.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            <span className="ml-2 text-gray-500 text-sm">Carregando histórico...</span>
          </div>
        ) : historyMeals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={28} className="text-gray-300" />
            </div>
            <p className="font-medium">Nenhuma refeição neste período</p>
            <p className="text-sm mt-1">
              {historyPeriod === 'today' ? 'Comece registrando sua primeira refeição de hoje' : 'Tente um período diferente'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupByDate(historyMeals).map((group) => (
              <div key={group.date}>
                {/* Date Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">{group.label}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">
                    {group.meals.reduce((s, m) => s + m.calories, 0)} kcal total
                  </span>
                </div>
                {/* Meals in this date group */}
                <div className="space-y-2.5">
                  {group.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="relative flex flex-col p-3 md:p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-200 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                      onClick={() => setViewingMeal(meal)}
                    >
                      <div className="flex items-center gap-3 min-h-[40px] md:min-h-[48px]">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-base md:text-xl shadow-sm overflow-hidden flex-shrink-0 border border-gray-100">
                          {meal.image ? (
                            <img
                              src={meal.image}
                              alt={meal.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerText = meal.type === 'breakfast' ? '☕' : meal.type === 'lunch' ? '🥗' : meal.type === 'dinner' ? '🍲' : '🍎';
                                }
                              }}
                            />
                          ) : (
                            meal.type === 'breakfast' ? '☕' : meal.type === 'lunch' ? '🥗' : meal.type === 'dinner' ? '🍲' : '🍎'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate text-sm">{meal.name}</h3>
                          <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1"><Clock size={10} className="md:w-[11px] md:h-[11px]" /> {meal.time}</span>
                            {meal.weight && <span className="flex items-center gap-1"><Scale size={10} className="md:w-[11px] md:h-[11px]" /> {meal.weight}g</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="block font-bold text-sm md:text-base text-gray-900">{meal.calories}</span>
                          <span className="text-[9px] md:text-[10px] text-gray-400">kcal</span>
                        </div>
                      </div>
                      {/* Macros + Actions */}
                      <div className="flex items-center gap-2 mt-2 pt-2 md:mt-2.5 md:pt-2.5 border-t border-gray-100/50 overflow-hidden">
                        <div className="flex gap-1.5 flex-1 min-w-0 overflow-hidden">
                          <span className="text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">P:{meal.macros.protein}g</span>
                          <span className="text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 whitespace-nowrap">C:{meal.macros.carbs}g</span>
                          <span className="text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 whitespace-nowrap">G:{meal.macros.fats}g</span>
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); loadMealIntoForm(meal, 'copy'); }} className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-white transition" title="Duplicar"><Copy size={14} className="md:w-4 md:h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); loadMealIntoForm(meal, 'edit'); }} className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-white transition" title="Editar"><Edit2 size={14} className="md:w-4 md:h-4" /></button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm('Excluir esta refeição?')) handleDeleteMeal(meal.id); }}
                            disabled={deletingId === meal.id}
                            className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            title="Excluir"
                          >
                            {deletingId === meal.id ? <Loader2 size={14} className="animate-spin md:w-4 md:h-4" /> : <Trash2 size={14} className="md:w-4 md:h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {historyHasMore && (
              <button
                onClick={handleLoadMore}
                disabled={historyLoading}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30 font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                {historyLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Carregando...</>
                ) : (
                  <><ChevronDown size={16} /> Carregar mais refeições</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewingMeal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setViewingMeal(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] md:max-h-[90vh] md:m-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>

            {/* Drag Handle (mobile) */}
            <div className="md:hidden flex justify-center py-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Modal Header & Image */}
            <div className="relative h-40 md:h-48 bg-gray-100 flex-shrink-0">
              {viewingMeal.image ? (
                <img
                  src={viewingMeal.image}
                  alt={viewingMeal.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-200';
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-200">
                  <ImageIcon size={56} />
                </div>
              )}
              <button
                onClick={() => setViewingMeal(null)}
                className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full backdrop-blur-md transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{viewingMeal.name}</h2>
                <p className="text-white/80 text-sm flex items-center gap-2 mt-1">
                  <Clock size={14} /> {viewingMeal.date?.split('T')[0]} às {viewingMeal.time}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 overflow-y-auto">

              {/* Macros Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 text-center border border-orange-100">
                  <div className="text-[10px] text-orange-500 font-medium mb-0.5">🔥 Calorias</div>
                  <div className="font-bold text-lg text-gray-900">{viewingMeal.calories}</div>
                  <div className="text-[10px] text-orange-400">kcal</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 text-center border border-blue-100">
                  <div className="text-[10px] text-blue-500 font-medium mb-0.5">💪 Proteínas</div>
                  <div className="font-bold text-lg text-gray-900">{viewingMeal.macros.protein}g</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-amber-100">
                  <div className="text-[10px] text-amber-500 font-medium mb-0.5">⚡ Carboid.</div>
                  <div className="font-bold text-lg text-gray-900">{viewingMeal.macros.carbs}g</div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 text-center border border-rose-100">
                  <div className="text-[10px] text-rose-500 font-medium mb-0.5">🥑 Gorduras</div>
                  <div className="font-bold text-lg text-gray-900">{viewingMeal.macros.fats}g</div>
                </div>
              </div>

              {/* Ingredients List */}
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                Ingredientes
                <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  {(viewingMeal.ingredients || []).length} itens
                </span>
              </h3>

              <div className="space-y-1.5 mb-4">
                {(viewingMeal.ingredients && viewingMeal.ingredients.length > 0) ? (
                  viewingMeal.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {ing.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{ing.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm italic">Ingredientes não detalhados.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/80 mt-auto flex-shrink-0">
              <button
                onClick={() => {
                  loadMealIntoForm(viewingMeal, 'edit');
                  setViewingMeal(null);
                }}
                className="flex-1 py-3 min-h-[48px] rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/50 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <Edit2 size={18} /> Editar
              </button>
              <button
                onClick={() => {
                  loadMealIntoForm(viewingMeal, 'copy');
                  setViewingMeal(null);
                }}
                className="flex-1 py-3 min-h-[48px] rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
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