import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { AppSidebar } from './components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackStatus = 'not_started' | 'in_progress' | 'completed';
export type CalibrationTarget = 'body' | 'body_and_arm';

interface TrackState {
  status: TrackStatus;
  updatedAt: Date | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_STORE_NAME = 'サンプル店舗';

const STATUS_LABELS: Record<TrackStatus, string> = {
  not_started: '実行前',
  in_progress: '実行中',
  completed: '完了',
};

const CALIBRATION_OPTIONS: { value: CalibrationTarget; label: string; description: string }[] = [
  {
    value: 'body',
    label: 'Bodyのみ',
    description: 'ロボット本体（Body）のジョイントのみをキャリブレーションします。',
  },
  {
    value: 'body_and_arm',
    label: 'Body + Arm',
    description: 'ロボット本体（Body）とアーム（Arm）の両方のジョイントをキャリブレーションします。ジグの取り付け・取り外しが必要です。',
  },
];

// ─── DeploymentPage ───────────────────────────────────────────────────────────

export function DeploymentPage({ onStartRobotInit }: { onStartRobotInit: (includeArm: boolean) => void }) {
  const [tracks, setTracks] = useState<Record<string, TrackState>>({
    store_info:   { status: 'completed', updatedAt: new Date() },
    measurement:  { status: 'not_started', updatedAt: null },
    robot_init:   { status: 'not_started', updatedAt: null },
    stock_shelf:  { status: 'not_started', updatedAt: null },
  });

  const [robotInitDialogOpen, setRobotInitDialogOpen] = useState(false);
  const [calibrationTarget, setCalibrationTarget] = useState<CalibrationTarget>('body');
  const [isStarting, setIsStarting] = useState(false);

  const isStoreInfoComplete = tracks.store_info?.status === 'completed';

  const handleStoreInfoAction = () => {
    setTracks(prev => ({
      ...prev,
      store_info: { status: 'completed', updatedAt: new Date() },
    }));
  };

  const handleRobotInitStart = async () => {
    setIsStarting(true);
    // Simulate a brief delay
    await new Promise(r => setTimeout(r, 400));
    setTracks(prev => ({
      ...prev,
      robot_init: { status: 'in_progress', updatedAt: new Date() },
    }));
    setIsStarting(false);
    setRobotInitDialogOpen(false);
    onStartRobotInit(calibrationTarget === 'body_and_arm');
  };

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6 bg-background">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink>Deployment</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{MOCK_STORE_NAME}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="text-sm font-medium text-muted-foreground">{MOCK_STORE_NAME}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* 店舗情報確認 */}
            <TrackCard
              title="店舗情報を確認"
              description="棚数など店舗に関する情報が正しいか確認します。"
              status={tracks.store_info!.status}
              updatedAt={tracks.store_info!.updatedAt}
              actionLabel={tracks.store_info!.status === 'completed' ? 'やり直す...' : '確認'}
              actionVariant={tracks.store_info!.status === 'completed' ? 'outline' : 'default'}
              isLocked={false}
              onAction={handleStoreInfoAction}
            />

            {/* 店舗計測 */}
            <TrackCard
              title="店舗計測"
              description="ロボットが作業する棚や周辺環境の位置・寸法を計測し、動作に必要な基準データを登録します。"
              status={tracks.measurement!.status}
              updatedAt={tracks.measurement!.updatedAt}
              actionLabel={tracks.measurement!.status === 'completed' ? 'やり直す...' : tracks.measurement!.status === 'in_progress' ? '続ける' : '開始'}
              actionVariant={tracks.measurement!.status === 'completed' ? 'outline' : 'default'}
              isLocked={!isStoreInfoComplete}
              onAction={() => {}}
            />

            {/* ロボット初期化 */}
            <TrackCard
              title="ロボット初期化"
              description="ロボット本体の初期化を行い、ロボットが作業を開始できる状態にします。"
              status={tracks.robot_init!.status}
              updatedAt={tracks.robot_init!.updatedAt}
              actionLabel={tracks.robot_init!.status === 'completed' ? 'やり直す...' : tracks.robot_init!.status === 'in_progress' ? '続ける' : '開始'}
              actionVariant={tracks.robot_init!.status === 'completed' ? 'outline' : 'default'}
              isLocked={!isStoreInfoComplete}
              onAction={() => setRobotInitDialogOpen(true)}
            />

            {/* 在庫棚初期化 */}
            <TrackCard
              title="在庫棚 初期化"
              description="在庫棚の初期化を行い、棚板角度や重量検知が正しく動作するように設定します。"
              status={tracks.stock_shelf!.status}
              updatedAt={tracks.stock_shelf!.updatedAt}
              actionLabel={tracks.stock_shelf!.status === 'completed' ? 'やり直す...' : tracks.stock_shelf!.status === 'in_progress' ? '続ける' : '開始'}
              actionVariant={tracks.stock_shelf!.status === 'completed' ? 'outline' : 'default'}
              isLocked={!isStoreInfoComplete}
              onAction={() => {}}
            />
          </div>
        </main>
      </div>

      {/* ロボット初期化ダイアログ */}
      <AlertDialog open={robotInitDialogOpen} onOpenChange={setRobotInitDialogOpen}>
        <AlertDialogContent>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <AlertDialogTitle>ロボット初期化</AlertDialogTitle>
              <AlertDialogDescription>
                ジョイントキャリブレーションの対象を選択してください。
              </AlertDialogDescription>
            </div>
            <AlertDialogCancel asChild>
              <button className="mt-0.5 shrink-0 rounded-sm opacity-60 transition-opacity hover:opacity-100">
                <X className="size-4" />
                <span className="sr-only">閉じる</span>
              </button>
            </AlertDialogCancel>
          </div>

          <RadioGroup
            value={calibrationTarget}
            onValueChange={v => setCalibrationTarget(v as CalibrationTarget)}
            className="gap-3"
          >
            {CALIBRATION_OPTIONS.map(opt => (
              <label
                key={opt.value}
                htmlFor={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:border-primary/60 hover:bg-muted/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted/40"
              >
                <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.description}</span>
                </div>
              </label>
            ))}
          </RadioGroup>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">閉じる</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => void handleRobotInitStart()} disabled={isStarting}>
                {isStarting ? <Loader2 className="size-4 animate-spin" /> : null}
                開始
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── TrackCard ────────────────────────────────────────────────────────────────

function TrackCard({
  title, description, status, updatedAt,
  actionLabel, actionVariant = 'default', isLocked, onAction,
}: {
  title: string;
  description: string;
  status: TrackStatus;
  updatedAt: Date | null;
  actionLabel: string;
  actionVariant?: 'default' | 'outline';
  isLocked: boolean;
  onAction: () => void;
}) {
  const progressPercent = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
  const barColor = status === 'completed' ? 'bg-green-600' : 'bg-primary';
  const updatedAtLabel = updatedAt
    ? updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    : '--';

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusIndicator status={status} />
          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">最終更新: {updatedAtLabel}</div>
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-auto space-y-6">
        <div className="space-y-2">
          <div className="text-lg font-semibold">{progressPercent}%</div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {isLocked
            ? <div className="text-xs text-muted-foreground">店舗情報の確認が完了していません</div>
            : <div />
          }
          <Button
            disabled={isLocked}
            onClick={onAction}
            className="min-w-[96px]"
            variant={actionVariant}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: TrackStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-4" />
      </span>
    );
  }
  return (
    <span className={`inline-flex size-7 rounded-full border-2 ${status === 'in_progress' ? 'border-primary' : 'border-muted-foreground/50'}`} />
  );
}
