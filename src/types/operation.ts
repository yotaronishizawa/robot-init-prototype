export interface OperationProps {
  activeStepId: string;
  operationId?: string | null;
  deploymentProgressId?: string;
  robotId?: string;
  cameraFeedUrls?: { cam0?: string; cam1?: string };
  anyHumanDetected?: boolean;
  onCompleteStep: (stepId: string, completed?: boolean) => void;
  onStepRunning?: (stepId: string) => void;
  onPoseChange?: (roll: number, pitch: number) => void;
  /** dx/dz are deltas in metres (positive x = right along rail, positive z = up) */
  onPositionChange?: (dx: number, dz: number) => void;
}
