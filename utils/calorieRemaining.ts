export type ExerciseCaloriesMode = 'none' | 'half' | 'full';

/** Normalize goal to internal value (DB may store display or internal). */
function normalizeGoal(goal: string | undefined): string | undefined {
    if (!goal) return undefined;
    if (goal === 'perder_peso' || goal === 'Perder Peso') return 'perder_peso';
    if (goal === 'ganhar_massa' || goal === 'Ganhar Massa Muscular') return 'ganhar_massa';
    if (goal === 'manter_peso' || goal === 'Manter Peso') return 'manter_peso';
    return goal;
}

/**
 * Determines how much of exercise calories to add to "remaining" based on
 * user goal, clinical mode, and explicit preference.
 */
export function getExerciseCaloriesToAdd(
    goal: string | undefined,
    isClinicalMode: boolean | undefined,
    userPreference: ExerciseCaloriesMode | undefined
): ExerciseCaloriesMode {
    const g = normalizeGoal(goal);
    if (isClinicalMode || g === 'perder_peso') return 'none';
    if (userPreference !== undefined) return userPreference;
    if (g === 'ganhar_massa') return 'half';
    return 'full'; // manter_peso
}

/**
 * Calculates remaining calories for the day.
 * mode: none = don't add burned, half = add 50%, full = add 100%.
 */
export function calculateRemaining(
    goal: number,
    consumed: number,
    burned: number,
    mode: ExerciseCaloriesMode
): number {
    const toAdd = mode === 'none' ? 0 : mode === 'half' ? burned * 0.5 : burned;
    return Math.max(0, goal - consumed + toAdd);
}
