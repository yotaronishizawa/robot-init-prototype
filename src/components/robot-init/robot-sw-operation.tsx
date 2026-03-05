import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { mockApi } from '../../lib/mock-api';
import type { OperationProps } from '../../types/operation';

export function RobotSwOperation({ robotId, onCompleteStep, activeStepId }: OperationProps) {
  const [isPending, setIsPending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const ready = Boolean(robotId) && !isPending && !isComplete;

  const handleRun = async () => {
    if (!robotId) return;
    setIsPending(true);
    await mockApi.startRobotInitiate(robotId);
    await mockApi.startRobotConfirm(robotId);
    onCompleteStep(activeStepId);
    setIsComplete(true);
    toast.success('ロボットソフトウェアの起動を完了しました');
    setIsPending(false);
  };

  return (
    <div className="space-y-4">
      {isComplete ? (
        <div className="flex items-center gap-3 text-green-600">
          <div className="inline-flex items-center justify-center rounded-full bg-green-600 p-1">
            <Check className="size-4 text-white" />
          </div>
          <span className="font-medium">ロボットソフトウェアの起動を完了しました</span>
        </div>
      ) : (
        <Button disabled={!ready} onClick={handleRun}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          ロボットソフトウェアを起動
        </Button>
      )}
    </div>
  );
}
