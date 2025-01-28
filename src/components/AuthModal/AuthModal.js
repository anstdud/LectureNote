import React, { useState } from 'react';
import './AuthModal.css';
/////
const AuthModal = ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isRegister, setIsRegister] = useState(false); // Для переключения между формами

    const handleLogin = (username, password) => {
        fetch('http://localhost:5001/api/login', {  // Убедитесь, что путь правильный
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Ошибка при входе: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                if (data.token) {
                    localStorage.setItem('token', data.token); // Сохраняем токен
                    setIsAuthenticated(true); // Статус аутентификации
                } else {
                    alert('Неверный логин или пароль');
                }
            })
            .catch((error) => {
                console.error('Ошибка соединения с сервером:', error);
                alert('Ошибка соединения с сервером');
            });
    };


    const handleRegister = () => {
        const registerData = { username, password, email };

        fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData),
        })
            .then((response) => {
                if (!response.ok) {
                    console.error('Ошибка регистрации:', response.status, response.statusText);
                    throw new Error('Ошибка регистрации');
                }
                return response.json();
            })
            .then((data) => {
                if (data.id) { // Если регистрация успешна
                    alert('Регистрация успешна');
                } else {
                    alert('Ошибка регистрации');
                }
            })
            .catch((err) => {
                console.error('Ошибка соединения с сервером:', err);
                alert('Ошибка соединения с сервером');
            });
    };

    return (
        <div className="auth-modal">
            <div>
                <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {isRegister && (
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                )}
                <button onClick={isRegister ? handleRegister : () => handleLogin(username, password)}>
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <button onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? 'Есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </div>
        </div>
    );
};

export default AuthModal;
