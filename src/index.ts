import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, ElementHandle, Page } from 'puppeteer';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path, { dirname } from 'node:path';
import readline from 'node:readline/promises';
import { TOTP } from 'totp-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({
    path: path.join(__dirname, '../.env'),
});

puppeteer.default.use(StealthPlugin());

let puppeteerBrowser: Browser;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function generateRandom(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPost(posts: ElementHandle<Element>[]): ElementHandle<Element> {
    const post = posts[generateRandom(0, posts.length - 1)];
    if (!post) throw new Error('No post');
    return post;
}

async function prompt(prompt: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const res = await rl.question(prompt);

    rl.close();

    return res;
}

async function smoothScroll(page: Page, distance: number, step: number = 100, delay: number = 50) {
    let scrolled = 0;
    while (scrolled < distance) {
        await page.mouse.wheel({ deltaY: step });
        scrolled += step;
        await new Promise((r) => setTimeout(r, delay));
    }
}

async function login(page: Page) {
    await page.click('#login-button');
    await delay(2000);
    await page.screenshot({
        path: 'screenshots/login.png',
    });

    const username = process.env.REDDIT_USERNAME;
    console.log('Username:', username);
    if (!username) process.exit(1);
    await page.click('#login-username');
    await delay(2000);
    await page.type('#login-username', username, { delay: 100 });
    await delay(2000);
    await page.screenshot({
        path: 'screenshots/username.png',
    });

    const password = process.env.REDDIT_PASSWORD;
    console.log('Password:', '*'.repeat(password?.length || 1));
    if (!password) process.exit(1);
    await page.click('#login-password');
    await delay(2000);
    await page.type('#login-password', password, { delay: 100 });
    await delay(2000);
    await page.screenshot({
        path: 'screenshots/password.png',
    });

    await page.click(
        '#login > auth-flow-modal > div.w-100 > faceplate-tracker:nth-child(1) > button',
    );
    await delay(2000);
    await page.screenshot({
        path: 'screenshots/auth_code.png',
    });

    const authSecret = process.env.REDDIT_2FA_SECRET;
    let authCode: string;
    if (authSecret) {
        authCode = (await TOTP.generate(authSecret)).otp;
    } else {
        authCode = await prompt('2FA code: ');
    }
    console.log('2FA code:', authCode);
    await page.click('#one-time-code-appOtp');
    await page.type('#one-time-code-appOtp', authCode, { delay: 100 });
    await delay(2000);
    await page.screenshot({
        path: 'screenshots/auth_input.png',
    });

    await page.click('#login-app-otp > auth-flow-modal > div.w-100 > button');
    await delay(10000);
    await page.screenshot({
        path: 'screenshots/auth_success.png',
    });
}

async function upvotePost(page: Page) {
    try {
        await page.waitForSelector('[post-title] >>> [upvote]');
        await page.click('[post-title] >>> [upvote]');
        await delay(2000);
        await page.screenshot({
            path: 'screenshots/post_upvoted.png',
        });

        const posts = await page.$$('[post-title] > a.absolute.inset-0');
        const post = getRandomPost(posts);
        console.log('Found post:', post);
        await post.scrollIntoView();
        await post.click();
        console.log('Clicked post.');
        await delay(generateRandom(30000, 60000));
        await smoothScroll(page, generateRandom(500, 2000), generateRandom(100, 200), 50);
        await page.goBack({
            waitUntil: 'networkidle2',
        });
    } catch (error) {
        console.error(error);
        await page.goto('https://reddit.com', {
            waitUntil: 'networkidle2',
        });
        upvotePost(page);
    }
}

async function main() {
    const browser = process.env.CUSTOM_CHROMIUM_PATH
        ? await puppeteer.default.launch({
              headless: false,
              args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--window-size=1920,1080',
              ],
              executablePath: process.env.CUSTOM_CHROMIUM_PATH,
          })
        : await puppeteer.default.launch({
              headless: false,
              args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--window-size=1920,1080',
              ],
          });
    puppeteerBrowser = browser;

    const page = await browser.newPage();

    await page.goto('https://reddit.com', {
        waitUntil: 'networkidle2',
    });

    await page.screenshot({
        path: `screenshots/load.png`,
    });

    await login(page);
    await upvotePost(page);

    await browser.close();

    process.exit(0);
}

process.on('SIGINT', async () => {
    await puppeteerBrowser.close();
    process.exit(0);
});

main();
