import { Project, User, Event } from '../types';

// Helper function to get all users from participant groups
const getAllUsersFromParticipants = (project: Project): User[] => {
  if (!project.participants) return [];
  
  const users: User[] = [];
  const userMap = new Map<string, User>();
  
  project.participants.forEach(participantGroup => {
    participantGroup.members.forEach(member => {
      if (!userMap.has(member.user._id)) {
        userMap.set(member.user._id, member.user);
        users.push(member.user);
      }
    });
  });
  
  return users;
};

export const calculateProjectCost = (project: Project): number => {
  if (!project.participants || !project.events) return 0;
  
  const allUsers = getAllUsersFromParticipants(project);
  let totalCost = 0;
  
  project.events.forEach(event => {
    if (event.actualHours && event.participants) {
      const participantIds = (event.participants as unknown as Array<string | { _id: string }>)
        .map(p => (typeof p === 'string' ? p : p?._id))
        .filter(Boolean) as string[];

      participantIds.forEach(participantId => {
        const user = allUsers.find(u => u._id === participantId);
        if (user) {
          const dailyHours = 8;
          const hourlyRate = user.dailyFee / dailyHours;
          totalCost += event.actualHours! * hourlyRate;
        }
      });
    }
  });
  
  return totalCost;
};

export const calculateEventCost = (event: Event, participants: User[]): number => {
  if (!event.actualHours || !event.participants) return 0;
  
  let totalCost = 0;
  
  const participantIds = (event.participants as unknown as Array<string | { _id: string }>)
    .map(p => (typeof p === 'string' ? p : p?._id))
    .filter(Boolean) as string[];

  participantIds.forEach(participantId => {
    const participant = participants.find(p => p._id === participantId);
    if (participant) {
      const dailyHours = 8;
      const hourlyRate = participant.dailyFee / dailyHours;
      totalCost += event.actualHours! * hourlyRate;
    }
  });
  
  return totalCost;
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const calculateBudgetUsage = (actualCost: number, budget: number): number => {
  if (budget === 0) return 0;
  return (actualCost / budget) * 100;
};

export const getBudgetStatus = (usage: number): 'good' | 'warning' | 'danger' => {
  if (usage <= 70) return 'good';
  if (usage <= 90) return 'warning';
  return 'danger';
};