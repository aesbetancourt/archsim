/** The HTTP status codes that the app sends and reads, by name. */
export const HTTP = {
  ok: 200,
  accepted: 202,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
  badGateway: 502,
} as const;
