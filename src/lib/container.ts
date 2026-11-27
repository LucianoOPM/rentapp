// Único lugar donde se crean servicios y repositorios y se les pasan sus dependencias.
import { auth } from '@lib/auth';
import { db } from '@lib/db';
import { DrizzleUserRepository } from '@lib/repositories/user-repository';
import { AuthService } from '@lib/services/auth-service';

export const authService = new AuthService(auth, new DrizzleUserRepository(db));
