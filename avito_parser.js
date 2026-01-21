// === КОНФИГУРАЦИЯ ===
const CONFIG = {
  TELEGRAM_TOKEN: "8224152817:AAFdH3EWnzidrT6yJgoMMHOUo6MDQ8AlwOU",
  CHAT_ID: "-1003683547762",
  
  // Данные для авторизации в Avito (опционально)
  AVITO_LOGIN: "ваш_логин",
  AVITO_PASSWORD: "ваш_пароль",
  
  // Или используйте внешний парсер
  PARSER_URL: "https://ваш-парсер.сервис.com/parse"
};

// === ОСНОВНАЯ ФУНКЦИЯ ===
function main() {
  console.log("Запуск парсера Avito: " + new Date());
  
  // Способ 1: Через внешний парсер (рекомендуется)
  let responses = getFromExternalParser();
  
  // Способ 2: Если внешний парсер не работает - мок данные
  if (!responses || responses.length === 0) {
    responses = getMockData();
    console.log("Использую тестовые данные");
  }
  
  // Отправляем в Telegram
  sendResponsesToTelegram(responses);
  
  // Сохраняем в Google Sheets
  saveToGoogleSheets(responses);
  
  console.log("Готово! Обработано: " + responses.length);
}

// === ВНЕШНИЙ ПАРСЕР ===
function getFromExternalParser() {
  try {
    if (!CONFIG.PARSER_URL || CONFIG.PARSER_URL.includes("ваш-парсер")) {
      return [];
    }
    
    const response = UrlFetchApp.fetch(CONFIG.PARSER_URL, {
      muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
  } catch (e) {
    console.error("Ошибка внешнего парсера: " + e);
  }
  
  return [];
}

// === TELEGRAM ===
function sendResponsesToTelegram(responses) {
  if (!responses || responses.length === 0) return;
  
  responses.forEach((resp, index) => {
    const message = `🎯 Отклик #${index + 1}\n👤 ${resp.name}\n📞 ${resp.phone}\n📋 ${resp.vacancy}`;
    
    sendTelegramMessage(message);
    
    // Пауза между сообщениями
    if (index < responses.length - 1) {
      Utilities.sleep(1500);
    }
  });
}

function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
  
  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      payload: {
        chat_id: CONFIG.CHAT_ID,
        text: text,
        parse_mode: "HTML"
      }
    });
  } catch (e) {
    console.error("Ошибка Telegram: " + e);
  }
}

// === GOOGLE SHEETS ===
function saveToGoogleSheets(responses) {
  try {
    // Создаем или открываем таблицу
    const spreadsheet = SpreadsheetApp.create("Avito Responses " + new Date().toLocaleDateString());
    const sheet = spreadsheet.getActiveSheet();
    
    // Заголовки
    sheet.getRange("A1:E1").setValues([["Имя", "Телефон", "Вакансия", "Дата", "Статус"]]);
    
    // Данные
    const data = responses.map(resp => [
      resp.name || "",
      resp.phone || "",
      resp.vacancy || "",
      new Date().toLocaleString(),
      "Новый"
    ]);
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, 5).setValues(data);
    }
    
    console.log("Сохранено в таблицу: " + spreadsheet.getUrl());
    
  } catch (e) {
    console.error("Ошибка Google Sheets: " + e);
  }
}

// === ТЕСТОВЫЕ ДАННЫЕ ===
function getMockData() {
  return [
    {
      name: "Иванов Иван",
      phone: "+7 (999) 123-45-67",
      vacancy: "Менеджер по продажам",
      date: new Date().toLocaleString()
    },
    {
      name: "Петрова Анна",
      phone: "+7 (999) 987-65-43",
      vacancy: "Маркетолог",
      date: new Date().toLocaleString()
    }
  ];
}

// === ТРИГГЕР ===
function setupTrigger() {
  // Удаляем старые триггеры
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Создаем новый триггер (каждые 10 минут)
  ScriptApp.newTrigger("main")
    .timeBased()
    .everyMinutes(10)
    .create();
  
  console.log("Триггер установлен: проверка каждые 10 минут");
}

// === ТЕСТОВЫЙ ЗАПУСК ===
function test() {
  console.log("Тестовый запуск...");
  main();
}
