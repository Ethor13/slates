import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../lib/firebase";
import React, { useEffect } from "react";

export const FirebaseImg: React.FC<{src: string, className?: string, alt?: string, loading?: "eager" | "lazy"}> = ({src, className, alt, loading}) => {
  const [imageSrc, setImageSrc] = React.useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchLogo = async () => {
        const srcAdjusted = src.replace(/\/scoreboard/g, '');
        const imageRef = ref(storage, srcAdjusted);
        const downloadUrl = await getDownloadURL(imageRef);
        setImageSrc(downloadUrl);
    };
    fetchLogo();
  }, []);

  return (
    <img
        className={className}
        src={imageSrc}
        alt={alt}
        loading={loading}
    />
  );
};