import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { UploadApiOptions, UploadApiResponse } from "cloudinary";

// Define a type for custom upload options
interface CustomUploadOptions {
  folder?: string;
  publicId?: string;
  transformations?: { width?: number; height?: number; crop?: string };
  overwrite?: boolean;
}

export const uploadImageToCloudinary = (
  buffer: Buffer,
  options: CustomUploadOptions = {}
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const uploadOptions: UploadApiOptions = {
      folder: options.folder || "/paisaid/posts", // Default folder
      public_id: options.publicId, // Custom file name (optional)
      overwrite: options.overwrite || false, // Overwrite if same public_id exists
      transformation: options.transformations
        ? [
            {
              width: options.transformations.width,
              height: options.transformations.height,
              crop: options.transformations.crop || "limit",
            },
          ]
        : undefined,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      }
    );
    stream.pipe(uploadStream);
  });
};

// Function to delete an image by public_id
export const deleteImageFromCloudinary = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};
