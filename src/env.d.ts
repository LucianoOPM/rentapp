declare namespace App {
  interface Locals {
    /** Lo llena `src/middleware.ts`. */
    user: (typeof import('./lib/auth').auth.$Infer.Session)['user'] | null;
  }
}
