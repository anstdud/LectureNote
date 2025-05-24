import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/admin/verification-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Ошибка загрузки');
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (requestId, status) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/admin/verify-teacher', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ requestId, status })
            });

            if (!response.ok) throw new Error('Ошибка обновления');
            await fetchRequests();
        } catch (err) {
            alert(err.message);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка: {error}</div>;

    return (
        <div className="admin-container">
            <h2>Запросы на верификацию</h2>
            <div className="requests-list">
                {requests.length === 0 ? (
                    <div className="no-requests">Нет новых запросов</div>
                ) : (
                    requests.map(request => (
                        <div key={request.id} className="request-card">
                            <div className="request-info">
                                <h3>{request.full_name}</h3>
                                <p>Предмет: {request.subject}</p>
                                <p>Пользователь: {request.username}</p>
                                <p>Email: {request.email}</p>
                                <p>Дата подачи: {new Date(request.created_at).toLocaleDateString()}</p>
                                <a
                                    href={`http://localhost:5001${request.document_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-link"
                                >
                                    Просмотреть документ
                                </a>
                            </div>
                            <div className="request-actions">
                                <button
                                    className="approve-btn"
                                    onClick={() => handleVerification(request.id, 'approved')}
                                >
                                    Подтвердить
                                </button>
                                <button
                                    className="reject-btn"
                                    onClick={() => handleVerification(request.id, 'rejected')}
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminPanel;