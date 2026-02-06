/**
 * Share Service
 * Generates shareable images from app data using html2canvas
 * and handles Web Share API or download fallback
 */

// Type for weekly summary data
export interface WeeklySummaryData {
    userName: string;
    weekRange: string;
    caloriesAvg: number;
    caloriesGoal: number;
    waterAvg: number;
    waterGoal: number;
    exerciseMinutes: number;
    weightChange: number;
    streak: number;
    mealsLogged: number;
}

// Create a summary card element for sharing
function createSummaryElement(data: WeeklySummaryData): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
    width: 400px;
    padding: 32px;
    background: linear-gradient(135deg, #00b37e 0%, #00875f 100%);
    border-radius: 24px;
    font-family: 'Inter', system-ui, sans-serif;
    color: white;
  `;

    const caloriePercent = Math.round((data.caloriesAvg / data.caloriesGoal) * 100);
    const waterPercent = Math.round((data.waterAvg / data.waterGoal) * 100);

    container.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Meu Resumo Semanal</div>
      <div style="font-size: 24px; font-weight: 700; margin-top: 8px;">${data.userName}</div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${data.weekRange}</div>
    </div>
    
    <div style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: 700;">${data.caloriesAvg.toLocaleString()}</div>
          <div style="font-size: 11px; opacity: 0.8;">kcal/dia</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: 700;">${(data.waterAvg / 1000).toFixed(1)}L</div>
          <div style="font-size: 11px; opacity: 0.8;">água/dia</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: 700;">${data.exerciseMinutes}</div>
          <div style="font-size: 11px; opacity: 0.8;">min exercício</div>
        </div>
      </div>
      
      <div style="display: flex; gap: 8px;">
        <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 18px; font-weight: 600;">🔥 ${data.streak}</div>
          <div style="font-size: 10px; opacity: 0.9;">dias seguidos</div>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 18px; font-weight: 600;">${data.weightChange > 0 ? '+' : ''}${data.weightChange.toFixed(1)}kg</div>
          <div style="font-size: 10px; opacity: 0.9;">esta semana</div>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 18px; font-weight: 600;">📝 ${data.mealsLogged}</div>
          <div style="font-size: 10px; opacity: 0.9;">refeições</div>
        </div>
      </div>
    </div>
    
    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Calorias</div>
        <div style="background: rgba(255,255,255,0.3); border-radius: 999px; height: 8px; overflow: hidden;">
          <div style="background: white; height: 100%; width: ${Math.min(caloriePercent, 100)}%; border-radius: 999px;"></div>
        </div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 4px; text-align: right;">${caloriePercent}% da meta</div>
      </div>
      <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Hidratação</div>
        <div style="background: rgba(255,255,255,0.3); border-radius: 999px; height: 8px; overflow: hidden;">
          <div style="background: white; height: 100%; width: ${Math.min(waterPercent, 100)}%; border-radius: 999px;"></div>
        </div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 4px; text-align: right;">${waterPercent}% da meta</div>
      </div>
    </div>
    
    <div style="text-align: center; font-size: 12px; opacity: 0.7;">
      Monitorando com <strong>NutriSmart</strong> 💚
    </div>
  `;

    return container;
}

// Convert HTML element to canvas using canvas API (no external dependencies)
async function elementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    // Append temporarily to DOM for rendering
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    document.body.appendChild(element);

    // Force a reflow
    element.offsetHeight;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Set dimensions
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const scale = 2; // For retina

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Use foreignObject in SVG to render HTML
    const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${element.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            document.body.removeChild(element);
            resolve(canvas);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            document.body.removeChild(element);
            reject(e);
        };
        img.src = url;
    });
}

// Generate weekly summary image as blob
export async function generateWeeklySummaryImage(data: WeeklySummaryData): Promise<Blob> {
    const element = createSummaryElement(data);
    const canvas = await elementToCanvas(element);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    });
}

// Check if Web Share API is supported
export function isShareSupported(): boolean {
    return 'share' in navigator && 'canShare' in navigator;
}

// Share image using Web Share API or download fallback
export async function shareImage(blob: Blob, title: string = 'Meu Progresso NutriSmart'): Promise<boolean> {
    const file = new File([blob], 'nutrismart-resumo.png', { type: 'image/png' });

    // Try Web Share API first
    if (isShareSupported()) {
        try {
            const shareData = {
                files: [file],
                title: title,
                text: 'Confira meu progresso no NutriSmart! 💚',
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return true;
            }
        } catch (error) {
            // User cancelled or share failed
            console.log('Share cancelled or failed:', error);
        }
    }

    // Fallback: Download
    downloadImage(blob, 'nutrismart-resumo-semanal.png');
    return false;
}

// Download image as file
export function downloadImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Format date range for display
export function getWeekRange(): string {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const format = (d: Date) =>
        d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

    return `${format(weekAgo)} - ${format(now)}`;
}
