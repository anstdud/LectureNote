import express from 'express';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5001;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

pool.connect()
    .then(() => console.log('Бд подключена'))
    .catch(err => console.error('Бд НЕ подключена:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function authenticate(req, res, next) {
    console.log(`[AUTH] Method: ${req.method}, Path: ${req.path}`);

    if (req.method === 'OPTIONS') {
        console.log('[AUTH] Skipping OPTIONS request');
        return next();
    }

    const authHeader = req.headers.authorization;
    console.log('[AUTH] Headers:', req.headers);

    if (!authHeader) {
        console.error('[AUTH] No authorization header');
        return res.status(401).json({ error: 'Отсутствует токен' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[AUTH] Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[AUTH] Token error:', {
            error: err.name,
            message: err.message,
            token: token?.slice(0, 15) + '...'
        });
        res.status(401).json({ error: 'Недействительный токен' });
    }
}

app.post('/api/register', [
        body('username')
            .isLength({ min: 3 }).withMessage('Логин должен быть не менее 3 символов')
            .trim().escape(),
        body('password')
            .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов')
            .trim().escape(),
        body('email')
            .isEmail().withMessage('Некорректный email')
            .normalizeEmail(),
        body('role').optional().isIn(['student', 'teacher', 'admin'])
            .withMessage('Недопустимая роль пользователя')
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
    body('username')
        .notEmpty().withMessage('Логин обязателен')
        .trim().escape(),
    body('password')
        .notEmpty().withMessage('Пароль обязателен')
        .trim().escape(),
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
        }, JWT_SECRET, { expiresIn: '4h' });

        res.json({
            token,
            role: user.role
        });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.get('/api/tutoring', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            const [bookings, tutorData] = await Promise.all([
                pool.query(
                    `SELECT
                         b.id,
                         u.full_name AS "studentName",
                         u.avatar_url AS "studentAvatar",
                         b.datetime,
                         t.subject,
                         u.phone_number AS "studentPhone",
                         u.email AS "studentEmail"
                     FROM bookings b
                              JOIN users u ON b.student_id = u.id
                              JOIN tutors t ON b.tutor_id = t.id
                     WHERE t.user_id = $1
                       AND b.datetime >= NOW()
                     ORDER BY b.datetime DESC`,
                    [req.user.id]
                ),
                pool.query(
                    `SELECT
                        full_name AS "fullName",
                        subject,
                        price,
                        available_days AS "availableDays",
                        available_time AS "availableTime",
                        COALESCE(additional_info, '') AS "additionalInfo",
                        position,
                        education,
                        rank,
                        city
                     FROM tutors
                     WHERE user_id = $1`,
                    [req.user.id]
                )
            ]);

            res.json({
                bookings: bookings.rows,
                tutorData: tutorData.rows[0] || null
            });
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

    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Только студенты могут записываться на занятия' });
    }

    try {
        const { tutorId, datetime } = req.body;

        const tutorExists = await pool.query(
            'SELECT id, user_id FROM tutors WHERE id = $1',
            [tutorId]
        );

        if (tutorExists.rows.length === 0) {
            return res.status(404).json({ error: 'Преподаватель не найден' });
        }

        const tutorUserId = tutorExists.rows[0].user_id;

        const timeBooked = await pool.query(
            'SELECT id FROM bookings WHERE datetime = $1 AND tutor_id = $2',
            [datetime, tutorId]
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

app.get('/api/bookings/all-occupied', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT TO_CHAR(datetime, \'YYYY-MM-DD"T"HH24:MI:SS\') as datetime FROM bookings'
        );
        res.json(result.rows.map(row => row.datetime));
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
    body('additionalInfo').optional().trim().escape(),
    body('position').optional().trim().escape(),
    body('education').optional().trim().escape(),
    body('rank').optional().trim().escape(),
    body('city').optional().trim().escape()
], async (req, res) => {
    console.log('Received tutor data:', req.body);
    const { fullName, subject, price, availableDays, availableTime, additionalInfo = '', position, education, rank, city } = req.body;

    try {
        const existing = await pool.query(
            'SELECT 1 FROM tutors WHERE user_id = $1',
            [req.user.id]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE tutors
                 SET full_name = $1,
                     subject = $2,
                     price = $3,
                     available_days = $4,
                     available_time = $5,
                     additional_info = $6,
                     position = $7,
                     education = $8,
                     rank = $9,
                     city = $10
                 WHERE user_id = $11`,
                [fullName, subject, price, availableDays, availableTime, additionalInfo, position, education, rank, city, req.user.id]
            );
        } else {
            await pool.query(
                `INSERT INTO tutors (
                    user_id, full_name, subject, price, available_days,
                    available_time, additional_info, position, education,
                    rank, city
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [req.user.id, fullName, subject, price, availableDays, availableTime, additionalInfo, position, education, rank, city]
            );
        }

        const result = await pool.query(`
            SELECT 
                full_name AS "fullName",
                subject,
                price,
                available_days AS "availableDays",
                available_time AS "availableTime",
                additional_info AS "additionalInfo",
                position,
                education,
                rank,
                city
            FROM tutors 
            WHERE user_id = $1
        `, [req.user.id]);

        res.json(result.rows[0] || {});
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/tutor', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                full_name AS "fullName",
                subject,
                price,
                available_days AS "availableDays",
                available_time AS "availableTime",
                COALESCE(additional_info, '') AS "additionalInfo" 
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
                t.id,
                t.id as "tutorId",
                t.full_name AS "fullName",
                t.subject,
                t.price,
                COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS rating,
                COUNT(r.rating) as total_ratings,
                (
                    SELECT rating
                    FROM ratings
                    WHERE tutor_id = t.id
                      AND student_id = $1
                    LIMIT 1
                ) AS "userRating",
                t.available_days AS "availableDays",
                t.available_time->>'start' AS start_time,
                t.available_time->>'end' AS end_time,
                t.additional_info AS "additionalInfo",
                t.position,
                t.education,
                t.rank,
                t.city,
                EXISTS(
                    SELECT 1 
                    FROM tutor_verifications 
                    WHERE user_id = t.user_id 
                    AND status = 'approved'
                ) as "is_verified"
            FROM tutors t
                LEFT JOIN ratings r ON t.id = r.tutor_id
            GROUP BY t.id, t.user_id
            ORDER BY rating DESC
        `, [req.user.id]);

        const tutors = result.rows.map(tutor => ({
            ...tutor,
            availableTime: {
                start: tutor.start_time,
                end: tutor.end_time
            }
        }));

        res.json(tutors);
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
                 b.datetime,
                 u.avatar_url AS "tutorAvatar",
                 t.price
             FROM bookings b
                      JOIN tutors t ON b.tutor_id = t.id
                      JOIN users u ON t.user_id = u.id
             WHERE b.student_id = $1
               AND b.datetime >= NOW()
             ORDER BY b.datetime ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения бронирований:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
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

app.get('/api/lectures', authenticate, async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const userId = req.user.id;
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении лекций:', err);
        res.status(500).json([]);
    }
});

app.post('/api/lectures', authenticate, [
    body('title').trim().escape(),
    body('text').trim().escape(),
], async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

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
            'SELECT username, email, full_name, phone_number, city, education, bio, avatar_url, role FROM users WHERE id = $1',
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
    body('full_name').optional().trim().escape(),
    body('phone_number').optional().trim().escape(),
    body('city').optional().trim().escape(),
    body('education').optional().trim().escape(),
    body('bio').optional().trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        username,
        email,
        full_name,
        phone_number,
        city,
        education,
        bio
    } = req.body;
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
             SET username = $1, email = $2,
                 full_name = $3, phone_number = $4,
                 city = $5, education = $6, bio = $7
             WHERE id = $8
                 RETURNING *`,
            [username, email, full_name, phone_number, city, education, bio, req.user.id]
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

if (!existsSync('uploads')) {
    mkdirSync('uploads', { recursive: true });
}

app.post('/api/upload-avatar', authenticate, upload.single('avatar'), async (req, res) => {
    try {
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        await pool.query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2',
            [avatarUrl, req.user.id]
        );
        res.json({ avatarUrl });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки аватара' });
    }
});

const documentsDir = 'uploads/documents/';
if (!existsSync(documentsDir)) {
    mkdirSync(documentsDir, { recursive: true });
}

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, documentsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const uploadDocument = multer({
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Неподдерживаемый формат файла'), false);
        }
    }
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});
// const uploadDocument = multer({ storage: documentStorage });

app.post('/api/tutor/upload-document', authenticate, uploadDocument.single('document'), async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    try {
        const tutor = await pool.query('SELECT id FROM tutors WHERE user_id = $1', [req.user.id]);
        if (tutor.rows.length === 0) {
            return res.status(400).json({
                error: 'Сначала заполните профиль преподавателя'
            });
        }

        await pool.query(
            'DELETE FROM tutor_verifications WHERE user_id = $1 AND status = $2',
            [req.user.id, 'pending']
        );

        const documentUrl = `/uploads/documents/${req.file.filename}`;

        await pool.query(
            'INSERT INTO tutor_verifications (user_id, document_url) VALUES ($1, $2) RETURNING *',
            [req.user.id, documentUrl]
        );

        res.json({
            message: 'Документ отправлен на проверку',
            documentUrl
        });

    } catch (error) {
        console.error('Ошибка загрузки документа:', error);
        res.status(500).json({
            error: 'Ошибка сервера при загрузке документа',
            details: error.message
        });
    }
});

app.get('/api/tutor/verification-status', authenticate, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Доступ запрещен' });

    try {
        const result = await pool.query(
            `SELECT tv.status, tv.document_url, tv.updated_at, u.username AS verified_by 
             FROM tutor_verifications tv
             LEFT JOIN users u ON tv.verified_by = u.id
             WHERE tv.user_id = $1 
             ORDER BY tv.created_at DESC 
             LIMIT 1`,
            [req.user.id]
        );

        res.json(result.rows[0] || { status: 'not_submitted' });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка получения статуса' });
    }
});

app.get('/api/tutors/:id/rating', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ROUND(AVG(rating), 1) as average_rating,
                COUNT(*) as total_ratings
            FROM ratings 
            WHERE tutor_id = $1
        `, [req.params.id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения рейтинга' });
    }
});

app.post('/api/rate-tutor', authenticate, [
    body('tutorId').isInt(),
    body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { tutorId, rating } = req.body;

        const tutorExists = await pool.query(
            'SELECT id FROM tutors WHERE id = $1',
            [tutorId]
        );

        if (tutorExists.rows.length === 0) {
            return res.status(404).json({ error: 'Преподаватель не найден' });
        }

        await pool.query(`
            INSERT INTO ratings (tutor_id, student_id, rating)
            VALUES ($1, $2, $3)
                ON CONFLICT (tutor_id, student_id) 
            DO UPDATE SET rating = EXCLUDED.rating
        `, [tutorId, req.user.id, rating]);

        const result = await pool.query(`
            SELECT
                ROUND(AVG(rating)::numeric, 1) as average_rating,
                COUNT(*) as total_ratings
            FROM ratings
            WHERE tutor_id = $1
        `, [tutorId]);

        res.json({
            message: 'Оценка сохранена',
            averageRating: result.rows[0].average_rating,
            totalRatings: result.rows[0].total_ratings
        });
    } catch (err) {
        console.error('Ошибка сохранения оценки:', err);
        res.status(500).json({ error: 'Ошибка сохранения оценки' });
    }
});

app.get('/api/admin/verification-requests', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                tv.id,
                u.username,
                u.email,
                tv.document_url,
                tv.created_at,
                t.full_name,
                t.subject
            FROM tutor_verifications tv
            JOIN users u ON tv.user_id = u.id
            JOIN tutors t ON tv.user_id = t.user_id
            WHERE tv.status = 'pending'
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/admin/verify-teacher', authenticate, [
    body('requestId').isInt(),
    body('status').isIn(['approved', 'rejected'])
], async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { requestId, status } = req.body;

    try {
        const result = await pool.query(`
            UPDATE tutor_verifications
            SET 
                status = $1,
                verified_by = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [status, req.user.id, requestId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запрос не найден' });
        }

        res.json({ message: 'Статус обновлен' });
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});
