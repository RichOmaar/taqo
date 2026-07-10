import { expect, test } from '@playwright/test';

import { truncateEntries } from './helpers';

const CLIENT = 'http://localhost:3102';
const RECEPTION = 'http://localhost:3103';

test.beforeEach(async () => {
  await truncateEntries();
});

test('a diner joins and sees their live waiting status', async ({ page }) => {
  await page.goto(CLIENT);
  await page.getByPlaceholder('O usa un apodo divertido').fill('Playwright Diner');
  await page.getByRole('button', { name: 'Unirme a la fila' }).click();
  await expect(page.getByText('¡Estás en la fila!')).toBeVisible();
});

test('reception sees a live join and notifying reaches the diner', async ({ browser }) => {
  // Staff logs in to the reception board.
  const staff = await browser.newContext();
  const staffPage = await staff.newPage();
  await staffPage.goto(RECEPTION);
  await staffPage.locator('input[type="email"]').fill('owner@demo.nexa');
  await staffPage.locator('input[type="password"]').fill('ownerpass123');
  await staffPage.getByRole('button', { name: 'Entrar' }).click();
  await expect(staffPage.getByRole('heading', { name: 'Cola en vivo' })).toBeVisible();

  // A diner joins from the client app.
  const dinerCtx = await browser.newContext();
  const dinerPage = await dinerCtx.newPage();
  await dinerPage.goto(CLIENT);
  await dinerPage.getByPlaceholder('O usa un apodo divertido').fill('Live Diner');
  await dinerPage.getByRole('button', { name: 'Unirme a la fila' }).click();
  await expect(dinerPage.getByText('¡Estás en la fila!')).toBeVisible();

  // The diner appears on the reception board in real time.
  await expect(staffPage.getByText('Live Diner')).toBeVisible();

  // Reception notifies → the diner sees "table ready" live.
  await staffPage.getByRole('button', { name: 'Avisar' }).click();
  await expect(dinerPage.getByText('¡Tu mesa está lista!')).toBeVisible();

  await staff.close();
  await dinerCtx.close();
});
