// Traduz mensagens de erro técnicas (Supabase Auth, banco, rede) para português claro.
// Aceita o objeto de erro ({ message, code }) ou só o texto. Mensagens que já estão em português passam direto.

const BY_CODE: Record<string, string> = {
  weak_password: 'Essa senha é fraca e fácil de adivinhar (aparece em listas de senhas vazadas). Escolha outra, com letras, números e símbolos.',
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Seu e-mail ainda não foi confirmado. Confira sua caixa de entrada e clique no link que enviamos.',
  user_already_exists: 'Este e-mail já tem cadastro.',
  email_exists: 'Este e-mail já tem cadastro.',
  same_password: 'A nova senha precisa ser diferente da senha atual.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde alguns instantes e tente de novo.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
  otp_expired: 'O link expirou ou já foi usado. Peça um novo.',
  session_not_found: 'Sua sessão expirou. Entre novamente.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
  email_address_invalid: 'E-mail inválido.',
  signup_disabled: 'Novos cadastros estão desativados no momento.',
  user_not_found: 'Usuário não encontrado.',
  user_banned: 'Este acesso está bloqueado. Fale com o suporte.',
}

const BY_TEXT: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/password is known to be weak|weak password|easy to guess|pwned/i, () => BY_CODE.weak_password],
  [/password should be at least (\d+) characters?/i, m => `A senha precisa ter pelo menos ${m[1]} caracteres.`],
  [/current password required|current_password/i, () => 'Informe a senha atual para trocar a senha.'],
  [/new password should be different/i, () => BY_CODE.same_password],
  [/invalid login credentials/i, () => BY_CODE.invalid_credentials],
  [/email not confirmed/i, () => BY_CODE.email_not_confirmed],
  [/user already registered|already been registered|already registered|email address.*already/i, () => BY_CODE.user_already_exists],
  [/unable to validate email address|invalid email|email address .* is invalid/i, () => BY_CODE.email_address_invalid],
  [/signups? not allowed|signup is disabled/i, () => BY_CODE.signup_disabled],
  [/rate limit|too many requests|you can only request this after (\d+) seconds?/i, () => BY_CODE.over_request_rate_limit],
  [/token has expired|otp.*expired|invalid or has expired|link.*expired/i, () => BY_CODE.otp_expired],
  [/auth session missing|session.*(expired|not found)|jwt expired|invalid jwt/i, () => BY_CODE.session_expired],
  [/user not found/i, () => BY_CODE.user_not_found],
  [/failed to fetch|networkerror|network request failed|load failed|fetch failed/i, () => 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'],
  [/row-level security|permission denied|not authorized|insufficient.?privilege|forbidden/i, () => 'Sem permissão para esta ação (ou a assinatura da loja está inativa).'],
  [/duplicate key value|already exists/i, () => 'Já existe um registro com esses dados.'],
  [/violates foreign key/i, () => 'Este item está ligado a outros dados e não pode ser alterado assim.'],
  [/violates not-null|null value in column/i, () => 'Faltou preencher um campo obrigatório.'],
  [/value too long|payload too large|request entity too large/i, () => 'O conteúdo é grande demais. Tente com um arquivo ou texto menor.'],
  [/timeout|timed out/i, () => 'A operação demorou demais. Tente de novo.'],
]

export function errorPt(err: unknown, fallback = 'Ocorreu um erro inesperado. Tente de novo.'): string {
  const e: any = err
  const code = typeof e?.code === 'string' ? e.code : ''
  if (code && BY_CODE[code]) return BY_CODE[code]
  const msg = typeof err === 'string' ? err : typeof e?.message === 'string' ? e.message : ''
  if (!msg) return fallback
  for (const [re, fn] of BY_TEXT) {
    const m = msg.match(re)
    if (m) return fn(m)
  }
  return msg
}
