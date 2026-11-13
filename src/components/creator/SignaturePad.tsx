import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, Type } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SignaturePadProps {
  onSaveSignature: (dataUrl: string) => void;
  onClearSignature: () => void;
  initialSignature?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSaveSignature,
  onClearSignature,
  initialSignature,
}) => {
  const { t, currentTheme } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [penColor, setPenColor] = useState('#0f172a');
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 460;
    canvas.height = 140;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveSignature(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setTypedName('');
    onClearSignature();
  };

  const handleTypeToSign = (name: string) => {
    setTypedName(name);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!name.trim()) {
      setHasDrawn(false);
      onClearSignature();
      return;
    }

    ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    setHasDrawn(true);
    onSaveSignature(canvas.toDataURL('image/png'));
  };

  return (
    <div className={`p-4 rounded-xl border ${currentTheme.borderClass} bg-slate-900/40 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-emerald-400" />
          <span className={`text-xs font-semibold ${currentTheme.textPrimaryClass}`}>
            {t.creator.electronicSignature}
          </span>
        </div>

        {/* Mode switcher: draw vs type */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mode === 'draw' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>رسم باليد</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mode === 'type' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-3 h-3" />
            <span>كتابة بالاسم</span>
          </button>
        </div>
      </div>

      {mode === 'type' ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="اكتب اسمك ليتم تحويله لتوقيع أنيق..."
            value={typedName}
            onChange={(e) => handleTypeToSign(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      ) : null}

      {/* Signature Canvas */}
      <div className="relative rounded-lg bg-white border border-slate-300 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 block touch-none"
        />

        {/* Watermark baseline */}
        <div className="absolute bottom-4 inset-x-6 border-b border-dashed border-slate-300 pointer-events-none" />
        <span className="absolute bottom-1 right-6 text-[10px] text-slate-400 pointer-events-none">
          وقع هنا (X)
        </span>
      </div>

      {/* Signature Toolbar */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">لون الحبر:</span>
          {['#0f172a', '#1e3a8a', '#047857'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setPenColor(c)}
              className={`w-5 h-5 rounded-full border transition-transform ${
                penColor === c ? 'scale-125 border-emerald-400' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="px-2.5 py-1 text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.creator.clearSignature}</span>
        </button>
      </div>
    </div>
  );
};
