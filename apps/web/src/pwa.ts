export interface PwaRegistrationOptions {
  onReady: () => void;
  onUpdate: (worker: ServiceWorker) => void;
  onError: (message: string) => void;
}

export async function registerPwa(options: PwaRegistrationOptions): Promise<ServiceWorkerRegistration | null> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
    if (registration.active) options.onReady();
    if (registration.waiting) options.onUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
          if (navigator.serviceWorker.controller) options.onUpdate(worker);
          else options.onReady();
        }
      });
    });
    window.setInterval(() => { if (navigator.onLine) void registration.update(); }, 60 * 60 * 1000);
    return registration;
  } catch (error) {
    options.onError(error instanceof Error ? error.message : 'Offline installation is unavailable.');
    return null;
  }
}

export function activateUpdate(worker: ServiceWorker): void {
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  worker.postMessage({ type: 'SKIP_WAITING' });
}
