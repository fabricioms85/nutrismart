import { supabase } from './supabaseClient';

export interface UploadResult {
    url: string;
    path: string;
}

/**
 * Upload an image to Supabase Storage
 * @param bucket - The bucket name ('meal-images' or 'avatars')
 * @param file - The file to upload
 * @param userId - The user's ID (used to organize files by user)
 * @param customFileName - Optional custom filename
 */
export async function uploadImage(
    bucket: 'meal-images' | 'avatars',
    file: File,
    userId: string,
    customFileName?: string
): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = customFileName || `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return {
        url: data.publicUrl,
        path: filePath
    };
}

/**
 * Upload a meal image from a base64 string
 */
export async function uploadMealImageFromBase64(
    base64Data: string,
    userId: string,
    mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create file from blob
    const ext = mimeType.split('/')[1] || 'jpg';
    const file = new File([blob], `meal-${Date.now()}.${ext}`, { type: mimeType });

    return uploadImage('meal-images', file, userId);
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(
    bucket: 'meal-images' | 'avatars',
    filePath: string
): Promise<void> {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
        throw error;
    }
}

/**
 * Update user avatar
 */
export async function updateAvatar(
    file: File,
    userId: string
): Promise<string> {
    const result = await uploadImage('avatars', file, userId, 'avatar.jpg');

    // Update the user's profile with the new avatar URL
    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: result.url })
        .eq('id', userId);

    if (error) {
        throw error;
    }

    return result.url;
}

/**
 * Get the public URL for an image
 */
export function getImageUrl(
    bucket: 'meal-images' | 'avatars',
    filePath: string
): string {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return data.publicUrl;
}
