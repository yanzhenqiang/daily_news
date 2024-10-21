import { chromium } from 'playwright';
import fs from 'fs';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

async function getHtml(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' }); // 等待网络空闲
	// await page.waitForFunction(() => window.isLoaded === true);
	await page.waitForTimeout(5000); //  5 s
    const html = await page.content();
	// await page.screenshot({ path: 'foo.jpg' });
    await browser.close();
    return html;
}

const url = "https://hot.imsyy.top/#/";
getHtml(url).then(html => {

    const dom = new JSDOM(html);
    const nTextElements = dom.window.document.querySelectorAll('.n-text');
    // const nTextContent = Array.from(nTextElements).map(el => el.textContent);
    const nTextContent = Array.from(nTextElements).map(el => el.textContent).join('\n');
    // console.log(nTextContent);
    fs.appendFile('zh_hots_news.txt', nTextContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('The file was saved!');
        }
    });
});

// TODO
// https://quote.eastmoney.com/center/

// https://upstract.com/

// https://github.com/cambecc/earth

// weibo baidu toutiao wangyixinwen