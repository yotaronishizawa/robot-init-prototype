import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from '../ui/toast';
import { mockApi } from '../../lib/mock-api';
import type { OperationProps } from '../../types/operation';

const LEFT_STEP_ID = 'hand-eye-calibration-left';
const RIGHT_STEP_ID = 'hand-eye-calibration-right';
const CAMERA0 = 'CAMERA0';
const CAMERA1 = 'CAMERA1';

export function HandEyeCalibrationOperation({ robotId, onCompleteStep }: OperationProps) {
  const [pendingLeft, setPendingLeft] = useState(false);
  const [pendingRight, setPendingRight] = useState(false);
  const [leftComplete, setLeftComplete] = useState(false);
  const [rightComplete, setRightComplete] = useState(false);

  const canRunLeft = Boolean(robotId) && !pendingLeft && !leftComplete;
  const canRunRight = Boolean(robotId) && !pendingRight && !rightComplete && leftComplete;

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
    await mockApi.calibrateCameraInitiate(robotId, CAMERA1);
    await mockApi.calibrateCameraConfirm(robotId, CAMERA1);
    onCompleteStep(RIGHT_STEP_ID);
    setRightComplete(true);
    toast.success('カメラ_1のハンドアイキャリブレーションを完了しました');
    setPendingRight(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
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

      <div className="inline-block rounded-md border bg-muted/40 p-2">
        <div className="text-xs text-muted-foreground mb-2">参考画像</div>
        <div className="h-48 w-64 rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-sm">
          ハンドアイキャリブレーション参考画像
        </div>
      </div>
    </div>
  );
}
