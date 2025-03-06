export default class AuthController {
    public register(res, req, next) {
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
    }
}