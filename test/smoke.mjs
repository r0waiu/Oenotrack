import { open } from './ui.mjs';
const SHOTS = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
import fs from 'fs'; fs.mkdirSync(SHOTS, { recursive: true });
const { browser, page, errors } = await open();
await page.screenshot({ path: SHOTS + '/00-home.png' });
const tabs = await page.$$eval('[role=tab][id^=tab-]', (b) => b.map((x) => x.id));
for (const t of tabs) { await page.click('#' + t); await page.waitForTimeout(400); const txt = await page.$eval('main', (m) => m.innerText.slice(0, 120).replace(/\n/g, ' | ')); console.log(t, '→', txt); await page.screenshot({ path: `${SHOTS}/${t}.png` }); }
console.log('ERREURS:', errors.length ? errors.join('\n') : 'aucune');
await browser.close();
