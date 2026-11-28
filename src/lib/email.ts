// Único archivo que habla con Resend (decisión 015). Lo cargan `node --test` y `scripts/`.

export type EmailConfig = { apiKey: string; from: string; adminEmail: string };

const variables = { apiKey: 'RESEND_API_KEY', from: 'MAIL_FROM', adminEmail: 'ADMIN_EMAIL' } as const;
const fields = Object.keys(variables) as (keyof EmailConfig)[];

function assertComplete(config: EmailConfig) {
  const missing = fields.filter((field) => !config[field].trim()).map((field) => variables[field]);
  if (missing.length) throw new Error(`Faltan variables de correo: ${missing.join(', ')}`);
}

export function emailConfigFrom(env: Record<string, string | undefined>): EmailConfig {
  const config = {
    apiKey: env.RESEND_API_KEY ?? '',
    from: env.MAIL_FROM ?? '',
    adminEmail: env.ADMIN_EMAIL ?? '',
  };
  assertComplete(config);
  return config;
}

// La respuesta y los errores de la petición pueden traer correos o la API key: solo se conserva el código HTTP.
const sendError = (status?: number) =>
  new Error(`Resend: falló el envío${status === undefined ? '' : ` (HTTP ${status})`}`);

export class ResendMailer {
  readonly #config: EmailConfig;
  readonly #fetch: typeof fetch;

  constructor(config: EmailConfig, fetchFn: typeof fetch = fetch) {
    assertComplete(config);
    this.#config = config;
    this.#fetch = fetchFn;
  }

  /** Siempre escribe a la administradora: los inquilinos reciben avisos por WhatsApp (decisión 012). */
  async sendEmail({ subject, text }: { subject: string; text: string }): Promise<void> {
    if (!subject.trim() || !text.trim()) throw new Error('El correo necesita asunto y texto');
    let response: Response;
    try {
      response = await this.#fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#config.apiKey}`,
          'Content-Type': 'application/json',
          // Resend responde 403 sin ella.
          'User-Agent': 'mailer/1.0',
        },
        body: JSON.stringify({ from: this.#config.from, to: this.#config.adminEmail, subject, text }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw sendError();
    }
    // El código HTTP ya decide el resultado: un cuerpo cortado no debe cambiarlo.
    await response.body?.cancel().catch(() => {});
    if (!response.ok) throw sendError(response.status);
  }
}
