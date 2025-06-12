# diagmindtw CMS

## 目標:

### 管理內容

- copy stuff form onenote to server or db

## bluehost server 部屬細節

- due to bluehost (錢付不夠) 所以不能 reverse proxy
- in ~/public_html/\<portname\>.php 要放 諸如 `./reverse_proxy_example` 的檔案
- 要放一隻看門口(cron), 確定這支 nodejs 程式 時時刻刻活著

### reverse_proxy_example 作動原理

Bluehost 無法在共享主機上直接設定 Nginx/Apache 的 reverse proxy，因此改用
PHP 轉送請求。`reverse_proxy_example/48001.php` 需要放到
`~/public_html/48001.php`，之後所有對 `48001.php` 的請求都會由這支 PHP
腳本處理。腳本會將網址中的 `48001.php` 部分去除，並以 cURL 把相同的
HTTP method、header 與 body 轉發到本機的 Node 服務
`127.0.0.1:48001`。收到的回應再完整地傳回給瀏覽器，達到簡易 reverse
proxy 的效果。

### 看門狗設定與位置

![image](https://github.com/user-attachments/assets/09694348-7a25-4a91-b11f-bf3e0b4ab5dc)

- cron 管理器 GUI [https://www.bluehost.com/my-account/hosting/details/cron-jobs](https://www.bluehost.com/my-account/hosting/details/cron-jobs)
- 看門狗程式位址 (bluehost server 上的位置) 與 相關log位置 : `~/andythebreaker/onenote2html/monitor.sh >> ~/andythebreaker/cron.log 2>&1`

`monitor.sh` 與 `script.sh` 均位在專案根目錄。`monitor.sh` 由 cron 執行，
定期確認 `run.pid` 中的 PID 是否存活，不在時就呼叫 `script.sh` 重新啟
動 `bin/www`，並把輸出寫入 `log.txt`。

在 Bluehost 的 Cron 管理介面新增類似下列的任務即可每五分鐘檢查一次：

```
*/5 * * * * bash $HOME/andythebreaker/onenote2html/monitor.sh >> $HOME/andythebreaker/cron.log 2>&1
```

初次部署時需將本資料夾上傳至 `~/andythebreaker/onenote2html`，並在
`~/public_html` 放置 `48001.php` 等 PHP 轉發檔，之後便可由 watchdog
保持 Node 服務常駐。

## 環境變數清單

|環境變數|型別|意思|
|--|--|--|
|HTTPS|BOOL|a switch between https (T)/(F) http, for bluehost server, currently use http|
|DEV|BOOL|for local usage, set to true; for bluehost server, set to false|
|PORT|INT|...port, you must! set some value|
|SAVE_LOG|BOOL|to save log or not|
|MUTE_LOG|BOOL|to mute log or not|
|USE_CACHE|BOOL|if true then use cache (local storage instead of fetching data from cloud) when accessing `/test` route|
|ONENOTE_CLIENT_ID|STRING|Client ID for OneNote API|
|ONENOTE_CLIENT_SECRET|STRING|Client Secret for OneNote API|
|CACHE_FILE|STRING|path to JSON cache used by `/vitepress2md` route. Can be overridden with the `cacheFile` query parameter|

When calling `/vitepress2md`, you may append `?cacheFile=path/to/cache.json` to override the cache file location.

Please refer to lib/envar.js to see the default values of the registered environment variables.
> 不一定要設預設值，可以不給`default`那項，這時預設為`null`

## 還沒寫完的部分

在SERVER上跑NODE 要先叫 nvm use 23

###

[https://diagmindtw.com/48001.php/vitepressOUTPUT/left.json](https://diagmindtw.com/48001.php/vitepressOUTPUT/left.json)
