import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_URL } from 'astro:env/server';
import * as account from '@lib/schema/account';
import * as charge from '@lib/schema/charge';
import * as file from '@lib/schema/file';
import * as lease from '@lib/schema/lease';
import * as maintenanceReport from '@lib/schema/maintenance-report';
import * as payment from '@lib/schema/payment';
import * as paymentCharge from '@lib/schema/payment-charge';
import * as rateLimit from '@lib/schema/rate-limit';
import * as reportPhoto from '@lib/schema/report-photo';
import * as session from '@lib/schema/session';
import * as unit from '@lib/schema/unit';
import * as user from '@lib/schema/user';
import * as verification from '@lib/schema/verification';

// Cada entidad nueva se agrega aquí.
const schema = {
  ...account,
  ...charge,
  ...file,
  ...lease,
  ...maintenanceReport,
  ...payment,
  ...paymentCharge,
  ...rateLimit,
  ...reportPhoto,
  ...session,
  ...unit,
  ...user,
  ...verification,
};

export const db = drizzle(new Pool({ connectionString: DATABASE_URL }), { schema });
