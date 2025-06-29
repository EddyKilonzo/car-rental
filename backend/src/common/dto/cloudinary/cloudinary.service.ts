import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Express } from 'express';

/**
 * Result interface for Cloudinary uploads
 * Contains all essential information returned after successful upload
 */
export interface CloudinaryUploadResult {
  public_id: string; // Unique identifier for the uploaded file
  secure_url: string; // HTTPS URL to access the file
  url: string; // HTTP URL to access the file
  original_filename: string; // Original name of the uploaded file
  bytes: number; // File size in bytes
  format: string; // File format (jpg, png, pdf, etc.)
  resource_type: string; // Type of resource (image, video, raw)
  created_at: string; // Upload timestamp
  width?: number; // Image width (for images only)
  height?: number; // Image height (for images only)
  folder: string; // Cloudinary folder path
}

/**
 * Configuration for different uploads
 */
export interface CarRentalUploadConfig {
  uploadType: CarRentalUploadType;
  maxSizeBytes: number; // Maximum file size in bytes
  allowedFormats: string[]; // Array of allowed file formats (e.g., ['jpg', 'png'])
  folder: string; // Cloudinary folder path for uploads
  transformation?: Record<string, unknown>; // Optional transformation string for image processing
}

/**
 * Enum for defining all upload types
 */
export enum CarRentalUploadType {
  USER_PROFILE = 'user_profile',
  VEHICLE_MAIN = 'vehicle_main',
  VEHICLE_GALLERY = 'vehicle_gallery',
  VEHICLE_INTERIOR = 'vehicle_interior',
  VEHICLE_EXTERIOR = 'vehicle_exterior',
  VEHICLE_DOCUMENTS = 'vehicle_documents',
  LICENSE_DOCUMENT = 'license_document',
  INSURANCE_DOCUMENT = 'insurance_document',
}

@Injectable()
export class CloudinaryService {
  constructor() {
    // Setup Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Get upload configuration based on upload type
   */
  private getUploadConfig(
    uploadType: CarRentalUploadType,
  ): CarRentalUploadConfig {
    const configs: Record<CarRentalUploadType, CarRentalUploadConfig> = {
      [CarRentalUploadType.USER_PROFILE]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'car-rental/users/profiles',
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
          gravity: 'face',
        },
      },
      [CarRentalUploadType.VEHICLE_MAIN]: {
        uploadType,
        maxSizeBytes: 8 * 1024 * 1024, // 8MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'car-rental/vehicles/main',
        transformation: {
          width: 1200,
          height: 800,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [CarRentalUploadType.VEHICLE_GALLERY]: {
        uploadType,
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'car-rental/vehicles/gallery',
        transformation: {
          width: 1920,
          height: 1080,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [CarRentalUploadType.VEHICLE_INTERIOR]: {
        uploadType,
        maxSizeBytes: 8 * 1024 * 1024, // 8MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'car-rental/vehicles/interior',
        transformation: {
          width: 1200,
          height: 900,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [CarRentalUploadType.VEHICLE_EXTERIOR]: {
        uploadType,
        maxSizeBytes: 8 * 1024 * 1024, // 8MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'car-rental/vehicles/exterior',
        transformation: {
          width: 1200,
          height: 900,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [CarRentalUploadType.VEHICLE_DOCUMENTS]: {
        uploadType,
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        folder: 'car-rental/vehicles/documents',
      },
      [CarRentalUploadType.LICENSE_DOCUMENT]: {
        uploadType,
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        folder: 'car-rental/users/licenses',
      },
      [CarRentalUploadType.INSURANCE_DOCUMENT]: {
        uploadType,
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        folder: 'car-rental/vehicles/insurance',
      },
    };

    return configs[uploadType];
  }

  /**
   * Validate file before upload
   */
  private validateFile(
    file: Express.Multer.File,
    config: CarRentalUploadConfig,
  ): void {
    // Check if file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check if file has required properties
    if (!file.originalname || !file.size || !file.mimetype) {
      throw new BadRequestException('Invalid file structure');
    }

    // Check file size
    if (file.size && file.size > config.maxSizeBytes) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${config.maxSizeBytes} bytes`,
      );
    }

    // Check file format
    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `File format ${fileExtension || 'unknown'} is not allowed. Allowed formats: ${config.allowedFormats.join(', ')}`,
      );
    }

    // Check MIME type
    const isValidMimeType = config.allowedFormats.some(
      (format) =>
        file.mimetype.includes(format) ||
        (format === 'jpg' && file.mimetype.includes('jpeg')),
    );

    if (!isValidMimeType) {
      throw new BadRequestException(
        `Invalid MIME type ${file.mimetype}. Expected formats: ${config.allowedFormats.join(', ')}`,
      );
    }
  }

  /**
   * Upload single file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    uploadType: CarRentalUploadType,
    customOptions?: Record<string, unknown>,
  ): Promise<CloudinaryUploadResult> {
    const config = this.getUploadConfig(uploadType);

    // Check file
    this.validateFile(file, config);

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      // Determine resource type based on upload type
      const resourceType =
        uploadType === CarRentalUploadType.LICENSE_DOCUMENT ||
        uploadType === CarRentalUploadType.VEHICLE_DOCUMENTS ||
        uploadType === CarRentalUploadType.INSURANCE_DOCUMENT
          ? 'raw'
          : 'auto';

      const uploadOptions: Record<string, unknown> = {
        folder: config.folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        access_mode: 'public', // Ensure public access for documents
        ...(config.transformation && { transformation: config.transformation }),
        ...(customOptions || {}),
      };

      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(
                new BadRequestException(`Upload failed: ${error.message}`),
              );
            } else if (result) {
              // Transform UploadApiResponse to CloudinaryUploadResult
              const uploadResult: CloudinaryUploadResult = {
                public_id: result.public_id,
                secure_url: result.secure_url,
                url: result.url,
                original_filename: result.original_filename,
                bytes: result.bytes,
                format: result.format,
                resource_type: result.resource_type,
                created_at: result.created_at,
                width: result.width,
                height: result.height,
                folder: config.folder,
              };
              resolve(uploadResult);
            } else {
              reject(
                new BadRequestException('Upload failed: No result returned'),
              );
            }
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadType: CarRentalUploadType,
    customOptions?: Record<string, unknown>,
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, uploadType, customOptions),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId)) as {
        result: string;
      };
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete file: ${errorMessage}`);
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  async deleteMultipleFiles(
    publicIds: string[],
  ): Promise<{ deleted: Record<string, string> }> {
    try {
      const result = (await cloudinary.api.delete_resources(publicIds)) as {
        deleted: Record<string, string>;
      };
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete files: ${errorMessage}`);
    }
  }

  /**
   * Get file details from Cloudinary
   */
  async getFileDetails(publicId: string): Promise<Record<string, unknown>> {
    try {
      const result = (await cloudinary.api.resource(publicId)) as Record<
        string,
        unknown
      >;
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to get file details: ${errorMessage}`,
      );
    }
  }

  /**
   * Generate transformation URL for existing image
   */
  generateTransformationUrl(
    publicId: string,
    transformations: Record<string, unknown>,
  ): string {
    return cloudinary.url(publicId, transformations);
  }

  /**
   * Get optimized URL for web display
   */
  getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    return cloudinary.url(publicId, {
      width: width || 800,
      height: height || 600,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto',
    });
  }

  /**
   * Create archive of multiple files
   */
  async createArchive(publicIds: string[]): Promise<string> {
    try {
      const result = (await cloudinary.uploader.create_archive({
        resource_type: 'image',
        type: 'upload',
        target_format: 'zip',
        public_ids: publicIds,
        use_original_filename: true,
      })) as { secure_url: string };
      return result.secure_url;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create archive: ${errorMessage}`,
      );
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(cloudinaryUrl: string): string {
    const parts = cloudinaryUrl.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }

  /**
   * Generate a signed URL for secure document access
   * This is useful for sensitive documents that need authentication
   */
  generateSignedUrl(publicId: string, expiresInSeconds: number = 3600): string {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const expiration = timestamp + expiresInSeconds;

    return cloudinary.url(publicId, {
      sign_url: true,
      expires_at: expiration,
      resource_type: 'auto',
      type: 'upload',
    });
  }

  /**
   * Generate a secure download URL for documents
   * This provides a direct download link with authentication
   */
  generateDownloadUrl(publicId: string, filename?: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      attachment: filename || true,
      flags: 'attachment',
    });
  }

  /**
   * Generate a public URL for documents (raw resources)
   * This provides a direct link that should work without authentication
   */
  generatePublicDocumentUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
    });
  }
}
