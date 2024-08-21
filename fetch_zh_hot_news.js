import { chromium } from 'playwright';
import fs from 'fs';

async function getHtml(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' }); // 等待网络空闲
	// await page.waitForFunction(() => window.isLoaded === true);
	await page.waitForTimeout(5000); // 等待 5000 毫秒，即 5 秒
    const html = await page.content();
	await page.screenshot({ path: 'foo.jpg' });
    await browser.close();
    return html;
}

const url = "https://hot.imsyy.top/#/";
getHtml(url).then(html => {
	fs.writeFile('foo.html', html, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('The file was saved!');
        }
    });
	const cleanedContent = html.replace(/<[^>]*>/g, ' ');
    console.log(cleanedContent);
});