"use client";

import { IconUser } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import type { Profile } from "@/db/schema";
import { ProfileForm } from "./ProfileForm";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSaved: () => void;
}

export function ProfileSheet({ open, onOpenChange, profile, onSaved }: ProfileSheetProps) {
  const router = useRouter();
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Profile">
      {profile ? (
        <ProfileForm profile={profile} onSaved={onSaved} />
      ) : (
        <EmptyState
          icon={IconUser}
          mascot={{ pose: "me" }}
          title="No profile yet"
          text="Finish setup to create your profile."
          action={{ label: "Finish setup", onClick: () => router.push("/onboarding") }}
        />
      )}
    </ResponsiveSheet>
  );
}
