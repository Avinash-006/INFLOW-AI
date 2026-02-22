import puppeteer from 'puppeteer';
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9224' });
const pages = await browser.pages();
for (const page of pages) {
    const url = await page.url();
    if (url.includes('localhost:5174')) {
        console.log("Analyzing page...");
        let errorCount = 0;
        page.on('console', msg => { 
            const text = msg.text();
            if (text.includes("Context Lost") || text.includes("Cannot set property")) errorCount++;
        });
        page.on('pageerror', error => { errorCount++; console.log('PAGE ERROR:', error.message); });
        await page.evaluate(() => {
            console.log("Hello from browser");
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Visualize'));
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
        console.log("Errors detected:", errorCount);
        break;
    }
}
await browser.disconnect();
