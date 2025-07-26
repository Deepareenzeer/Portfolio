export default ({ env }: { env: any }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    // แปลงเป็น boolean เอง
    nps: env('FLAG_NPS') === 'true' || true,
    promoteEE: env('FLAG_PROMOTE_EE') === 'true' || true,
  },
});
