import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: false
});
const page = await browser.newPage();

// Navigate to the login page
await page.goto('https://auth0.openai.com/u/login/');

// Wait for the login form to load
await new Promise(res=>setTimeout(res,100_000))
await page.waitForSelector('#username');

// Enter username and password
await page.type('#username', process.env.OPENAI_EMAIL);
await page.type('#password', process.env.OPENAI_PASSWORD);

// Click on the login button
await page.click('button[type="submit"]');

// Wait for redirection to the chat page after successful login
await page.waitForNavigation();

// Wait for the chat messages to load
await page.waitForSelector('.message');

// Extract chat messages
const messages = await page.evaluate(() => {
  const messageElements = document.querySelectorAll('.message');
  const messageData = [];
  messageElements.forEach(element => {
    const message = {
      timestamp: element.querySelector('.message-time').textContent,
      user: element.querySelector('.message-username').textContent,
      text: element.querySelector('.message-text').textContent
    };
    messageData.push(message);
  });
  return messageData;
});

console.log(messages);

await browser.close();
