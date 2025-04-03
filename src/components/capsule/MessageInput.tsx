
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";

interface MessageInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  previewUrls: string[];
  onImageUpload: (files: File[]) => void;
  onImageRemove: (index: number) => void;
}

export const MessageInput = ({
  message,
  onMessageChange,
  previewUrls,
  onImageUpload,
  onImageRemove
}: MessageInputProps) => {
  return (
    <div className="relative">
      <Textarea
        placeholder="What do you want to capture in your virtual capsule?"
        className="min-h-[200px] resize-none p-4"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
      />
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        <ImageUploader 
          previewUrls={previewUrls} 
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
    </div>
  );
};
