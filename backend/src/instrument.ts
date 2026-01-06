import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Only initialize Sentry in production with a valid DSN
const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
    // Profiling
    profilesSampleRate: 0.1, // Profile 10% of sampled transactions
    // Environment
    environment: process.env.NODE_ENV || 'development',
  });

  console.log('Sentry initialized for production monitoring');
} else {
  console.log('Sentry not initialized (no DSN or not in production)');
}

export { Sentry };
