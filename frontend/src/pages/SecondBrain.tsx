import { SecondBrainPanel } from "../components/brain/SecondBrainPanel";
import { BrainLogPanel } from "../components/brain/BrainLogPanel";

export function SecondBrainPage() {
  return (
    <div className="space-y-4 p-4" data-testid="second-brain-page">
      <SecondBrainPanel />
      <BrainLogPanel />
    </div>
  );
}

export default SecondBrainPage;
