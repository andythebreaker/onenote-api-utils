import { db_data_dir } from './commonPath.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function generateDocJSON() {
  // 從docx的nest2json.js中複製過來改寫的函式
  const docxWrapper = document.querySelector('.docx-wrapper.ui.segment');
  if (!docxWrapper) {
      console.error('No .docx-wrapper.ui.segment element found');
      return { error: 'No docx-wrapper found', docTree: [] };
  }

  const topLevelSegments = Array.from(docxWrapper.querySelectorAll('.level-2'));
  console.log('Found top-level segments:', topLevelSegments.length);

  if (topLevelSegments.length === 0) {
      console.error('No .level-2 elements found inside .docx-wrapper');
      return { error: 'No level-2 elements found', docTree: [] };
  }

  // 遞迴函式來創建巢狀的文檔樹結構
  function buildDocTree(element) {
      // 確保只處理可見的段落
      if (!element || getComputedStyle(element).display === 'none') {
          return null;
      }

      // 創建當前節點的基本資訊
      const nodeInfo = {
          DOMnodeID: Math.random().toString(36).substr(2, 9), // 生成隨機ID
          DOMnodeClass: element.className,
          DOMinnerText: element.innerText.trim(),
          // DOMfirstChildInnerText: element.firstChild?.innerText?.trim() || '',
          DOMinnerHtml: element.innerHTML.trim(),
          DOMattributes: Array.from(element.attributes).map(attr => ({ name: attr.name, value: attr.value }))
      };

      // 找出所有子元素，這裡僅處理 .ui.segment 元素
      const childSegments = Array.from(element.querySelectorAll(':scope > .ui.segment'));//TODO:我不確定這裡不吃P會不會有問題

      if (childSegments.length > 0) {
          nodeInfo.DOMchildArray = childSegments
              .map(buildDocTree)
              .filter(item => item !== null);
      }

      return nodeInfo;
  }

  // 構建文檔樹
  const docTree = topLevelSegments
      .map(buildDocTree)
      .filter(item => item !== null);

  return docTree;
}

// 本地端架設在docx的python HTTP伺服器
const serverUrl = 'http://localhost:8000';
const mainPageUrl = `${serverUrl}/index.html`;

async function dumpJSON() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set user-agent to mimic a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // Navigate to the page
  await page.goto(mainPageUrl, { waitUntil: 'networkidle0' });

  // Extract leftMenu items
  const leftMenuItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#leftMenu .item')).map(item => ({
      title: item.innerText.trim(),
      url: item.getAttribute('href'),
    }));
  });

  const department_contents = [];
  var topic_contents = [];
  var departmentID = 1;
  var topicID = 1;

  for (const leftMenuItem of leftMenuItems) {
    await page.goto(`${serverUrl}${leftMenuItem.url}`, { waitUntil: 'networkidle2' });

    department_contents.push({ id: departmentID, department: leftMenuItem.title, path: leftMenuItem.url });

    // Wait for the `docxready` variable or specific elements
    await page.waitForFunction(() => window.docxready === true);

    // Extract rightMenu items
    const rightMenuItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#rightMenu .item')).map(item => ({
        title: item.innerText.trim(),
        url: item.getAttribute('href'),
      }));
    });
    
    for (const rightMenuItem of rightMenuItems) {
      // Click on the right menu item
      await page.evaluate((selector) => {
        const menuItem = document.querySelector(selector);
        if (menuItem) {
            menuItem.click();
        } else {
            throw new Error(`Menu item with selector "${selector}" not found`);
        }
      }, `#rightMenu .item[href="${rightMenuItem.url}"]`);

      try {
        await page.waitForFunction(() => window.docxready === true, { timeout: 60000 });
      } catch (error) {
        console.warn(`Skipping item "${rightMenuItem.title}" because docx was not ready within 60 sec.`);
        continue;
      }      
      try {
        await page.waitForSelector('.docx .ui.segment', { visible: true, timeout: 40000 });
      } catch (error) {
        console.warn(`Skipping item "${rightMenuItem.title}" because'.docx .ui.segment' was not found within 40 sec.`);
        continue;
      }

      const generateDocJSONFunction = generateDocJSON.toString();
      const docTree = await page.evaluate(new Function(`return (${generateDocJSONFunction})();`));

      // Extract tables
      const tables = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.docx table')).filter(table => {
          const style = window.getComputedStyle(table);
          return style.display !== 'none';
        }).map(table => table.outerHTML);
      });

      topic_contents.push({ id: topicID++,
                            topic: rightMenuItem.title,
                            tab_no: parseInt(rightMenuItem.url.split('#').pop()),
                            path: `${leftMenuItem.url}${rightMenuItem.url}`,
                            department_id: departmentID,
                            docTree: docTree,
                            tables: tables });
      
    }

    // Write the topic JSON data
    const topic_json = path.join(db_data_dir, `topic_${departmentID}.json`);
    fs.writeFileSync(topic_json, JSON.stringify(topic_contents, null, 2));

    departmentID++;
    topic_contents = []; // Reset topic_contents for the next department

  }

  // Write the department JSON data
  const department_json = path.join(db_data_dir, 'departments.json');
  fs.writeFileSync(department_json, JSON.stringify(department_contents, null, 2));

  await browser.close();
}

dumpJSON().catch(error => {
  console.error(error);
});