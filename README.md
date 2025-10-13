# ![Логотип](public/logo.svg) LectureNote

**LectureNote** - это веб-приложение для создания, управления и экспорта персональных записей с системой аутентификации пользователей. Все данные хранятся в PostgreSQL и привязаны к аккаунту.

Посмотреть можете здесь: https://lecture-note.onrender.com

## 🌟 Особенности
- 🔐 Регистрация и авторизация пользователей
- 📝 Создание/редактирование/удаление записей
- 💾 Автоматическое сохранение в базу данных
- 📤 Экспорт записей
- 👤 Персональное пространство для каждого пользователя


## 🛠 Технологии

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens)

- **Frontend**: React
- **Backend**: Node.js/Express
- **База данных**: PostgreSQL
- **Аутентификация**: JWT
- **Дополнительно**:
    - Environment Variables
    - npm-пакеты

## 🚀 Быстрый старт

### Предварительные требования
- Node.js ≥ 16.x
- PostgreSQL ≥ 14.x
- npm ≥ 9.x

### Установка
1. **Клонировать репозиторий**
   ```bash
   git clone [anstdud/LectureNote](https://github.com/anstdud/LectureNote/tree/main)
   cd LectureNote
   ```

2. **Установить зависимости**
   ```bash
   npm install
   npm install --save-dev cross-env
   npm install --save-dev nodemon
   ```

3. **Настройка БД**
    - Создайте БД в PostgreSQL:
```bash
 CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE shared_lectures (
    code VARCHAR(10) PRIMARY KEY UNIQUE NOT NULL,
    lecture_id INT REFERENCES notes(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
  
CREATE TABLE tutors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),  
    full_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    price NUMERIC NOT NULL,
    available_days TEXT[] NOT NULL,
    available_time JSONB NOT NULL,
    additional_info TEXT,
    position TEXT,
    education TEXT,
    rank TEXT,
    city TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    tutor_id INTEGER REFERENCES tutors(id),
    datetime TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  
  CREATE TABLE tutor_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    document_url VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    verified_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
  
  CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES tutors(id), 
    student_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tutor_id, student_id)
);
    ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student';
```

- Настройте подключение в `.env`:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=ваш_пользователь
  DB_PASSWORD=ваш_пароль
  DB_NAME=lecturenote_db
  JWT_SECRET=ваш_секретный_ключ
  ```
  
4. **Запуск приложения**
   ```bash
   # Терминал 1 (бэкенд)
   npm run start:server
   # Терминал 2 (фронтенд)
   npm run start:client
   ```

## 🗂 Структура проекта (ключевые элементы)
```
LectureNote/
├── public/            # Статические ресурсы
│   ├── index.html
│   └── ...
├── src/              # Клиентская часть
│   ├── components/   # React-компоненты
│   ├── auth/         # Логика авторизации
│   ├── notes/        # Работа с записями
│   └── server.js     # Серверная логика
├── .env              # Конфигурация окружения
└── package.json      # Зависимости
```


---

**Версия**: 1.0.0  
