# OneNote API Utils

透過MS graph和Azure registered app來fetch OneNote筆記本資料

## Azure App Registration
到MS Azure App Registration註冊一個APP
> 目前測試是用免費版的MS帳號也可以註冊

![Azure Registered App](./azure_app_registration.png)

### 設定Authentication
設定Platform
1. 選擇 Mobile and desktop applications
2. 勾選`https://login.microsoftonline.com/common/oauth2/nativeclient`

允許public client flows
> 這個不打開請求token時會有error

### 設定API Permission
至少要勾選MS Graph的`User.Read`和`Notes.Read`，才可以登陸拿token然後讀取Onenote筆記本資料


## Config檔設定
1. 把`config.json.sample`複製或改名為`config.json`
2. 到剛剛在MS Azure App Registration註冊的APP總攬(overview)頁面找Application (client) ID，然後把找到的ID複製到`config.json`中對應`clientId`的value
> 實測只需要`clientId`，使用`tenantId`的登入方式會有一些問題這裡不使用

## Usage
1. 執行`node ./src/tests/listNotebooks.js`列出筆記本
2. 找出欲讀取筆記本的ID貼至`config.json`中對應`notebookId`的value
3. 執行`node ./src/tests/fetchNotebook.js`讀取筆記本內容，並將對應的章節內容儲存至`./notebook_data/`中
