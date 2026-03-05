import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

function MIcon({ name, size = 14, className = '', weight, stroke }: { name: string; size?: number; className?: string; weight?: number; stroke?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size, lineHeight: 1, width: size, height: size, display: 'inline-flex', alignItems: 'center',
        ...(weight !== undefined ? { fontVariationSettings: `'wght' ${weight}` } : {}),
        ...(stroke ? { WebkitTextStroke: '0.4px currentColor' } : {}),
      }}
    >
      {name}
    </span>
  );
}

// ============================================
// Types
// ============================================
export interface HumanDetectionStatus {
  enabled: boolean;
  humanDetected: boolean;
  obstacleDetected: boolean;
  fallenDrinkDetected: boolean;
}

export interface RobotData {
  humanDetection: HumanDetectionStatus;
  robotConnected: boolean;
  cameraFeedUrls?: { cam0?: string; cam1?: string };
}

export interface BreathingPanelProps {
  robotData: RobotData;
  activeStepId?: string;
  onRefresh?: () => void;
  floating?: boolean;
}

// ============================================
// Human Detection
// ============================================
const DETECTION_ITEMS = [
  { key: 'humanDetected',       label: '人'       },
  { key: 'obstacleDetected',    label: '障害物'    },
  { key: 'fallenDrinkDetected', label: '落下飲料'  },
] as const;

function HumanDetection({ status }: { status: HumanDetectionStatus }) {
  const { enabled } = status;

  return (
    <div className="space-y-1.5 rounded-lg px-2.5 py-2 transition-colors duration-300 border border-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MIcon name="sensor_occupied" />
          <span className="text-xs font-semibold text-foreground">人感知センサ</span>
        </div>
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold
          ${enabled ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}
        >
          {enabled ? '有効' : '無効'}
        </span>
      </div>
      <div className={`space-y-1 text-[11px] transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-50'}`}>
        {DETECTION_ITEMS.map(({ key, label }) => {
          const detected = status[key];
          return (
            <div key={key} className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded transition-colors duration-200 ${detected ? 'bg-red-50/80 border border-red-400' : ''}`}>
              <div className="flex items-center gap-1.5">
                <MIcon
                  name={detected ? 'error' : 'check'}
                  size={13}
                  className={detected ? 'text-red-500' : 'text-green-500'}
                  weight={700}
                  stroke
                />
                <span className={`font-semibold ${detected ? 'text-red-700' : 'text-green-700'}`}>{label}</span>
              </div>
              <span className={`font-semibold ${detected ? 'text-red-600' : 'text-green-600'}`}>
                {detected ? '検知中' : '検知なし'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Camera Viewer
// ============================================
function CameraViewer({ label, feedUrl }: { label: string; feedUrl?: string }) {
  const hasImage = Boolean(feedUrl);

  return (
    <div className="space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="relative w-full aspect-video bg-zinc-900 rounded overflow-hidden">
        {hasImage ? (
          <img src={feedUrl} alt={`${label} feed`} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-zinc-500">
            <MIcon name="videocam_off" size={20} />
            <span className="text-[10px] font-medium">カメラが起動していません</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Robot Connection Status
// ============================================
const MOCK_FETCH_DELAY_MS = 2500;

function RobotConnectionStatus({
  isRefreshing,
  displayConnected,
  lastUpdatedAt,
  onRefresh,
}: {
  isRefreshing: boolean;
  displayConnected: boolean;
  lastUpdatedAt: Date | null;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">ロボット状態</span>
          <span className={`inline-flex size-2 rounded-full shrink-0 ${displayConnected ? 'bg-green-600' : 'bg-red-600'}`} />
          <span className={`text-xs font-medium ${displayConnected ? 'text-green-600' : 'text-red-600'}`}>
            {displayConnected ? 'オンライン' : 'オフライン'}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded-md border border-input text-muted-foreground"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {!isRefreshing && (
        <span className="text-xs text-muted-foreground">
          最終更新 {lastUpdatedAt?.toLocaleTimeString() ?? '—'}
        </span>
      )}
    </div>
  );
}

// ============================================
// Robot Section
// ============================================
const CAMERA_FOCUSED_STEPS = new Set(['wrist-alignment-left', 'wrist-alignment-right']);

function RobotSection({ data, activeStepId, onRefresh }: { data: RobotData; activeStepId?: string; onRefresh?: () => void }) {
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const startRefresh = (userTriggered = false) => {
    setIsRefreshing(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdatedAt(new Date());
      if (userTriggered) onRefresh?.();
    }, MOCK_FETCH_DELAY_MS);
  };

  useEffect(() => {
    startRefresh();
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  const displayConnected = !isRefreshing && data.robotConnected;
  const isCameraFocused = activeStepId ? CAMERA_FOCUSED_STEPS.has(activeStepId) : false;

  return (
    <section className="space-y-3">
      <RobotConnectionStatus
        isRefreshing={isRefreshing}
        displayConnected={displayConnected}
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={() => startRefresh(true)}
      />

      {isRefreshing ? (
        <div className="text-sm text-muted-foreground">ロボット情報を取得中...</div>
      ) : (
        <>
          <HumanDetection status={data.humanDetection} />

          <div>
            <div
              className="grid transition-[grid-template-rows] duration-500 ease-in-out"
              style={{ gridTemplateRows: isCameraFocused ? '0fr' : '1fr' }}
            >
              <div className="overflow-hidden">
                <div className={`space-y-2 transition-opacity duration-300 ${isCameraFocused ? 'opacity-0' : 'opacity-100'}`}>
                  <CameraViewer label="左カメラ (cam_0)" feedUrl={data.cameraFeedUrls?.cam0} />
                  <CameraViewer label="右カメラ (cam_1)" feedUrl={data.cameraFeedUrls?.cam1} />
                </div>
              </div>
            </div>
            {isCameraFocused && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-[11px] text-muted-foreground">
                <MIcon name="personal_video" size={14} />
                <span>カメラフィードはメインエリアに表示されています</span>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

// ============================================
// Main Component
// ============================================
export function BreathingPanel({ robotData, activeStepId, onRefresh, floating }: BreathingPanelProps) {
  return (
    <div className={floating
      ? "flex flex-col w-full h-full bg-white"
      : "flex flex-col w-[280px] h-full bg-white border-l border-zinc-200 shrink-0"
    }>
      <div className="flex-1 flex flex-col gap-4 p-3 overflow-y-auto">
        <RobotSection data={robotData} activeStepId={activeStepId} onRefresh={onRefresh} />
      </div>
    </div>
  );
}
