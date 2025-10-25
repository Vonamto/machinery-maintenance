// frontend/src/utils/imageUtils.js

/**
 * Generates a thumbnail URL from a Google Drive file URL.
 * Assumes the input URL is a direct link to a file in Google Drive,
 * e.g., https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * or https://drive.google.com/uc?id=FILE_ID
 * @param {string} url - The original Google Drive file URL.
 * @returns {string} - The URL for a thumbnail version of the image, or the original URL if it cannot be processed.
 */
export function getThumbnailUrl(url) {
    if (!url) {
        return url; // Return as is if empty
    }

    // Try to extract the file ID using different common Google Drive URL patterns
    let fileId = null;

    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const pattern1 = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match1 = url.match(pattern1);
    if (match1) {
        fileId = match1[1];
    }

    // Pattern 2: https://drive.google.com/open?id=FILE_ID (older format)
    if (!fileId) {
         const pattern2 = /[?&]id=([a-zA-Z0-9_-]+)/;
         const match2 = url.match(pattern2);
         if (match2) {
             fileId = match2[1];
         }
    }

    // Pattern 3: https://drive.google.com/uc?id=FILE_ID
    if (!fileId) {
         const pattern3 = /\/uc\?id=([a-zA-Z0-9_-]+)/;
         const match3 = url.match(pattern3);
         if (match3) {
             fileId = match3[1];
         }
    }

    // If a file ID is found, construct the thumbnail URL
    if (fileId) {
        // Google Drive thumbnail URL format
        // You can adjust the 's' parameter (size) as needed (e.g., s220, s400, s800)
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`; // Example size
        // Alternatively, using 'uc' endpoint:
        // return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    // If the URL doesn't match expected patterns, return the original URL
    // This might work for publicly shared images if they are direct links,
    // but is less reliable for Drive-specific sharing links without an ID.
    console.warn("Could not generate thumbnail URL for:", url);
    return url;
}

/**
 * Converts a File object to a Base64 string.
 * Used before uploading to Google Drive via the backend.
 * @param {File} file - The File object to convert.
 * @returns {Promise<string>} - A promise resolving to the Base64 string.
 */
export function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}
