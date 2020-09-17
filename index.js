const puppeteer = require("puppeteer");
const fs = require("fs");
const json2csv = require("json2csv").Parser;

const SIGN_IN = "body > div > main > p > a";
const EMAIL_SELECTOR = "#username";
const PASSWORD_SELECTOR = "#password";
const LINKEDIN_LOGIN_URL =
  "https://www.linkedin.com/signup/cold-join?session_redirect=https%3A%2F%2Fwww%2Elinkedin%2Ecom%2Fgroups%2F4484356%2Fmembers%2F&trk=login_reg_redirect";
const SUBMIT_BUTTON =
  "#app__container > main > div:nth-child(2) > form > div.login__form_action_container > button";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(LINKEDIN_LOGIN_URL, {
    waitUntil: "networkidle2",
  });
  await page.click(SIGN_IN);
  await page.click(EMAIL_SELECTOR);
  await page.keyboard.type("mukesh.rajasekar@gmail.com");
  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type("mukesh2297");
  await page.click(SUBMIT_BUTTON);
  await page.waitForNavigation();
  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await autoScroll(page);
  const result = await page.evaluate(() => {
    let membersArray = [];

    let arrayLength = document.getElementsByClassName(
      "groups-members-list__typeahead-result relative artdeco-typeahead__result ember-view"
    ).length;

    for (let i = 0; i < arrayLength; i++) {
      const imgUrl = document.getElementsByClassName(
        "groups-members-list__typeahead-result relative artdeco-typeahead__result ember-view"
      )[i].children[0].children[0].children[0].children[0].children[0]
        .children[0].src;
      const name = document
        .getElementsByClassName(
          "groups-members-list__typeahead-result relative artdeco-typeahead__result ember-view"
        )
        [
          i
        ].children[0].children[0].children[0].children[1].children[0].textContent.trim();
      const title = document
        .getElementsByClassName(
          "groups-members-list__typeahead-result relative artdeco-typeahead__result ember-view"
        )
        [
          i
        ].children[0].children[0].children[0].children[1].children[2].textContent.trim();
      const memberObj = { imageUrl: imgUrl, username: name, title: title };

      membersArray.push(memberObj);
    }
    return membersArray;
  });

  const membersInfoArrayLength = await page.evaluate(() => {
    let arrayLength = document.getElementsByClassName(
      "groups-members-list__typeahead-result relative artdeco-typeahead__result ember-view"
    ).length;

    return arrayLength;
  });

  const individualMembersObjArray = [];

  for (let i = 0; i < 3; i++) {
    const href = await page.evaluate((i) => {
      return document.getElementsByClassName(
        "groups-members-list__typeahead-result relative artdeco-typeahead__result ember-view"
      )[i].children[0].children[0].href;
    }, i);

    await page.goto(href, { waitUntil: "load" });

    //await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    const username = await page.evaluate(() => {
      return document
        .getElementsByClassName("flex-1 mr5")[0]
        .children[0].children[0].textContent.trim();
    });

    console.log(username);

    const subtitle = await page.evaluate(() => {
      return document
        .getElementsByClassName("flex-1 mr5")[0]
        .children[1].textContent.trim();
    });

    console.log(subtitle);

    individualMembersObjArray.push({ username, subtitle });

    await page.goBack();
  }

  const j2cp = new json2csv();
  const csv = j2cp.parse(individualMembersObjArray);

  fs.writeFileSync("./memberData.csv", csv, "utf-8");

  await browser.close();
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
