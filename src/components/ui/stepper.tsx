import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';

export type StepState = 'idle' | 'active' | 'complete' | 'skipped';

export interface StepItem {
  id: string;
  label: string;
  state?: StepState;
}

export interface StepGroup {
  id: string;
  label?: string;
  steps: StepItem[];
  state?: StepState;
}

interface StepperProps {
  groups: StepGroup[];
  activeStepId?: string;
  className?: string;
}

const indicatorBase =
  'flex size-5 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-150 ease-linear';

function indicatorClasses(state: StepState) {
  switch (state) {
    case 'active':
      return cn(indicatorBase, 'border-primary bg-primary/10 text-primary shadow-[0_0_0_4px_rgba(255,107,0,0.25)]');
    case 'complete':
      return cn(indicatorBase, 'border-primary bg-primary text-primary-foreground');
    case 'skipped':
      return cn(indicatorBase, 'border-dashed border-muted-foreground/50 bg-muted text-muted-foreground');
    default:
      return cn(indicatorBase, 'border-border bg-background text-muted-foreground');
  }
}

export function Stepper({ groups, activeStepId, className }: StepperProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {groups.map(group => {
        const groupHasActiveStep =
          group.state === 'active' ||
          group.steps.some(step => step.state === 'active' || (!step.state && step.id === activeStepId));
        const groupAllComplete =
          group.state === 'complete' ||
          (group.steps.length > 0 &&
            group.steps.every(s => {
              const state = s.state ?? 'idle';
              return state === 'complete' || state === 'skipped';
            }));
        const groupState: StepState =
          group.state ?? (groupHasActiveStep ? 'active' : groupAllComplete ? 'complete' : 'idle');
        const indicatorState: StepState = groupAllComplete ? 'complete' : groupState;
        const groupTone =
          groupState === 'active'
            ? 'bg-primary/10 border-transparent'
            : groupState === 'complete'
              ? 'bg-transparent border-transparent'
              : 'bg-muted/60 border-transparent';
        const groupOpacity = groupState === 'active' || groupState === 'complete' ? 'opacity-100' : 'opacity-70';
        const groupText =
          groupState === 'active' || groupState === 'complete' ? 'text-foreground' : 'text-muted-foreground';
        const hasLabel = Boolean(group.label);
        const stepsPadding = hasLabel ? 'mt-1 pl-7' : 'pl-1';

        return (
          <div
            key={group.id}
            className={cn(
              'relative overflow-hidden rounded-2xl border px-4 py-5 transition-colors',
              groupTone,
              groupOpacity,
            )}
          >
            <div className="flex flex-col gap-4">
              {hasLabel ? (
                <div className="flex items-center gap-3">
                  <span className={indicatorClasses(indicatorState)} aria-hidden>
                    {groupAllComplete ? <Check className="size-3" /> : null}
                  </span>
                  <div className={cn('text-sm font-semibold leading-tight', groupText)}>{group.label}</div>
                </div>
              ) : null}

              <div className={cn('relative flex flex-col gap-3', stepsPadding)}>
                {group.steps.map(step => {
                  const derivedState: StepState = step.state ?? (step.id === activeStepId ? 'active' : 'idle');
                  const IndicatorIcon =
                    derivedState === 'complete' ? Check : derivedState === 'skipped' ? Minus : null;

                  return (
                    <div key={step.id} className="flex items-center gap-3 pl-[2px]">
                      <span className={indicatorClasses(derivedState)} aria-hidden>
                        {IndicatorIcon ? <IndicatorIcon className="size-3" /> : null}
                      </span>
                      <div className="flex flex-col">
                        <div className={cn('text-sm font-medium leading-tight', groupText)}>{step.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
