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


## 環境變數設定
在執行範例程式前，請設定下列環境變數：

* `ONENOTE_CLIENT_ID`：Azure App Registration 取得的 Application (client) ID
* `ONENOTE_NOTEBOOK_ID`：欲讀取的筆記本 ID
* `ONENOTE_TENANT_ID`：Tenant ID，選填，預設使用 common

## Usage
1. 執行`node ./src/tests/listNotebooks.js`列出筆記本
2. 找出欲讀取筆記本的ID後，設定至`ONENOTE_NOTEBOOK_ID`環境變數
3. 執行`node ./src/tests/fetchNotebook.js [--min N]`讀取筆記本內容，並將對應的章節內容儲存至`./notebook_data/`中 (N 為間隔分鐘，0 表示僅執行一次，預設 5 分鐘)
4. 執行`npm run serv`啟動簡易瀏覽伺服器，於瀏覽器開啟 `http://localhost:3000` 查看筆記內容

## 資料格式的參考

可以去看`./document_example_of_input_and_output_format`這個資料夾裡面的各種檔案，這是我真實去跑一次生成的資料，只是把他從原本的地方移過來放著。供參考。