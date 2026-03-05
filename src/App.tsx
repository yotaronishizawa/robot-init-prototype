import { useState, useCallback, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { AppSidebar } from './components/app-sidebar';
import { Button } from './components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
import { RobotInit, type StepCompleteInfo } from './components/robot-init/robot-init';
import { BreathingPanel, type RobotData } from './components/BreathingPanel';

const MOCK_STORE_NAME = 'サンプル店舗';
const MOCK_ROBOT_ID = 'robot-001';

const initialRobotData: RobotData = {
  humanDetection: {
    enabled: true,
    humanDetected: false,
    obstacleDetected: false,
    fallenDrinkDetected: false,
  },
  robotConnected: true,
  cameraFeedUrls: {},
};

function App() {
  const [robotData, setRobotData] = useState<RobotData>(initialRobotData);
  const [activeOperationId, setActiveOperationId] = useState<string>('');
  const [activeStepId, setActiveStepId] = useState<string>('');
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  const isCameraStep = activeStepId === 'wrist-alignment-left' || activeStepId === 'wrist-alignment-right';

  useEffect(() => {
    setIsPanelMinimized(isCameraStep);
  }, [isCameraStep]);

  // Mock: trigger detections at specific points in the prototype
  useEffect(() => {
    if (activeOperationId === 'hand-eye-calibration') {
      setRobotData(prev => ({
        ...prev,
        humanDetection: { ...prev.humanDetection, humanDetected: true, obstacleDetected: true },
      }));
    }
  }, [activeOperationId]);

  useEffect(() => {
    if (activeStepId === 'wrist-alignment-left') {
      setRobotData(prev => ({
        ...prev,
        humanDetection: { ...prev.humanDetection, humanDetected: true, obstacleDetected: true },
      }));
    }
  }, [activeStepId]);

  const handleDetectionRefresh = useCallback(() => {
    setRobotData(prev => ({
      ...prev,
      humanDetection: { ...prev.humanDetection, humanDetected: false, obstacleDetected: false },
    }));
  }, []);

  const anyHumanDetected = robotData.humanDetection.enabled && (
    robotData.humanDetection.humanDetected ||
    robotData.humanDetection.obstacleDetected ||
    robotData.humanDetection.fallenDrinkDetected
  );

  const handleStepComplete = useCallback((info: StepCompleteInfo) => {
    if (info.stepId === 'robot-sw-start') {
      setRobotData(prev => ({
        ...prev,
        cameraFeedUrls: {
          cam0: '/frame-627005.png',
          cam1: '/frame-627005.png',
        },
      }));
    }
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <>
        <div className="flex h-screen">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-h-0">
            <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6 bg-background">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink>Deployment</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink>{MOCK_STORE_NAME}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>ロボット初期化</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Button variant="outline" size="sm">
                  店舗を変更
                </Button>
                <span>{MOCK_STORE_NAME} (Robot ID: {MOCK_ROBOT_ID})</span>
              </div>
            </header>

            <main className="flex-1 overflow-hidden flex min-h-0 relative">
              <div className="flex-1 overflow-hidden">
                <RobotInit
                  onStepComplete={handleStepComplete}
                  onOperationChange={setActiveOperationId}
                  onActiveStepChange={setActiveStepId}
                  cameraFeedUrls={robotData.cameraFeedUrls}
                  anyHumanDetected={anyHumanDetected}
                />
              </div>

              {/* Inline panel — hidden during camera steps */}
              {!isCameraStep && (
                <BreathingPanel robotData={robotData} activeStepId={activeStepId} onRefresh={handleDetectionRefresh} />
              )}

              {/* Floating HUD during camera steps */}
              {isCameraStep && (
                isPanelMinimized ? (
                  /* Minimized pill */
                  <button
                    type="button"
                    className={`absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-lg transition-colors ${anyHumanDetected ? 'border-red-400 bg-red-50 hover:bg-red-100' : 'border bg-background/95 backdrop-blur-sm hover:bg-muted'}`}
                    onClick={() => setIsPanelMinimized(false)}
                  >
                    {anyHumanDetected && (
                      <span
                        className="material-symbols-outlined select-none text-red-500"
                        style={{ fontSize: 13, lineHeight: 1, width: 13, height: 13, display: 'inline-flex', alignItems: 'center', fontVariationSettings: "'wght' 700", WebkitTextStroke: '0.4px currentColor' }}
                      >error</span>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">ロボット状態</span>
                    <ChevronLeft className="size-3 text-muted-foreground" />
                  </button>
                ) : (
                  /* Floating panel */
                  <div className="absolute top-3 right-3 z-20 w-[272px] max-h-[calc(100%-24px)] rounded-xl border shadow-xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-zinc-50 shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">ロボット状態</span>
                      <button
                        type="button"
                        className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-zinc-200 transition-colors"
                        onClick={() => setIsPanelMinimized(true)}
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      <BreathingPanel robotData={robotData} activeStepId={activeStepId} onRefresh={handleDetectionRefresh} floating />
                    </div>
                  </div>
                )
              )}
            </main>
            <div id="robot-init-footer" />
          </div>
        </div>
        <Toaster />
      </>
    </TooltipProvider>
  );
}

export default App;
