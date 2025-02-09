
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match display size
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Set initial canvas state
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-50">
      <div 
        className="relative w-full max-w-5xl aspect-[4/3] transition-transform duration-300 ease-out hover:shadow-lg"
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full rounded-lg border border-neutral-200/50",
            "bg-white shadow-sm transition-all duration-300",
            "hover:border-neutral-300/50"
          )}
        />
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-neutral-200/50 text-sm text-neutral-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Canvas Ready
        </div>
      </div>
    </div>
  );
};
