import { Project, User, Event } from '../types';

export const calculateProjectCost = (project: Project): number => {
  if (!project.participants || !project.events) return 0;
  
  let totalCost = 0;
  
  project.events.forEach(event => {
    if (event.actualHours && event.participants) {
      event.participants.forEach(participantId => {
        const participant = project.participants.find(p => p._id === participantId);
        if (participant) {
          const dailyHours = 8;
          const hourlyRate = participant.dailyFee / dailyHours;
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
  
  event.participants.forEach(participantId => {
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