import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

const ProfilePage = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [editMode, setEditMode] = useState(false);
    const [passwordEditMode, setPasswordEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:5001/api/user', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) throw new Error('Ошибка загрузки данных');

                const data = await response.json();
                setUserData((prev) => ({ ...prev, username: data.username, email: data.email }));
                setLoading(false);
            } catch (error) {
                console.error('Ошибка:', error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:5001/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                }),
            });

            if (!response.ok) throw new Error('Ошибка обновления данных');

            const data = await response.json();
            setUserData((prev) => ({ ...prev, username: data.username, email: data.email }));
            localStorage.setItem('username', data.username);
            setEditMode(false);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при обновлении данных');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (userData.newPassword !== userData.confirmPassword) {
            alert('Новый пароль и подтверждение пароля не совпадают');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: userData.password,
                    newPassword: userData.newPassword,
                }),
            });

            if (!response.ok) throw new Error('Ошибка обновления пароля');

            setUserData((prev) => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
            setPasswordEditMode(false);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при изменении пароля');
        }
    };

    if (loading) {
        return <div className="profile-loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="profile-error">Ошибка: {error}</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-content">
                <h2 className="profile-title">Профиль пользователя</h2>
                <form onSubmit={handleSubmit}>
                    <div className="profile-field">
                        <label>Имя пользователя:</label>
                        {editMode ? (
                            <input
                                type="text"
                                name="username"
                                value={userData.username}
                                onChange={handleInputChange}
                                className="profile-input"
                            />
                        ) : (
                            <div className="profile-value">{userData.username}</div>
                        )}
                    </div>

                    <div className="profile-field">
                        <label>Email:</label>
                        {editMode ? (
                            <input
                                type="email"
                                name="email"
                                value={userData.email}
                                onChange={handleInputChange}
                                className="profile-input"
                            />
                        ) : (
                            <div className="profile-value">{userData.email}</div>
                        )}
                    </div>

                    {editMode && (
                        <div className="profile-buttons">
                            <button type="submit" className="profile-save-btn">
                                Сохранить
                            </button>
                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={() => setEditMode(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    )}
                </form>

                {passwordEditMode ? (
                    <form onSubmit={handlePasswordSubmit} className="password-form">
                        <div className="profile-field">
                            <label>Текущий пароль:</label>
                            <input
                                type="password"
                                name="password"
                                value={userData.password}
                                onChange={handleInputChange}
                                className="profile-input"
                            />
                        </div>
                        <div className="profile-field">
                            <label>Новый пароль:</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={userData.newPassword}
                                onChange={handleInputChange}
                                className="profile-input"
                            />
                        </div>
                        <div className="profile-field">
                            <label>Подтвердите пароль:</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={userData.confirmPassword}
                                onChange={handleInputChange}
                                className="profile-input"
                            />
                        </div>
                        <div className="profile-buttons">
                            <button type="submit" className="profile-save-btn">
                                Сохранить пароль
                            </button>
                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={() => setPasswordEditMode(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                ) : null}

                {!editMode && !passwordEditMode && (
                    <div className="profile-action-buttons">
                        <div className="profile-action-buttons-row">
                            <button
                                className="profile-edit-btn"
                                onClick={() => setEditMode(true)}
                            >
                                Изменить данные
                            </button>
                            <button
                                className="profile-password-btn"
                                onClick={() => setPasswordEditMode(true)}
                            >
                                Сменить пароль
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;