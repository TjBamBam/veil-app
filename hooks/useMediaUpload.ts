import { useState } from "react";

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const upload = async (file: File) => {
    setUploading(true);
    //Upload to storage
    setUploading(false);
  };

  return { upload, uploading, progress };
};