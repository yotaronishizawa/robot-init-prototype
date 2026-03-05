import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Stepper, type StepGroup, type StepState } from '../ui/stepper';
import { ROBOT_INIT_OPERATIONS, type RobotInitOperation, type RobotInitStep } from './robot-init-operations-config';

const MOCK_ROBOT_ID = 'robot-001';

export interface StepCompleteInfo {
  stepId: string;
  stepLabel: string;
  operationId: string;
  operationLabel: string;
  isOperationComplete: boolean;
  noHistory: boolean;
}

interface RobotInitProps {
  onStepComplete?: (info: StepCompleteInfo) => void;
  onStepRunning?: (stepId: string) => void;
  onPoseChange?: (roll: number, pitch: number) => void;
  onPositionChange?: (dx: number, dz: number) => void;
  onOperationChange?: (operationId: string) => void;
  onActiveStepChange?: (stepId: string) => void;
  cameraFeedUrls?: { cam0?: string; cam1?: string };
  anyHumanDetected?: boolean;
}

export function RobotInit({ onStepComplete, onStepRunning, onPoseChange, onPositionChange, onOperationChange, onActiveStepChange, cameraFeedUrls, anyHumanDetected }: RobotInitProps) {
  const getStepOperation = (step: RobotInitStep): RobotInitOperation => {
    for (const operation of ROBOT_INIT_OPERATIONS) {
      if (operation.steps.some(opStep => opStep.id === step.id)) return operation;
    }
    return ROBOT_INIT_OPERATIONS[0]!;
  };

  const getStepIndex = (step: RobotInitStep) =>
    getStepOperation(step).steps.findIndex(opStep => opStep.id === step.id);

  const [activeStep, setActiveStep] = useState<RobotInitStep>(() => ROBOT_INIT_OPERATIONS[0]!.steps[0]!);
  const activeOperation = useMemo(() => getStepOperation(activeStep), [activeStep]);
  const nextOperation = useMemo(
    () => ROBOT_INIT_OPERATIONS[ROBOT_INIT_OPERATIONS.findIndex(op => op.id === activeOperation.id) + 1] ?? null,
    [activeOperation],
  );

  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);
  useEffect(() => { setFooterEl(document.getElementById('robot-init-footer')); }, []);
  useEffect(() => { onOperationChange?.(activeOperation.id); }, [activeOperation.id, onOperationChange]);
  useEffect(() => { onActiveStepChange?.(activeStep.id); }, [activeStep.id, onActiveStepChange]);


  const getStepState = useCallback(
    (step: RobotInitStep): StepState => {
      if (completedStepIds.has(step.id)) return 'complete';
      if (step.id === activeStep.id) return 'active';
      return 'idle';
    },
    [activeStep, completedStepIds],
  );

  const isOperationComplete = useCallback(
    (operation: RobotInitOperation) => operation.steps.every(step => completedStepIds.has(step.id)),
    [completedStepIds],
  );

  const operationStepsComplete = useMemo(
    () => isOperationComplete(activeOperation),
    [activeOperation, isOperationComplete],
  );

  const stepperGroups: StepGroup[] = useMemo(
    () =>
      ROBOT_INIT_OPERATIONS.map(operation => ({
        id: operation.id,
        label: operation.label,
        state: activeOperation.id === operation.id ? 'active' : isOperationComplete(operation) ? 'complete' : 'idle',
        steps: operation.steps.map(step => ({
          id: step.id,
          label: step.label,
          state: getStepState(step),
        })),
      })),
    [activeOperation, getStepState, isOperationComplete],
  );

  const getTitleText = (operation: RobotInitOperation) => operation.label || operation.steps[0]?.label || '';

  const subTitleText = useMemo(
    () => (activeOperation.hideSubTitle ? '' : activeStep.label || ''),
    [activeOperation, activeStep],
  );

  const descriptionText = useMemo(
    () => activeOperation.description || activeStep.description || '',
    [activeOperation, activeStep],
  );

  const activeOperationCompleted = activeOperation.steps.every(step => completedStepIds.has(step.id));
  const ActiveOperation = activeOperation.component;

  const markStepComplete = (stepId: string, completed = true) => {
    let nextCompletedIds: Set<string>;

    if (completed) {
      nextCompletedIds = new Set([...Array.from(completedStepIds), stepId]);
    } else {
      nextCompletedIds = new Set(Array.from(completedStepIds));
      nextCompletedIds.delete(stepId);
    }

    setCompletedStepIds(nextCompletedIds);

    if (completed && onStepComplete) {
      const step = activeOperation.steps.find(s => s.id === stepId) ?? activeStep;
      const isOpComplete = activeOperation.steps.every(s => nextCompletedIds.has(s.id));
      onStepComplete({
        stepId,
        stepLabel: step.label,
        operationId: activeOperation.id,
        operationLabel: getTitleText(activeOperation),
        isOperationComplete: isOpComplete,
        noHistory: step.noHistory ?? false,
      });
    }

    let nextActiveStep = null;
    if (completed) {
      nextActiveStep = activeOperation.steps[getStepIndex(activeStep) + 1];
    } else {
      nextActiveStep = activeOperation.steps[getStepIndex(activeStep) - 1];
    }
    if (nextActiveStep) setActiveStep(nextActiveStep);
  };

  return (
    <>
    <div className="grid md:grid-cols-[320px_1fr] items-start h-full">
      <div className="p-4 border-r h-full overflow-y-auto">
        <Stepper groups={stepperGroups} activeStepId={activeStep.id} />
      </div>

      <div className="flex h-full flex-col min-w-0">
        <div className="flex flex-col flex-1 p-6 gap-6 overflow-y-auto overflow-x-hidden">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">{getTitleText(activeOperation)}</h1>
            {subTitleText ? <h2 className="text-lg font-medium">{subTitleText}</h2> : null}
            {descriptionText ? <p className="text-muted-foreground">{descriptionText}</p> : null}
          </header>
          <div className="flex-1">
            <ActiveOperation
              operationId={activeOperation.id}
              activeStepId={activeStep.id}
              robotId={MOCK_ROBOT_ID}
              onCompleteStep={markStepComplete}
              onStepRunning={onStepRunning}
              onPoseChange={onPoseChange}
              onPositionChange={onPositionChange}
              cameraFeedUrls={cameraFeedUrls}
              anyHumanDetected={anyHumanDetected}
            />
          </div>
        </div>

      </div>
    </div>

    {footerEl && createPortal(
      <footer className="flex flex-wrap items-center justify-between gap-6 px-4 py-3 border-t bg-background shrink-0">
        <div className="flex items-center gap-8">
          {!activeOperationCompleted ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-base font-semibold text-foreground hover:underline"
              onClick={() => markStepComplete(activeStep.id, true)}
            >
              <span>{activeStep.label}をスキップ</span>
              <ChevronRight className="size-5" />
            </button>
          ) : null}
        </div>
        <Button
          disabled={!operationStepsComplete}
          onClick={() => {
            if (nextOperation) {
              setActiveStep(nextOperation.steps[0]!);
              return;
            }
            alert('全ての手順が完了しました！');
          }}
        >
          {nextOperation ? `${getTitleText(nextOperation)}へ進む` : '完了してホームに戻る'}
        </Button>
      </footer>,
      footerEl!
    )}
    </>
  );
}
