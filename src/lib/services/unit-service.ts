// Solo `import type`: así el servicio se puede probar con `node --test`, sin Astro ni base de datos.
import type { UnitRepository } from '@lib/repositories/unit-repository';

export class UnitService {
  readonly #units: UnitRepository;

  constructor(units: UnitRepository) {
    this.#units = units;
  }

  list() {
    return this.#units.findAll();
  }
}
