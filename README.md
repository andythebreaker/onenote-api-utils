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

## 主要差異摘要

以下表格簡要比較目前版本（第一版，HEAD）與先前版本（第二版，origin/main）的差異：

| 項目 | 第一版 (HEAD) | 第二版 (origin/main) |
| --- | --- | --- |
| Token 儲存與刷新邏輯 | 有完整實作，支援 token 過期自動更新 | 無 token 更新邏輯，只使用初次取得的 access token |
| Scopes | 包含 `offline_access` | 缺少 `offline_access` |
| `graphClient` `authProvider` | 使用 async 函式並支援自動 refresh | 使用一次性 `accessToken` |
| 頁面讀取邏輯 (`getPages`) | 單次請求全部頁面 | 加入分頁查詢邏輯 (`$top`, `$skip`) 且限制 `pageSize` |
| 結構與維護性 | 更模組化，支援 token 再利用 | 較簡單，但缺乏完整的使用者登入週期處理 |
| 可用性與擴充性 | 更符合實際應用需求，支援長期 session 使用 | 適合單次存取需求，較為簡化 |
