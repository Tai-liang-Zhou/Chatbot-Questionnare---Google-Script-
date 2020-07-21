// Handling the type of the event
function eventHandler(event){
  var eventType = event.type;
  var replyToken = event.replyToken; // get replyToken
  var replyMessageData = [];

  switch (eventType) {
    case 'postback':
      switch(event.postback.data){
        case "DateMessage":
          console.log('enter : DateMessage');
          clientMessage = event.postback.params.date;
          replyMessageData.push({type:"text", text:clientMessage});
          break;
        case "TimeMessage":
          console.log('enter : TimeMessage');
          clientMessage = event.postback.params.time;
          replyMessageData.push({type:"text", text:clientMessage});
          break;
        case "DateTimeMessage":
          console.log('enter : DateTimeMessage');
          clientMessage = event.postback.params.datetime;
          replyMessageData.push({type:"text", text:clientMessage});
          break;
        case "ignoreQuestion":
          console.log('enter : ignoreQuestion');
          clientMessage = "NULL";
          replyMessageData.push({type:"text", text:"此題已略過"});
          break;
        case "otherOption":
          console.log('enter : otherOption');
          replyMessageData = replyMessageData.concat(otherOptionMessage());
          replyMessage(replyToken, replyMessageData, CHANNEL_ACCESS_TOKEN);
          return;
          break;
      }
      break;
    case 'message':
      clientMessage = event.message.text;
      break;
    default:
      break;
  }
  
  var replyData = getUserAnswer(event.source.userId, clientMessage);
  switch (replyData[1]) {
    case -1:
      sheet.getRange(replyData[0], 1).setValue(Date());
      replyMessageData = replyMessageData.concat(finishTheQuestionnare(replyData[2]));
      replyMessage(replyToken, replyMessageData, CHANNEL_ACCESS_TOKEN);
      return;
      break;
    case 1:
      replyMessageData = replyMessageData.concat(getFormTitle());
      break;
  }
  
  replyMessageData = replyMessageData.concat(getQuestion(replyData[1]));
  replyMessage(replyToken, replyMessageData, CHANNEL_ACCESS_TOKEN);
  
}


function replyMessage(replyToken, messageConfig, CHANNEL_ACCESS_TOKEN) {
  var url = 'https://api.line.me/v2/bot/message/reply';
  var opt = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': messageConfig
    })
  };
  UrlFetchApp.fetch(url, opt);
}

//判斷使用者回答到第幾題
function getUserAnswer(clientID, clientMessage) {
  var returnData = [];
  for (var i = lastRow - 1; i >= 0; i--) {
    if (sheetData[i][0] == "" && sheetData[i][lastColumn - 1] == clientID) {
      for (var j = 1; j <= lastColumn -1; j++) {
        if (sheetData[i][j] === "") {break;}
      }
      sheet.getRange(i + 1, j + 1).setValue(clientMessage);
      //如果使用者已經回答了最後一題，就把完成時間填上。不然就送出下一題給使用者
      if (j + 2 == lastColumn) {
        returnData = [i + 1, -1, j];
      }
      else {
        returnData = [i + 1, j + 1];
      }
      return returnData;
      break;
    }
  }
  //如果使用者還沒有回答過任何資料，就新增加一列在最後，把使用者ID輸入並開始送出題目
  sheet.insertRowAfter(lastRow);
  sheet.getRange(lastRow + 1, lastColumn).setValue(clientID);
  returnData = [lastRow + 1, 1];
  return returnData;
}


//取得最後一個問題之後的東西以及確認訊息
function finishTheQuestionnare(lastNum) {
  var replyMessageData = [];
//如果題目前面有段落，重新計算取得題目真正的 index
  var realQuestionNo = lastNum;
  for (var i = 0; i < realQuestionNo; i++) {
    if (formItems[i].getType() == "SECTION_HEADER") {
      realQuestionNo++;
    }
  }
  if (realQuestionNo < formItems.length) {
    for (var i = realQuestionNo; i < formItems.length; i++) {
      replyMessageData.push({
        "type": "flex",
        "altText": formItems[i].getTitle(),
        "contents": {
          "type": "carousel",
          "contents": [{
            "type": "bubble",
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": formItems[i].getTitle(),
                  "weight": "bold",
                  "size": "xl",
                  "wrap": true
                }
              ]
            }
          }]
        }
      });
      if (formItems[i].getHelpText() != "") {
        replyMessageData[replyMessageData.length - 1].contents.contents[0].body.contents = replyMessageData[replyMessageData.length - 1].contents.contents[0].body.contents.concat(
          {
            "type": "text",
            "text": formItems[i].getHelpText(),
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true,
            "margin": "md"
          }
        );
      }
    }
  }
  replyMessageData.push({
    "type": "flex",
    "altText": confirmationMessage,
    "contents": {
      "type": "carousel",
      "contents": [{
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": confirmationMessage,
              "weight": "bold",
              "size": "xl",
              "wrap": true
            }
          ]
        }
      }]
    }
  });
  return replyMessageData;
}

//取得表單名稱及說明
function getFormTitle() {
  var formTitleDescription = [];
  var flexMessage = [];
  flexMessage.push({
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": form.getTitle(),
          "weight": "bold",
          "size": "xxl",
          "wrap": true
        },
        {
          "type": "text",
          "text": form.getDescription() + " ",
          "size": "xs",
          "color": "#aaaaaa",
          "wrap": true,
          "margin": "md"
        }
      ]
    }
  });
  formTitleDescription.push({
    "type": "flex",
    "altText": form.getTitle(),
    "contents": {
      "type": "carousel",
      "contents": flexMessage
    }
  });
  return formTitleDescription;
}

//取得要送出的題目
function getQuestion(questionNo) {
  var replyMessageData = [];
//如果題目前面有段落，重新計算取得題目真正的 index
  var realQuestionNo = questionNo;
  for (var i = 0; i < realQuestionNo; i++) {
    if (formItems[i].getType() == "SECTION_HEADER") {
      realQuestionNo++;
    }
  }
//把題目前面的段落標題及說明取出來  
  if (realQuestionNo > questionNo) {
    var checkSectionHeaderNo = realQuestionNo - 3;
    var sectionHeaderTitle = [];
    for (var i = realQuestionNo - 2; i > checkSectionHeaderNo; i--) {
      if (formItems[i] && formItems[i].getType() == FormApp.ItemType.SECTION_HEADER) {
        checkSectionHeaderNo--;
        sectionHeaderTitle.push({
          "type": "flex",
          "altText": formItems[i].asSectionHeaderItem().getTitle(),
          "contents": {
            "type": "carousel",
            "contents": [{
              "type": "bubble",
              "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "text",
                    "text": formItems[i].asSectionHeaderItem().getTitle(),
                    "weight": "bold",
                    "size": "xl",
                    "wrap": true
                  }
                ]
              }
            }]
          }
        });
        if (formItems[i].asSectionHeaderItem().getHelpText() != "") {
          sectionHeaderTitle[sectionHeaderTitle.length - 1].contents.contents[0].body.contents = sectionHeaderTitle[sectionHeaderTitle.length - 1].contents.contents[0].body.contents.concat(
            {
              "type": "text",
              "text": formItems[i].asSectionHeaderItem().getHelpText(),
              "size": "xs",
              "color": "#aaaaaa",
              "wrap": true,
              "margin": "md"
            }
          );
        }
      }
    }
    if (sectionHeaderTitle.length != 0) {replyMessageData = replyMessageData.concat(sectionHeaderTitle.reverse());}  
  }
//取得題型
  var itemObj = formItems[realQuestionNo - 1];
  var itemContent;
  var itemFlex = [];
  var optionsContent = [];
  var scaleFlexContent = [];
  switch (itemObj.getType()) {
    case FormApp.ItemType.MULTIPLE_CHOICE:    //單選題
    case FormApp.ItemType.LIST:    //下拉式選單
      if (itemObj.getType() == FormApp.ItemType.MULTIPLE_CHOICE) {itemContent = itemObj.asMultipleChoiceItem();}
      else {itemContent = itemObj.asListItem();}
      var choiceItemOptions = itemContent.getChoices();
      var buttonColor;
      for (var i = 0; i < choiceItemOptions.length; i++) {
        if (i % 2 === 0) {buttonColor = "#9CA3DB";}
        else {buttonColor = "#677DB7";}
        optionsContent.push(
          {
            "type": "button",
            "action": {
              "type": "message",
              "label": choiceItemOptions[i].getValue(),
              "text": choiceItemOptions[i].getValue()
            },
            "style": "primary",
            "color": buttonColor,
            "margin": "sm"
          }
        );
      }
      break;
    case FormApp.ItemType.SCALE:               //線性刻度
      itemContent = itemObj.asScaleItem();
      var uBound = itemContent.getUpperBound();
      var lBound = itemContent.getLowerBound();
      var lLabel = itemContent.getLeftLabel();
      var rLabel = itemContent.getRightLabel();
      if (lLabel != "") {
        scaleFlexContent.push(
          {
            "type": "bubble",
            "size": "nano",
            "body": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "text",
                  "text": lLabel,
                  "align": "center",
                  "gravity": "center",
                  "wrap": true,
                  "size": "xl"
                }
              ]
            },
            "styles": {
              "footer": {
                "separator": false
              }
            }
          }
        )
      }
      for (var i = lBound; i <= uBound; i++) {
        scaleFlexContent.push(
          {
            "type": "bubble",
            "size": "nano",
            "body": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": i.toString(),
                    "text": i.toString()
                  },
                  "style": "primary",
                  "color": "#9CA3DB",
                  "gravity": "center"
                }
              ]
            },
            "styles": {
              "footer": {
               "separator": false
              }
            }
          }
        )
      }
      if (rLabel != "") {
        scaleFlexContent.push(
          {
            "type": "bubble",
            "size": "nano",
            "body": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "text",
                  "text": rLabel,
                  "align": "center",
                  "gravity": "center",
                  "wrap": true,
                  "size": "xl"
                }
              ]
            },
            "styles": {
              "footer": {
                "separator": false
              }
            }
          }
        )
      }
      break;
    case FormApp.ItemType.TEXT:               //簡答題
      itemContent = itemObj.asTextItem();
      break;
    case FormApp.ItemType.PARAGRAPH_TEXT:     //段落問題
      itemContent = itemObj.asParagraphTextItem();
      break;
    case FormApp.ItemType.DATE:               //日期
      itemContent = itemObj.asDateItem();
      optionsContent.push(
        {
          "type": "button",
          "action": {
            "type": "datetimepicker",
            "label": "點選輸入日期",
            "data": "DateMessage",
            "mode": "date"
          },
          "style": "primary",
          "color": "#454B66",
          "margin": "sm"
        }
      );
      break;
    case FormApp.ItemType.TIME:               //時間
      itemContent = itemObj.asTimeItem();
      optionsContent.push(
        {
          "type": "button",
          "action": {
            "type": "datetimepicker",
            "label": "點選輸入時間",
            "data": "TimeMessage",
            "mode": "time"
          },
          "style": "primary",
          "color": "#454B66",
          "margin": "sm"
        }
      );
      break;
    case FormApp.ItemType.DATETIME:          //日期及時間
      itemContent = itemObj.asDateTimeItem();
      optionsContent.push(
        {
          "type": "button",
          "action": {
            "type": "datetimepicker",
            "label": "點選輸入日期及時間",
            "data": "DateTimeMessage",
            "mode": "datetime"
          },
          "style": "primary",
          "color": "#454B66",
          "margin": "sm"
        }
      );
      break;
    case FormApp.ItemType.FILE_UPLOAD:        //上傳檔案
      itemContent = itemObj;
      break;
  }
  if (itemObj.getType() == FormApp.ItemType.MULTIPLE_CHOICE && itemContent.hasOtherOption()) {
    optionsContent.push(
      {
        "type": "button",
        "action": {
          "type": "postback",
          "label": "其他",
          "data": "otherOption"
        },
        "style": "primary",
        "color": "#454B66",
        "margin": "sm"
      }
    );
  }
  if (itemObj.getType() != "FILE_UPLOAD") {
    if (!itemContent.isRequired()) {
      optionsContent.push(
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "略過此題",
            "data": "ignoreQuestion"
          },
          "margin": "sm"
        }
      );
    }
  }
  itemFlex.push({
    "type": "flex",
    "altText": itemObj.getTitle(),
    "contents": {
      "type": "carousel",
      "contents": [{
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": itemObj.getTitle(),
              "weight": "bold",
              "size": "xl",
              "wrap": true
            }
          ]
        }
      }]
    }
  });
  if (itemObj.getHelpText() != "") {
    itemFlex[0].contents.contents[0].body.contents = itemFlex[0].contents.contents[0].body.contents.concat({
        "type": "text",
        "text": itemObj.getHelpText(),
        "size": "xs",
        "color": "#aaaaaa",
        "wrap": true,
        "margin": "md"
      }
    );
  }
  if (optionsContent.length != 0) {
    itemFlex[0].contents.contents[0].body.contents = itemFlex[0].contents.contents[0].body.contents.concat({
        "type": "separator",
        "margin": "xxl"
      },
      {
        "type": "box",
        "layout": "vertical",
        "margin": "md",
        "contents": optionsContent
      }
    );
  }
  if (scaleFlexContent.length != 0) {
    itemFlex.push({
      "type": "flex",
      "altText": itemObj.getTitle(),
      "contents": {
        "type": "carousel",
        "contents":scaleFlexContent
      }
    });
  }
  replyMessageData = replyMessageData.concat((itemFlex));
  return replyMessageData;
}




function otherOptionMessage() {
  var returnData = [];
  returnData.push({
    "type": "flex",
    "altText": "請輸入「其他」的內容",
    "contents": {
      "type": "carousel",
      "contents": [{
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "您選擇了「其他」，麻煩請輸入您的答案後送出即可",
              "weight": "bold",
              "size": "xl",
              "wrap": true
            }
          ]
        }
      }]
    }
  });
  return returnData;
}