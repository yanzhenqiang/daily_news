import { chromium } from "playwright";

const run = async function () {
  const waitUntil = "networkidle";

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const pageGoto = async function () {
    const page = await context.newPage();
    try {
      await page.goto("https://colab.research.google.com/drive/1FNFybCI5yFhS2vMkXqw4zais6sdQ22Xe", { waitUntil });
      if (await page.isVisible('input[type="email"]')) {
        await page.fill('input[type="email"]', 'yanzhenqiang18811432571@gmail.com');
        await page.click('#identifierNext');        
        await page.waitForSelector('input[type="password"]', { state: 'visible' });
        await page.fill('input[type="password"]', 'your_password');
        await page.click('#passwordNext');
        await page.waitForNavigation({ waitUntil });
      }
    } catch (error) {
      console.log("---页面无法打开，请检查---");
      console.log(error);
    } finally {
      await page.close();
    }
  };

  await pageGoto();
  await browser.close();
};

run();
