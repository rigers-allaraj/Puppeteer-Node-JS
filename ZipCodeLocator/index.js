const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const getArray = require('./readFile.js');

let scrape = async () => {
    const array = await getArray.main();
    console.log(array)
    console.log("Starting...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1560, height: 680, deviceScaleFactor: 1, })
    await page.goto('https://ahainstructornetwork.americanheart.org/AHAECC/classConnector.jsp?pid=ahaecc.classconnector.home');
    let results = [];
    for (val of array) {
        let inputValue = val;
        console.log({ inputValue }, typeof val)
        let element = await page.waitForXPath(`//div[@class="input-group"]//input[@title="Enter a location"]`);
        await element.type(inputValue);
        const [el] = await page.$x(`//button[@id="submitButton"]`);
        await el.click()
        let hasResults = await page.$('div[style="display: none;"].alert-danger');
        if (hasResults !== null) {
            await page.waitForSelector('#resultsBin > .page .tc-name');
            results = results.concat(await extractedEvaluateCall(page))
            // .catch((e) => console.log("E", e)));
        }
        await page.$eval('div input.pac-target-input', el => el.value = '');
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    } return results;
};


async function extractedEvaluateCall(page) {

    return page.evaluate(() => {
        let data = [];
        let elements = document.querySelectorAll('#resultsBin > .page .tc-name');
        for (const element of elements) {
            let title = element.childNodes[1].textContent;
            let address = element.closest('div').childNodes[1].textContent;
            let cityState = element.closest('div').childNodes[2].textContent;
            let phonee = element.closest('div');
            let phone = phonee.querySelector("a[href^='tel']") ? phonee.querySelector("a[href^='tel']").textContent : '';
            let email = element.closest('div').querySelectorAll("a[href^='mailto']")[0] ? element.closest('div').querySelectorAll("a[href^='mailto']")[0].href.replace(/mailto:/g, "") : '';
            let website = element.closest('div').querySelector('.glyphicon-globe') ? element.closest('div').querySelector('.glyphicon-globe').closest('a').href : "";
            let direction = element.closest('div').querySelector('.glyphicon-map-marker') ? element.closest('div').querySelector('.glyphicon-map-marker').closest('a').href : "";
            //get lat long
            const regex = new RegExp('&end=(.*),(.*)$');
            const lat_long_match = direction.match(regex);
            const lat = lat_long_match ? lat_long_match[1] : "";
            const long = lat_long_match ? lat_long_match[2] : "";
            data.push({ title, address, cityState, phone, email, website, direction, lat, long });
        }
        return data;
    });
}

const objectToCsv = function (data) {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header]
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
};

async function main() {
    try {
        scrape().then((value) => {
            console.log({ value });
            console.log(value[value.length - 1], value.length);
            const csvData = objectToCsv(value);
            console.log("Finished successfully!");
            fs.appendFile('data.csv', csvData, (errr) =>
                console.log({ errr }));
        }).catch((e) => console.log(e))
    } catch (err) {
        console.log(err);
    }
}
main()


