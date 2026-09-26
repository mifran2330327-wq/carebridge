export function shortHash(str, length = 6) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36).substring(0, length).toUpperCase()
}

export function maskAuthorName(userId, fallback = 'Parent') {
  return `${fallback} ${shortHash(userId)}`
}