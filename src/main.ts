'use strict';
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

 
app.listen(4999);


/**
 * Black mage here
 * @param startAt 
 * @param arr 
 * @param page 
 */
export const recursiveTimeout = (startAt:number = 0, arr: any[], page:any, resp:any = null): any => {
	let c = startAt;
	let max = arr.length;

    if ( resp === null ) resp = {};

	if ( c < max ) {
		setTimeout( async () => {
            let id = arr[c];
			console.log(`Detected message ID : ${id}`);

            await page.click(`li[id=${id}]`);

            let treated = false;
            
            try {
                //const emailMessagesPs = await page.$$eval('.spinmail-quill-editor__spin-break', (el:any) => el.innerText);
                const emailMessagesPs = await page.evaluate(() => Array.from(document.querySelectorAll('.spinmail-quill-editor__spin-break'), (e:any) => e.innerText));
                console.log(emailMessagesPs);
                for ( let i in emailMessagesPs) {
                    resp[id] = [...resp[id], emailMessagesPs[i]];
                }
                console.log("email type detected");
                treated = true;
            } catch ( e ) {
                console.log("No email")
            }

            if ( treated === false ) {

                try {
                    const classicMessages = await page.evaluate(() => Array.from(document.querySelectorAll('.msg-s-event-listitem__body'), (e:any) => e.innerText));
                    console.log(classicMessages);
                    for ( const text of classicMessages ) {
                        resp[id] = [...resp[id], text];
                    }
                    console.log("classic type detected");
                    treated = true;
                } catch ( e ) {
                    console.log("No classic")
                }
            }

            console.log(resp[id]);
            console.log("--------------------------");

			c++;
            console.log(resp);
			recursiveTimeout(c, arr, page, resp);
		},3000)
	} else {
        return new Promise((resolve, _reject) => {
            console.log("Parsing done.")
            resolve(resp);
        });
    }
}



( async () => {

    const browser = process.env.HEADLESS === "0" ? await puppeteer.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH }) : await puppeteer.launch({ headless: true })
    
    const page = await browser.newPage();
    await page.goto('https://linkedin.com');
    await page.click('body > nav > div > a.nav__button-secondary');
    let pass = process.env.PASSWORD;
    let login = process.env.LOGIN;
    await page.$eval("#username", (el: any, login:any) => {el.value = login}, login );
    await page.$eval("#password", (el: any, pass:any) => {el.value = pass}, pass );
    await page.click('#organic-div > form > div.login__form_action_container > button');
    await page.waitForTimeout(4000)
    await page.click('#ember25');
    await page.waitForTimeout(4000)

    // Infinite loader, here we retrieve ONLY the "pre open" conversation, means 21 conversations 
    const conversations = await page.evaluate(() => {
        let list: any[] = Array.from(document.querySelectorAll("#main > div > section.scaffold-layout__list.msg__list > div.relative.display-flex.justify-center.flex-column.overflow-hidden > ul > li"));
        let convIds = list.map( (li:any) => {
            return li.id;
        })
        let cleanConvIds = Array.from(new Set(convIds.filter( (id:string) => id !== "")));
        return cleanConvIds;
     });

     console.log("Supported messages type : email, basic");

     const end = await recursiveTimeout(0, conversations, page, null);
    
})();



