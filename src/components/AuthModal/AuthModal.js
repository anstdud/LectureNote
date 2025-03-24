import React, { useState } from 'react';
import { showCustomAlert } from '../Notifications/Notifications.js';
import './AuthModal.css';

const AuthModal = ({ setIsAuthenticated, setUserRole }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('student');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
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

            const { token, role } = await response.json();
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            localStorage.setItem('role', role);
            setIsAuthenticated(true);
            setUserRole(role);
            showCustomAlert('Вход выполнен успешно!');

        } catch (err) {
            console.error('Ошибка соединения с сервером:', err);
            showCustomAlert(err.message || 'Ошибка соединения с сервером', true);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const registerData = { username, password, email, role };

        try {
            const response = await fetch('http://localhost:5001/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:3000'
                },
                body: JSON.stringify(registerData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMessage = responseData.errors
                    ? responseData.errors.map(e => e.msg).join(', ')
                    : responseData.error || 'Ошибка регистрации';
                throw new Error(errorMessage);
            }

            if (responseData.id) {
                showCustomAlert('Регистрация успешна!');
                setIsRegister(false);
            }
        } catch (err) {
            console.error('Ошибка:', err);
            showCustomAlert(err.message, true);
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
                    <>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="role-select"
                        >
                            <option value="student">Студент</option>
                            <option value="teacher">Преподаватель</option>
                        </select>
                    </>
                )}
                <button onClick={isRegister ? handleRegister : handleLogin}>
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <button onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                }}>
                    {isRegister ? 'Есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </button>
            </div>
        </div>
    );
};

export default AuthModal;