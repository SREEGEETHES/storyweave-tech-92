import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface StyleDetailsModalProps {
  style: any;
  isOpen: boolean;
  onClose: () => void;
}

const StyleDetailsModal = ({ style, isOpen, onClose }: StyleDetailsModalProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (style?.id) {
      // Try to load image from localStorage
      const savedImages = JSON.parse(localStorage.getItem('styleImages') || '[]');
      const imageData = savedImages.find((img: any) => img.id === style.id);
      if (imageData?.data) {
        setImageUrl(imageData.data);
      }
    }
  }, [style]);

  if (!style) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{style.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {imageUrl && (
            <div>
              <h4 className="font-medium mb-2">Reference Image</h4>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={imageUrl}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div>
            <h4 className="font-medium mb-2">Full Description</h4>
            <p className="text-muted-foreground leading-relaxed">
              {style.description || "No description provided"}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Created</h4>
            <p className="text-sm text-muted-foreground">
              {style.createdAt ? new Date(style.createdAt).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StyleDetailsModal;