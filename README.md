# redditstreak

This repository contains code for a script that maintains your Reddit streak while you are away. This is entirely proof of concept and for educational purposes only. This is not meant to launch harmful attacks against Reddit.

## Installation

1. **Copy the `.env.example` and rename it to `.env`**

```bash
cp .env.example .env
```

2. **Configure your .env file\***
3. **Install everything\***

```bash
npm install
```

4. Run the project

```bash
npm run dev
```

## Build

1. Follow steps 1 - 3 above
2. Build the project

```bash
npm run build
```

## How this was made

I used `puppeteer-extra` to simulate a browser and log in to Reddit and upvote a post every 12 hours. Also my first project using Puppeteer, did it in about 4 hours.

## Process

1. Types in the username and password provided from the `.env` file
2. Generates the 2FA code via the `REDDIT_2FA_SECRET` in the `.env` file and enters it
3. If the 2FA secret doesn't exist, it reads the code from the console
4. Once the user is logged in, the script upvotes the first post and scrolls and clicks other posts
5. This process repeats every 12 hours

## Why did I even bother doing this

I need to go off Reddit for a few days due to a school camp and I don't have my phone. I don't trust anyone to use my Reddit account, so I though I'd just script something fun!

## Disclaimer

Please do not use this to abuse any of Reddit's systems. I will not be liable for anything that your instance of this does. I'm also going to stop hosting my instance once I am done with my camp and just keep the code in archive.

Also Reddit please don't ban my account thanks.

© 2026 (ing) Studios and Ethan Lee
