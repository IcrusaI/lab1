require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,  // Имя базы данных
  process.env.DB_USER,  // Пользователь БД
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,  // Стандартный порт PostgreSQL
    dialect: process.env.DB_DIALECT || 'postgres', // Явно указываем dialect
    logging: false, // Отключаем логирование SQL-запросов
  }
);

const authenticateDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно.');
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
  }
};

module.exports = { sequelize, authenticateDB };
