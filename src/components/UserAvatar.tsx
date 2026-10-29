'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';

const variantClasses: Record<NonNullable<User['avatarVariant']>, string> = {
  purple: 'bg-[#3f2b96] text-white',
  blue: 'bg-[#175cd3] text-white',
  green: 'bg-[#087443] text-white',
  orange: 'bg-[#b54708] text-white',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  const first = Array.from(parts[0])[0] || '';
  // Match the initials shown on /personal-details: use the first and last
  // name initials, or the first two letters when only one name is present.
  const last = parts.length > 1
    ? Array.from(parts[parts.length - 1])[0] || ''
    : Array.from(parts[0])[1] || '';
  return (first + last).toLocaleUpperCase();
}

export default function UserAvatar({ user, className }: { user: User; className?: string }) {
  const variant = user.avatarVariant || 'purple';
  return (
    <Avatar className={cn('shrink-0 overflow-hidden', className)}>
      {user.profilePicture ? <AvatarImage src={user.profilePicture} alt={user.name || 'Profile avatar'} /> : null}
      <AvatarFallback className={cn('font-bold tracking-wide', variantClasses[variant])}>
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
