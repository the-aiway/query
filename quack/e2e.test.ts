import { chromium } from 'playwright';

async function testQuack() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000...');

  page.on('console', (msg) => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('requestfailed', (request) => {
    console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('pageerror', (err) => {
    console.log(`BROWSER PAGE ERROR: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for DuckDB to initialize (it sets the root text)
    console.log('Waiting for DuckDB Ready...');
    await page.waitForFunction(
      () => {
        return document.body.textContent?.includes('Transport Optimization');
      },
      { timeout: 30000 }
    );

    console.log('Optimizer Dashboard loaded.');

    // Wait for the "Projected Savings" card to have a real number (not "...")
    console.log('Waiting for analytics to materialize...');
    await page.waitForFunction(
      () => {
        const cards = document.querySelectorAll('div > div > div');
        const savingsCard = Array.from(cards).find((c) =>
          c.textContent?.includes('Projected Savings')
        );
        if (!savingsCard) return false;
        const value = savingsCard.querySelector('div:last-child')?.textContent;
        return value && value !== '...';
      },
      { timeout: 60000 }
    );

    const stats = await page.evaluate(() => {
      const cards = document.querySelectorAll('div > div > div');
      return Array.from(cards)
        .map((c) => {
          const label = c.querySelector('div:first-child')?.textContent;
          const value = c.querySelector('div:last-child')?.textContent;
          if (!label || !value) return null;
          return `${label}: ${value}`;
        })
        .filter(Boolean);
    });
    console.log('Final Performance Snapshot:', stats);
    console.log('Detected Stats:', stats);

    console.log('Testing Slider Interaction...');
    await page.fill('input[type="range"]', '0.5'); // Move to 50%
    await page.dispatchEvent('input[type="range"]', 'change');

    // Wait for the numbers to change/update
    console.log('Waiting for re-calculation...');
    await page.waitForTimeout(2000);

    const updatedStats = await page.evaluate(() => {
      const cards = document.querySelectorAll('div > div > div');
      return Array.from(cards)
        .map((c) => {
          const label = c.querySelector('div:first-child')?.textContent;
          const value = c.querySelector('div:last-child')?.textContent;
          if (!label || !value) return null;
          return `${label}: ${value}`;
        })
        .filter(Boolean);
    });
    console.log('Testing Segment Toggle (Removing Colis)...');
    await page.click('button:has-text("Colis")');

    console.log('Waiting for re-calculation after segment toggle...');
    await page.waitForTimeout(2000);

    const segmentStats = await page.evaluate(() => {
      const cards = document.querySelectorAll('div > div > div');
      return Array.from(cards)
        .map((c) => {
          const label = c.querySelector('div:first-child')?.textContent;
          const value = c.querySelector('div:last-child')?.textContent;
          if (!label || !value) return null;
          return `${label}: ${value}`;
        })
        .filter(Boolean);
    });
    console.log('Stats after Segment Change:', segmentStats);
    console.log('Detected Stats:', segmentStats);

    await page.screenshot({ path: 'quack_test_result.png' });
    console.log('Screenshot saved to quack_test_result.png');
  } catch (e) {
    console.error('Test Failed:', e.message);
    await page.screenshot({ path: 'quack_error.png' });
  } finally {
    await browser.close();
  }
}

testQuack();
