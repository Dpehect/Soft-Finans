import { UmayTokenHub } from "../components/crypto/UmayTokenHub";

export function UmayTokenPage() {
  return (
    <div className="min-h-full bg-terminal-bg text-terminal-text p-3 sm:p-4 lg:p-6 transition-colors duration-200">
      <UmayTokenHub />
    </div>
  );
}

export default UmayTokenPage;
