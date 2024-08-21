import jsdom from 'jsdom';
const { JSDOM } = jsdom;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from "node-fetch";

const fetch0 = url=> {
	return new Promise((resolve, reject) => {
		fetch(url, {
			"headers": {
				"accept": "text/html, */*; q=0.01",
				"accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
				"cache-control": "no-cache",
				"pragma": "no-cache",
				"sec-ch-ua": "\"Microsoft Edge\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": "\"Windows\"",
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"x-requested-with": "XMLHttpRequest",
				"cookie": "cna=eY6BGb2h7yACAbSMsOm2vFG2; sca=5a4237a6; atpsida=6e052f524a88bc925aed09c0_1664038526_68",
				"Referer": url,
				"Referrer-Policy": "strict-origin-when-cross-origin"
			},
			"body": null,
			"method": "GET"
		}).then(res => {
			resolve(res.text());
		});
	});
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns 当前日期，format: 20220929
 */
const getDate = () => {
	const date = new Date();
	date.setDate(date.getDate() - 1); // 获取昨天日期
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
}

const DATE = getDate();
const NEWS_PATH = path.join(__dirname, 'cctv_news');
const NEWS_MD_PATH = path.join(NEWS_PATH, DATE + '.md');
const README_PATH = path.join(__dirname, 'README.md');

console.log('DATE:', DATE);
console.log('NEWS_PATH:', NEWS_PATH);
console.log('README_PATH:', README_PATH);

/**
 * @param {String} path 需读取文件的路径
 * @returns {String} (Primise) 文件内容
 */
const readFile = path => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, {}, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

/**
 * @param {String} path 需写入文件的路径
 * @param {String} data 需写入的数据
 * @returns {*} (Primise)
 */
const writeFile = (path, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, data, err => {
			if (err) reject(err);
			resolve(true);
		});
	});
};

/**
 * @param {String|Number} date 当前日期
 * @returns {Object} abstract为简介的链接, news为新闻链接数组
 */
const getCCTVNewsList = async date => {
	const HTML = await fetch0(`http://tv.cctv.com/lm/xwlb/day/${date}.shtml`);
	const fullHTML = `<!DOCTYPE html><html><head></head><body>${HTML}</body></html>`;
	const dom = new JSDOM(fullHTML);
	const nodes = dom.window.document.querySelectorAll('a');
	var links = [];
	nodes.forEach(node => {
		let link = node.href;
		if (!links.includes(link)) links.push(link);
	});
	const abstract = links.shift();
	console.log('getCCTVNewsList sucess');
	return {
		abstract,
		news: links
	}
}

/**
 * 获取新闻摘要 (简介)
 * @param {String} link 简介的链接
 * @returns {String} 简介内容
 */
const getAbstract = async link => {
	const HTML = await fetch0(link);
	const dom = new JSDOM(HTML);
	const abstract = dom.window.document.querySelector(
		'#page_body > div.allcontent > div.video18847 > div.playingCon > div.nrjianjie_shadow > div > ul > li:nth-child(1) > p'
	).innerHTML.replaceAll('；', "；\n\n").replaceAll('：', "：\n\n");
	console.log('成功获取新闻简介');
	return abstract;
}

/**
 * @param {Array} links 链接数组
 * @returns {Object} title为新闻标题, content为新闻内容
 */
const getNews = async links => {
	const linksLength = links.length;
	console.log('共', linksLength, '则新闻, 开始获取');
	// 所有新闻
	var news = [];
	for (let i = 0; i < linksLength; i++) {
		const url = links[i];
		const html = await fetch0(url);
		const dom = new JSDOM(html);
		const title = dom.window.document.querySelector('#page_body > div.allcontent > div.video18847 > div.playingVideo > div.tit')?.innerHTML?.replace('[视频]', '');
		const content = dom.window.document.querySelector('#content_area')?.innerHTML;
		news.push({ title, content });
		console.count('获取的新闻则数');
	}
	console.log('成功获取所有新闻');
	return news;
}

/**
 * @param {Object} object date为获取的时间, abstract为新闻简介, news为新闻数组, links为新闻链接
 * @returns {String} 处理成功后的md文本
 */
const newsToMarkdown = ({ date, abstract, news, links }) => {
	// 将数据处理为md文档
	let mdNews = '';
	const newsLength = news.length;
	for (let i = 0; i < newsLength; i++) {
		const { title, content } = news[i];
		const link = links[i];
		mdNews += `### ${title}\n\n${content}\n\n[查看原文](${link})\n\n`;
	}
	return `# 《新闻联播》 (${date})\n\n## 新闻摘要\n\n${abstract}\n\n## 详细新闻\n\n${mdNews}\n\n---\n\n(更新时间戳: ${new Date().getTime()})\n\n`;
}

const saveTextToFile = async (savePath, text) => {
	// 输出到文件
	await writeFile(savePath, text);
}

const updateReadMe = async ({ readmeMdPath, date }) => {
	await readFile(readmeMdPath).then(async data => {
		data = data.toString();
		let text = data.replace('<!-- INSERT -->', `<!-- INSERT -->\n- [${date}](./news/${date}.md)`)
		await writeFile(readmeMdPath, text);
	});
	console.log('update README.md done');
}

const newsList = await getCCTVNewsList(DATE);
const abstract = await getAbstract(newsList.abstract);
const news = await getNews(newsList.news);
const md = newsToMarkdown({
	date: DATE,
	abstract,
	news,
	links: newsList.news
});
await saveTextToFile(NEWS_MD_PATH, md);
await updateReadMe({ 
	readmeMdPath: README_PATH,
	date: DATE,
});
console.log('done');
