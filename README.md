# LectureNote📓

**LectureNote** - это веб-приложение для создания, управления и экспорта персональных записей с системой аутентификации пользователей. Все данные хранятся в PostgreSQL и привязаны к аккаунту.

![Логотип](public/favicon.ico)

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
   cd client && npm install
   ```

3. **Настройка БД**
    - Создайте БД в PostgreSQL:
```bash
 CREATE TABLE users (  
 id SERIAL PRIMARY KEY,  
 username VARCHAR(50) UNIQUE NOT NULL,  
 password_hash VARCHAR(255) NOT NULL,  
 email VARCHAR(255) UNIQUE NOT NULL,  
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
   # Запуск сервера
   npm run server

   # Запуск клиента (в отдельном терминале)
   cd client && npm start
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
