import { useMemo } from "react";

// Predefined vibrant colors for avatar backgrounds
const AVATAR_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
];

/**
 * Generate a consistent color based on a string seed (userId or name).
 * Same seed always produces the same color.
 */
function getColorFromSeed(seed: string | number): string {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Get the first character of a name for avatar display.
 * Handles Chinese characters, English letters, and other scripts.
 */
function getInitial(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) return "U";
  const trimmed = name.trim();
  // Get first character and uppercase if it's a letter
  const first = trimmed[0];
  return first.toUpperCase();
}

interface UserAvatarProps {
  /** User ID for consistent color generation */
  userId?: number | string | null;
  /** User display name */
  name?: string | null;
  /** Avatar image URL (if uploaded) */
  avatarUrl?: string | null;
  /** Size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = 32,
  className = "",
}: UserAvatarProps) {
  const bgColor = useMemo(
    () => getColorFromSeed(userId ?? name ?? "unknown"),
    [userId, name]
  );

  const initial = useMemo(() => getInitial(name), [name]);

  const sizeStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  // Calculate font size based on avatar size
  const fontSize = Math.max(10, Math.round(size * 0.4));

  // If user has uploaded an avatar, show it
  if (avatarUrl && avatarUrl.length > 0) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        className={`rounded-full object-cover ${className}`}
        style={sizeStyle}
        loading="lazy"
        onError={(e) => {
          // On load error, hide the img and show fallback
          const target = e.currentTarget;
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement("div");
            fallback.className = `rounded-full flex items-center justify-center text-white font-semibold ${className}`;
            Object.assign(fallback.style, {
              ...sizeStyle,
              width: `${size}px`,
              height: `${size}px`,
              minWidth: `${size}px`,
              minHeight: `${size}px`,
              backgroundColor: bgColor,
              fontSize: `${fontSize}px`,
            });
            fallback.textContent = initial;
            parent.replaceChild(fallback, target);
          }
        }}
      />
    );
  }

  // Default: show initial with colored background
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      style={{
        ...sizeStyle,
        backgroundColor: bgColor,
        fontSize: `${fontSize}px`,
      }}
    >
      {initial}
    </div>
  );
}
