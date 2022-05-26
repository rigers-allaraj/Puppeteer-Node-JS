const puppeteer = require('puppeteer');
const fs = require('fs');
const {performance} = require('perf_hooks');

async function extractedEvaluateCall(page) {
    console.log("loading...")
    return page.evaluate(() => {
        let values = [];
        try {
            const list = document.querySelectorAll('.brokers-grid-wrapper >.broker .broker-tile-header-standard');
            for (el of list) {
                const name = el.childNodes[1].textContent.trim();
                let company = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-company');
                const city = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-city');
                const state = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-state');
                let mobile = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-mobile');
                const phone = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-phone');
                const email = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-email');
                //extract id just in case to do a better QA process
                const id = el.closest('.broker-tile-header-standard').closest('div.broker').childNodes[03].querySelector('a').getAttribute('data-external_id');
                mobile = mobile !== null ? mobile : '';
                company = (company !== null) ? company : '';
                values.push({ name, company, city, state, mobile, phone, email });
            }
        }
        catch (e) {
            throw new Error(e)
        }
        return values;
    })
}

const scrape = async () => {
    console.log("Starting...")
    const startTime = performance.now();
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1560, height: 680, deviceScaleFactor: 1, })
    await page.goto('https://www.mortgageandfinancehelp.com.au/find-accredited-broker/?location=2000');

    let hasMore = true;
    let data = [];

    while (hasMore) {
        await page.waitForXPath('//a[@class="loadMore"][not(contains(@style,"none"))]');
        const [button] = await page.$x('//a[@class="loadMore"][not(contains(@style,"none"))]');
        await button.click();

        try {
            console.log("Extracting...")
            await page.waitForXPath('//a[@class="loadMore"][not(contains(@style,"none"))]');
            await page.evaluate(() => {
                const getElement = document.evaluate('//a[@class="loadMore"][not(contains(@style,"none"))]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                return getElement.singleNodeValue.textContent;
            });
        }
        catch (error) {
            console.log("The element didn't appear.")
            if (error) {
                console.log(error.message);
                hasMore = false; // stop the load more click action
            }
        }
    }

    data = data.concat(await extractedEvaluateCall(page).catch((error) => {
        console.log(error);
    })
    )

    //success
    console.log("Finished successfully", data, 'Finished successfull', data.length , 'results')
    const endTime = performance.now();

    const d = new Date(1000*Math.round((endTime - startTime)/1000)); // round to nearest second
    function pad(i) { return ('0'+i).slice(-2); }
    const finalTime = d.getUTCHours() + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
    console.log(`Data extraction was performed in ${finalTime} `)
    return data;
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

scrape()
    .then((value) => {
        const csvData = objectToCsv(value);
        // console.log(csvData);
        fs.appendFile('output.csv', csvData, (err) =>{
        if (err) {
            console.log(err);
        }});
    })
    .catch((error) => console.log(error.message))

