// input your CHANNEL_ACCESS_TOKEN
var CHANNEL_ACCESS_TOKEN = '';
// history user id
var MAIN_USER_ID = 
// linebot id
var LINEBOT_ID = 

//表單 ID
var formId = "";
//試算表 ID
var spreadSheetId = "";
//工作表名稱
var sheetName = "";

var form = FormApp.openById(formId);
var spreadSheet = SpreadsheetApp.openById(spreadSheetId);
var sheet = spreadSheet.getSheetByName(sheetName);
var lastRow = sheet.getLastRow();
var lastColumn = sheet.getLastColumn();
var sheetData = sheet.getSheetValues(1, 1, lastRow, lastColumn);
var confirmationMessageDefault = "我們已經收到您回覆的表單。";
var confirmationMessage = form.getConfirmationMessage();
if (confirmationMessage == "") {confirmationMessage = confirmationMessageDefault;}
var formItems = form.getItems();


// e 是Line 給我們的資料
function doPost(e) {
  var dataFromLine = JSON.parse(e.postData.contents);
  // 取出 replayToken 和發送的訊息文字
  
  try {
    var events = dataFromLine.events;

    if (events == null) {return;}
    var event = events[0];
    var messageConfig = eventHandler(event);

  } catch(ex) {
   console.log(ex);
  }
}