// Demo mode utilities for testing UI without backend setup

export const DEMO_MODE = true; // Set to true for local testing

export const createDemoUser = () => ({
  user_id: 'demo-user-123',
  email: 'demo@therajournal.com',
  created_at: new Date().toISOString(),
});

export const createDemoEntries = () => [
  {
    id: 'demo-entry-1',
    user_id: 'demo-user-123',
    title: 'Feeling Grateful Today',
    body: 'Today was a wonderful day. I had a great conversation with my friend, and I feel really grateful for the relationships in my life. Sometimes it\'s easy to take these connections for granted, but today I really appreciated them.',
    mood: 4,
    tags: ['gratitude', 'relationships', 'positive'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    entry_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-entry-2',
    user_id: 'demo-user-123',
    title: 'Work Stress',
    body: 'I\'ve been feeling overwhelmed at work lately. The deadlines are piling up and I\'m not sure how to manage everything. I need to find a better way to organize my tasks and maybe talk to my manager about priorities.',
    mood: -2,
    tags: ['work', 'stress', 'organization'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    entry_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-entry-3',
    user_id: 'demo-user-123',
    title: 'Morning Reflection',
    body: 'Started the day with meditation and it really helped center me. I\'m trying to establish a better morning routine that includes some quiet time before the chaos of the day begins.',
    mood: 3,
    tags: ['meditation', 'routine', 'mindfulness'],
    created_at: new Date().toISOString(), // Today
    entry_at: new Date().toISOString(),
  },
];

export const createDemoConversations = () => [
  {
    id: 'demo-conversation-1',
    user_id: 'demo-user-123',
    title: 'Work-Life Balance',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'demo-msg-1',
        role: 'user' as const,
        content: 'I\'m struggling with work-life balance. Any advice?',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-msg-2',
        role: 'assistant' as const,
        content: 'Work-life balance is a common challenge. Based on your journal entries, I notice you value mindfulness and routine. Consider setting clear boundaries between work and personal time, and remember that your mental health is just as important as your professional success.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      },
    ],
  },
];
