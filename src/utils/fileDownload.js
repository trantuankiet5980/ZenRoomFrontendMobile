import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const MIME_PDF = "application/pdf";

export async function persistFileToDownloads(localUri, fileName, mimeType = MIME_PDF) {
    if (!localUri) {
        return localUri;
    }

    if (Platform.OS === "android" && FileSystem.StorageAccessFramework?.requestDirectoryPermissionsAsync) {
        try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                return localUri;
            }
            const base64 = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                mimeType
            );
            await FileSystem.writeAsStringAsync(destinationUri, base64, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return destinationUri;
        } catch (error) {
            console.warn("persistFileToDownloads error", error);
            return localUri;
        }
    }

    return localUri;
}