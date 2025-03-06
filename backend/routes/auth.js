require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { RefreshToken } = require('../models');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Регистрация и авторизация
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации или email уже используется
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post('/register', async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email уже используется' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ email, name, password: hashedPassword });

        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
});
// todo router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешная авторизация и получение JWT
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Неверные email или пароль
 *       500:
 *         description: Внутренняя ошибка сервера
 */
 router.post('/login', async (req, res) => {
     const { email, password } = req.body;

     if (!email || !password) {
         return res.status(400).json({ message: 'Заполните email и пароль' });
     }

     try {
         const user = await User.findOne({ where: { email } });
         if (!user) {
             return res.status(401).json({ message: 'Неверные email или пароль' });
         }

         const isPasswordValid = await bcrypt.compare(password, user.password);
         if (!isPasswordValid) {
             return res.status(401).json({ message: 'Неверные email или пароль' });
         }

         const accessToken = jwt.sign( //todo вынести в отдельный метод
             { id: user.id, email: user.email },
             process.env.JWT_SECRET,
             { expiresIn: '15m' }  // Access Token на 15 минут
         );

         const refreshToken = uuidv4();

         await RefreshToken.create({ //todo в отдельный метод
             token: refreshToken,
             userId: user.id,
             expiresAt: new Date(Date.now() + 7604800000)  // Refresh Token на 7 дней
         });

         res.status(200).json({
             message: 'Вход выполнен успешно',
             accessToken,
             refreshToken
         });
     } catch (error) {
         res.status(500).json({ message: 'Ошибка сервера', error: error.message });
     }
 });

 /**
  * @swagger
  * /auth/refresh:
  *   post:
  *     summary: Обновить Access Token по Refresh Token
  *     tags: [Auth]
  *     description: Получение нового Access Token без повторного ввода логина и пароля.
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               refreshToken:
  *                 type: string
  *                 description: Действующий Refresh Token, выданный при авторизации.
  *     responses:
  *       200:
  *         description: Успешное обновление Access Token.
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 accessToken:
  *                   type: string
  *                   description: Новый Access Token.
  *       400:
  *         description: Если Refresh Token не передан.
  *       401:
  *         description: Если Refresh Token не найден или истёк.
  *       500:
  *         description: Внутренняя ошибка сервера.
  */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Отсутствует refresh token' });
    }

    try {
        const tokenData = await RefreshToken.findOne({ where: { token: refreshToken } });

        if (!tokenData || tokenData.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Refresh token недействителен' });
        }

        const user = await User.findByPk(tokenData.userId);

        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }  // Новый Access Token на 15 минут
        );

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
});

module.exports = router;
