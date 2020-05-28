require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const weatherEndpoint = (id) => {
  return `http://api.openweathermap.org/data/2.5/weather?id=${id}&units=metric&lang=ru&appid=${process.env.APP_ID}`;
};

const weatherIcon = (icon) => {
  return `http://openweathermap.org/img/w/${icon}.png`;
};

const weatherHtmlTemplate = (name, main, weather, wind, sys) =>
  `Погода в <b>${name}</b>: 
  ${weather.description}
  Температура: <b> ${Math.round(main.temp)} °C</b>
  В течении дня: <b> от ${Math.round(main.temp_min)} до ${Math.round(main.temp_max)} °C</b>
  Влажность: <b> ${main.humidity} %</b>
  Скорость ветра: <b>${wind.speed} м/сек</b>
  Восход солнца: <b> ${setDate(sys.sunrise)}</b>
  Закат солнца: <b> ${setDate(sys.sunset)}</b>
  `;

// Function that gets the weather by the city name
const getWeather = (chatId, id) => {
  const endpoint = weatherEndpoint(id);
  axios.get(endpoint).then(
    (resp) => {
      const { name, main, weather, wind, sys } = resp.data;
      bot.sendMessage(chatId, weatherHtmlTemplate(name, main, weather[0], wind, sys), {
        parse_mode: 'HTML',
      });
    },
    (error) => {
      console.log('error', error);
      bot.sendMessage(chatId, `Упс...для этого города нет информации`, {
        parse_mode: 'HTML',
      });
    }
  );
};

const options = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: 'г.Химки', callback_data: '550280' }],
      [{ text: 'п.Быково', callback_data: '570298' }],
      [{ text: 'г.Москва', callback_data: '524894' }],
      [{ text: 'г.Нижний Новгород', callback_data: '520555' }],
    ],
  }),
};

/* bot.onText(/\//, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Выберите город, в котором хотите узнать прогноз погоды: `, options, {
    parse_mode: 'HTML',
  });
}); */
bot.onText(/\//, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Выберите город, в котором хотите узнать прогноз погоды: `, {
    reply_markup: {
      keyboard: [
        [{ text: 'г.Химки' }, { text: 'п.Быково' }],
        [{ text: 'г.Москва' }, { text: 'г.Нижний Новгород' }],
      ],
      resize_keyboard: true,
    },
  });
});

/* bot.on('callback_query', (msg) => {
  const chatId = msg.message.chat.id;
  const id = msg.data;
  getWeather(chatId, id);
}); */

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  let id;
  if (msg.text !== undefined) {
    if (msg.text === 'г.Химки') {
      id = '550280';
    } else if (msg.text === 'п.Быково') {
      id = '570298';
    } else if (msg.text === 'г.Москва') {
      id = '524894';
    } else if (msg.text === 'г.Нижний Новгород') {
      id = '520555';
    } else return;
    getWeather(chatId, id);
  } else return;

  /* bot.sendMessage(chatId, 'Ваше мнение очень важно для нас, но это не точно :)'); */
});

function setDate(suntime) {
  const date = new Date(Date.UTC(suntime) * 1000);

  if (date.getMinutes() < 10 && date.getHours() < 10) {
    return `0${date.getHours()}:0${date.getMinutes()}`;
  } else {
    return `${date.getHours()}:${date.getMinutes()}`;
  }
}

// eslint-disable-next-line no-console
console.log('Бот запущен');
