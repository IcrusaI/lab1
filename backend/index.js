require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { authenticateDB } = require('./config/db');
const { syncDatabase } = require('./models');
const passport = require('./config/passport'); //
const { swaggerUi, specs } = require('./swagger');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const publicRoutes = require('./routes/public'); //

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan(':method :url :status - :response-time ms'));
app.use(passport.initialize()); // Инициализация passport

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


const PORT = process.env.PORT || 5000;

authenticateDB().then(async () => {
    await syncDatabase();
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}).catch((err) => {
    console.error('Не удалось подключиться к базе данных:', err);
    process.exit(1);
});
