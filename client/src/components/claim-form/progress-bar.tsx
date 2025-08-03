import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = [
    "Policy Details",
    "Vehicle & Accident", 
    "Damage Assessment",
    "Driver & Declaration"
  ];

  return (
    <div>
      {/* Progress Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                      ${isCompleted
                        ? 'bg-secondary text-white'
                        : isActive
                        ? 'bg-primary text-white'
                        : 'bg-neutral-200 text-neutral-600'
                      }
                    `}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-3 transition-all
                        ${stepNumber < currentStep ? 'bg-primary' : 'bg-neutral-200'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-sm font-medium text-neutral-600">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
      
      {/* Step Labels */}
      <div className="flex justify-between mt-2 text-xs text-neutral-500">
        {steps.map((step, index) => (
          <span key={index} className="text-center max-w-[100px]">
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
