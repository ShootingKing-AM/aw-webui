/* global fixture */
/* eslint jest/no-test-callback: "off" */
/* eslint jest/expect-expect: "off" */

import { Selector } from 'testcafe';
import { RequestLogger } from 'testcafe';

const baseURL = 'http://127.0.0.1:27180';
const HTTPLogger = RequestLogger(/^(?:(?!\.js|\.css|\.png|\.woff2).)+$/, {
  logRequestHeaders: true,
  logResponseHeaders: true,
  logRequestBody: true,
  logResponseBody: true,
  stringifyRequestBody: true,
  stringifyResponseBody: true,
});

async function hide_devonly(t) {
  // Hide all devonly-elements
  const $hidedevonly = Selector('.hide-devonly');
  for (let i = 0; i < (await $hidedevonly.count); i++) {
    await t.click($hidedevonly.nth(i));
  }
}

async function waitForLoading(t) {
  // Waits for all "Loading..." texts to disappear from page.
  // If it takes longer than 10s, it will fail.
  let $loading;

  console.log('Waiting for loading to disappear...');
  const start = new Date();
  do {
    $loading = await Selector('.aw-loading, text', { timeout: 500 }).withText(/Loading[.]{3}/g)();

    // Useful for debugging:
    if ($loading) {
      console.log(`Found loading element with contents - "${$loading.textContent}"`);

      // If taking >20s, throw an error
      if (new Date() - start > 20000) {
        console.log(await t.getBrowserConsoleMessages());
        console.log(JSON.stringify(HTTPLogger.requests, null, '\t'));
        throw new Error('Timeout while waiting for loading to disappear');
      }
      await t.wait(500);
    }
  } while ($loading);

  await t.wait(500); // wait an extra 500ms, just in case a visualization is still rendering
  console.log('Loading is gone!');
}

async function checkNoError(t) {
  const $error = Selector('div.alert').withText(/[Ee]rror/g);
  try {
    await t.expect(await $error.count).eql(0);
  } catch (e) {
    console.log('Errors found: ' + (await $error.textContent));
    throw e;
  }
}

fixture(`Home view`).page(baseURL);

// Log JS errors even if --skip-js-errors is given
// From: https://stackoverflow.com/a/59856422/965332
test.clientScripts({
  content: `
        window.addEventListener('error', function (e) {
            console.error(e.message);
        });`,
})(`Skip error but log it`, async t => {
  console.log(await t.getBrowserConsoleMessages());
});

test('Screenshot the home view', async t => {
  // TODO: Detect CI instead of never resizing
  // For resizeWindow to work tests needs to run with a ICCCM/EWMH-compliant window manager
  // Since CI just runs plain xvfb, it doesn't have that, so we don't.
  // The resolution is the one used by the testcafe-action:
  //   https://github.com/DevExpress/testcafe-action/blob/0989d5f8ad852d71298ce3b770442cdec309d479/index.js#L59-L60
  // await t.resizeWindow(1280, 720);

  await hide_devonly(t);
  await t.takeScreenshot({
    path: 'home.png',
    fullPage: true,
  });
});

fixture(`Activity view`).page(`${baseURL}/#/activity/fakedata`).requestHooks(HTTPLogger);

test('Screenshot the activity view', async t => {
  await hide_devonly(t);
  await waitForLoading(t);
  await t.takeScreenshot({
    path: 'activity.png',
    fullPage: true,
  });
  await checkNoError(t);

  // TODO: resize to mobile size and take another screenshot
});

fixture(`Timeline view`).page(`${baseURL}/#/timeline`).requestHooks(HTTPLogger);

const durationSelect = Selector('select#duration');
const durationOption = durationSelect.find('option');

test('Screenshot the timeline view', async t => {
  await hide_devonly(t);
  await t.takeScreenshot({
    path: 'timeline-initial.png',
    fullPage: true,
  });
  await waitForLoading(t);
  await t
    .click(durationSelect)
    .click(durationOption.withText('12h'))
    .expect(durationSelect.value)
    .eql('43200');

  await t.takeScreenshot({
    path: 'timeline-12h.png',
    fullPage: true,
  });
  await checkNoError(t);
});

fixture(`Buckets view`).page(`${baseURL}/#/buckets/`).requestHooks(HTTPLogger);

test('Screenshot the buckets view', async t => {
  await hide_devonly(t);
  await t.wait(1000);
  await t.takeScreenshot({
    path: 'buckets.png',
    fullPage: true,
  });
  await checkNoError(t);
});

fixture(`Setting view`).page(`${baseURL}/#/settings/`).requestHooks(HTTPLogger);

test('Screenshot the settings view', async t => {
  await hide_devonly(t);
  await t.takeScreenshot({
    path: 'settings.png',
    fullPage: true,
  });
  await checkNoError(t);
});

fixture(`Stopwatch view`).page(`${baseURL}/#/stopwatch/`).requestHooks(HTTPLogger);

test('Screenshot the stopwatch view', async t => {
  await hide_devonly(t);
  await waitForLoading(t);
  await t.takeScreenshot({
    path: 'stopwatch.png',
    fullPage: true,
  });
  await checkNoError(t);
});
