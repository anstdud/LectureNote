import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { showCustomAlert } from '../Notifications/Notifications.js';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        newPassword: '',
        confirmPassword: '',
        full_name: '',
        phone_number: '',
        city: '',
        education: '',
        bio: '',
        avatar_url: '',
        role: '',
        tutorProfileComplete: false
    });
    const [editMode, setEditMode] = useState(false);
    const [passwordEditMode, setPasswordEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState('not_submitted');
    const [documentUrl, setDocumentUrl] = useState('');
    const [verificationDetails, setVerificationDetails] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVerificationStatus = async () => {
            if (userData.role === 'teacher') {
                try {
                    const response = await fetch('http://localhost:5001/api/tutor/verification-status', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    });
                    const data = await response.json();
                    setVerificationStatus(data.status || 'not_submitted');
                    setDocumentUrl(data.document_url || '');
                    setVerificationDetails(data);
                } catch (error) {
                    console.error('Ошибка:', error);
                }
            }
        };
        fetchVerificationStatus();
    }, [userData.role]);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            try {
                const [userResponse, tutorResponse] = await Promise.all([
                    fetch('http://localhost:5001/api/user', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch('http://localhost:5001/api/tutor', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ]);

                if (!userResponse.ok) throw new Error('Ошибка загрузки данных');

                const userData = await userResponse.json();
                const tutorData = await tutorResponse.json().catch(() => null);

                setUserData(prev => ({
                    ...prev,
                    username: userData.username || '',
                    email: userData.email || '',
                    full_name: userData.full_name || '',
                    phone_number: userData.phone_number || '',
                    city: userData.city || '',
                    education: userData.education || '',
                    bio: userData.bio || '',
                    avatar_url: userData.avatar_url || '',
                    role: userData.role,
                    tutorProfileComplete: !!tutorData?.fullName
                }));

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
        setUserData(prev => ({ ...prev, [name]: value }));
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
                    full_name: userData.full_name,
                    phone_number: userData.phone_number,
                    city: userData.city,
                    education: userData.education,
                    bio: userData.bio
                }),
            });

            if (!response.ok) throw new Error('Ошибка обновления данных');

            const data = await response.json();
            setUserData(prev => ({
                ...prev,
                username: data.username,
                email: data.email,
                full_name: data.full_name,
                phone_number: data.phone_number,
                city: data.city,
                education: data.education,
                bio: data.bio
            }));
            localStorage.setItem('username', data.username);
            setEditMode(false);
        }  catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert('Ошибка при обновлении данных', true);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (userData.newPassword !== userData.confirmPassword) {
            showCustomAlert('Новый пароль и подтверждение пароля не совпадают', true);
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
            showCustomAlert('Ошибка при изменении пароля', true);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('http://localhost:5001/api/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Ошибка загрузки');

            const { avatarUrl } = await response.json();
            setUserData(prev => ({
                ...prev,
                avatar_url: avatarUrl + '?t=' + Date.now()
            }));
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert('Не удалось загрузить аватар');
        }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('document', file);

            const response = await fetch('http://localhost:5001/api/tutor/upload-document', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Ошибка загрузки');

            setVerificationStatus('pending');
            showCustomAlert('Документ успешно загружен!');

        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert(error.message, true);
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

                <div className="avatar-section">
                    <img
                        src={userData.avatar_url || '/default-avatar.png'}
                        alt="Аватар"
                        className="avatar-image"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        id="avatar-upload"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="avatar-upload" className="avatar-upload-label">
                        Изменить аватар
                    </label>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="profile-info-container">
                        <div className="profile-fields-group">
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

                            <div className="profile-field">
                                <label>ФИО:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={userData.full_name}
                                        onChange={handleInputChange}
                                        className="profile-input"
                                    />
                                ) : (
                                    <div className="profile-value">{userData.full_name}</div>
                                )}
                            </div>

                            <div className="profile-field">
                                <label>Телефон:</label>
                                {editMode ? (
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={userData.phone_number}
                                        onChange={handleInputChange}
                                        className="profile-input"
                                    />
                                ) : (
                                    <div className="profile-value">{userData.phone_number}</div>
                                )}
                            </div>

                            <div className="profile-field">
                                <label>Город:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="city"
                                        value={userData.city}
                                        onChange={handleInputChange}
                                        className="profile-input"
                                    />
                                ) : (
                                    <div className="profile-value">{userData.city}</div>
                                )}
                            </div>

                            <div className="profile-field">
                                <label>Образование:</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        name="education"
                                        value={userData.education}
                                        onChange={handleInputChange}
                                        className="profile-input"
                                    />
                                ) : (
                                    <div className="profile-value">{userData.education}</div>
                                )}
                            </div>
                        </div>

                        <div className="profile-field bio-field">
                            <label>О себе:</label>
                            {editMode ? (
                                <textarea
                                    name="bio"
                                    value={userData.bio}
                                    onChange={handleInputChange}
                                    className="profile-input bio-textarea"
                                    rows="4"
                                />
                            ) : (
                                <div className="profile-value bio-content">
                                    {userData.bio || <span className="empty-bio">Нет информации</span>}
                                </div>
                            )}
                        </div>
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

                {userData.role === 'teacher' && (
                    <div className="verification-section">
                        <h3>Подтверждение квалификации</h3>

                        {!userData.tutorProfileComplete && (
                            <div className="verification-warning">
                                <p>⚠️ Для загрузки документа необходимо сначала заполнить профиль преподавателя</p>
                                <button
                                    className="profile-edit-btn"
                                    onClick={() => navigate('/tutoring')}
                                >
                                    Заполнить профиль
                                </button>
                            </div>
                        )}

                        {userData.tutorProfileComplete && (
                            <>
                            {verificationStatus === 'not_submitted' && (
                                <div className="verification-upload">
                                    <input
                                        type="file"
                                        id="document-upload"
                                        onChange={handleDocumentUpload}
                                        accept="application/pdf,image/*"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="document-upload" className="upload-label">
                                        Загрузить документ
                                    </label>
                                    <p className="upload-hint">Поддерживаемые форматы: PDF, JPG, PNG</p>
                                </div>
                            )}

                            {verificationStatus === 'pending' && (
                                <div className="verification-status pending">
                                    <p>⏳ Документ на проверке</p>
                                    {documentUrl && (
                                        <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                                            Просмотреть загруженный документ
                                        </a>
                                    )}
                                </div>
                            )}

                            {verificationStatus === 'approved' && (
                                <div className="verification-status approved">
                                    <p>✅ Квалификация подтверждена</p>
                                    {verificationDetails && (
                                        <div className="verification-details">
                                            <p>Проверено: {new Date(verificationDetails.updated_at).toLocaleDateString()}</p>
                                            {verificationDetails.verified_by && (
                                                <p>Администратор: {verificationDetails.verified_by}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {verificationStatus === 'rejected' && (
                                <div className="verification-status rejected">
                                    <p>❌ Документ отклонен</p>
                                    <button
                                        className="retry-button"
                                        onClick={() => document.getElementById('document-upload').click()}
                                    >
                                        Загрузить новый документ
                                    </button>
                                </div>
                            )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;