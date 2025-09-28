const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} imageData - Image buffer or base64 string
 * @param {string} folder - Folder name in Cloudinary
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Secure URL of uploaded image
 */
const uploadToCloudinary = async (imageData, folder = "uploads", options = {}) => {
  try {
    // Return empty string if no image data provided
    if (!imageData) {
      return "";
    }

    let result;

    const uploadOptions = {
      folder: folder,
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
      ...options
    };

    if (typeof imageData === "string") {
      // Base64 string or URL
      if (imageData.startsWith('data:') || imageData.startsWith('http')) {
        result = await cloudinary.uploader.upload(imageData, uploadOptions);
      } else {
        // If it's just a string but not base64 or URL, return as is
        return imageData;
      }
    } else if (imageData.buffer) {
      // File buffer from multer
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(imageData.buffer);
      });
    } else if (imageData instanceof File) {
      // File object from frontend
      const arrayBuffer = await imageData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    } else {
      console.log("Image data type:", typeof imageData);
      console.log("Image data:", imageData);
      // If it's already a URL, return it
      if (typeof imageData === "string" && imageData.startsWith('http')) {
        return imageData;
      }
      throw new Error(`Invalid image data format: ${typeof imageData}`);
    }

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - URL of image to delete
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    
    // Find folder from URL
    const folderIndex = urlParts.findIndex(part => part === 'v1' || part === 'v2');
    const folder = folderIndex > 0 ? urlParts[folderIndex - 1] : '';
    
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    await cloudinary.uploader.destroy(fullPublicId);
    console.log(`Successfully deleted image: ${fullPublicId}`);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    // Don't throw error for delete failures to avoid breaking the flow
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} images - Array of image data
 * @param {string} folder - Folder name in Cloudinary
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Array of secure URLs
 */
const uploadMultipleToCloudinary = async (images, folder = "uploads", options = {}) => {
  try {
    const uploadPromises = images.map(image => 
      uploadToCloudinary(image, folder, options)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Multiple upload error:", error);
    throw new Error(`Multiple upload failed: ${error.message}`);
  }
};

/**
 * Transform image URL with Cloudinary transformations
 * @param {string} imageUrl - Original image URL
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} - Transformed image URL
 */
const transformImageUrl = (imageUrl, transformations = {}) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }

    const defaultTransformations = {
      quality: "auto",
      fetch_format: "auto",
      ...transformations
    };

    const urlParts = imageUrl.split('/');
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    
    if (versionIndex === -1) return imageUrl;

    // Insert transformations before version
    const transformationString = Object.entries(defaultTransformations)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');

    urlParts.splice(versionIndex, 0, transformationString);
    return urlParts.join('/');
  } catch (error) {
    console.error("Transform URL error:", error);
    return imageUrl;
  }
};

/**
 * Get image info from Cloudinary
 * @param {string} imageUrl - Image URL
 * @returns {Promise<Object>} - Image information
 */
const getImageInfo = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return null;
    }

    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    
    const folderIndex = urlParts.findIndex(part => part === 'v1' || part === 'v2');
    const folder = folderIndex > 0 ? urlParts[folderIndex - 1] : '';
    
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    const result = await cloudinary.api.resource(fullPublicId);
    return result;
  } catch (error) {
    console.error("Get image info error:", error);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
  transformImageUrl,
  getImageInfo
};
