import Dexie from 'dexie'

export const db = new Dexie('TaskFlowDB')

db.version(1).stores({
  tasks: '++id, title, completed, priority, dueDate, createdAt, updatedAt, synced',
  user: '++id, localUserId, name, email, avatar, createdAt',
  syncMeta: '++id, key, value, updatedAt',
})

// Seed a default user if none exists
db.on('ready', async () => {
  const count = await db.user.count()
  if (count === 0) {
    const localUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.user.add({
      localUserId,
      name: 'Your Name',
      email: 'you@example.com',
      avatar: '',
      createdAt: new Date(),
    })
  }
})

export default db
