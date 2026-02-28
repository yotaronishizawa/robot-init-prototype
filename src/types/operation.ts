export interface OperationProps {
  activeStepId: string;
  operationId?: string | null;
  deploymentProgressId?: string;
  robotId?: string;
  onCompleteStep: (stepId: string, completed?: boolean) => void;
}
