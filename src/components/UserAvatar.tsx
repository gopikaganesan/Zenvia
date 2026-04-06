import React from "react";
import BoringAvatar from "boring-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type UserAvatarProps = {
  name: string;
  imageUrl?: string;
  seed?: string;
  className?: string;
};

export function UserAvatar({ name, imageUrl, seed, className }: UserAvatarProps) {
  const resolvedSeed = seed || name || "zenvia-user";
  const safeImageUrl = imageUrl && imageUrl.trim().length > 0 ? imageUrl : undefined;

  return (
    <Avatar className={className}>
      {safeImageUrl ? <AvatarImage key={safeImageUrl} src={safeImageUrl} alt={name} className="object-cover" /> : null}
      <AvatarFallback className="p-0 overflow-hidden bg-transparent">
        <BoringAvatar
          size={64}
          name={resolvedSeed}
          variant="beam"
          colors={["#6D28D9", "#A855F7", "#EC4899", "#0EA5E9", "#10B981"]}
        />
      </AvatarFallback>
    </Avatar>
  );
}
