export type Role = 'Leader' | 'Guardian' | 'Assassin' | 'Traitor';

export const ROLE_DISTRIBUTION: Record<number, Role[]> = {
  4: ['Leader', 'Traitor', 'Assassin', 'Assassin'],
  5: ['Leader', 'Traitor', 'Assassin', 'Assassin', 'Guardian'],
  6: ['Leader', 'Traitor', 'Assassin', 'Assassin', 'Assassin', 'Guardian'],
  7: ['Leader', 'Traitor', 'Assassin', 'Assassin', 'Assassin', 'Guardian', 'Guardian'],
  8: ['Leader', 'Traitor', 'Traitor', 'Assassin', 'Assassin', 'Assassin', 'Guardian', 'Guardian'],
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function assignRoles(playerCount: number): Role[] {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
  }
  
  const roles = [...ROLE_DISTRIBUTION[playerCount]];
  return shuffle(roles);
}

export function getRoleFromCard(card: { subtype: string | null }): Role | null {
  const subtype = card.subtype?.toLowerCase() || '';
  if (subtype.includes('leader')) return 'Leader';
  if (subtype.includes('guardian')) return 'Guardian';
  if (subtype.includes('assassin')) return 'Assassin';
  if (subtype.includes('traitor')) return 'Traitor';
  return null;
}

export const roleIcons: Record<Role, string> = {
  'Leader': '👑',
  'Guardian': '🛡️',
  'Assassin': '🗡️',
  'Traitor': '🎭',
};

export const roleColors: Record<Role, string> = {
  'Leader': 'text-yellow-500',
  'Guardian': 'text-blue-500',
  'Assassin': 'text-red-500',
  'Traitor': 'text-zinc-400',
};

export const roleDescriptions: Record<Role, string> = {
  'Leader': 'You must discover and eliminate the Assassins and the Traitor. Survive at all costs. You begin the game revealed.',
  'Guardian': 'Your objective is to protect the Leader at all costs. You win if the Leader wins.',
  'Assassin': 'Your objective is to kill the Leader. You win if the Leader dies.',
  'Traitor': 'Your objective is to be the last player standing. Eliminate the Assassins and the Guardian first, then kill the Leader.'
};
