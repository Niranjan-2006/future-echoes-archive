
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface ImageUploaderProps {
  previewUrls: string[];
  onImageUpload: (files: File[]) => void;
  onImageRemove: (index: number) => void;
}

export const ImageUploader = ({ previewUrls, onImageUpload, onImageRemove }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onImageUpload(selectedFiles);
  };

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon className="h-5 w-5" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="rounded-lg w-full h-24 object-cover"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={() => onImageRemove(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
