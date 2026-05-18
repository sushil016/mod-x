import { useEffect, useRef } from "react";

export default function AnimatedWave() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    const chars = ".oO0";
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = "14px var(--font-mono)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cols = Math.max(1, Math.floor(rect.width / 20));
      const rows = Math.max(1, Math.floor(rect.height / 20));

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const px = (x + 0.5) * (rect.width / cols);
          const py = (y + 0.5) * (rect.height / rows);
          const combined = (
            Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time)
            + Math.sin((x + y) * 0.1 + time * 1.5)
            + Math.cos(x * 0.1 - y * 0.1 + time * 0.8)
          ) / 3;
          const normalized = (combined + 1) / 2;
          ctx.fillStyle = `color-mix(in oklch, var(--foreground) ${15 + normalized * 45}%, transparent)`;
          ctx.fillText(chars[Math.floor(normalized * (chars.length - 1))], px, py);
        }
      }

      time += 0.03;
      frameRef.current = requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" style={{ display: "block" }} />;
}
