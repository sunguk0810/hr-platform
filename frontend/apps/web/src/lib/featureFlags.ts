/**
 * Check if mock mode is enabled for a specific service or globally.
 *
 * Usage:
 *   isMockEnabled()         → checks global VITE_ENABLE_MOCK
 *   isMockEnabled('auth')   → checks VITE_MOCK_AUTH, falls back to global
 */
export function isMockEnabled(service?: string): boolean {
  const globalMock = import.meta.env.VITE_ENABLE_MOCK === 'true';
  if (!service) return globalMock;

  const envKey = `VITE_MOCK_${service.toUpperCase()}`;
  const serviceMock = import.meta.env[envKey];
  if (serviceMock !== undefined) return serviceMock === 'true';

  return globalMock;
}
