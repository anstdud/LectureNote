import express from 'express';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',  // Убедитесь, что это порт вашего фронтенда
    methods: ['GET', 'POST'],        // Разрешаем только нужные методы
}));

// Настройки подключения к базе данных
const pool = new Pool({
    user: 'ttwinkleee',
    host: 'localhost',
    database: 'LectureNote',
    password: '1111',
    port: 5432,
});

// Проверка подключения к базе данных
pool.connect()
    .then(() => console.log('Бд подключена'))
    .catch(err => console.error('Бд НЕ подключена:', err));

const JWT_SECRET = 'your_jwt_secret_key';  // Используем эту переменную для подписи JWT

// Маршрут для регистрации
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Проверяем, существует ли уже пользователь с таким логином
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});

// Маршрут для входа
app.post('/api/login', async (req, res) => {
    console.log('Запрос на вход:', req.body);
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            console.log('Пользователь не найден');
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];
        console.log('Найден пользователь:', user);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log('Пароли не совпадают');
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Создан токен:', token);
        res.json({ token });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Middleware для проверки токена
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Отсутствует токен' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("Аутентифицированный пользователь:", decoded); // Лог для проверки
        next();
    } catch (err) {
        console.error('Ошибка токена:', err);
        res.status(401).json({ error: 'Недействительный токен' });
    }

}

// Маршрут для получения лекций
app.get('/api/lectures', authenticate, async (req, res) => {
    const userId = req.user.id;
    console.log('Проверка user_id:', req.user);

    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);  // Отправляем лекции на фронтенд
    } catch (err) {
        console.error('Ошибка при получении лекций:', err);
        res.status(500).json({ error: 'Ошибка при получении лекций' });
    }
});

// Маршрут для сохранения лекции
app.post('/api/lectures', authenticate, async (req, res) => {
    const { title, text } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'INSERT INTO notes (user_id, title, text) VALUES ($1, $2, $3) RETURNING *',
            [userId, title, text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при сохранении лекции:', err);
        res.status(500).json({ error: 'Ошибка при сохранении лекции' });
    }
});

// Маршрут для редактирования лекции
app.put('/api/lectures/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, text } = req.body;
    const userId = req.user.id;  // Исправлено на правильное извлечение userId

    try {
        const result = await pool.query(
            `UPDATE notes 
             SET title = $1, text = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4 RETURNING *`,
            [title, text, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Лекция не найдена или вы не являетесь ее владельцем' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении лекции:', err);
        res.status(500).json({ error: 'Ошибка при обновлении лекции' });
    }
});

// Маршрут для удаления лекции
app.delete('/api/lectures/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Лекция не найдена или вы не являетесь ее владельцем' });
        }

        res.status(200).json({ message: 'Лекция успешно удалена' });
    } catch (err) {
        console.error('Ошибка при удалении лекции:', err);
        res.status(500).json({ error: 'Ошибка при удалении лекции' });
    }
});

app.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});
