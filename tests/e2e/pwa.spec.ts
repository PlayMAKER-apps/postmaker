import { expect, test } from '@playwright/test';

const appPath = '/postmaker/';

test('saves a project to IndexedDB and restores it after reload', async ({ page }) => {
  await page.goto(appPath);
  await page.getByRole('button', { name: 'Start Manual mode' }).click();
  await page.getByLabel('Project name').fill('Mobile saved project');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.getByLabel('Project name')).toHaveValue('Mobile saved project');
});

test('exports a recoverable JSON backup and imports it again', async ({ page }) => {
  await page.goto(appPath);
  await page.getByRole('button', { name: 'Start Manual mode' }).click();
  await page.getByLabel('Project name').fill('Recoverable project');
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share or export backup', exact: true }).first().click();
  const backup = await backupPromise;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();
  await page.getByRole('button', { name: 'Projects' }).click();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.locator('input[type=file][accept*="application/json"]').setInputFiles(backupPath!);
  await expect(page.getByLabel('Project name')).toHaveValue('Recoverable project');
});

test('exports the rendered graphic as a PNG', async ({ page }) => {
  await page.goto(appPath);
  await page.getByRole('button', { name: 'Start Manual mode' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share or download PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});

test('uses the GitHub Pages base path and starts offline after one online load', async ({ page, context }) => {
  await page.goto(appPath);
  await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href', '/postmaker/manifest.webmanifest');
  await page.evaluate(async () => Boolean(await navigator.serviceWorker.ready));
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).some(key => key.startsWith('postmaker-shell-')))).toBe(true);
  const scriptSources = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => (node as HTMLScriptElement).src));
  expect(scriptSources.every(source => new URL(source).pathname.startsWith('/postmaker/'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sports graphics workspace' })).toBeVisible();
});

test('offers collapsible editor sections at smartphone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appPath);
  await page.getByRole('button', { name: 'Start Manual mode' }).click();
  await expect(page.getByRole('navigation', { name: 'Editor sections' })).toBeVisible();
  const projectPanel = page.locator('#project-panel');
  await expect(projectPanel).toHaveAttribute('open', '');
  await projectPanel.locator('summary').click();
  await expect(projectPanel).not.toHaveAttribute('open', '');
  await expect(page.getByRole('button', { name: 'Share or download PNG' })).toBeVisible();
});
