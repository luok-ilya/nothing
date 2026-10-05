const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 const page = await browser.newPage({viewport:{width:1440,height:1080}});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('index.html')).href);
 const box=await page.locator('canvas').boundingBox();
 const pixel=()=>page.evaluate(()=>Array.from(document.querySelector('canvas').getContext('2d').getImageData(180,180,1,1).data));
 const stroke=async()=>{await page.mouse.move(box.x+box.width*.1,box.y+box.height*.1);await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.32,{steps:20});await page.mouse.up();};
 await page.mouse.move(box.x+box.width*.15,box.y+box.height*180/760);await page.mouse.down();await page.mouse.up();
 assert.deepEqual(await pixel(),[37,99,235,255]);
 await page.locator('#undo').click();assert.deepEqual(await pixel(),[255,255,255,255]);
 await page.locator('#redo').click();assert.deepEqual(await pixel(),[37,99,235,255]);
 await page.locator('[data-tool=eraser]').click();await page.mouse.move(box.x+box.width*.15,box.y+box.height*180/760);await page.mouse.down();await page.mouse.up();assert.deepEqual(await pixel(),[255,255,255,255]);
 for(const tool of ['line','rectangle','ellipse']){await page.locator(`[data-tool=${tool}]`).click();await stroke();}
 const downloadPromise=page.waitForEvent('download');await page.locator('#save').click();const download=await downloadPromise;await download.saveAs(path.resolve('verification.png'));assert.equal(download.suggestedFilename(),'我的画作.png');
 await page.locator('#file').setInputFiles(path.resolve('verification.png'));await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('图片已打开'));
 page.once('dialog',dialog=>dialog.accept());await page.locator('#clear').click();assert.deepEqual(await pixel(),[255,255,255,255]);await page.locator('#undo').click();
 await page.screenshot({path:'preview.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log('PASS: drawing pixels, undo, redo, eraser, shapes, PNG download, image import, clear, mobile overflow, no browser errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
