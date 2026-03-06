import { useState, useCallback } from 'react';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { AppSidebar } from './components/app-sidebar';
import { Button } from './components/ui/button';
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
import { DeploymentPage } from './deployment-page';

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

type Page = 'deployment' | 'robot-init';

function App() {
  const [page, setPage] = useState<Page>('deployment');
  const [includeArm, setIncludeArm] = useState(false);
  const [robotData, setRobotData] = useState<RobotData>(initialRobotData);
  const [activeOperationId, setActiveOperationId] = useState<string>('');
  const [activeStepId, setActiveStepId] = useState<string>('');

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

  const handleStartRobotInit = useCallback((arm: boolean) => {
    setIncludeArm(arm);
    setPage('robot-init');
  }, []);

  if (page === 'deployment') {
    return (
      <TooltipProvider delayDuration={300}>
        <>
          <DeploymentPage onStartRobotInit={handleStartRobotInit} />
          <Toaster />
        </>
      </TooltipProvider>
    );
  }

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
                    <BreadcrumbLink className="cursor-pointer" onClick={() => setPage('deployment')}>
                      Deployment
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => setPage('deployment')}>
                      {MOCK_STORE_NAME}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>ロボット初期化</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Button variant="outline" size="sm" onClick={() => setPage('deployment')}>
                  ← 戻る
                </Button>
                <span>{MOCK_STORE_NAME} (Robot ID: {MOCK_ROBOT_ID})</span>
              </div>
            </header>

            <main className="flex-1 overflow-hidden flex min-h-0 relative">
              <div className="flex-1 overflow-hidden h-full">
                <RobotInit
                  includeArm={includeArm}
                  onStepComplete={handleStepComplete}
                  onOperationChange={setActiveOperationId}
                  onActiveStepChange={setActiveStepId}
                  cameraFeedUrls={robotData.cameraFeedUrls}
                  anyHumanDetected={anyHumanDetected}
                />
              </div>

              <BreathingPanel robotData={robotData} activeStepId={activeStepId} onRefresh={handleDetectionRefresh} />
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
