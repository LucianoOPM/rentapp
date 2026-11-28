// Único lugar donde se crean servicios y repositorios y se les pasan sus dependencias.
import { CLOUDINARY_URL } from 'astro:env/server';
import { auth } from '@lib/auth';
import { db } from '@lib/db';
import { DrizzleFileRepository } from '@lib/repositories/file-repository';
import { DrizzleLeaseRepository } from '@lib/repositories/lease-repository';
import { DrizzleUnitRepository } from '@lib/repositories/unit-repository';
import { DrizzleUserRepository } from '@lib/repositories/user-repository';
import { AuthService } from '@lib/services/auth-service';
import { FileService } from '@lib/services/file-service';
import { LeaseService } from '@lib/services/lease-service';
import { UnitService } from '@lib/services/unit-service';
import { CloudinaryStorage, parseCloudinaryUrl } from '@lib/storage';

export const unitService = new UnitService(new DrizzleUnitRepository(db));

export const authService = new AuthService(auth, new DrizzleUserRepository(db));

export const leaseService = new LeaseService(new DrizzleLeaseRepository(db));
export const fileService = new FileService(
  new DrizzleFileRepository(db),
  leaseService,
  new CloudinaryStorage(parseCloudinaryUrl(CLOUDINARY_URL)),
);
