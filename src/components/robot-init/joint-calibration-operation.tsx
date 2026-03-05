import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { mockApi } from '../../lib/mock-api';
import type { OperationProps } from '../../types/operation';

export function JointCalibrationOperation({ activeStepId, robotId, onCompleteStep, onStepRunning }: OperationProps) {
  if (activeStepId === 'joint-run') {
    return <JointRunScreen robotId={robotId} onCompleteStep={onCompleteStep} stepId={activeStepId} />;
  }
  if (activeStepId === 'verify-joint-calibration') {
    return <VerifyJointCalibrationScreen robotId={robotId} onCompleteStep={onCompleteStep} onStepRunning={onStepRunning} stepId={activeStepId} />;
  }
  if (activeStepId === 'jig-removal') {
    return <JigRemovalScreen onCompleteStep={onCompleteStep} stepId={activeStepId} />;
  }
  return <ConnectionCheckScreen robotId={robotId} onCompleteStep={onCompleteStep} stepId={activeStepId} />;
}

function ConnectionCheckScreen({
  robotId,
  onCompleteStep,
  stepId,
}: {
  robotId?: string;
  onCompleteStep: (id: string) => void;
  stepId: string;
}) {
  const [wiringChecked, setWiringChecked] = useState(false);
  const [robotStoppedChecked, setRobotStoppedChecked] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const ready = useMemo(
    () => Boolean(robotId) && wiringChecked && robotStoppedChecked && !isPending,
    [robotId, wiringChecked, robotStoppedChecked, isPending],
  );

  const handleRun = async () => {
    if (!robotId) return;
    setIsPending(true);
    const cmdId = await mockApi.scanJointInitiate(robotId);
    if (cmdId?.value) {
      await mockApi.scanJointConfirm(cmdId.value);
      toast.success('全ての接続が確認できました');
      onCompleteStep(stepId);
      setIsComplete(true);
    }
    setIsPending(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <div className="text-base font-semibold">確認事項</div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={wiringChecked} onCheckedChange={v => setWiringChecked(Boolean(v))} />
            <span className="text-sm md:text-base">配線 (電源・LAN・カメラ) が正しく接続されている</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={robotStoppedChecked} onCheckedChange={v => setRobotStoppedChecked(Boolean(v))} />
            <span className="text-sm md:text-base">ロボットは停止状態である</span>
          </label>
        </div>
      </div>
      <div>
        <Button disabled={!ready || isComplete} onClick={handleRun}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          接続確認を実行
        </Button>
      </div>
    </div>
  );
}

function JointRunScreen({
  robotId,
  onCompleteStep,
  stepId,
}: {
  robotId?: string;
  onCompleteStep: (id: string) => void;
  stepId: string;
}) {
  const [powerChecked, setPowerChecked] = useState(false);
  const [zeroChecked, setZeroChecked] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const ready = powerChecked && zeroChecked && Boolean(robotId) && !isPending && !isComplete;

  const handleRun = async () => {
    if (!robotId) return;
    setIsPending(true);
    const cmdId = await mockApi.calibrateJointInitiate(robotId);
    if (cmdId?.value) {
      await mockApi.calibrateJointConfirm(cmdId.value);
      toast.success('ジョイントキャリブレーションを実行完了しました');
      onCompleteStep(stepId);
      setIsComplete(true);
    }
    setIsPending(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <div className="text-base font-semibold">確認事項</div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={powerChecked} onCheckedChange={v => setPowerChecked(Boolean(v))} />
            <span className="text-sm md:text-base">ロボットの電源がONになっている</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={zeroChecked} onCheckedChange={v => setZeroChecked(Boolean(v))} />
            <span className="text-sm md:text-base">ロボットは0地点(下記参照)に配置されている</span>
          </label>
        </div>
      </div>
      <div className="w-full max-w-[520px] h-[280px] rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-sm">
        ロボットアーム ジグ参考画像
      </div>
      <div>
        <Button disabled={!ready} onClick={handleRun}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          ジョイントキャリブレーションを実行
        </Button>
      </div>
    </div>
  );
}

function VerifyJointCalibrationScreen({
  robotId,
  onCompleteStep,
  onStepRunning,
  stepId,
}: {
  robotId?: string;
  onCompleteStep: (id: string) => void;
  onStepRunning?: (stepId: string) => void;
  stepId: string;
}) {
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const ready = Boolean(robotId) && !isPending && !isComplete;

  const handleRun = async () => {
    if (!robotId) return;
    setIsPending(true);
    onStepRunning?.(stepId);
    const cmdId = await mockApi.verifyJointCalibrationInitiate(robotId);
    if (cmdId?.value) {
      await mockApi.verifyJointCalibrationConfirm(cmdId.value);
      toast.success('ジョイントキャリブレーションの結果確認を完了しました');
      onCompleteStep(stepId);
      setIsComplete(true);
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-4">
      <Button disabled={!ready} onClick={handleRun}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        ジョイントキャリブレーションの結果を確認
      </Button>
    </div>
  );
}

function JigRemovalScreen({ onCompleteStep, stepId }: { onCompleteStep: (id: string) => void; stepId: string }) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="space-y-3">
      <div className="text-base font-semibold">確認事項</div>
      <label className="flex items-center gap-3 cursor-pointer">
        <Checkbox
          checked={isChecked}
          onCheckedChange={value => {
            const next = Boolean(value);
            setIsChecked(next);
            if (next) onCompleteStep(stepId);
          }}
        />
        <span className="text-sm md:text-base">ジグの取り外しが完了している</span>
      </label>
    </div>
  );
}
