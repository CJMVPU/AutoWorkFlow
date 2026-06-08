import { chromium } from 'playwright';

async function main() {
  // 1. 启动浏览器 
  // headless: false 可以让你弹窗看着它自动操作浏览器，调试时非常直观
  console.log('正在启动 Chromium 浏览器...');
  const browser = await chromium.launch({ headless: false }); 
  
  // 2. 创建一个新的浏览器上下文（类似无痕模式的独立环境）和页面
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://example.com';
  console.log(`[Playwright] 正在导航至: ${url} ...`);

  try {
    // 3. 访问网页，waitUntil: 'domcontentloaded' 确保基础 DOM 树构建完毕
    // 如果是极其复杂的单页应用(SPA)，可以改为 'networkidle' 确保网络请求完全静止
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 4. 使用 Locator 提取数据 (完美替代 Cheerio)
    // 即使页面是 JS 动态渲染的，Playwright 也会自动等待该元素出现在 DOM 中
    const titleLocator = page.locator('h1');
    const titleText = await titleLocator.textContent();
    
    console.log(`抓取成功！网页大标题是: ${titleText?.trim()}`);

    // 进阶示例：如果页面里有个列表，可以这样批量提取文本：
    // const listItems = await page.locator('ul > li').allTextContents();
    // console.log('列表内容:', listItems);

  } catch (error) {
    console.error('抓取过程中发生错误:', error);
  } finally {
    // 5. 爬取结束，务必关闭浏览器释放资源
    await browser.close();
    console.log('浏览器已关闭。');
  }
}

main();