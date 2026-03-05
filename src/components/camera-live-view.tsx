interface CameraLiveViewProps {
  robotCamera?: string;
  robotId?: string;
  feedUrl?: string;
  showGrid?: boolean;
  gridColorRgb?: string;
  gridOpacity?: number;
  gridYOffset?: number;
  imageFilter?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function CameraAssistGridOverlay({
  opacityPercent,
  yOffsetPercent,
  colorRgb,
}: {
  opacityPercent: number;
  yOffsetPercent: number;
  colorRgb: string;
}) {
  const lineOpacity = clamp(opacityPercent, 0, 100) / 100;
  const translateYPercent = 50 - clamp(yOffsetPercent, 0, 100);
  const positions = [33.3333, 50, 66.6667];

  return (
    <div className="pointer-events-none absolute inset-0">
      {positions.map(position => {
        const isCenter = position === 50;
        return (
          <div
            key={`h-${position}`}
            className="absolute left-0 right-0"
            style={{
              top: `calc(${position}% + ${translateYPercent}%)`,
              height: isCenter ? '2px' : '1px',
              transform: 'translateY(-50%)',
              backgroundColor: isCenter
                ? `rgba(${colorRgb}, ${lineOpacity})`
                : `rgba(${colorRgb}, ${lineOpacity * 0.75})`,
            }}
          />
        );
      })}
      {positions.map(position => {
        const isCenter = position === 50;
        return (
          <div
            key={`v-${position}`}
            className="absolute bottom-0 top-0"
            style={{
              left: `${position}%`,
              width: isCenter ? '2px' : '1px',
              transform: 'translateX(-50%)',
              backgroundColor: isCenter
                ? `rgba(${colorRgb}, ${lineOpacity})`
                : `rgba(${colorRgb}, ${lineOpacity * 0.75})`,
            }}
          />
        );
      })}
    </div>
  );
}

export function CameraLiveView({
  feedUrl,
  showGrid = false,
  gridColorRgb = '217, 70, 239',
  gridOpacity = 80,
  gridYOffset = 50,
  imageFilter,
}: CameraLiveViewProps) {
  const src = feedUrl ?? '/frame-627005.png';

  return (
    <div className="relative rounded-md bg-gray-900 w-full overflow-hidden aspect-video">
      <img
        src={src}
        alt="camera feed"
        className="w-full h-full object-cover"
        style={imageFilter ? { filter: imageFilter } : undefined}
      />
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5">
        <span className="relative flex size-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-green-500" />
        </span>
        <span className="text-[8px] font-bold text-green-400 tracking-[1px]">オンライン</span>
      </div>
      {showGrid ? (
        <CameraAssistGridOverlay
          opacityPercent={gridOpacity}
          yOffsetPercent={gridYOffset}
          colorRgb={gridColorRgb}
        />
      ) : null}
    </div>
  );
}
