import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../ui/input-group';
import { toast } from 'sonner';
import { mockApi } from '../../lib/mock-api';
import { CameraLiveView } from '../camera-live-view';
import type { OperationProps } from '../../types/operation';

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">{isLeft ? '左カメラ (cam_0)の調整' : '右カメラ (cam_1)の調整'}</h3>
        <span className="text-muted-foreground text-sm">この操作ではロボットが物理的にアームの向きを移動します</span>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <CameraLiveView robotCamera={robotCamera} robotId={robotId} feedUrl={isLeft ? cameraFeedUrls?.cam0 : cameraFeedUrls?.cam1} />
        </div>

        <div className="lg:max-w-[420px] space-y-6">
          <section className="space-y-2 p-4 rounded-md bg-muted">
            <div className="text-base font-semibold">レール上でロボットを移動</div>
            <p className="text-sm text-muted-foreground">現在位置を原点として上下左右へロボットを移動します。</p>
            <div className="flex gap-8">
              <div className="flex-1 space-y-3">
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
              <div className="min-w-[120px]">
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
                <div className="flex flex-wrap gap-2 mt-8">
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
