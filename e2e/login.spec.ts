import { test, expect } from '@playwright/test'

test('login page loads and shows form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('h1')).toContainText('Iniciar Sesión')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'wrong@email.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 10000 })
})

test('login redirects to dashboard on success', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'admin@donanina.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
})
