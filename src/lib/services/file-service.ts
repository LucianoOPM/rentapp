// Solo `import type`: así el servicio se prueba con `node --test`, sin Astro ni base de datos.
import type { ActiveLease } from '@lib/repositories/lease-repository';
import type { FileRecord, FileReference, FileRepository } from '@lib/repositories/file-repository';
import type { LeaseService, Viewer } from '@lib/services/lease-service';
import type { CloudinaryStorage } from '@lib/storage';

// Un texto que no es UUID haría fallar la consulta en Postgres.
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function grants(reference: FileReference, renterId: number, active: ActiveLease | null) {
  if (reference.kind === 'lease') return reference.renterId === renterId && reference.status !== 'draft';
  // Regla provisional y estricta: ver las preguntas abiertas sobre el historial y el contrato por firmar.
  if (active?.status !== 'signed') return false;
  if (reference.kind === 'photo') return reference.unitId === active.unitId && reference.createdBy === renterId;
  return reference.leaseId === active.id;
}

export class FileService {
  readonly #files: FileRepository;
  readonly #leases: Pick<LeaseService, 'getActiveLease'>;
  readonly #storage: Pick<CloudinaryStorage, 'get'>;

  constructor(
    files: FileRepository,
    leases: Pick<LeaseService, 'getActiveLease'>,
    storage: Pick<CloudinaryStorage, 'get'>,
  ) {
    this.#files = files;
    this.#leases = leases;
    this.#storage = storage;
  }

  /** `null` tanto si no existe como si el usuario no puede verlo. */
  async findAccessible(user: Viewer, publicId: string): Promise<FileRecord | null> {
    if (!uuid.test(publicId)) return null;
    const record = await this.#files.findByPublicId(publicId);
    if (!record || user.role === 'admin') return record;
    const [references, active] = await Promise.all([
      this.#files.findReferences(record.id),
      this.#leases.getActiveLease(user),
    ]);
    return references.some((reference) => grants(reference, Number(user.id), active)) ? record : null;
  }

  open(file: FileRecord) {
    return this.#storage.get(file.key);
  }
}
