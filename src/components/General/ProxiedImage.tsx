import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../../lib/firebase';

/**
 * Proxies an image through Firebase Storage, storing it if it doesn't exist
 * @param imageUrl Full URL of the original image
 * @returns Promise resolving to the Firebase Storage URL
 */
export const getProxiedImageUrl = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return '';
  
  try {
    // Create a hash/path for the image based on the URL
    // Use just the path part after the domain for storage path
    const urlParts = imageUrl.split('.com/');
    const imgPath = urlParts.length > 1 ? urlParts[1] : imageUrl;
    
    // Create reference to the image in Firebase Storage
    const storageRef = ref(storage, `logos/${imgPath}`);
    
    try {
      // Try to get the download URL for the image if it already exists
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.log('Image not found in cache, downloading and storing...');
      
      // Download the image from the original URL
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const imageBlob = await response.blob();
      
      // Upload to Firebase Storage
      await uploadBytesResumable(storageRef, imageBlob);
      
      // Get the URL for the newly uploaded image
      const url = await getDownloadURL(storageRef);
      return url;
    }
  } catch (error) {
    console.error('Error processing image:', error);
    // If anything fails, fall back to the original URL
    return imageUrl;
  }
};

interface ProxiedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const ProxiedImage: React.FC<ProxiedImageProps> = ({ src, alt, className, ...rest }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setIsLoading(false);
        setError(true);
        return;
      }

      setIsLoading(true);
      try {
        // Try to get the image from the proxy
        const proxiedUrl = await getProxiedImageUrl(src);
        setImageSrc(proxiedUrl);
      } catch (err) {
        console.error('Error loading proxied image:', err);
        setError(true);
        // Fall back to original source
        setImageSrc(src);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [src]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-pulse bg-gray-200 w-full h-full rounded-md"></div>
      </div>
    );
  }

  return <img src={error || !imageSrc ? src : imageSrc} alt={alt} className={className} {...rest} />;
};

export default ProxiedImage;