import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (username, password) => {
        try {
            const response = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при входе');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                setIsAuthenticated(true);
            } else {
                setError('Неверный логин или пароль');
            }
        } catch (err) {
            console.error('Ошибка соединения с сервером:', err);
            setError(err.message || 'Ошибка соединения с сервером');
        }
    };

    const handleRegister = async () => {
        const registerData = { username, password, email };

        try {
            const response = await fetch('http://localhost:5001/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:3000'
                },
                body: JSON.stringify(registerData),
            });

            const responseData = await response.json(); // Всегда парсим ответ

            if (!response.ok) {
                // Обрабатываем разные форматы ошибок
                const errorMessage = responseData.errors
                    ? responseData.errors.map(e => e.msg).join(', ')
                    : responseData.error || 'Ошибка регистрации';

                throw new Error(errorMessage);
            }

            if (responseData.id) {
                alert('Регистрация успешна');
                setIsRegister(false);
            }
        } catch (err) {
            console.error('Ошибка:', err);
            setError(err.message);
        }
    };

    return (
        <div className="auth-modal">
            <div>
                <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>
                {error && <p className="error-message">{error}</p>}
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
                <button onClick={() => {
                    setIsRegister(!isRegister);
                    setError(''); // Очищаем ошибку при переключении форм
                }}>
                    {isRegister ? 'Есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </div>
        </div>
    );
};

export default AuthModal;