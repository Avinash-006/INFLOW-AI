import puppeteer from 'puppeteer';
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9223' });
const pages = await browser.pages();
for (const page of pages) {
    const url = await page.url();
    if (url.includes('localhost:5174')) {
        console.log("Analyzing page...");
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        await page.evaluate(() => {
            console.log("Hello from browser");
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Visualize'));
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
        break;
    }
}
await browser.disconnect();
