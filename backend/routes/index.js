const router = new Router(); //todo вынести маршруты в файл с маршрутами, main скрипт должен только настраивать

// Публичные маршруты (доступны без авторизации)
app.use('/public', publicRoutes);  //todo публичные маршруты, но не нужно добавлять в адрес /public

// Маршруты авторизации (с API-ключом)
app.use('/auth', authRoutes);

// Маршруты пользователей и мероприятий (только с JWT)
app.use('/users', passport.authenticate('jwt', { session: false }), userRoutes);
app.use('/events', (req, res, next) => {
    console.log('Authorization header:', req.headers.authorization);
    next();
}, passport.authenticate('jwt', { session: false }), eventRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Сервер работает!' });
});

export default router;