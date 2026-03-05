import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from './components/app-sidebar';
import { BreathingPanel, type RobotData } from './components/BreathingPanel';
import { CameraLiveView } from './components/camera-live-view';
import { Button } from './components/ui/button';
import { Switch } from './components/ui/switch';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './components/ui/input-group';
import { Stepper, type StepGroup } from './components/ui/stepper';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from './components/ui/breadcrumb';
import { mockApi } from './lib/mock-api';

// ─── Assist settings ─────────────────────────────────────────────────────────

type GridColorKey = 'magenta' | 'cyan' | 'lime';
interface CameraAssistSettings {
  showGrid: boolean; gridColor: GridColorKey;
  gridOpacity: number; gridYOffset: number;
  brightness: number; contrast: number; grayscale: number;
  invert: number; saturate: number; sepia: number;
}
const ASSIST_KEY = 'robotInit.wristAlignment.cameraAssist.v1';
const ASSIST_DEFAULTS: CameraAssistSettings = {
  showGrid: true, gridColor: 'magenta', gridOpacity: 45, gridYOffset: 50,
  brightness: 100, contrast: 100, grayscale: 0, invert: 0, saturate: 100, sepia: 0,
};
const GRID_COLORS: { key: GridColorKey; label: string; rgb: string }[] = [
  { key: 'magenta', label: 'マゼンタ', rgb: '217, 70, 239' },
  { key: 'cyan',    label: 'シアン',   rgb: '87, 233, 255' },
  { key: 'lime',    label: 'ライム',   rgb: '154, 255, 0'  },
];
const GRID_SLIDERS = [
  { key: 'gridOpacity' as const, label: 'グリッド不透明度', min: 0, max: 100 },
  { key: 'gridYOffset' as const, label: 'グリッドYオフセット', min: 0, max: 100 },
];
const IMAGE_SLIDERS = [
  { key: 'brightness' as const, label: '明るさ',         min: 0, max: 200 },
  { key: 'contrast'   as const, label: 'コントラスト',   min: 0, max: 200 },
  { key: 'grayscale'  as const, label: 'グレースケール', min: 0, max: 100 },
  { key: 'invert'     as const, label: '反転',           min: 0, max: 100 },
  { key: 'saturate'   as const, label: '彩度',           min: 0, max: 200 },
  { key: 'sepia'      as const, label: 'セピア',         min: 0, max: 100 },
];
const clamp = (v: number, mn: number, mx: number) => Math.min(mx, Math.max(mn, v));
const toNum = (v: unknown, mn: number, mx: number, fb: number) => { const n = Number(v); return Number.isFinite(n) ? clamp(n, mn, mx) : fb; };
function readAssist(): CameraAssistSettings {
  try {
    const raw = localStorage.getItem(ASSIST_KEY);
    if (!raw) return ASSIST_DEFAULTS;
    const s = JSON.parse(raw) as Record<string, unknown>;
    return {
      showGrid: typeof s.showGrid === 'boolean' ? s.showGrid : true,
      gridColor: s.gridColor === 'magenta' || s.gridColor === 'cyan' || s.gridColor === 'lime' ? s.gridColor : 'magenta',
      gridOpacity: toNum(s.gridOpacity, 0, 100, 80), gridYOffset: toNum(s.gridYOffset, 0, 100, 50),
      brightness: toNum(s.brightness, 0, 200, 100), contrast:   toNum(s.contrast,   0, 200, 100),
      grayscale:  toNum(s.grayscale,  0, 100, 0),   invert:     toNum(s.invert,     0, 100, 0),
      saturate:   toNum(s.saturate,   0, 200, 100),  sepia:      toNum(s.sepia,      0, 100, 0),
    };
  } catch { return ASSIST_DEFAULTS; }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function AssistSlider({ label, value, min, max, disabled = false, onChange }: {
  label: string; value: number; min: number; max: number; disabled?: boolean; onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-0.5">
      <div className="flex justify-between text-xs text-white/90">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} disabled={disabled}
        className="w-full disabled:opacity-40"
        onChange={e => onChange(toNum(e.target.value, min, max, value))} />
    </label>
  );
}

function AssistPanel({ assist, setAssist }: {
  assist: CameraAssistSettings;
  setAssist: (next: CameraAssistSettings) => void;
}) {
  const save = (next: CameraAssistSettings) => {
    setAssist(next);
    try { localStorage.setItem(ASSIST_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return (
    <div className="space-y-3">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 cursor-pointer select-none">
            <Switch checked={assist.showGrid} onCheckedChange={v => save({ ...assist, showGrid: v })} />
            <span>ガイドグリッド</span>
          </label>
          <div className="flex gap-1">
            {GRID_COLORS.map(opt => (
              <button key={opt.key} type="button" title={opt.label}
                className={`size-4 rounded-sm border transition-shadow ${opt.key === assist.gridColor ? 'ring-2 ring-offset-1 ring-offset-black/50 ring-white' : ''}`}
                style={{ backgroundColor: `rgb(${opt.rgb})`, borderColor: 'rgba(0,0,0,0.3)' }}
                onClick={() => save({ ...assist, gridColor: opt.key })} />
            ))}
          </div>
        </div>
        {GRID_SLIDERS.map(s => (
          <AssistSlider key={s.key} label={s.label} min={s.min} max={s.max}
            value={assist[s.key]} disabled={!assist.showGrid}
            onChange={v => save({ ...assist, [s.key]: v })} />
        ))}
      </section>
      <section className="space-y-2">
        <div className="text-xs font-semibold text-white/80">カメラ映像調整</div>
        {IMAGE_SLIDERS.map(s => (
          <AssistSlider key={s.key} label={s.label} min={s.min} max={s.max}
            value={assist[s.key]} onChange={v => save({ ...assist, [s.key]: v })} />
        ))}
      </section>
      <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => save({ ...ASSIST_DEFAULTS })}>
        リセット
      </Button>
    </div>
  );
}

// ─── Shared logic hook ────────────────────────────────────────────────────────

const MOCK_ROBOT_ID = 'robot-001';
const LEFT_STEP_ID = 'wrist-alignment-left';
const DEBOUNCE_MS = 350;
const isOk = (r: { status: number; errors: unknown[] }) => r.status >= 200 && r.status < 300 && r.errors.length === 0;

function useWristAlignment(onCompleteStep: (id: string, c?: boolean) => void) {
  const robotId = MOCK_ROBOT_ID;
  const cameraFeedUrls = { cam0: '/frame-627005.png', cam1: '/frame-627005.png' };

  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedLeft, setHasSavedLeft] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [movementDistance, setMovementDistance] = useState('');
  const [rollInput, setRollInput] = useState('0');
  const [pitchInput, setPitchInput] = useState('0');
  const [alignmentStatus, setAlignmentStatus] = useState<'idle'|'pending'|'syncing'|'success'|'invalid'|'error'>('idle');
  const [alignmentError, setAlignmentError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [assist, setAssist] = useState<CameraAssistSettings>(() => readAssist());

  const gridColorRgb = useMemo(
    () => GRID_COLORS.find(o => o.key === assist.gridColor)?.rgb ?? GRID_COLORS[0].rgb,
    [assist.gridColor],
  );
  const imageFilter = useMemo(
    () => `brightness(${assist.brightness}%) contrast(${assist.contrast}%) grayscale(${assist.grayscale}%) invert(${assist.invert}%) saturate(${assist.saturate}%) sepia(${assist.sepia}%)`,
    [assist.brightness, assist.contrast, assist.grayscale, assist.invert, assist.saturate, assist.sepia],
  );

  const parsedDistance = Number(movementDistance);
  const hasValidDistance = movementDistance.trim() !== '' && Number.isFinite(parsedDistance) && parsedDistance > 0;

  const scheduleAlignment = useCallback((nextRoll: string, nextPitch: string) => {
    if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    const pr = Number(nextRoll), pp = Number(nextPitch);
    const valid = nextRoll.trim() !== '' && nextPitch.trim() !== '' && Number.isFinite(pr) && Number.isFinite(pp);
    if (!valid) { setAlignmentStatus('invalid'); setAlignmentError('数値を入力してください'); return; }
    timerRef.current = window.setTimeout(() => {
      setAlignmentStatus('syncing'); setAlignmentError(null);
      void (async () => {
        try {
          const init = await mockApi.wristAlignmentInitiate(robotId, { rollDeg: pr, pitchDeg: pp, yawDeg: 0 });
          if (!isOk(init)) { setAlignmentStatus('error'); setAlignmentError('送信に失敗しました'); return; }
          const conf = await mockApi.wristAlignmentConfirm(robotId);
          if (!isOk(conf)) { setAlignmentStatus('error'); setAlignmentError('送信に失敗しました'); return; }
          setAlignmentStatus('success');
        } catch { setAlignmentStatus('error'); setAlignmentError('送信に失敗しました'); }
      })();
    }, DEBOUNCE_MS);
  }, [robotId]);

  const cancelAlignment = useCallback(() => {
    if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setAlignmentStatus('idle'); setAlignmentError(null);
  }, []);

  useEffect(() => cancelAlignment, [cancelAlignment]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const cmdId = await mockApi.saveWristAlignmentInitiate(robotId);
    if (cmdId?.value) {
      const result = await mockApi.saveWristAlignmentConfirm(cmdId.value);
      if (result) { setHasSavedLeft(true); toast.success('左カメラの設定を保存しました'); onCompleteStep(LEFT_STEP_ID, true); }
    }
    setIsSaving(false);
  };

  const handleMove = async (axis: 'x'|'z', direction: 1|-1) => {
    if (isMoving) return;
    const dist = Math.abs(parsedDistance);
    if (!Number.isFinite(dist) || dist <= 0) { toast.error('移動距離を入力してください'); return; }
    setIsMoving(true);
    await mockApi.moveRailPositionInitiate(robotId, { x: axis === 'x' ? direction * dist : 0, y: 0, z: axis === 'z' ? direction * dist : 0 });
    await mockApi.moveRailPositionConfirm(robotId);
    setIsMoving(false);
  };

  const alignmentStatusMeta = useMemo(() => {
    if (alignmentStatus === 'syncing') return { tone: 'text-muted-foreground', text: '送信中...', showSpinner: true };
    if (alignmentStatus === 'error')   return { tone: 'text-red-600',  text: alignmentError ?? '送信に失敗しました', showSpinner: false };
    if (alignmentStatus === 'invalid') return { tone: 'text-amber-600', text: alignmentError ?? '数値を入力してください', showSpinner: false };
    if (alignmentStatus === 'success') return { tone: 'text-green-600', text: '同期済み', showSpinner: false };
    return { tone: 'text-amber-600', text: '未同期', showSpinner: false };
  }, [alignmentError, alignmentStatus]);

  return {
    robotId, cameraFeedUrls,
    isSaving, hasSavedLeft, isMoving,
    movementDistance, setMovementDistance,
    rollInput, setRollInput, pitchInput, setPitchInput,
    alignmentStatusMeta, scheduleAlignment,
    handleSave, handleMove, hasValidDistance,
    showPanel, setShowPanel,
    assist, setAssist, gridColorRgb, imageFilter,
  };
}

type WristState = ReturnType<typeof useWristAlignment>;

// ─── Shared upper group (Variant B overlay, bg-black/30) ─────────────────────

function UpperGroup({ state: s }: { state: WristState }) {
  return (
    <div className="shrink-0 pb-4 -mx-6 px-6 bg-background border-b border-border relative z-10" style={{ boxShadow: '0 4px 8px -2px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-lg font-semibold">左カメラ (cam_0)の調整</h3>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none ml-auto">
          <span>アシスト調整</span>
          <Switch checked={s.showPanel} onCheckedChange={s.setShowPanel} />
        </label>
      </div>
      <div className="relative">
        <CameraLiveView feedUrl={s.cameraFeedUrls.cam0} showGrid={s.assist.showGrid}
          gridColorRgb={s.gridColorRgb} gridOpacity={s.assist.gridOpacity}
          gridYOffset={s.assist.gridYOffset} imageFilter={s.imageFilter} />
        {s.showPanel && (
          <div className="absolute top-0 right-0 bottom-0 w-56 overflow-y-auto p-3 rounded-r-md bg-black/45 border-l border-white/10">
            <AssistPanel assist={s.assist} setAssist={s.setAssist} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reusable lower section components ───────────────────────────────────────

function MovementSection({ state: s, compact = false }: { state: WristState; compact?: boolean }) {
  const hasRobotId = Boolean(s.robotId);
  const moveBtn = (axis: 'x'|'z', dir: 1|-1, Icon: React.ElementType) => (
    <Button size="icon" variant="default" className="size-8" disabled={!hasRobotId || !s.hasValidDistance || s.isMoving}
      onClick={() => void s.handleMove(axis, dir)}>
      {s.isMoving ? <Loader2 className="size-3 animate-spin" /> : <Icon className="size-3" />}
    </Button>
  );
  return (
    <section className={compact ? 'space-y-2' : 'space-y-2 p-4 rounded-md bg-muted'}>
      <div className={compact ? 'text-sm font-semibold' : 'text-base font-semibold'}>
        {compact ? 'レール移動' : 'レール上でロボットを移動'}
      </div>
      {!compact && <p className="text-sm text-muted-foreground">現在位置を原点として上下左右へロボットを移動します。</p>}
      <div className="flex gap-6 items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <InputGroup className="bg-white">
            <InputGroupInput type="number" value={s.movementDistance} onChange={e => s.setMovementDistance(e.target.value)} />
            <InputGroupAddon align="inline-end"><InputGroupText>mm</InputGroupText></InputGroupAddon>
          </InputGroup>
          {!compact && <div className="text-sm text-muted-foreground">現在位置: —</div>}
          <div className="flex flex-wrap gap-1.5">
            {[{l:'1cm',v:10},{l:'5cm',v:50},{l:'10cm',v:100},{l:'50cm',v:500},{l:'1m',v:1000}].map(p => (
              <Button key={p.l} variant="outline" size="sm" onClick={() => s.setMovementDistance(String(p.v))}>{p.l}</Button>
            ))}
          </div>
        </div>
        <div className="w-24 shrink-0">
          <div className="flex flex-col items-center gap-1 mt-1">
            {moveBtn('z', 1, ChevronUp)}
            <div className="flex gap-1">
              {moveBtn('x', -1, ChevronLeft)}
              {moveBtn('x', 1, ChevronRight)}
            </div>
            {moveBtn('z', -1, ChevronDown)}
          </div>
        </div>
      </div>
    </section>
  );
}

function AlignmentSection({ state: s, compact = false }: { state: WristState; compact?: boolean }) {
  const hasRobotId = Boolean(s.robotId);
  return (
    <section className="space-y-2">
      <div className={compact ? 'text-sm font-semibold' : 'text-base font-semibold'}>
        {compact ? '水平調整' : 'ロボットリストの角度を水平に調整'}
      </div>
      {!compact && <p className="text-sm text-muted-foreground">ロボットのリスト角度を調整し、カメラと棚の水平を一致させます。</p>}
      {!compact && <div className="rounded-md bg-muted/70 p-4 text-center text-muted-foreground text-sm">Roll/Pitchについて (説明イメージ)</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Roll</span>
          <InputGroup>
            <InputGroupInput type="number" step="0.1" min="-5" max="5" value={s.rollInput}
              onChange={e => { s.setRollInput(e.target.value); s.scheduleAlignment(e.target.value, s.pitchInput); }} />
            <InputGroupAddon align="inline-end"><InputGroupText>°</InputGroupText></InputGroupAddon>
          </InputGroup>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Pitch</span>
          <InputGroup>
            <InputGroupInput type="number" step="0.1" min="-5" max="5" value={s.pitchInput}
              onChange={e => { s.setPitchInput(e.target.value); s.scheduleAlignment(s.rollInput, e.target.value); }} />
            <InputGroupAddon align="inline-end"><InputGroupText>°</InputGroupText></InputGroupAddon>
          </InputGroup>
        </label>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">送信状況:</span>
        <span className={`inline-flex items-center gap-1 font-medium ${s.alignmentStatusMeta.tone}`}>
          {s.alignmentStatusMeta.showSpinner && <Loader2 className="size-3 animate-spin" />}
          {s.alignmentStatusMeta.text}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 mb-6">
        <Button variant="default" disabled={!hasRobotId || s.isSaving || s.hasSavedLeft} onClick={() => void s.handleSave()}>
          {s.isSaving ? '保存中...' : '設定を保存して右カメラ(cam_1)の調整に進む'}
        </Button>
      </div>
    </section>
  );
}

// ─── Variant A: 2カラム (movement left, alignment right) ─────────────────────

function VariantA({ onCompleteStep }: { onCompleteStep: (id: string, c?: boolean) => void }) {
  const s = useWristAlignment(onCompleteStep);
  return (
    <div className="flex flex-col flex-1">
      <UpperGroup state={s} />
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
          <div className="pt-4 pb-6 grid grid-cols-2 gap-6 items-start">
            <MovementSection state={s} />
            <AlignmentSection state={s} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant B: タブ切り替え ──────────────────────────────────────────────────

function VariantB({ onCompleteStep }: { onCompleteStep: (id: string, c?: boolean) => void }) {
  const s = useWristAlignment(onCompleteStep);
  const [tab, setTab] = useState<'move'|'align'>('align');
  return (
    <div className="flex flex-col flex-1">
      <UpperGroup state={s} />
      <div className="shrink-0 flex gap-0 border-b border-border -mx-6 px-6">
        {([['move', 'レール移動'], ['align', '水平調整']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-4">
          {tab === 'move'
            ? <MovementSection state={s} />
            : <AlignmentSection state={s} />
          }
        </div>
      </div>
    </div>
  );
}

// ─── Variant C: コンパクト (no descriptions, tight spacing) ──────────────────

function VariantC({ onCompleteStep }: { onCompleteStep: (id: string, c?: boolean) => void }) {
  const s = useWristAlignment(onCompleteStep);
  return (
    <div className="flex flex-col flex-1">
      <UpperGroup state={s} />
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
          <div className="pt-3 pb-6 space-y-4">
            <MovementSection state={s} compact />
            <div className="border-t border-border" />
            <AlignmentSection state={s} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant D: 移動セクション折りたたみ (alignment always visible first) ────

function VariantD({ onCompleteStep }: { onCompleteStep: (id: string, c?: boolean) => void }) {
  const s = useWristAlignment(onCompleteStep);
  const [moveOpen, setMoveOpen] = useState(false);
  return (
    <div className="flex flex-col flex-1">
      <UpperGroup state={s} />
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
          <div className="pt-4 pb-6 space-y-4">
            <AlignmentSection state={s} />
            <section className="rounded-md border border-border">
              <button type="button" className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors rounded-md"
                onClick={() => setMoveOpen(v => !v)}>
                <span>レール移動</span>
                {moveOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </button>
              {moveOpen && (
                <div className="px-4 pb-4 pt-1">
                  <MovementSection state={s} compact />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Static stepper groups ────────────────────────────────────────────────────

const STEPPER_GROUPS: StepGroup[] = [
  { id: 'joint-calibration', label: 'ジョイントキャリブレーション', state: 'complete',
    steps: [
      { id: 'joint-conn',   label: '接続確認',      state: 'complete' },
      { id: 'joint-run',    label: '実行',           state: 'complete' },
      { id: 'verify-joint', label: '結果確認',       state: 'complete' },
      { id: 'jig-removal',  label: 'ジグ取り外し',  state: 'complete' },
    ] },
  { id: 'robot-sw', label: 'ロボットSW起動', state: 'complete',
    steps: [{ id: 'robot-sw-start', label: 'ロボットSW起動', state: 'complete' }] },
  { id: 'hand-eye-calibration', label: 'ハンドアイキャリブレーション', state: 'complete',
    steps: [
      { id: 'hand-eye-calibration-left',  label: '左カメラ (cam_0)', state: 'complete' },
      { id: 'hand-eye-calibration-right', label: '右カメラ (cam_1)', state: 'complete' },
    ] },
  { id: 'wrist-alignment', label: '水平アラインメント', state: 'active',
    steps: [
      { id: 'wrist-snapshot',        label: '初期設定',         state: 'complete' },
      { id: 'wrist-alignment-left',  label: '左カメラ (cam_0)', state: 'active'   },
      { id: 'wrist-alignment-right', label: '右カメラ (cam_1)', state: 'idle'     },
    ] },
];

const MOCK_ROBOT_DATA: RobotData = {
  humanDetection: { enabled: true, humanDetected: false, obstacleDetected: false, fallenDrinkDetected: false },
  robotConnected: true,
  cameraFeedUrls: { cam0: '/frame-627005.png', cam1: '/frame-627005.png' },
};

// ─── Full-screen shell ────────────────────────────────────────────────────────

function CompareShell({
  variantLabel,
  component: OperationComponent,
}: {
  variantLabel: string;
  component: React.ComponentType<{ onCompleteStep: (id: string, c?: boolean) => void }>;
}) {
  return (
    <div className="flex h-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6 bg-background">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink>Deployment</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink>サンプル店舗</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>ロボット初期化</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-medium">{variantLabel}</span>
        </header>

        <main className="flex-1 overflow-hidden flex min-h-0">
          <div className="flex-1 overflow-hidden h-full">
            <div className="grid md:grid-cols-[320px_1fr] h-full">
              <div className="p-4 border-r h-full overflow-y-auto">
                <Stepper groups={STEPPER_GROUPS} activeStepId="wrist-alignment-left" />
              </div>
              <div className="flex h-full flex-col min-w-0">
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="space-y-1 shrink-0 p-6 pb-4">
                    <h1 className="text-2xl font-semibold">水平アラインメント</h1>
                    <p className="text-muted-foreground">棚の角度に合わせて手首の姿勢を調整し、カメラ映像を正しい基準にそろえます。</p>
                  </header>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
                    <div className="px-6 flex flex-col flex-1">
                      <OperationComponent onCompleteStep={() => {}} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <BreathingPanel robotData={MOCK_ROBOT_DATA} activeStepId="wrist-alignment-left" />
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-6 px-4 py-3 border-t bg-background shrink-0">
          <button type="button" className="inline-flex items-center gap-1 text-base font-semibold text-foreground hover:underline">
            <span>左カメラ (cam_0)をスキップ</span>
            <ChevronRight className="size-5" />
          </button>
          <Button disabled>右カメラ (cam_1)の調整へ進む</Button>
        </footer>
      </div>
    </div>
  );
}

// ─── Compare Page ─────────────────────────────────────────────────────────────

const VARIANTS = [
  { id: 'A', label: 'A — 2カラム',         component: VariantA },
  { id: 'B', label: 'B — タブ切り替え',    component: VariantB },
  { id: 'C', label: 'C — コンパクト',      component: VariantC },
  { id: 'D', label: 'D — 折りたたみ移動',  component: VariantD },
];

export function ComparePage() {
  const [active, setActive] = useState('A');
  const current = VARIANTS.find(v => v.id === active) ?? VARIANTS[0]!;

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-1 bg-background/95 backdrop-blur border-b border-border px-4 py-2 shadow-sm">
        <span className="text-xs text-muted-foreground mr-2 font-medium">バリアント:</span>
        {VARIANTS.map(v => (
          <button key={v.id} type="button"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${active === v.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActive(v.id)}>
            {v.id}
          </button>
        ))}
        <span className="ml-3 text-xs text-muted-foreground">{current.label}</span>
      </div>
      <div style={{ paddingTop: '41px', height: '100dvh', boxSizing: 'border-box' }}>
        <CompareShell variantLabel={current.label} component={current.component} />
      </div>
    </div>
  );
}
