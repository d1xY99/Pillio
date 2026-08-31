import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { createId } from '@/db/ids';

async function persistPhotoOnWeb(sourceUri: string): Promise<string> {
  try {
    const response = await fetch(sourceUri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return sourceUri;
  }
}

function photosDir() {
  const dir = new Directory(Paths.document, 'progress-photos');
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

export async function persistPhoto(sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return persistPhotoOnWeb(sourceUri);
  }

  const dest = new File(photosDir(), `${createId()}.jpg`);
  const source = new File(sourceUri);
  await source.copy(dest);
  return dest.uri;
}

export function deletePhotoFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // file may already be gone
  }
}

export async function captureProgressPhoto(
  source: 'camera' | 'library',
): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.85, exif: false })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          exif: false,
        });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistPhoto(result.assets[0].uri);
}
