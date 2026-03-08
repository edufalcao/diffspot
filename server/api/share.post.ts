import { defineEventHandler, readBody, createError } from 'h3'
import { saveShare } from '~/server/utils/db'

const MAX_TEXT_SIZE = 100 * 1024 // 100 KB

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate required fields
  if (!body || typeof body.leftText !== 'string' || typeof body.rightText !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'leftText and rightText are required and must be strings.',
    })
  }

  const { leftText, rightText, language } = body

  // Validate text is not empty
  if (leftText.trim().length === 0 && rightText.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'At least one of leftText or rightText must be non-empty.',
    })
  }

  // Validate size limits
  if (new TextEncoder().encode(leftText).length > MAX_TEXT_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'leftText exceeds the maximum allowed size of 100 KB.',
    })
  }

  if (new TextEncoder().encode(rightText).length > MAX_TEXT_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'rightText exceeds the maximum allowed size of 100 KB.',
    })
  }

  // Validate language if provided
  const lang = typeof language === 'string' ? language : 'plaintext'

  const id = saveShare(leftText, rightText, lang)

  return {
    id,
    url: `/share/${id}`,
  }
})
