/**
 * Extracts a set of keyframes from a video File object.
 * Returns an array of Base64 strings.
 */
export async function extractFramesFromVideo(file: File, frameCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const frames: string[] = [];
    
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const interval = duration / (frameCount + 1);
      
      canvas.width = video.videoWidth / 2; // Resize for faster API upload
      canvas.height = video.videoHeight / 2;

      for (let i = 1; i <= frameCount; i++) {
        const time = i * interval;
        video.currentTime = time;
        
        await new Promise((r) => {
          video.onseeked = () => {
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
            }
            r(null);
          };
        });
      }
      
      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = (e) => reject(new Error("Failed to load video file"));
  });
}
