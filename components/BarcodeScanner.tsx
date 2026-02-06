import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, CameraOff, Loader2, Barcode, AlertCircle, Package } from 'lucide-react';
import {
    BarcodeProduct,
    getProductByBarcode,
    requestCameraPermission,
    stopCameraStream,
    isBarcodeDetectorSupported,
    createBarcodeDetector,
    detectBarcodeFromVideo,
    calculateNutritionForServing,
} from '../services/barcodeService';

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onProductFound: (product: BarcodeProduct, servingGrams: number) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onProductFound }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectorRef = useRef<BarcodeDetector | null>(null);
    const scanIntervalRef = useRef<number | null>(null);

    const [status, setStatus] = useState<'initializing' | 'scanning' | 'found' | 'error' | 'manual'>('initializing');
    const [error, setError] = useState<string>('');
    const [manualBarcode, setManualBarcode] = useState('');
    const [product, setProduct] = useState<BarcodeProduct | null>(null);
    const [servingGrams, setServingGrams] = useState(100);
    const [isLoading, setIsLoading] = useState(false);

    const startScanning = useCallback(async () => {
        // Check if BarcodeDetector is supported
        const supported = await isBarcodeDetectorSupported();

        if (!supported) {
            setStatus('manual');
            setError('Seu navegador não suporta leitura de código de barras pela câmera. Digite o código manualmente.');
            return;
        }

        // Request camera access
        const stream = await requestCameraPermission();
        if (!stream) {
            setStatus('manual');
            setError('Não foi possível acessar a câmera. Digite o código manualmente.');
            return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
        }

        // Create detector
        detectorRef.current = createBarcodeDetector();
        setStatus('scanning');

        // Start scanning loop
        scanIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || !detectorRef.current) return;

            const barcode = await detectBarcodeFromVideo(videoRef.current, detectorRef.current);
            if (barcode) {
                handleBarcodeFound(barcode);
            }
        }, 250); // Scan every 250ms
    }, []);

    const handleBarcodeFound = async (barcode: string) => {
        // Stop scanning
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        setIsLoading(true);
        setStatus('found');

        const productData = await getProductByBarcode(barcode);

        if (productData) {
            setProduct(productData);
            setServingGrams(productData.servingSizeG || 100);
        } else {
            setError(`Produto não encontrado: ${barcode}`);
            setStatus('manual');
        }

        setIsLoading(false);
    };

    const handleManualSearch = async () => {
        const cleanBarcode = manualBarcode.trim().replace(/\D/g, '');
        if (!cleanBarcode) return;

        await handleBarcodeFound(cleanBarcode);
    };

    const handleConfirm = () => {
        if (product) {
            onProductFound(product, servingGrams);
        }
    };

    const resetScanner = () => {
        setProduct(null);
        setError('');
        setManualBarcode('');
        setStatus('initializing');
        startScanning();
    };

    // Initialize on open
    useEffect(() => {
        if (isOpen) {
            startScanning();
        }

        return () => {
            // Cleanup
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
            if (streamRef.current) {
                stopCameraStream(streamRef.current);
            }
        };
    }, [isOpen, startScanning]);

    if (!isOpen) return null;

    const calculatedNutrition = product
        ? calculateNutritionForServing(product, servingGrams)
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-nutri-500 to-nutri-600 p-5 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Barcode size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Scanner de Código de Barras</h2>
                            <p className="text-white/80 text-sm">Aponte para o código do produto</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Camera View */}
                    {status === 'scanning' && (
                        <div className="relative rounded-2xl overflow-hidden bg-gray-900 mb-4">
                            <video
                                ref={videoRef}
                                className="w-full aspect-[4/3] object-cover"
                                playsInline
                                muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-3/4 h-24 border-2 border-white/50 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-nutri-400 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-nutri-400 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-nutri-400 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-nutri-400 rounded-br-lg" />
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                                    Posicione o código de barras na área destacada
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Initializing */}
                    {status === 'initializing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={48} className="text-nutri-500 animate-spin mb-4" />
                            <p className="text-gray-600">Iniciando câmera...</p>
                        </div>
                    )}

                    {/* Loading product */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={48} className="text-nutri-500 animate-spin mb-4" />
                            <p className="text-gray-600">Buscando produto...</p>
                        </div>
                    )}

                    {/* Manual Entry / Error */}
                    {(status === 'manual' || status === 'error') && !isLoading && (
                        <div className="space-y-4">
                            {error && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-orange-800 text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Digite o código de barras manualmente
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualBarcode}
                                        onChange={(e) => setManualBarcode(e.target.value)}
                                        placeholder="Ex: 7891234567890"
                                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-nutri-500 focus:ring-4 focus:ring-nutri-100"
                                        onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                    />
                                    <button
                                        onClick={handleManualSearch}
                                        disabled={!manualBarcode.trim()}
                                        className="px-6 py-3 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-colors disabled:opacity-50"
                                    >
                                        Buscar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Found */}
                    {product && !isLoading && (
                        <div className="space-y-6">
                            {/* Product Info */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                                        <Package size={32} className="text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                                    {product.brand && (
                                        <p className="text-sm text-gray-500">{product.brand}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">Código: {product.barcode}</p>
                                </div>
                            </div>

                            {/* Serving Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantidade (gramas)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="10"
                                        max="500"
                                        step="10"
                                        value={servingGrams}
                                        onChange={(e) => setServingGrams(parseInt(e.target.value))}
                                        className="flex-1 accent-nutri-500"
                                    />
                                    <div className="w-24 text-center">
                                        <input
                                            type="number"
                                            value={servingGrams}
                                            onChange={(e) => setServingGrams(parseInt(e.target.value) || 100)}
                                            className="w-full px-3 py-2 text-center border-2 border-gray-200 rounded-xl focus:border-nutri-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Nutrition Info */}
                            {calculatedNutrition && (
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="bg-orange-50 p-3 rounded-xl text-center">
                                        <p className="text-xl font-bold text-orange-600">{calculatedNutrition.calories}</p>
                                        <p className="text-xs text-orange-500">kcal</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-xl text-center">
                                        <p className="text-xl font-bold text-red-600">{calculatedNutrition.protein}g</p>
                                        <p className="text-xs text-red-500">Proteína</p>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-xl text-center">
                                        <p className="text-xl font-bold text-yellow-600">{calculatedNutrition.carbs}g</p>
                                        <p className="text-xs text-yellow-500">Carbs</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                                        <p className="text-xl font-bold text-blue-600">{calculatedNutrition.fats}g</p>
                                        <p className="text-xs text-blue-500">Gorduras</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={resetScanner}
                                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Camera size={18} />
                                    Escanear outro
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-colors"
                                >
                                    Adicionar Refeição
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Switch to manual entry */}
                    {status === 'scanning' && (
                        <button
                            onClick={() => setStatus('manual')}
                            className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <CameraOff size={18} />
                            Digitar código manualmente
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
