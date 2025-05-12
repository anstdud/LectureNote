import React, { useState, useCallback, useEffect } from 'react';
import { showCustomAlert } from '../Notifications/Notifications.js';
import './AuthModal.css';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthModal = ({ setIsAuthenticated, setUserRole }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        confirmPassword: '',
        role: 'student'
    });
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formValid, setFormValid] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const validateForm = useCallback(() => {
        const basicValidation = formData.username.trim() && formData.password.trim();
        if (isRegister) {
            return basicValidation &&
                formData.password === formData.confirmPassword &&
                formData.password.length >= 6 &&
                /\S+@\S+\.\S+/.test(formData.email);
        }
        return basicValidation;
    }, [formData, isRegister]);

    useEffect(() => {
        setFormValid(validateForm());
    }, [formData, validateForm]);

    const handleInputChange = useCallback((field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        setError('');
    }, []);

    const handleAuthSuccess = useCallback((token, role, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);

        setIsAuthenticated(true);
        setUserRole(role);
        navigate(location.state?.from?.pathname || '/', { replace: true });
    }, [setIsAuthenticated, setUserRole, navigate, location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.error || 'Ошибка при входе';
                throw new Error(errorMessage);
            }

            handleAuthSuccess(data.token, data.role, data.username);
        } catch (err) {
            console.error('Login Error:', err);
            showCustomAlert(err.message, true);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (formData.password.length < 6) {
            showCustomAlert('Пароль должен быть не менее 6 символов', true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    role: formData.role
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.errors
                    ? data.errors.map(e => e.msg).join(', ')
                    : data.error || 'Ошибка регистрации';
                throw new Error(errorMessage);
            }

            showCustomAlert('Регистрация успешна! Авторизуйтесь');
            setIsRegister(false);
            setFormData({
                username: '',
                password: '',
                email: '',
                confirmPassword: '',
                role: 'student'
            });
        } catch (err) {
            console.error('Registration Error:', err);
            showCustomAlert(err.message, true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleForm = useCallback(() => {
        setIsRegister(prev => !prev);
        setError('');
        setFormData({
            username: '',
            password: '',
            email: '',
            confirmPassword: '',
            role: 'student'
        });
    }, []);

    return (
        <div className="auth-modal">
            <div className="auth-modal__container">
                <h2 className="auth-modal__title">
                    {isRegister ? 'Регистрация' : 'Вход'}
                </h2>

                {error && <p className="auth-modal__error">{error}</p>}

                <form className="auth-modal__form" onSubmit={isRegister ? handleRegister : handleLogin}>
                    <div className="auth-modal__input-group">
                        <label htmlFor="username" className="auth-modal__label">
                            Имя пользователя
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="auth-modal__input"
                            value={formData.username}
                            onChange={handleInputChange('username')}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="auth-modal__input-group">
                        <label htmlFor="password" className="auth-modal__label">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="auth-modal__input"
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            disabled={isLoading}
                            required
                            minLength={6}
                        />
                    </div>

                    {isRegister && (
                        <>
                            <div className="auth-modal__input-group">
                                <label htmlFor="confirmPassword" className="auth-modal__label">
                                    Подтвердите пароль
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className="auth-modal__input"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange('confirmPassword')}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="auth-modal__input-group">
                                <label htmlFor="email" className="auth-modal__label">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="auth-modal__input"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="auth-modal__input-group">
                                <label htmlFor="role" className="auth-modal__label">
                                    Роль
                                </label>
                                <select
                                    id="role"
                                    className="auth-modal__select"
                                    value={formData.role}
                                    onChange={handleInputChange('role')}
                                    disabled={isLoading}
                                >
                                    <option value="student">Студент</option>
                                    <option value="teacher">Преподаватель</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className={`auth-modal__button ${isLoading ? 'auth-modal__button--loading' : ''}`}
                        disabled={!formValid || isLoading}
                    >
                        {isLoading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
                    </button>

                    <button
                        type="button"
                        className="auth-modal__toggle-button"
                        onClick={handleToggleForm}
                        disabled={isLoading}
                    >
                        {isRegister
                            ? 'Есть аккаунт? Войти'
                            : 'Нет аккаунта? Зарегистрироваться'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;