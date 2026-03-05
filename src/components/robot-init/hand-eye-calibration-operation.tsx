import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { mockApi } from '../../lib/mock-api';
import type { OperationProps } from '../../types/operation';

const LEFT_STEP_ID = 'hand-eye-calibration-left';
const RIGHT_STEP_ID = 'hand-eye-calibration-right';
const CAMERA0 = 'CAMERA0';
const CAMERA1 = 'CAMERA1';

export function HandEyeCalibrationOperation({ robotId, onCompleteStep, onStepRunning, anyHumanDetected }: OperationProps) {
  const [pendingLeft, setPendingLeft] = useState(false);
  const [pendingRight, setPendingRight] = useState(false);
  const [leftComplete, setLeftComplete] = useState(false);
  const [rightComplete, setRightComplete] = useState(false);
  const [walkInClear, setWalkInClear] = useState(false);

  const canRunLeft = Boolean(robotId) && !pendingLeft && !leftComplete && walkInClear;
  const canRunRight = Boolean(robotId) && !pendingRight && !rightComplete && leftComplete && walkInClear;

  const runLeft = async () => {
    if (!robotId) return;
    setPendingLeft(true);
    await mockApi.calibrateCameraInitiate(robotId, CAMERA0);
    await mockApi.calibrateCameraConfirm(robotId, CAMERA0);
    onCompleteStep(LEFT_STEP_ID);
    setLeftComplete(true);
    toast.success('カメラ_0のハンドアイキャリブレーションを完了しました');
    setPendingLeft(false);
  };

  const runRight = async () => {
    if (!robotId) return;
    setPendingRight(true);
    onStepRunning?.(RIGHT_STEP_ID);
    await mockApi.calibrateCameraInitiate(robotId, CAMERA1);
    await mockApi.calibrateCameraConfirm(robotId, CAMERA1);
    onCompleteStep(RIGHT_STEP_ID);
    setRightComplete(true);
    toast.success('カメラ_1のハンドアイキャリブレーションを完了しました');
    setPendingRight(false);
  };

  return (
    <div className="space-y-6">
      <label className={`flex items-center gap-3 w-fit ${anyHumanDetected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <Checkbox
          checked={walkInClear}
          disabled={anyHumanDetected}
          onCheckedChange={v => setWalkInClear(Boolean(v))}
        />
        <span className="text-sm md:text-base">ウォークイン内に人がいない</span>
      </label>

      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <div className="text-base font-semibold">左カメラ (cam_0)</div>
          {leftComplete ? (
            <div className="flex items-center gap-2 text-green-600">
              <span className="inline-flex items-center justify-center rounded-full bg-green-600 p-1">
                <Check className="size-4 text-white" />
              </span>
              <span className="text-sm font-medium">左カメラ (cam_0)のハンドアイキャリブレーションを完了しました</span>
            </div>
          ) : (
            <Button disabled={!canRunLeft} onClick={runLeft}>
              {pendingLeft && <Loader2 className="size-4 animate-spin" />}
              ハンドアイキャリブレーションを実行
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-base font-semibold">右カメラ (cam_1)</div>
          {rightComplete ? (
            <div className="flex items-center gap-2 text-green-600">
              <span className="inline-flex items-center justify-center rounded-full bg-green-600 p-1">
                <Check className="size-4 text-white" />
              </span>
              <span className="text-sm font-medium">右カメラ (cam_1)のハンドアイキャリブレーションを完了しました</span>
            </div>
          ) : (
            <Button disabled={!canRunRight} onClick={runRight}>
              {pendingRight && <Loader2 className="size-4 animate-spin" />}
              ハンドアイキャリブレーションを実行
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-muted/40 p-2 max-w-full w-fit">
        <div className="text-xs text-muted-foreground mb-2">参考画像</div>
        <div className="h-48 w-64 max-w-full rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-sm">
          ハンドアイキャリブレーション参考画像
        </div>
      </div>
    </div>
  );
}
