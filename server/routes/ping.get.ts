export default defineEventHandler(() => {
  return {
    message: 'pong',
    timestamp: new Date().toISOString(),
  }
})
