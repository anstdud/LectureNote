import express from 'express';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect()
    .then(() => console.log('Бд подключена'))
    .catch(err => console.error('Бд НЕ подключена:', err));

const JWT_SECRET = 'your_jwt_secret_key';

app.post('/api/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('password').isLength({ min: 6 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['student', 'teacher', 'admin'])
], async (req, res) => {
    console.log('Received registration data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, role = 'student' } = req.body;

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким логином или email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, hashedPassword, email, role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});

app.post('/api/login', [
    body('username').trim().escape(),
    body('password').trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            role: user.role
        });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/tutoring', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const result = await pool.query(`
                SELECT u.id, u.username, t.subject, t.price 
                FROM tutors t
                JOIN users u ON t.user_id = u.id
            `);
            res.json(result.rows);
        } else if (req.user.role === 'teacher') {
            const result = await pool.query(`
                SELECT 
                    b.id, 
                    u.username, 
                    b.datetime,
                    t.subject
                FROM bookings b
                JOIN users u ON b.student_id = u.id
                JOIN tutors t ON b.tutor_id = t.user_id
                WHERE b.tutor_id = $1
                ORDER BY b.datetime DESC
            `, [req.user.id]);
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/tutoring', authenticate, [
    body('tutorId').isInt(),
    body('datetime').isISO8601(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Проверка роли
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Только студенты могут записываться на занятия' });
    }

    try {
        const { tutorId, datetime } = req.body;

        // Проверка существования преподавателя
        const tutorExists = await pool.query(
            'SELECT id FROM tutors WHERE user_id = $1',
            [tutorId]
        );

        if (tutorExists.rows.length === 0) {
            return res.status(404).json({ error: 'Преподаватель не найден' });
        }

        const timeBooked = await pool.query(
            'SELECT id FROM bookings WHERE tutor_id = $1 AND datetime = $2',
            [tutorId, datetime]
        );

        if (timeBooked.rows.length > 0) {
            return res.status(400).json({ error: 'Это время уже занято другим студентом' });
        }

        const result = await pool.query(
            'INSERT INTO bookings (student_id, tutor_id, datetime) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, tutorId, datetime]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/tutor', authenticate, [
    body('fullName').trim().escape(),
    body('subject').trim().escape(),
    body('price').isNumeric(),
    body('availableDays').isArray(),
    body('availableTime').isObject(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('User role:', req.user.role);
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { fullName, subject, price, availableDays, availableTime } = req.body;
    console.log('Received data:', { fullName, subject, price, availableDays, availableTime }); // Логируем полученные данные

    try {
        const existing = await pool.query(
            'SELECT 1 FROM tutors WHERE user_id = $1',
            [req.user.id]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE tutors 
                 SET full_name = $1, subject = $2, price = $3, available_days = $4, available_time = $5
                 WHERE user_id = $6`,
                [fullName, subject, price, availableDays, availableTime, req.user.id]
            );
        } else {
            await pool.query(
                `INSERT INTO tutors (user_id, full_name, subject, price, available_days, available_time)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [req.user.id, fullName, subject, price, availableDays, availableTime]
            );
        }

        res.json({ message: 'Профиль сохранен' });
    } catch (err) {
        console.error('Ошибка в /api/tutor:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/tutor', authenticate, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                full_name AS "fullName",
                subject,
                price,
                available_days AS "availableDays",
                available_time AS "availableTime"
            FROM tutors 
            WHERE user_id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) return res.json({});
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/tutors', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                t.full_name AS "fullName",
                t.subject,
                t.price,
                t.available_days AS "availableDays",
                t.available_time AS "availableTime"
            FROM tutors t
            JOIN users u ON t.user_id = u.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/tutor', authenticate, [
    body('subject').trim().escape(),
    body('price').isNumeric(),
], async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    try {
        const { subject, price } = req.body;
        await pool.query(
            'UPDATE tutors SET subject = $1, price = $2 WHERE user_id = $3',
            [subject, price, req.user.id]
        );
        res.json({ message: 'Профиль обновлен' });
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/tutor', authenticate, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    try {
        await pool.query('DELETE FROM tutors WHERE user_id = $1', [req.user.id]);
        res.json({ message: 'Профиль удален' });
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/student/bookings', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                b.id, 
                t.full_name AS "tutorName", 
                t.subject, 
                b.datetime
             FROM bookings b
             JOIN tutors t ON b.tutor_id = t.user_id
             WHERE b.student_id = $1
             ORDER BY b.datetime DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения бронирований студента:', err);
        res.status(500).json({ error: 'Ошибка получения бронирований' });
    }
});

app.get('/api/bookings/occupied', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT datetime FROM bookings WHERE tutor_id = $1',
            [req.user.id]
        );

        res.json(result.rows.map(row => row.datetime));
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/bookings/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM bookings WHERE id = $1 AND (student_id = $2 OR tutor_id = $2) RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена или у вас нет прав на ее удаление' });
        }

        res.json({ message: 'Запись успешно отменена' });
    } catch (err) {
        console.error('Ошибка при отмене записи:', err);
        res.status(500).json({ error: 'Ошибка при отмене записи' });
    }
});

function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Отсутствует токен' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Декодированный токен:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Ошибка токена:', err);
        res.status(401).json({ error: 'Недействительный токен' });
    }
}

app.get('/api/lectures', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении лекций:', err);
        res.status(500).json({ error: 'Ошибка при получении лекций' });
    }
});

app.post('/api/lectures', authenticate, [
    body('title').trim().escape(),
    body('text').trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

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

app.put('/api/lectures/:id', authenticate, [
    body('title').trim().escape(),
    body('text').trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, text } = req.body;
    const userId = req.user.id;

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

app.post('/api/lectures/:id/share', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const lectureExists = await pool.query(
            'SELECT * FROM notes WHERE id = $1',
            [id]
        );

        if (lectureExists.rows.length === 0) {
            return res.status(404).json({ error: 'Лекция не найдена' });
        }

        const generateCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();
        let code;
        let exists = true;

        while (exists) {
            code = generateCode();
            const check = await pool.query(
                'SELECT * FROM shared_lectures WHERE code = $1',
                [code]
            );
            exists = check.rows.length > 0;
        }

        await pool.query(
            'INSERT INTO shared_lectures (code, lecture_id, user_id) VALUES ($1, $2, $3)',
            [code, id, userId]
        );

        res.json({ code });
    } catch (err) {
        console.error('Ошибка генерации кода:', err);
        res.status(500).json({ error: 'Ошибка генерации кода' });
    }
});

app.post('/api/lectures/add-by-code', authenticate, async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;

    try {
        const shared = await pool.query(
            'SELECT * FROM shared_lectures WHERE code = $1',
            [code]
        );

        if (shared.rows.length === 0) {
            return res.status(404).json({ error: 'Неверный код доступа' });
        }

        const { lecture_id } = shared.rows[0];

        const originalLecture = await pool.query(
            'SELECT * FROM notes WHERE id = $1',
            [lecture_id]
        );

        if (originalLecture.rows.length === 0) {
            return res.status(404).json({ error: 'Лекция не найдена' });
        }

        const { title, text } = originalLecture.rows[0];

        const result = await pool.query(
            'INSERT INTO notes (user_id, title, text) VALUES ($1, $2, $3) RETURNING *',
            [userId, title, text]
        );

        await pool.query(
            'DELETE FROM shared_lectures WHERE code = $1',
            [code]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка добавления по коду:', err);
        res.status(500).json({ error: 'Ошибка добавления лекции' });
    }
});

app.get('/api/user', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT username, email FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка получения данных:', err);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

app.put('/api/user', authenticate, [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const userId = req.user.id;

    try {
        const emailCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [email, userId]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email уже используется' });
        }

        const result = await pool.query(
            `UPDATE users 
       SET username = $1, email = $2 
       WHERE id = $3 
       RETURNING id, username, email`,
            [username, email, userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка обновления:', err);
        res.status(500).json({ error: 'Ошибка обновления данных' });
    }
});

app.put('/api/user/password', authenticate, [
    body('currentPassword').trim().escape(),
    body('newPassword').isLength({ min: 6 }).trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Неверный текущий пароль' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        res.json({ message: 'Пароль успешно изменен' });
    } catch (err) {
        console.error('Ошибка обновления пароля:', err);
        res.status(500).json({ error: 'Ошибка обновления пароля' });
    }
});

app.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});