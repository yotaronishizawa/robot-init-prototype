interface CameraLiveViewProps {
  robotCamera?: string;
  robotId?: string;
  feedUrl?: string;
}

export function CameraLiveView({ robotCamera, feedUrl }: CameraLiveViewProps) {
  const src = feedUrl ?? '/frame-627005.png';

  return (
    <div className="relative rounded-md bg-gray-900 aspect-video w-full max-w-[640px] overflow-hidden">
      <img src={src} alt="camera feed" className="w-full h-full object-cover" />
      {/* LIVE indicator — top-left */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5">
        <span className="relative flex size-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-green-500" />
        </span>
        <span className="text-[8px] font-bold text-green-400 tracking-[1px]">オンライン</span>
      </div>
    </div>
  );
}
