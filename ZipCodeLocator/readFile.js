const fs = require('fs');
const csv = require('csv-parser');

async function readInputListAsync(filename, encoding = 'utf-8') {
    return new Promise((resolve, reject) => {
        const rows = [];
        try {
            fs.createReadStream(filename, { encoding: encoding })
                .pipe(csv())
                .on('data', (row) => rows.push(row.inputZipCode))
                .on('end', () => resolve(rows))
                .on('error', reject);
        } catch (err) {
            reject(err.message);
        }
    });
}
 async function main() {
    const rows =  await readInputListAsync('input.csv');
    return rows
    console.log(rows)
}
// module.exports = {    hello: async function(){
//     return main()
//  }}

module.exports = {  main}