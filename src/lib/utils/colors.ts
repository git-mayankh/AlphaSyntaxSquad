export const getAvatarColor = (name: string) => {
  const colors = [
    'linear-gradient(135deg, #A78BFA, #7C3AED)', // Purple
    'linear-gradient(135deg, #60A5FA, #2563EB)', // Blue
    'linear-gradient(135deg, #F472B6, #DB2777)', // Pink
    'linear-gradient(135deg, #FBBF24, #D97706)', // Amber
    'linear-gradient(135deg, #34D399, #059669)', // Emerald
    'linear-gradient(135deg, #FB923C, #EA580C)', // Orange
    'linear-gradient(135deg, #F87171, #DC2626)', // Red
    'linear-gradient(135deg, #818CF8, #4F46E5)'  // Indigo
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
