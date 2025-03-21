import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../lib/firebase";
import React, { useEffect, useState } from "react";

export const FirebaseImg: React.FC<{src: string, className?: string, alt?: string, loading?: "eager" | "lazy"}> = ({src, className, alt, loading}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const srcAdjusted = src.replace(/\/scoreboard/g, '');
        
        // Check if URL is cached in localStorage
        const cacheKey = `firebase-img-cache:${srcAdjusted}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const { url } = JSON.parse(cachedData);
          setImageSrc(url);
          return;
        }
        
        // Fetch from Firebase if not in cache or expired
        const imageRef = ref(storage, srcAdjusted);
        const downloadUrl = await getDownloadURL(imageRef);
        setImageSrc(downloadUrl);
        
        localStorage.setItem(
          cacheKey, 
          JSON.stringify({ url: downloadUrl })
        );
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };
    fetchLogo();
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className={`${className} rounded-md bg-gray-200 animate-pulse`} />
      )}
      {imageSrc && (
        <img
          className={className}
          src={imageSrc}
          alt={alt}
          loading={loading}
          onLoad={handleImageLoad}
          style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
        />
      )}
    </>
  );
};