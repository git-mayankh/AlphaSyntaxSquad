export const getAvatarColor = (name: string) => {
  const colors = [
    'linear-gradient(135deg, var(--indigo-400), var(--indigo-600))',
    'linear-gradient(135deg, var(--cyan-400), #0891B2)',
    'linear-gradient(135deg, var(--pink-400), #DB2777)',
    'linear-gradient(135deg, var(--amber-400), #D97706)',
    'linear-gradient(135deg, var(--green-400), #16A34A)',
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
