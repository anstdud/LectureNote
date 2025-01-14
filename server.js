import express from 'express';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'LectureNote',
    password: '1111',
    port: 5432,
});

// Проверка подключения к базе данных
pool.connect()
    .then(() => console.log('Бд подключена'))
    .catch(err => console.error('Бд НЕ подключена:', err));

const JWT_SECRET = 'your_jwt_secret_key';

// Пример маршрута для регистрации
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Добавление пользователя
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
    const { username, password } = req.body;

    try {
        // Находим пользователя по имени
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        // Если пользователь не найден
        if (!user) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        // Если пароль неверный
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        // Генерация JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Ошибка входа' });
    }

    console.log('Полученные данные:', { password, passwordHash: user.password_hash });
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Результат проверки пароля:', isPasswordValid);

});

// Middleware для проверки JWT
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'Необходимо войти в систему' });
    }

    const tokenWithoutBearer = token.split(' ')[1];

    // Проверяем токен
    jwt.verify(tokenWithoutBearer, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный или просроченный токен' });
        }
        req.user = decoded;
        next();
    });
};

// Защищённый маршрут
app.get('/api/protected-route', authenticate, (req, res) => {
    res.status(200).json({ message: 'Это защищённый маршрут', user: req.user });
});


// Маршрут для создания новой заметки
app.post('/api/notes', authenticate, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.userId; // Получаем ID пользователя из токена

    try {
        const result = await pool.query(
            `INSERT INTO notes (user_id, title, content) 
             VALUES ($1, $2, $3) RETURNING *`,
            [userId, title, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при создании заметки:', err);
        res.status(500).json({ error: 'Ошибка при создании заметки' });
    }
});

// Маршрут для получения всех заметок пользователя
app.get('/api/notes', authenticate, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении заметок:', err);
        res.status(500).json({ error: 'Ошибка при получении заметок' });
    }
});

// Маршрут для редактирования заметки
app.put('/api/notes/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `UPDATE notes 
             SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4 RETURNING *`,
            [title, content, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заметка не найдена или вы не являетесь ее владельцем' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении заметки:', err);
        res.status(500).json({ error: 'Ошибка при обновлении заметки' });
    }
});

// Маршрут для удаления заметки
app.delete('/api/notes/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заметка не найдена или вы не являетесь ее владельцем' });
        }

        res.status(200).json({ message: 'Заметка успешно удалена' });
    } catch (err) {
        console.error('Ошибка при удалении заметки:', err);
        res.status(500).json({ error: 'Ошибка при удалении заметки' });
    }
});


// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});
