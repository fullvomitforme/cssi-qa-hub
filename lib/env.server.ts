import "server-only"

function readServerSecret() {
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  return secret && secret.length > 0 ? secret : null
}

export const serverEnv = {
  supabaseSecretKey: readServerSecret(),
}
