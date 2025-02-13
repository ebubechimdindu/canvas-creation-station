
interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressSteps = ({ currentStep, totalSteps }: ProgressStepsProps) => {
  return (
    <div className="flex justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((num) => (
        <div
          key={num}
          className={`w-1/3 h-2 rounded-full mx-1 transition-colors duration-300 ${
            currentStep >= num ? "bg-purple-600" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
};
