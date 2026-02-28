import React from 'react';

interface CameraLiveViewProps {
  robotCamera?: string;
  robotId?: string;
}

export const CameraLiveView: React.FC<CameraLiveViewProps> = ({ robotCamera }) => {
  return (
    <div className="flex items-center justify-center rounded-md bg-gray-900 aspect-video w-full max-w-[640px]">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">📷</div>
        <div className="text-sm font-medium">カメラ映像</div>
        <div className="text-xs mt-1 opacity-60">{robotCamera ?? 'cam_0'}</div>
        <div className="text-xs mt-2 opacity-40">(プロトタイプ: 映像なし)</div>
      </div>
    </div>
  );
};
