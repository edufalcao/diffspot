import { getShare } from '../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Share ID is required.',
    })
  }

  const share = getShare(id)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: `Share with ID "${id}" not found.`,
    })
  }

  return {
    id: share.id,
    leftText: share.left_text,
    rightText: share.right_text,
    language: share.language,
    createdAt: share.created_at,
  }
})
