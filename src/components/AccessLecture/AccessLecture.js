import React, { useState } from 'react';
import { showCustomAlert } from './Notifications/Notifications.js';

const AccessLecture = ({ onLectureAccess }) => {
    const [code, setCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showCustomAlert('Необходимо авторизоваться', true);
                return;
            }

            const response = await fetch(`http://localhost:5001/api/lectures/shared/${code}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Лекция не найдена');
            }

            const data = await response.json();
            onLectureAccess(data);
            showCustomAlert('Лекция успешно открыта!');
        } catch (error) {
            showCustomAlert(error.message || 'Неверный код или срок действия истек', true);
        }
    };

    return (
        <div className="access-form">
            <h3>Введите код доступа</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXX"
                    maxLength="6"
                />
                <button type="submit">Открыть лекцию</button>
            </form>
        </div>
    );
};

export default AccessLecture;