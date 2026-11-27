// Solo `import type`: así el servicio se prueba con `node --test`, sin Astro ni base de datos.
import type { LeaseRepository } from '@lib/repositories/lease-repository';

/** El `id` de la sesión llega como texto. */
export type Viewer = { id: string | number; role?: string | null };

export class LeaseService {
  readonly #leases: LeaseRepository;

  constructor(leases: LeaseRepository) {
    this.#leases = leases;
  }

  /** Toda consulta de un inquilino pasa por aquí. */
  async getActiveLease(user: Viewer) {
    const [active = null, ...others] = await this.#leases.findActiveByRenter(Number(user.id));
    // La base lo permite en departamentos distintos; ante la duda no se entrega nada.
    if (others.length) throw new Error(`El usuario ${user.id} tiene más de un contrato activo`);
    return active;
  }
}
