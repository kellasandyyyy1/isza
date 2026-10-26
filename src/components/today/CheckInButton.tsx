import { IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";

interface CheckInButtonProps {
  logged: boolean;
  // Secondary when another primary action is on screen, such as "Log period".
  secondary?: boolean;
  onOpen: () => void;
}

export function CheckInButton({ logged, secondary = false, onOpen }: CheckInButtonProps) {
  if (logged) {
    return (
      <Button fullWidth variant="secondary" icon={IconCheck} onClick={onOpen}>
        Edit check-in
      </Button>
    );
  }
  return (
    <Button fullWidth variant={secondary ? "secondary" : "primary"} onClick={onOpen}>
      Log today&apos;s check-in
    </Button>
  );
}
