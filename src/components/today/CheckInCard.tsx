import { Card } from "@/components/ui/Card";
import { CheckInButton } from "./CheckInButton";

// Desktop version of the check-in action.
export function CheckInCard(props: { logged: boolean; secondary: boolean; onOpen: () => void }) {
  return (
    <Card className="hidden flex-col items-start gap-3 lg:flex">
      <h2 className="text-h2 text-ink">Daily check-in</h2>
      <p className="text-body text-ink-muted">About 20 seconds. It helps Isza learn your patterns.</p>
      <CheckInButton {...props} />
    </Card>
  );
}
