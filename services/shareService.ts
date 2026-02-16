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

// --- Relatório de Progresso Completo (para compartilhamento clínico) ---

export interface ProgressReportData {
    userName: string;
    period: number;
    periodLabel: string;
    dateRange: string;
    generatedAt: string;
    goals: {
        calorieGoal: number;
        waterGoal: number;
        weightGoal?: number;
        macros: { protein: number; carbs: number; fats: number };
    };
    summary: {
        caloriesAvg: number;
        caloriesPercent: number;
        waterAvg: number;
        waterPercent: number;
        exerciseMinutes: number;
        streak: number;
        weightStart: number;
        weightEnd: number;
        weightChange: number;
        mealsLogged: number;
        isOnTrackCalories: boolean;
    };
    weightSeries: { day: string; weight: number }[];
    calorieSeries: { day: string; calories: number }[];
}

const CHART_WIDTH = 760;
const CHART_HEIGHT = 240;
const NUTRI_GREEN = '#00b37e';
const GOAL_AMBER = '#f59e0b';
const TEXT_GRAY = '#374151';
const BG_LIGHT = '#f9fafb';

function renderWeightChartSVG(
    weightSeries: { day: string; weight: number }[],
    weightGoal: number | undefined,
    width: number,
    height: number
): string {
    if (weightSeries.length === 0) {
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${TEXT_GRAY}" font-size="14" font-family="Inter,system-ui,sans-serif">Sem dados no período</text></svg>`;
    }
    const padding = { top: 20, right: 20, bottom: 36, left: 44 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const minW = Math.min(...weightSeries.map(d => d.weight));
    const maxW = Math.max(...weightSeries.map(d => d.weight));
    const range = maxW - minW || 2;
    const yMin = minW - range * 0.1;
    const yMax = maxW + range * 0.1;
    const yScale = (v: number) => padding.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
    const xScale = (i: number) => padding.left + (i / Math.max(1, weightSeries.length - 1)) * chartW;

    let pathD = '';
    let areaD = '';
    weightSeries.forEach((p, i) => {
        const x = xScale(i);
        const y = yScale(p.weight);
        if (i === 0) {
            pathD = `M ${x} ${y}`;
            areaD = `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
            areaD += ` L ${x} ${y}`;
        }
    });
    const lastX = xScale(weightSeries.length - 1);
    const firstX = xScale(0);
    areaD += ` L ${lastX} ${padding.top + chartH} L ${firstX} ${padding.top + chartH} Z`;

    const goalLine =
        weightGoal != null && weightGoal >= yMin && weightGoal <= yMax
            ? `<line x1="${padding.left}" y1="${yScale(weightGoal)}" x2="${width - padding.right}" y2="${yScale(weightGoal)}" stroke="${GOAL_AMBER}" stroke-width="2" stroke-dasharray="6 4"/><text x="${width - padding.right - 4}" y="${yScale(weightGoal) - 6}" text-anchor="end" fill="${GOAL_AMBER}" font-size="11" font-family="Inter,system-ui,sans-serif">Meta ${weightGoal}kg</text>`
            : '';

    const yTicks = [yMin, (yMin + yMax) / 2, yMax].map(v => Math.round(v * 10) / 10);
    const gridLines = yTicks
        .map(
            (v, i) =>
                `<line x1="${padding.left}" y1="${yScale(v)}" x2="${width - padding.right}" y2="${yScale(v)}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4 4"/>`
        )
        .join('');
    const yLabels = yTicks
        .map(
            v =>
                `<text x="${padding.left - 6}" y="${yScale(v) + 4}" text-anchor="end" fill="#6b7280" font-size="11" font-family="Inter,system-ui,sans-serif">${v}kg</text>`
        )
        .join('');

    const xStep = Math.max(1, Math.floor(weightSeries.length / 8));
    const xLabels = weightSeries
        .map((p, i) => (i % xStep === 0 || i === weightSeries.length - 1 ? `<text x="${xScale(i)}" y="${height - 8}" text-anchor="middle" fill="#6b7280" font-size="10" font-family="Inter,system-ui,sans-serif">${escapeHtml(p.day)}</text>` : ''))
        .join('');

    const points = weightSeries
        .map((p, i) => `<circle cx="${xScale(i)}" cy="${yScale(p.weight)}" r="4" fill="${NUTRI_GREEN}" stroke="#fff" stroke-width="2"/>`)
        .join('');

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${gridLines}
  ${yLabels}
  ${xLabels}
  <path d="${areaD}" fill="${NUTRI_GREEN}" fill-opacity="0.2"/>
  <path d="${pathD}" fill="none" stroke="${NUTRI_GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${points}
  ${goalLine}
</svg>`;
}

function renderCalorieChartSVG(
    calorieSeries: { day: string; calories: number }[],
    calorieGoal: number,
    width: number,
    height: number
): string {
    if (calorieSeries.length === 0) {
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${TEXT_GRAY}" font-size="14" font-family="Inter,system-ui,sans-serif">Sem dados no período</text></svg>`;
    }
    const padding = { top: 20, right: 20, bottom: 36, left: 48 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxCal = Math.max(...calorieSeries.map(d => d.calories), calorieGoal, 1);
    const yMax = Math.ceil(maxCal / 500) * 500 || 2000;
    const yScale = (v: number) => padding.top + chartH - (v / yMax) * chartH;
    const barW = Math.max(4, (chartW / calorieSeries.length) * 0.7);
    const gap = chartW / calorieSeries.length;
    const xCenter = (i: number) => padding.left + (i + 0.5) * gap;

    const goalY = yScale(calorieGoal);
    const goalLine =
        calorieGoal > 0 && calorieGoal <= yMax
            ? `<line x1="${padding.left}" y1="${goalY}" x2="${width - padding.right}" y2="${goalY}" stroke="${GOAL_AMBER}" stroke-width="2" stroke-dasharray="6 4"/><text x="${width - padding.right - 4}" y="${goalY - 6}" text-anchor="end" fill="${GOAL_AMBER}" font-size="11" font-family="Inter,system-ui,sans-serif">Meta ${calorieGoal}</text>`
            : '';

    const bars = calorieSeries
        .map((p, i) => {
            const x = xCenter(i) - barW / 2;
            const h = Math.max(0, (p.calories / yMax) * chartH);
            const y = padding.top + chartH - h;
            return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${NUTRI_GREEN}"/>`;
        })
        .join('');

    const yTicks = [0, Math.round(yMax / 2), yMax];
    const gridLines = yTicks
        .map(
            v =>
                `<line x1="${padding.left}" y1="${yScale(v)}" x2="${width - padding.right}" y2="${yScale(v)}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4 4"/>`
        )
        .join('');
    const yLabels = yTicks
        .map(
            v =>
                `<text x="${padding.left - 6}" y="${yScale(v) + 4}" text-anchor="end" fill="#6b7280" font-size="11" font-family="Inter,system-ui,sans-serif">${v}</text>`
        )
        .join('');

    const xStep = Math.max(1, Math.floor(calorieSeries.length / 8));
    const xLabels = calorieSeries
        .map((p, i) => (i % xStep === 0 || i === calorieSeries.length - 1 ? `<text x="${xCenter(i)}" y="${height - 8}" text-anchor="middle" fill="#6b7280" font-size="10" font-family="Inter,system-ui,sans-serif">${escapeHtml(p.day)}</text>` : ''))
        .join('');

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${gridLines}
  ${yLabels}
  ${xLabels}
  ${bars}
  ${goalLine}
</svg>`;
}

function createProgressReportElement(data: ProgressReportData): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
    width: 800px;
    min-height: 400px;
    padding: 32px 24px;
    background: #fff;
    font-family: 'Inter', system-ui, sans-serif;
    color: ${TEXT_GRAY};
    box-sizing: border-box;
    overflow: visible;
  `;

    const s = data.summary;
    const g = data.goals;
    const weightSvg = renderWeightChartSVG(data.weightSeries, g.weightGoal, CHART_WIDTH, CHART_HEIGHT);
    const calorieSvg = renderCalorieChartSVG(data.calorieSeries, g.calorieGoal, CHART_WIDTH, CHART_HEIGHT);

    const goalsRow = `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;"><span style="font-size: 11px; color: #6b7280;">Meta calórica</span><div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${g.calorieGoal.toLocaleString()} kcal/dia</div></div>
      <div style="background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;"><span style="font-size: 11px; color: #6b7280;">Meta hídrica</span><div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${(g.waterGoal / 1000).toFixed(1)} L/dia</div></div>
      ${g.weightGoal != null ? `<div style="background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;"><span style="font-size: 11px; color: #6b7280;">Meta de peso</span><div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${g.weightGoal} kg</div></div>` : ''}
      <div style="background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;"><span style="font-size: 11px; color: #6b7280;">Macros (P/C/G)</span><div style="font-size: 16px; font-weight: 600; color: ${TEXT_GRAY};">${g.macros.protein}g / ${g.macros.carbs}g / ${g.macros.fats}g</div></div>
    </div>`;

    const summaryRow = `
    <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
      <div style="flex: 1; min-width: 120px; background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Média calórica</span>
        <div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${s.caloriesAvg.toLocaleString()} kcal <span style="font-size: 12px; font-weight: 500; color: #6b7280;">(${s.caloriesPercent}% da meta)</span></div>
      </div>
      <div style="flex: 1; min-width: 120px; background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Hidratação</span>
        <div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${(s.waterAvg / 1000).toFixed(1)} L <span style="font-size: 12px; font-weight: 500; color: #6b7280;">(${s.waterPercent}% da meta)</span></div>
      </div>
      <div style="flex: 1; min-width: 100px; background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Exercício</span>
        <div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${s.exerciseMinutes} min</div>
      </div>
      <div style="flex: 1; min-width: 100px; background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Sequência</span>
        <div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${s.streak} dias</div>
      </div>
      <div style="flex: 1; min-width: 120px; background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Variação peso</span>
        <div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${s.weightChange > 0 ? '+' : ''}${s.weightChange.toFixed(1)} kg <span style="font-size: 11px; color: #6b7280;">(${s.weightStart.toFixed(1)} → ${s.weightEnd.toFixed(1)} kg)</span></div>
      </div>
      <div style="flex: 1; min-width: 100px; background: ${BG_LIGHT}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Refeições</span>
        <div style="font-size: 18px; font-weight: 700; color: ${TEXT_GRAY};">${s.mealsLogged}</div>
      </div>
      <div style="flex: 1; min-width: 100px; background: ${s.isOnTrackCalories ? '#dcfce7' : '#fef3c7'}; border-radius: 12px; padding: 14px;">
        <span style="font-size: 11px; color: #6b7280;">Calorias</span>
        <div style="font-size: 16px; font-weight: 600; color: ${s.isOnTrackCalories ? '#166534' : '#b45309'};">${s.isOnTrackCalories ? 'Na meta' : 'Acima da meta'}</div>
      </div>
    </div>`;

    container.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid ${NUTRI_GREEN};">
      <div style="font-size: 14px; color: #6b7280; letter-spacing: 1px;">RELATÓRIO DE PROGRESSO NUTRICIONAL</div>
      <div style="font-size: 22px; font-weight: 700; color: ${TEXT_GRAY}; margin-top: 8px;">${escapeHtml(data.userName)}</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 6px;">${escapeHtml(data.periodLabel)} · ${escapeHtml(data.dateRange)}</div>
      <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Gerado em ${escapeHtml(data.generatedAt)}</div>
    </div>
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 600; color: ${TEXT_GRAY}; margin: 0 0 12px 0;">Metas</h3>
      ${goalsRow}
    </div>
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 600; color: ${TEXT_GRAY}; margin: 0 0 12px 0;">Resumo do período</h3>
      ${summaryRow}
    </div>
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 600; color: ${TEXT_GRAY}; margin: 0 0 12px 0;">Evolução do peso</h3>
      <div style="background: ${BG_LIGHT}; border-radius: 12px; padding: 16px;">${weightSvg}</div>
    </div>
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 600; color: ${TEXT_GRAY}; margin: 0 0 12px 0;">Consumo calórico diário</h3>
      <div style="background: ${BG_LIGHT}; border-radius: 12px; padding: 16px;">${calorieSvg}</div>
    </div>
    <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">Gerado pelo <strong>NutriSmart</strong> · ${escapeHtml(data.generatedAt)}</div>
  `;

    return container;
}

async function reportElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    element.style.position = 'fixed';
    element.style.left = '-9000px';
    element.style.top = '0';
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '99999';
    document.body.appendChild(element);

    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 200));

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            imageTimeout: 0,
        });
        return canvas;
    } finally {
        document.body.removeChild(element);
    }
}

export async function generateProgressReportImage(data: ProgressReportData): Promise<Blob> {
    const element = createProgressReportElement(data);
    const canvas = await reportElementToCanvas(element);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha ao gerar imagem do relatório'));
        }, 'image/png');
    });
}
