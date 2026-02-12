/**
 * Share Service
 * Generates shareable images from app data using html2canvas
 * and handles Web Share API or download fallback
 */

import html2canvas from 'html2canvas';

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Type for summary data (período = 7, 14, 30 ou 90 dias)
export interface WeeklySummaryData {
    userName: string;
    weekRange: string;
    periodLabel?: string;
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
    min-height: 380px;
    padding: 32px;
    background: linear-gradient(135deg, #00b37e 0%, #00875f 100%);
    border-radius: 24px;
    font-family: 'Inter', system-ui, sans-serif;
    color: white;
    box-sizing: border-box;
    overflow: visible;
  `;

    const calorieGoal = data.caloriesGoal || 2000;
    const waterGoal = data.waterGoal || 2500;
    const caloriePercent = Math.min(100, Math.round((data.caloriesAvg / calorieGoal) * 100));
    const waterPercent = Math.min(100, Math.round((data.waterAvg / waterGoal) * 100));

    const periodLabel = data.periodLabel || data.weekRange;
    container.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px; width: 100%;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.9);">Meu Resumo NutriSmart</div>
      <div style="font-size: 24px; font-weight: 700; margin-top: 8px; color: #fff;">${escapeHtml(data.userName)}</div>
      <div style="font-size: 12px; margin-top: 4px; color: rgba(255,255,255,0.9);">${escapeHtml(periodLabel)}</div>
      <div style="font-size: 11px; margin-top: 2px; color: rgba(255,255,255,0.8);">${escapeHtml(data.weekRange)}</div>
    </div>
    <div style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 16px; width: 100%; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div style="text-align: center; flex: 1;"><div style="font-size: 28px; font-weight: 700; color: #fff;">${data.caloriesAvg.toLocaleString()}</div><div style="font-size: 11px; color: rgba(255,255,255,0.8);">kcal/dia</div></div>
        <div style="text-align: center; flex: 1;"><div style="font-size: 28px; font-weight: 700; color: #fff;">${(data.waterAvg / 1000).toFixed(1)} L</div><div style="font-size: 11px; color: rgba(255,255,255,0.8);">água/dia</div></div>
        <div style="text-align: center; flex: 1;"><div style="font-size: 28px; font-weight: 700; color: #fff;">${data.exerciseMinutes}</div><div style="font-size: 11px; color: rgba(255,255,255,0.8);">min exerc.</div></div>
      </div>
      <div style="display: flex; gap: 8px;">
        <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; text-align: center;"><div style="font-size: 18px; font-weight: 600; color: #fff;">${data.streak}</div><div style="font-size: 10px; color: rgba(255,255,255,0.9);">dias seguidos</div></div>
        <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; text-align: center;"><div style="font-size: 18px; font-weight: 600; color: #fff;">${data.weightChange > 0 ? '+' : ''}${data.weightChange.toFixed(1)} kg</div><div style="font-size: 10px; color: rgba(255,255,255,0.9);">variação peso</div></div>
        <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; text-align: center;"><div style="font-size: 18px; font-weight: 600; color: #fff;">${data.mealsLogged}</div><div style="font-size: 10px; color: rgba(255,255,255,0.9);">refeições</div></div>
      </div>
    </div>
    <div style="display: flex; gap: 8px; margin-bottom: 16px; width: 100%;">
      <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px;"><div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Calorias</div><div style="background: rgba(255,255,255,0.3); border-radius: 999px; height: 8px; overflow: hidden;"><div style="background: #fff; height: 100%; width: ${Math.min(caloriePercent, 100)}%; border-radius: 999px;"></div></div><div style="font-size: 10px; color: rgba(255,255,255,0.9); margin-top: 4px; text-align: right;">${caloriePercent}% da meta</div></div>
      <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px;"><div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Hidratação</div><div style="background: rgba(255,255,255,0.3); border-radius: 999px; height: 8px; overflow: hidden;"><div style="background: #fff; height: 100%; width: ${Math.min(waterPercent, 100)}%; border-radius: 999px;"></div></div><div style="font-size: 10px; color: rgba(255,255,255,0.9); margin-top: 4px; text-align: right;">${waterPercent}% da meta</div></div>
    </div>
    <div style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.8);">Monitorando com <b>NutriSmart</b></div>
  `;

    return container;
}

// Converte o elemento HTML em canvas (elemento precisa estar "pintado" para o html2canvas capturar o conteúdo)
async function elementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    element.style.position = 'fixed';
    element.style.left = '-8000px';
    element.style.top = '0';
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '99999';
    document.body.appendChild(element);

    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 150));

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#00b37e',
            allowTaint: true,
            imageTimeout: 0,
        });
        return canvas;
    } finally {
        document.body.removeChild(element);
    }
}

// Generate weekly summary image as blob
export async function generateWeeklySummaryImage(data: WeeklySummaryData): Promise<Blob> {
    const element = createSummaryElement(data);
    const canvas = await elementToCanvas(element);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha ao gerar imagem'));
        }, 'image/png');
    });
}

// Check if Web Share API is supported
export function isShareSupported(): boolean {
    return 'share' in navigator && 'canShare' in navigator;
}

// Share image using Web Share API or download fallback
export async function shareImage(blob: Blob, title: string = 'Meu Progresso NutriSmart'): Promise<boolean> {
    if (!blob || blob.size === 0) {
        console.warn('shareImage: blob vazio');
        return false;
    }

    const file = new File([blob], 'nutrismart-resumo.png', { type: 'image/png' });

    // Try Web Share API first (mobile e navegadores que suportam)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
            const shareData: ShareData & { files?: File[] } = {
                title,
                text: 'Confira meu progresso no NutriSmart! 💚',
                files: [file],
            };
            if (!navigator.canShare || navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return true;
            }
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                console.warn('Share API failed:', err);
            }
        }
    }

    // Fallback: download
    try {
        downloadImage(blob, 'nutrismart-resumo-semanal.png');
    } catch (err) {
        console.warn('Download fallback failed:', err);
    }
    return false;
}

// Download image as file (append to body so download triggers in all browsers)
export function downloadImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
}

// Formata intervalo de datas (ex.: "12 jan - 10 fev")
export function getWeekRange(days: number = 7): string {
    const now = new Date();
    const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const format = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    return `${format(start)} - ${format(now)}`;
}

// Rótulo do período para a imagem (ex.: "Últimos 30 dias")
export function getPeriodLabel(days: number): string {
    if (days === 7) return 'Últimos 7 dias';
    if (days === 14) return 'Últimos 14 dias';
    if (days === 30) return 'Últimos 30 dias';
    if (days === 90) return 'Últimos 90 dias';
    return `Últimos ${days} dias`;
}
