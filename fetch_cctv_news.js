import jsdom from 'jsdom';
const { JSDOM } = jsdom;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from "node-fetch";

const do_fetch = url=> {
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
 * @returns eg: 20220929
 */
const getDate = () => {
	const date = new Date();
	date.setDate(date.getDate() - 1); // 获取昨天日期
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth 从0开始
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
}

const DATE = getDate();
const NEWS_PATH = path.join(__dirname, 'news');
if (!fs.existsSync(NEWS_PATH)) {
	fs.mkdirSync(NEWS_PATH);
}
const NEWS_MD_PATH = path.join(NEWS_PATH, DATE + '.md');

console.log('DATE:', DATE);
console.log('NEWS_PATH:', NEWS_PATH);


const readFile = path => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, {}, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
};

const writeFile = (path, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, data, err => {
			if (err) reject(err);
			resolve(true);
		});
	});
};

const getCCTVNewsList = async date => {
	const HTML = await do_fetch(`http://tv.cctv.com/lm/xwlb/day/${date}.shtml`);
	const dom = new JSDOM(HTML);
	const nodes = dom.window.document.querySelectorAll('a');
	var links = [];
	nodes.forEach(node => {
		let link = node.href;
		if (!links.includes(link)) links.push(link);
	});
	const abstract = links.shift();
	console.log('getCCTVNewsList success');
	return {
		abstract,
		news: links
	}
}

const getAbstract = async link => {
	const HTML = await do_fetch(link);
	const dom = new JSDOM(HTML);
	const abstract = dom.window.document.querySelector(
		'#page_body > div.allcontent > div.video18847 > div.playingCon > div.nrjianjie_shadow > div > ul > li:nth-child(1) > p'
	).innerHTML.replaceAll('；', "；\n\n").replaceAll('：', "：\n\n");
	console.log('getAbstract success');
	return abstract;
}


const getNews = async links => {
	const linksLength = links.length;
	console.log('total:', linksLength, ' news, start fetch...');
	var news = [];
	for (let i = 0; i < linksLength; i++) {
		const url = links[i];
		const html = await do_fetch(url);
		const dom = new JSDOM(html);
		const title = dom.window.document.querySelector('#page_body > div.allcontent > div.video18847 > div.playingVideo > div.tit')?.innerHTML?.replace('[视频]', '');
		const content = dom.window.document.querySelector('#content_area')?.innerHTML;
		news.push({ title, content });
	}
	console.log('getNews success');
	return news;
}


const newsToMarkdown = ({ date, abstract, news, links }) => {
	let mdNews = '';
	const newsLength = news.length;
	for (let i = 0; i < newsLength; i++) {
		const { title, content } = news[i];
		const link = links[i];
		mdNews += `### ${title}\n\n${content}\n\n[原文](${link})\n\n`;
	}
	return `# 新闻联播 (${date})\n\n## 摘要\n\n${abstract}\n\n## 详细新闻\n\n${mdNews}\n\n`;
}

const saveTextToFile = async (savePath, text) => {
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
// await updateReadMe({ 
// 	readmeMdPath: README_PATH,
// 	date: DATE,
// });
console.log('done');
