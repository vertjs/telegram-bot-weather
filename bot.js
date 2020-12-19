require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
const weatherEndpoint = (data) => { // запрос данных с openweathermap
  if(typeof data === 'string') {
    return `http://api.openweathermap.org/data/2.5/weather?id=${data}&units=metric&lang=ru&appid=${process.env.APP_ID}`;
  } else if(typeof data === 'object') {
    let lat=data.latitude
    let lon = data.longitude
    return `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${process.env.APP_ID}`;
  } else return;
};

console.log('Bot has been started')

bot.onText(/start/, (msg) => { // запуск бота
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        [{text: 'Найди меня', request_location: true}],
        [{ text: 'г.Химки' }, { text: 'п.Быково' }],
        [{ text: 'г.Москва' }, { text: 'г.Нижний Новгород' }],
      ],
      resize_keyboard: true
    })
  };
  bot.sendMessage(msg.chat.id, 'Здесь можно узнать прогноз погоды на сегодня', opts);
});

bot.on('message', msg => msg.text !== '/start' ? sendData(msg) : '')

function sendData(msg) {
  switch (msg.text) {
    case 'г.Химки':
      getWeather(msg.chat.id, '550280')
      break;
    case 'п.Быково':
      getWeather(msg.chat.id, '570298')
      break;
    case 'г.Москва':
      getWeather(msg.chat.id, '524894')
      break;
    case 'г.Нижний Новгород':
      getWeather(msg.chat.id, '520555')
      break;
    default:
      getWeather(msg.chat.id, msg.location)
  }
}

function getWeather(chatId, data) { // обработка данных
  let endpoint;
  endpoint = weatherEndpoint(data)
  console.log(endpoint)
  axios.get(endpoint).then(
    resp => {
      const { name, main, weather, wind, sys } = resp.data;
      bot.sendMessage(chatId, weatherHtmlTemplate(name, main, weather[0], wind, sys), {
        parse_mode: 'HTML',
      });
    });
}

function weatherHtmlTemplate(name, main, weather, wind, sys) { // перевод данных в html форамт
  console.log(name)
  console.log(weather)
  return (
  `Погода в <b>${name}</b>: 
  ${weather.description}
  Температура: <b> ${Math.round(main.temp)} °C</b>
  В течении дня: <b> от ${Math.round(main.temp_min)} до ${Math.round(main.temp_max)} °C</b>
  Влажность: <b> ${main.humidity} %</b>
  Скорость ветра: <b>${wind.speed} м/сек</b>
  Восход солнца: <b> ${setDate(sys.sunrise + 10800)}</b>
  Закат солнца: <b> ${setDate(sys.sunset + 10800)}</b>`
  );
}

function setDate(suntime) { // форматирование времени в читаемый формат
  const date = new Date(suntime * 1000);
  if (date.getMinutes() < 10 && date.getHours() < 10) {
    return `0${date.getHours()-3}:0${date.getMinutes()}`;
  } else {
    return `${date.getHours()-3}:${date.getMinutes()}`;
  }
}