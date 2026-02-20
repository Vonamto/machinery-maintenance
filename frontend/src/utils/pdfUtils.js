/**
 * Convert PDF file to Base64 string
 * @param {File} file - PDF file from input
 * @returns {Promise<string>} Base64 encoded string
 */
export const pdfToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (file.type !== 'application/pdf') {
      reject(new Error('File must be a PDF'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validate PDF file size (max 10MB)
 * @param {File} file - PDF file
 * @returns {boolean} True if valid
 */
export const validatePDFSize = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file && file.size <= maxSize;
};
