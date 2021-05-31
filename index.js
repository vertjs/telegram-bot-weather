require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
let loc;
let url;

console.log('Bot has been started')

bot.onText(/start/, function (msg) { // запуск бота
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        [{text: 'Определить местоположение', request_location: true}]
      ],
      resize_keyboard: true
    })
  };
  bot.sendMessage(msg.chat.id, 'Здесь можно узнать прогноз погоды', opts);
});


bot.on('message',function(msg) {
  const chatId = msg.chat.id;
  const keyboard = [
    [{text: 'На сегодня', callback_data: '1'}, { text: 'На 5 дней', callback_data: '2' }],
  ]

  if(msg.location) {
    loc=msg.location
    
    setTimeout(() => {
      bot.sendMessage(chatId, 'Выберите период',   {
        reply_markup: {inline_keyboard: keyboard}
      })
    }, 1000)
  }
})

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data
  const msg = callbackQuery.message

  let name, main, weather, wind, sys, daily;

  if(action == 1) {
    url = `http://api.openweathermap.org/data/2.5/weather?lat=${loc.latitude}&lon=${loc.longitude}&units=metric&lang=ru&appid=${process.env.APP_ID}`

    axios.get(url).then(
      resp => {
        console.log(resp.data)
        name = resp.data.name
        main = resp.data.main
        weather = resp.data.weather
        wind = resp.data.wind
        sys = resp.data.sys
      }
    ).then(() => {
      bot.answerCallbackQuery(callbackQuery.id)
      .then(() => bot.sendMessage(msg.chat.id,  weatherHtmlTemplate(name, main, weather[0], wind, sys), {parse_mode: 'HTML'}))
    })

  } else if(action == 2) {
    url =`https://api.openweathermap.org/data/2.5/onecall?lat=${loc.latitude}&lon=${loc.longitude}&exclude=hourly,minutely&units=metric&lang=ru&&appid=${process.env.APP_ID}`
    axios.get(url).then(
      resp => {
        console.log(resp.data)
        daily = resp.data.daily
      }
    ).then(() => {
      bot.answerCallbackQuery(callbackQuery.id)
      .then(() => bot.sendMessage(msg.chat.id,  weatherHtmlTemplateList(daily), {parse_mode: 'HTML'}))
    })
  }
})

function weatherHtmlTemplate(name, main, weather, wind, sys) { // перевод данных в html форамт
  return (
    `Погода в <b>${name}</b>: 
    ${weather.description[0].toUpperCase() + weather.description.slice(1)} 
    Температура: <b> ${Math.round(main.temp)} °C</b>
    В течении дня: <b> от ${Math.round(main.temp_min)} до ${Math.round(main.temp_max)} °C</b>
    Влажность: <b> ${main.humidity} %</b>
    Скорость ветра: <b>${wind.speed} м/сек</b>
    Восход солнца: <b> ${setDate(sys.sunrise)}</b> 
    Закат солнца: <b> ${setDate(sys.sunset)}</b>`
    );
}

function weatherHtmlTemplateList(daily) { // перевод данных в html форамт
  let arrWeather = []
  daily.forEach(o => {

    arrWeather.push(
      `<b>${setDateList(o.dt)}</b>: 
      ${o.weather[0].description.slice(0,1).toUpperCase()}${o.weather[0].description.slice(1)}
      Температура днём: <b> от ${Math.round(o.temp.min)} до ${Math.round(o.temp.max)} °C</b>
      Температура ночью: <b> от ${Math.round(o.temp.morn)} до ${Math.round(o.temp.night)} °C</b>
      Вероятность осадков: <b> ${Math.round(o.pop * 100)} % </b>
      Влажность: <b> ${o.humidity} %</b>
      УФ-индекс: <b> ${o.uvi} </b>
      Скорость ветра: <b>${Math.round(o.wind_speed)} с порывами до ${Math.round(o.wind_gust)} м/сек </b>
      Восход солнца: <b> ${setDate(o.sunrise)}</b>
      Закат солнца: <b> ${setDate(o.sunset)}</b>
      
      `
    )
  })
  let outText = arrWeather.toString().replace(/[, ]+/g, " ")
  return outText;
}

function setDate(suntime) { // форматирование времени в читаемый формат
  const date = new Date(suntime * 1000);
  let h =  date.getHours() < 10 ? `0${date.getHours()}`: date.getHours()
  let m = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
  return h + ':' + m;
}

function setDateList(dt) {
  const date = new Date(dt * 1000)
  let d = date.getDate() 
  let m = date.getMonth() < 10 ? `0${date.getMonth() + 1}`: date.getMonth() + 1
  let y = date.getFullYear()
  return d + '.' + m + '.' + y;
}