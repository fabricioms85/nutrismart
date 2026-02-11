/**
 * Barcode Service
 * Scans barcodes using device camera and fetches product data from Open Food Facts API
 */

// Product data from barcode lookup
export interface BarcodeProduct {
    barcode: string;
    name: string;
    brand?: string;
    image?: string;
    servingSize?: string;
    servingSizeG?: number;
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber?: number;
        sugar?: number;
        sodium?: number;
    };
}

// Open Food Facts API base URL
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

// Fetch product by barcode from Open Food Facts
export async function getProductByBarcode(barcode: string): Promise<BarcodeProduct | null> {
    try {
        const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}?fields=code,product_name,brands,image_url,serving_size,nutriments`);

        if (!response.ok) {
            console.error('Open Food Facts API error:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.status !== 1 || !data.product) {
            console.log('Product not found:', barcode);
            return null;
        }

        const product = data.product;
        const nutriments = product.nutriments || {};

        // Parse serving size (e.g., "100g" -> 100)
        let servingSizeG = 100; // Default to 100g
        if (product.serving_size) {
            const match = product.serving_size.match(/(\d+)\s*g/i);
            if (match) {
                servingSizeG = parseInt(match[1]);
            }
        }

        return {
            barcode: barcode,
            name: product.product_name || 'Produto Desconhecido',
            brand: product.brands,
            image: product.image_url,
            servingSize: product.serving_size,
            servingSizeG,
            nutrition: {
                // Values per 100g from API
                calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
                protein: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
                carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
                fats: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
                fiber: nutriments.fiber_100g || nutriments.fiber,
                sugar: nutriments.sugars_100g || nutriments.sugars,
                sodium: nutriments.sodium_100g || nutriments.sodium,
            },
        };
    } catch (error) {
        console.error('Error fetching barcode product:', error);
        return null;
    }
}

// Check if camera is available
export async function isCameraAvailable(): Promise<boolean> {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
    } catch {
        return false;
    }
}

// Request camera permission (mobile-friendly: back camera on phones, works on HTTPS/localhost)
export async function requestCameraPermission(): Promise<MediaStream | null> {
    if (!navigator.mediaDevices?.getUserMedia) {
        console.error('getUserMedia not supported (use HTTPS or localhost)');
        return null;
    }
    const constraints: MediaStreamConstraints[] = [
        // Preferência para mobile: câmera traseira, resolução adequada
        {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
            },
            audio: false,
        },
        // Fallback: só câmera traseira
        { video: { facingMode: 'environment' }, audio: false },
        // Fallback: qualquer câmera (desktop ou permissão restrita)
        { video: true, audio: false },
    ];
    for (const c of constraints) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(c);
            return stream;
        } catch (err) {
            console.warn('getUserMedia attempt failed:', c, err);
        }
    }
    console.error('Camera permission denied or no working constraint');
    return null;
}

// Stop camera stream
export function stopCameraStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
}

// Simple barcode detection using BarcodeDetector API (when available)
export async function isBarcodeDetectorSupported(): Promise<boolean> {
    return 'BarcodeDetector' in window;
}

// Create barcode detector
export function createBarcodeDetector(): BarcodeDetector | null {
    if (!('BarcodeDetector' in window)) {
        return null;
    }

    // @ts-expect-error - BarcodeDetector is not in all TypeScript libs
    return new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
    });
}

// Detect barcode from video frame
export async function detectBarcodeFromVideo(
    video: HTMLVideoElement,
    detector: BarcodeDetector
): Promise<string | null> {
    try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
            return barcodes[0].rawValue;
        }
    } catch (error) {
        console.error('Barcode detection error:', error);
    }
    return null;
}

// Calculate nutrition values based on serving size
export function calculateNutritionForServing(
    product: BarcodeProduct,
    servingGrams: number
): BarcodeProduct['nutrition'] {
    const multiplier = servingGrams / 100; // API values are per 100g

    return {
        calories: Math.round(product.nutrition.calories * multiplier),
        protein: Math.round(product.nutrition.protein * multiplier * 10) / 10,
        carbs: Math.round(product.nutrition.carbs * multiplier * 10) / 10,
        fats: Math.round(product.nutrition.fats * multiplier * 10) / 10,
        fiber: product.nutrition.fiber ? Math.round(product.nutrition.fiber * multiplier * 10) / 10 : undefined,
        sugar: product.nutrition.sugar ? Math.round(product.nutrition.sugar * multiplier * 10) / 10 : undefined,
        sodium: product.nutrition.sodium ? Math.round(product.nutrition.sodium * multiplier * 10) / 10 : undefined,
    };
}

// Type declaration for BarcodeDetector API
declare global {
    interface BarcodeDetector {
        detect(source: ImageBitmapSource): Promise<{ rawValue: string; format: string }[]>;
    }

    interface Window {
        BarcodeDetector: new (options?: { formats: string[] }) => BarcodeDetector;
    }
}
