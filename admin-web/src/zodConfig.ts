import { z } from 'zod'

// Zod's JIT probes `new Function('')` when the first object schema is built, to see whether
// eval is allowed. Under a CSP without 'unsafe-eval' that probe is reported as a violation on
// every page. The interpreter path is plenty fast for the few small schemas here. This module
// is imported first in main.tsx so it runs before any schema is created.
z.config({ jitless: true })
