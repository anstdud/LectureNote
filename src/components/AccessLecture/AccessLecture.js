import React, { useState } from 'react';

const AccessLecture = ({ onLectureAccess }) => {
    const [code, setCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Необходимо авторизоваться');
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
            onLectureAccess(data); // Вызов функции onLectureAccess
        } catch (error) {
            alert(error.message || 'Неверный код или срок действия истек');
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