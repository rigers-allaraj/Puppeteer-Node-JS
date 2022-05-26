
const puppeteer = require('puppeteer');
const fs = require("fs");

(async () => {
    const url = 'https://www.buzzfeed.com/nusrat21/things-so-amazing-youll-break-into-song-dance';
    browser = await puppeteer.launch({
        headless: false,
        args: ["--disable-setuid-sandbox"],
        'ignoreHTTPSErrors': true
    });
    const width = 1524;
    const height = 1600;
    let allData = [];
    let page = await browser.newPage();

    //wait some seconds as required on task
    await page.waitForTimeout(3000);
    await page.setViewport({ 'width': width, 'height': height });
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
    //check
    await page.waitForSelector('h1.headline_title__NbsAE');

    //part 1
    const buzzFeed = await page.evaluate(() => Array.from(document.querySelectorAll('.js-subbuzz-wrapper:not(:last-child)'))
        .map(bzz => ([
            bzz.querySelector('.js-subbuzz__title-text').textContent.trim(),
            bzz.querySelector('.subbuzz__description').textContent.trim(),
            Array.from(bzz.querySelectorAll('img')).map(image => image.getAttribute('data-src')).toString().replace(/\,https:/g, ' | https:'),
            bzz.querySelector(`.subbuzz__description p:last-child > a[data-vars-name*='$']`) ? bzz.querySelector(`.subbuzz__description p:last-child > a[data-vars-name*='$']`).textContent.trim() : bzz.querySelector(`.subbuzz__description p > a[data-vars-name*='$']`).textContent.trim(),
        ])));
    
    //part 2 of task  
    await page.waitForTimeout(3000);

    const buttons = await page.$x(`//div[contains(@class,"subbuzz__descriptio")][//a[@data-vars-price.value]]//p[last()]/a[@data-vars-price.value> 25]/ancestor::div[contains(@class,"js-subbuzz-wrapper")][1]//button[@class="wishlist-button_button__Bkgar wishlist-button_wishButton__r__5E undefined null null"]`);
    for (let button of buttons) {
        await page.waitForXPath(`//div[contains(@class,"subbuzz__descriptio")][//a[@data-vars-price.value]]//p[last()]/a[@data-vars-price.value> 25]/ancestor::div[contains(@class,"js-subbuzz-wrapper")][1]//button[@class="wishlist-button_button__Bkgar wishlist-button_wishButton__r__5E undefined null null"]`);
        console.log("Click")
        await button.click();
    }
    // all results
    allData.push(...buzzFeed);
    console.log(allData, allData.length);
    await browser.close();

})();
