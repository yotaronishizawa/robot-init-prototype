import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../ui/input-group';
import { toast } from 'sonner';
import { mockApi } from '../../lib/mock-api';
import { CameraLiveView } from '../camera-live-view';
import type { OperationProps } from '../../types/operation';

// ---- Assist settings ----
type GridColorKey = 'magenta' | 'cyan' | 'lime';
interface CameraAssistSettings {
  showGrid: boolean;
  gridColor: GridColorKey;
  gridOpacity: number;
  gridYOffset: number;
  brightness: number;
  contrast: number;
  grayscale: number;
  invert: number;
  saturate: number;
  sepia: number;
}
const CAMERA_ASSIST_STORAGE_KEY = 'robotInit.wristAlignment.cameraAssist.v1';
const CAMERA_ASSIST_DEFAULTS: CameraAssistSettings = {
  showGrid: true, gridColor: 'magenta', gridOpacity: 45, gridYOffset: 50,
  brightness: 100, contrast: 100, grayscale: 0, invert: 0, saturate: 100, sepia: 0,
};
const GRID_COLOR_OPTIONS: { key: GridColorKey; label: string; rgb: string }[] = [
  { key: 'magenta', label: 'マゼンタ', rgb: '217, 70, 239' },
  { key: 'cyan',    label: 'シアン',   rgb: '87, 233, 255' },
  { key: 'lime',    label: 'ライム',   rgb: '154, 255, 0'  },
];
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const toNum = (v: unknown, min: number, max: number, fb: number) => {
  const n = Number(v); return Number.isFinite(n) ? clamp(n, min, max) : fb;
};
function readAssist(): CameraAssistSettings {
  try {
    const raw = localStorage.getItem(CAMERA_ASSIST_STORAGE_KEY);
    if (!raw) return CAMERA_ASSIST_DEFAULTS;
    const s = JSON.parse(raw) as Record<string, unknown>;
    return {
      showGrid: typeof s.showGrid === 'boolean' ? s.showGrid : true,
      gridColor: s.gridColor === 'magenta' || s.gridColor === 'cyan' || s.gridColor === 'lime' ? s.gridColor : CAMERA_ASSIST_DEFAULTS.gridColor,
      gridOpacity: toNum(s.gridOpacity, 0, 100, 80),
      gridYOffset: toNum(s.gridYOffset, 0, 100, 50),
      brightness:  toNum(s.brightness,  0, 200, 100),
      contrast:    toNum(s.contrast,    0, 200, 100),
      grayscale:   toNum(s.grayscale,   0, 100, 0),
      invert:      toNum(s.invert,      0, 100, 0),
      saturate:    toNum(s.saturate,    0, 200, 100),
      sepia:       toNum(s.sepia,       0, 100, 0),
    };
  } catch { return CAMERA_ASSIST_DEFAULTS; }
}
type AssistSliderKey = 'gridOpacity' | 'gridYOffset' | 'brightness' | 'contrast' | 'grayscale' | 'invert' | 'saturate' | 'sepia';
const GRID_SLIDERS: { key: AssistSliderKey; label: string; min: number; max: number }[] = [
  { key: 'gridOpacity', label: 'グリッド不透明度', min: 0, max: 100 },
  { key: 'gridYOffset', label: 'グリッドYオフセット', min: 0, max: 100 },
];
const IMAGE_SLIDERS: { key: AssistSliderKey; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: '明るさ',       min: 0, max: 200 },
  { key: 'contrast',   label: 'コントラスト', min: 0, max: 200 },
  { key: 'grayscale',  label: 'グレースケール', min: 0, max: 100 },
  { key: 'invert',     label: '反転',         min: 0, max: 100 },
  { key: 'saturate',   label: '彩度',         min: 0, max: 200 },
  { key: 'sepia',      label: 'セピア',       min: 0, max: 100 },
];
function AssistSlider({ label, value, min, max, disabled = false, onValueChange }: {
  label: string; value: number; min: number; max: number; disabled?: boolean;
  onValueChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-0.5">
      <div className="flex items-center justify-between text-xs text-white/90">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} disabled={disabled}
        className="w-full disabled:opacity-40"
        onChange={e => onValueChange(toNum(e.target.value, min, max, value))} />
    </label>
  );
}

const SNAPSHOT_STEP_ID = 'wrist-snapshot';
const LEFT_STEP_ID = 'wrist-alignment-left';
const ALIGNMENT_STATUS_DEBOUNCE_MS = 350;

const isResponseSuccess = (response: { status: number; errors: unknown[] }) =>
  response.status >= 200 && response.status < 300 && response.errors.length === 0;

export function WristAlignmentOperation({ robotId, activeStepId, onCompleteStep, onPoseChange, onPositionChange, cameraFeedUrls, anyHumanDetected }: OperationProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedLeft, setHasSavedLeft] = useState(false);
  const [hasSavedRight, setHasSavedRight] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [movementDistance, setMovementDistance] = useState('');
  const [rollInput, setRollInput] = useState('0');
  const [pitchInput, setPitchInput] = useState('0');
  const [alignmentStatus, setAlignmentStatus] = useState<
    'idle' | 'pending' | 'syncing' | 'success' | 'invalid' | 'error'
  >('idle');
  const [alignmentError, setAlignmentError] = useState<string | null>(null);
  const alignmentTimerRef = useRef<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [assist, setAssist] = useState<CameraAssistSettings>(() => readAssist());

  const setAssistValue = (key: AssistSliderKey, value: number) => {
    const next = { ...assist, [key]: value };
    setAssist(next);
    try { localStorage.setItem(CAMERA_ASSIST_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const gridColorRgb = useMemo(
    () => GRID_COLOR_OPTIONS.find(o => o.key === assist.gridColor)?.rgb ?? GRID_COLOR_OPTIONS[0].rgb,
    [assist.gridColor],
  );
  const imageFilter = useMemo(
    () => `brightness(${assist.brightness}%) contrast(${assist.contrast}%) grayscale(${assist.grayscale}%) invert(${assist.invert}%) saturate(${assist.saturate}%) sepia(${assist.sepia}%)`,
    [assist.brightness, assist.contrast, assist.grayscale, assist.invert, assist.saturate, assist.sepia],
  );

  const isLeft = activeStepId === LEFT_STEP_ID;
  const robotCamera = isLeft ? 'CAMERA0' : 'CAMERA1';
  const hasRobotId = Boolean(robotId);
  const parsedDistance = Number(movementDistance);
  const hasValidDistance = movementDistance.trim() !== '' && Number.isFinite(parsedDistance) && parsedDistance > 0;
  const blocked = !!anyHumanDetected;

  const scheduleAlignment = useCallback(
    (nextRoll: string, nextPitch: string) => {
      if (alignmentTimerRef.current !== null) {
        window.clearTimeout(alignmentTimerRef.current);
        alignmentTimerRef.current = null;
      }
      if (!robotId) return;

      const parsedRoll = Number(nextRoll);
      const parsedPitch = Number(nextPitch);
      const hasValidAngles =
        nextRoll.trim() !== '' && nextPitch.trim() !== '' &&
        Number.isFinite(parsedRoll) && Number.isFinite(parsedPitch);

      if (!hasValidAngles) {
        setAlignmentStatus('invalid');
        setAlignmentError('数値を入力してください');
        return;
      }

      alignmentTimerRef.current = window.setTimeout(() => {
        setAlignmentStatus('syncing');
        setAlignmentError(null);
        void (async () => {
          try {
            const orientation = { rollDeg: parsedRoll, pitchDeg: parsedPitch, yawDeg: 0 };
            const initiateResponse = await mockApi.wristAlignmentInitiate(robotId, orientation);
            if (!isResponseSuccess(initiateResponse)) {
              setAlignmentStatus('error');
              setAlignmentError('送信に失敗しました');
              return;
            }
            const confirmResponse = await mockApi.wristAlignmentConfirm(robotId);
            if (!isResponseSuccess(confirmResponse)) {
              setAlignmentStatus('error');
              setAlignmentError('送信に失敗しました');
              return;
            }
            setAlignmentStatus('success');
          } catch {
            setAlignmentStatus('error');
            setAlignmentError('送信に失敗しました');
          }
        })();
      }, ALIGNMENT_STATUS_DEBOUNCE_MS);
    },
    [robotId],
  );

  const cancelAlignment = useCallback(() => {
    if (alignmentTimerRef.current !== null) {
      window.clearTimeout(alignmentTimerRef.current);
      alignmentTimerRef.current = null;
    }
    setAlignmentStatus('idle');
    setAlignmentError(null);
  }, []);

  useEffect(() => cancelAlignment, [cancelAlignment]);
  useEffect(() => { cancelAlignment(); }, [activeStepId, cancelAlignment]);

  const handleSave = async () => {
    if (!robotId || isSaving) return;
    setIsSaving(true);
    const cmdId = await mockApi.saveWristAlignmentInitiate(robotId);
    if (cmdId?.value) {
      const result = await mockApi.saveWristAlignmentConfirm(cmdId.value);
      if (result) {
        if (isLeft) {
          setHasSavedLeft(true);
          toast.success('左カメラの設定を保存しました');
        } else {
          setHasSavedRight(true);
          toast.success('右カメラの設定を保存しました');
        }
        onCompleteStep(activeStepId, true);
      }
    }
    setIsSaving(false);
  };

  const handleMove = async (axis: 'x' | 'z', direction: 1 | -1) => {
    if (!robotId || isMoving) return;
    const distance = Math.abs(Number(movementDistance));
    if (!Number.isFinite(distance) || distance <= 0) {
      toast.error('移動距離を入力してください');
      return;
    }
    const xPosition = axis === 'x' ? direction * distance : 0;
    const zPosition = axis === 'z' ? direction * distance : 0;
    const vector = { x: xPosition, y: 0, z: zPosition };
    setIsMoving(true);
    await mockApi.moveRailPositionInitiate(robotId, vector);
    await mockApi.moveRailPositionConfirm(robotId);
    // Propagate position delta (mm → metres) to the panel
    onPositionChange?.(xPosition / 1000, zPosition / 1000);
    setIsMoving(false);
  };

  const saveButtonLabel = isLeft ? '設定を保存して右カメラ(cam_1)の調整に進む' : '設定を保存';
  const saveButtonDisabled = isLeft ? hasSavedLeft : hasSavedRight;

  const alignmentStatusMeta = useMemo(() => {
    if (alignmentStatus === 'syncing') return { tone: 'text-muted-foreground', text: '送信中...', showSpinner: true };
    if (alignmentStatus === 'error') return { tone: 'text-red-600', text: alignmentError ?? '送信に失敗しました', showSpinner: false };
    if (alignmentStatus === 'invalid') return { tone: 'text-amber-600', text: alignmentError ?? '数値を入力してください', showSpinner: false };
    if (alignmentStatus === 'success') return { tone: 'text-green-600', text: '同期済み', showSpinner: false };
    return { tone: 'text-amber-600', text: '未同期', showSpinner: false };
  }, [alignmentError, alignmentStatus]);

  if (activeStepId === SNAPSHOT_STEP_ID) {
    return <WristSnapshotScreen robotId={robotId} onCompleteStep={onCompleteStep} stepId={activeStepId} />;
  }

  return (
    <div className="flex flex-col flex-1">
      {/* 上グループ: カメラ（固定・フル幅・シャドウ付き） */}
      <div className="shrink-0 pb-4 -mx-6 px-6 bg-background border-b border-border relative z-10" style={{ boxShadow: '0 4px 8px -2px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-semibold">{isLeft ? '左カメラ (cam_0)の調整' : '右カメラ (cam_1)の調整'}</h3>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none ml-auto">
            <span>アシスト調整</span>
            <Switch checked={showPanel} onCheckedChange={setShowPanel} />
          </label>
        </div>
        <div className="relative">
          <CameraLiveView
            robotCamera={robotCamera}
            robotId={robotId}
            feedUrl={isLeft ? cameraFeedUrls?.cam0 : cameraFeedUrls?.cam1}
            showGrid={assist.showGrid}
            gridColorRgb={gridColorRgb}
            gridOpacity={assist.gridOpacity}
            gridYOffset={assist.gridYOffset}
            imageFilter={imageFilter}
          />
          {showPanel && (
            <div className="absolute top-0 right-0 bottom-0 w-56 overflow-y-auto p-3 rounded-r-md bg-black/45 border-l border-white/10">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 cursor-pointer select-none">
                    <Switch
                      checked={assist.showGrid}
                      onCheckedChange={checked => {
                        const next = { ...assist, showGrid: Boolean(checked) };
                        setAssist(next);
                        try { localStorage.setItem(CAMERA_ASSIST_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                      }}
                    />
                    <span>ガイドグリッド</span>
                  </label>
                  <div className="flex gap-1">
                    {GRID_COLOR_OPTIONS.map(opt => {
                      const selected = opt.key === assist.gridColor;
                      return (
                        <button key={opt.key} type="button" title={opt.label}
                          className={`size-4 rounded-sm border transition-shadow ${selected ? 'ring-2 ring-offset-1 ring-offset-black/50 ring-white' : ''}`}
                          style={{ backgroundColor: `rgb(${opt.rgb})`, borderColor: 'rgba(0,0,0,0.3)' }}
                          onClick={() => { const next = { ...assist, gridColor: opt.key }; setAssist(next); try { localStorage.setItem(CAMERA_ASSIST_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ } }}
                        />
                      );
                    })}
                  </div>
                </div>
                {GRID_SLIDERS.map(s => (
                  <AssistSlider key={s.key} label={s.label} min={s.min} max={s.max}
                    value={assist[s.key]} onValueChange={v => setAssistValue(s.key, v)} />
                ))}
              </section>
              <section className="space-y-2">
                <span className="text-xs font-semibold text-white/80">カメラ映像調整</span>
                {IMAGE_SLIDERS.map(s => (
                  <AssistSlider key={s.key} label={s.label} min={s.min} max={s.max}
                    value={assist[s.key]} onValueChange={v => setAssistValue(s.key, v)} />
                ))}
              </section>
              <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => { setAssist({ ...CAMERA_ASSIST_DEFAULTS }); try { localStorage.setItem(CAMERA_ASSIST_STORAGE_KEY, JSON.stringify(CAMERA_ASSIST_DEFAULTS)); } catch { /* ignore */ } }}>
                リセット
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 下グループ: スクロール可能なコントロール */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden space-y-6 pt-4">

          <section className="space-y-2 p-4 rounded-md bg-muted">
            <div className="text-base font-semibold">レール上でロボットを移動</div>
            <p className="text-sm text-muted-foreground">現在位置を原点として上下左右へロボットを移動します。</p>
            <div className="flex gap-8">
              <div className="min-w-0 flex-1 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <div className="mb-1">移動距離</div>
                    <InputGroup className="bg-white">
                      <InputGroupInput
                        type="number"
                        value={movementDistance}
                        onChange={e => setMovementDistance(e.target.value)}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>mm</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </label>
                <div className="text-sm text-muted-foreground">現在位置: —</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '1cm', mm: 10 },
                    { label: '5cm', mm: 50 },
                    { label: '10cm', mm: 100 },
                    { label: '50cm', mm: 500 },
                    { label: '1m', mm: 1000 },
                  ].map(preset => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setMovementDistance(String(preset.mm))}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="w-[120px] shrink-0">
                <div className="flex flex-col aspect-square justify-between mt-4">
                  <Button size="icon" variant="default" className="self-center"
                    disabled={!hasRobotId || !hasValidDistance || isMoving || blocked}
                    onClick={() => void handleMove('z', 1)}>
                    {isMoving ? <Loader2 className="size-4 animate-spin" /> : <ChevronUp className="size-4" />}
                  </Button>
                  <div className="flex justify-between gap-3">
                    <Button size="icon" variant="default"
                      disabled={!hasRobotId || !hasValidDistance || isMoving || blocked}
                      onClick={() => void handleMove('x', -1)}>
                      {isMoving ? <Loader2 className="size-4 animate-spin" /> : <ChevronLeft className="size-4" />}
                    </Button>
                    <Button size="icon" variant="default"
                      disabled={!hasRobotId || !hasValidDistance || isMoving || blocked}
                      onClick={() => void handleMove('x', 1)}>
                      {isMoving ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                    </Button>
                  </div>
                  <Button size="icon" variant="default" className="self-center"
                    disabled={!hasRobotId || !hasValidDistance || isMoving || blocked}
                    onClick={() => void handleMove('z', -1)}>
                    {isMoving ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-base font-semibold">ロボットリストの角度を水平に調整</div>
            <p className="text-sm text-muted-foreground">
              ロボットのリスト角度を調整し、カメラと棚の水平を一致させます。
            </p>
            <div className="flex flex-col gap-3">
              <div className="space-y-2">
                <div className="rounded-md bg-muted/70 p-4 text-center text-muted-foreground text-sm">
                  Roll/Pitchについて (説明イメージ)
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-2 text-sm">
                      <span>Roll</span>
                      <InputGroup className="w-full">
                        <InputGroupInput
                          type="number" step="0.1" min="-5" max="5" value={rollInput} disabled={blocked}
                          onChange={e => {
                            const v = e.target.value;
                            setRollInput(v);
                            setAlignmentStatus('pending');
                            setAlignmentError(null);
                            scheduleAlignment(v, pitchInput);
                            const n = Number(v);
                            if (Number.isFinite(n)) onPoseChange?.(n, Number(pitchInput));
                          }}
                        />
                        <InputGroupAddon align="inline-end"><InputGroupText>°</InputGroupText></InputGroupAddon>
                      </InputGroup>
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-2 text-sm">
                      <span>Pitch</span>
                      <InputGroup className="w-full">
                        <InputGroupInput
                          type="number" step="0.1" min="-5" max="5" value={pitchInput} disabled={blocked}
                          onChange={e => {
                            const v = e.target.value;
                            setPitchInput(v);
                            setAlignmentStatus('pending');
                            setAlignmentError(null);
                            scheduleAlignment(rollInput, v);
                            const n = Number(v);
                            if (Number.isFinite(n)) onPoseChange?.(Number(rollInput), n);
                          }}
                        />
                        <InputGroupAddon align="inline-end"><InputGroupText>°</InputGroupText></InputGroupAddon>
                      </InputGroup>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">送信状況:</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${alignmentStatusMeta.tone}`}>
                    {alignmentStatusMeta.showSpinner ? <Loader2 className="size-3 animate-spin" /> : null}
                    {alignmentStatusMeta.text}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-8 mb-6">
                  <Button
                    variant="default"
                    disabled={!hasRobotId || isSaving || saveButtonDisabled || blocked}
                    onClick={() => void handleSave()}
                  >
                    {isSaving ? '保存中...' : saveButtonLabel}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function WristSnapshotScreen({
  robotId,
  onCompleteStep,
  stepId,
}: {
  robotId?: string;
  onCompleteStep: (id: string) => void;
  stepId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const ready = Boolean(robotId) && !isPending && !isComplete;

  const handleRun = async () => {
    if (!robotId) return;
    setIsPending(true);
    const cmdId = await mockApi.wristSnapshotInitiate(robotId);
    if (cmdId?.value) {
      await mockApi.wristSnapshotConfirm(cmdId.value);
      toast.success('初期設定を完了しました');
      onCompleteStep(stepId);
      setIsComplete(true);
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-4">
      <Button disabled={!ready} onClick={() => void handleRun()}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        リストスナップショットを実行
      </Button>
      {isComplete ? <div className="text-sm text-green-600">初期設定を実行</div> : null}
    </div>
  );
}
