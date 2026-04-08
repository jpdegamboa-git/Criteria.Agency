interface ToneSliderProps {
  labelLeft: string;
  labelRight: string;
  value: number;
}

export function ToneSlider({ labelLeft, labelRight, value }: ToneSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-portal-text-muted w-16 text-right">{labelLeft}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-portal-text border-2 border-white shadow"
          style={{ left: `${value}%`, marginLeft: -6 }}
        />
      </div>
      <span className="text-[10px] text-portal-text-muted w-16">{labelRight}</span>
    </div>
  );
}
