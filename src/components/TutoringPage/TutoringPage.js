import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TutoringPage.css';

const TutoringPage = ({ userRole }) => {
    const [tutors, setTutors] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [studentBookings, setStudentBookings] = useState([]);
    const [selectedDateTime, setSelectedDateTime] = useState('');
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [subject, setSubject] = useState('');
    const [price, setPrice] = useState('');
    const [fullName, setFullName] = useState('');
    const [isProfileCreated, setIsProfileCreated] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [availableDays, setAvailableDays] = useState([]);
    const [availableTime, setAvailableTime] = useState({ start: '09:00', end: '18:00' });
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [isRefreshingBookings, setIsRefreshingBookings] = useState(false);
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const daysOrder = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const russianShortWeekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    const refreshBookings = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setIsRefreshingBookings(true);
        setError(null);

        try {
            if (userRole === 'student') {
                const response = await fetch(`http://localhost:5001/api/student/bookings?t=${Date.now()}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) throw new Error('Ошибка при загрузке бронирований');
                const data = await response.json();
                setStudentBookings(data);
            } else {
                const response = await fetch(`http://localhost:5001/api/tutoring?t=${Date.now()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Ошибка при загрузке данных');
                const data = await response.json();
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setError('Ошибка при обновлении записей');
        } finally {
            setIsRefreshingBookings(false);
        }
    }, [userRole, navigate]);

    const formatShortWeekday = (locale, date) => {
        return russianShortWeekdays[date.getDay()];
    };

    const formatDay = (locale, date) => {
        return date.getDate().toString();
    };

    const showCustomAlert = (message, isError = false) => {
        const alert = document.createElement('div');
        alert.className = `custom-alert ${isError ? 'error' : 'success'}`;
        alert.innerHTML = `
            <span class="alert-icon">${isError ? '⚠️' : '✅'}</span>
            ${message}
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    };

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (userRole === 'student') {
                const [tutorsResponse, bookingsResponse] = await Promise.all([
                    fetch(`http://localhost:5001/api/tutors?t=${Date.now()}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`http://localhost:5001/api/student/bookings?t=${Date.now()}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ]);

                if (!tutorsResponse.ok) throw new Error('Ошибка при загрузке анкет преподавателей');
                if (!bookingsResponse.ok) throw new Error('Ошибка при загрузке бронирований');

                const [tutorsData, bookingsData] = await Promise.all([
                    tutorsResponse.json(),
                    bookingsResponse.json()
                ]);

                setTutors(tutorsData);
                setStudentBookings(bookingsData);
            } else {
                const response = await fetch(`http://localhost:5001/api/tutoring?t=${Date.now()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Ошибка при загрузке данных');

                const data = await response.json();

                setBookings(data.bookings || []);

                if (data.tutorData) {
                    setIsProfileCreated(true);
                    setSubject(data.tutorData.subject || '');
                    setPrice(data.tutorData.price || '');
                    setFullName(data.tutorData.fullName || '');
                    setAdditionalInfo(data.tutorData.additionalInfo ?? '');
                    setAvailableDays(data.tutorData.availableDays || []);
                    setAvailableTime(data.tutorData.availableTime || {
                        start: '09:00',
                        end: '18:00'
                    });
                } else {
                    console.log('Профиль преподавателя не найден');
                    setIsProfileCreated(false);
                    setSubject('');
                    setPrice('');
                    setFullName('');
                    setAdditionalInfo('');
                    setAvailableDays([]);
                    setAvailableTime({ start: '09:00', end: '18:00' });
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setError('Ошибка при загрузке данных');
        } finally {
            setIsLoading(false);
        }
    }, [userRole, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isDayBooked = (date) => {
        if (!bookings || !Array.isArray(bookings)) return false;
        return bookings.some(booking => {
            const bookingDate = new Date(booking.datetime);
            return bookingDate.toDateString() === date.toDateString();
        });
    };

    const handleProfileSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Токен отсутствует');
            }

            const bodyData = {
                fullName,
                subject,
                price: Number(price),
                availableDays,
                availableTime,
                additionalInfo: additionalInfo || ''
            };

            console.log('Отправляемые данные:', bodyData);

            const response = await fetch('http://localhost:5001/api/tutor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Ошибка сервера');
            }

            const updatedProfile = await response.json();
            console.log('Обновленный профиль с сервера:', updatedProfile);

            setIsProfileCreated(true);
            setIsEditing(false);
            setSubject(updatedProfile.subject || '');
            setPrice(updatedProfile.price || '');
            setFullName(updatedProfile.fullName || '');
            setAdditionalInfo(updatedProfile.additionalInfo || '');
            setAvailableDays(updatedProfile.availableDays || []);
            setAvailableTime(updatedProfile.availableTime || { start: '09:00', end: '18:00' });

            showCustomAlert('Анкета успешно сохранена!');
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert(error.message || 'Ошибка операции', true);
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить анкету?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/tutor', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Ошибка удаления профиля');

            setIsProfileCreated(false);
            setSubject('');
            setPrice('');
            setFullName('');
            setAdditionalInfo('');
            setAvailableDays([]);
            setAvailableTime({ start: '09:00', end: '18:00' });
            showCustomAlert('Анкета успешно удалена!');
            await fetchData();
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert('Ошибка при удалении анкеты', true);
        }
    };

    const handleBooking = async (tutorId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (!selectedDateTime) {
                throw new Error('Время не выбрано');
            }

            const selectedDate = calendarDate.toLocaleDateString('en-CA');
            const datetime = `${selectedDate}T${selectedDateTime}:00`;

            if (!isTimeSlotAvailable(selectedDateTime)) {
                throw new Error('Это время уже занято');
            }

            const response = await fetch('http://localhost:5001/api/tutoring', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ tutorId, datetime }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Ошибка при планировании занятия');
            }

            showCustomAlert('Занятие успешно запланировано!');
            await fetchData();
            setSelectedTutor(null);
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert(error.message, true);
        }
    };

    const isTimeSlotAvailable = (time) => {
        try {
            if (!time || !selectedTutor || !isDayAvailable(calendarDate)) return false;

            const selectedTime = new Date(`1970-01-01T${time}:00`);
            const startTime = new Date(`1970-01-01T${selectedTutor.availableTime.start}:00`);
            const endTime = new Date(`1970-01-01T${selectedTutor.availableTime.end}:00`);

            if (selectedTime < startTime || selectedTime > endTime) return false;

            const selectedDate = calendarDate.toLocaleDateString('en-CA');
            const selectedDateTime = new Date(`${selectedDate}T${time}:00`).toISOString();

            return !bookings.some(booking => {
                const bookingDateTime = new Date(booking.datetime).toISOString();
                return bookingDateTime === selectedDateTime;
            });
        } catch (error) {
            console.error('Ошибка в isTimeSlotAvailable:', error);
            return false;
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Ошибка при отмене занятия');

            showCustomAlert('Занятие успешно отменено!');
            await fetchData();
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert('Ошибка при отмене занятия', true);
        }
    };

    const isDayAvailable = (date) => {
        if (!selectedTutor || !selectedTutor.availableDays) return false;

        const dayIndex = date.getDay();
        const currentDay = daysOfWeek[dayIndex];

        return selectedTutor.availableDays.includes(currentDay);
    };

    const sortedAvailableDays = (days) => {
        return daysOrder.filter(day => days.includes(day));
    };

    if (isLoading) {
        return (
            <div className="tutoring-container">
                <h2>Репетиторство</h2>
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Загрузка данных...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tutoring-container">
                <h2>Репетиторство</h2>
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button
                        className="retry-button"
                        onClick={fetchData}
                    >
                        Повторить попытку
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="tutoring-container">
            <h2>Репетиторство</h2>
            {userRole === 'student' ? (
                <div className="student-two-column-layout">
                    <div className="tutors-column">
                        <h3>Преподаватели</h3>
                        <div className="tutors-list">
                            {tutors.map(tutor => (
                                <div key={tutor.id} className="tutor-card">
                                    <div className="tutor-card-header">
                                        <h4>{tutor.fullName}</h4>
                                        <span className="tutor-price">{tutor.price} руб./час</span>
                                    </div>
                                    <div className="tutor-card-body">
                                        <p className="tutor-subject"><strong>Предмет:</strong> {tutor.subject}</p>
                                        <p className="tutor-availability">
                                            <strong>Доступные
                                                дни:</strong> {sortedAvailableDays(tutor.availableDays).join(', ')}
                                        </p>
                                        <p className="tutor-time">
                                            <strong>Время:</strong> {tutor.availableTime.start} - {tutor.availableTime.end}
                                        </p>
                                        {tutor.additionalInfo && (
                                            <div className="tutor-additional-info">
                                                <strong>Дополнительно:</strong> {tutor.additionalInfo}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="schedule-button"
                                        onClick={() => setSelectedTutor(tutor)}
                                    >
                                        Запланировать занятие
                                    </button>
                                </div>
                            ))}
                        </div>

                        {selectedTutor && (
                            <div className="booking-modal">
                                <div className="modal-content">
                                    <h3>Запланировать занятие с {selectedTutor.fullName}</h3>
                                    <div className="calendar-section">
                                        <Calendar
                                            minDate={new Date()}
                                            onChange={setCalendarDate}
                                            value={calendarDate}
                                            className="custom-calendar"
                                            tileDisabled={({date}) => !isDayAvailable(date)}
                                            formatShortWeekday={formatShortWeekday}
                                            formatDay={formatDay}
                                            locale="ru-RU"
                                            calendarType="gregory"
                                        />
                                    </div>

                                    <div className="time-selection">
                                        <label>Выберите время:</label>
                                        <input
                                            type="time"
                                            value={selectedDateTime}
                                            onChange={e => {
                                                const time = e.target.value;
                                                if (time && isTimeSlotAvailable(time)) {
                                                    setSelectedDateTime(time);
                                                }
                                            }}
                                            className="time-input"
                                            min={selectedTutor.availableTime.start}
                                            max={selectedTutor.availableTime.end}
                                            disabled={!isDayAvailable(calendarDate)}
                                        />
                                    </div>

                                    <div className="modal-actions">
                                        <button
                                            className="close-modal-button"
                                            onClick={() => setSelectedTutor(null)}
                                        >
                                            Закрыть
                                        </button>
                                        <button
                                            className="confirm-button"
                                            onClick={() => handleBooking(selectedTutor.id)}
                                            disabled={!selectedDateTime}
                                        >
                                            Подтвердить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bookings-column">
                        <div className="bookings-header">
                            <h3>Мои занятия</h3>
                            <div className="bookings-header-right">
                                <div className="bookings-count">
                                    {studentBookings.length} запланировано
                                </div>
                                <button
                                    className="refresh-button"
                                    onClick={refreshBookings}
                                    disabled={isRefreshingBookings}
                                    title="Обновить список занятий"
                                >
                                    <svg
                                        className={`refresh-icon ${isRefreshingBookings ? 'spinning' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#548B74"
                                    >
                                        <path
                                            d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="bookings-list-container">
                            {studentBookings.length > 0 ? (
                                <div className="bookings-list">
                                    {studentBookings
                                        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                                        .map(booking => (
                                            <div key={booking.id} className="booking-item">
                                                <div className="booking-main-info">
                                                    <div className="booking-tutor">
                                                        <strong>{booking.tutorName}</strong>
                                                    </div>
                                                    <div className="booking-subject">
                                                        {booking.subject}
                                                    </div>
                                                </div>

                                                <div className="booking-datetime">
                                                    {new Date(booking.datetime).toLocaleString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>

                                                <button
                                                    className="cancel-booking-button"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                >
                                                    Отменить
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="no-bookings">
                                    <div className="no-bookings-icon">📅</div>
                                    <h4>Нет запланированных занятий</h4>
                                    <p>Выберите преподавателя слева, чтобы запланировать занятие</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="teacher-view">
                    <div className="teacher-profile">
                        {isProfileCreated && !isEditing ? (
                            <div className="profile-view">
                                <h3>Мой профиль преподавателя</h3>

                                <div className="profile-info">
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">ФИО</span>
                                        <span className="profile-info-value">{fullName}</span>
                                    </div>

                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Предмет</span>
                                        <span className="profile-info-value">{subject}</span>
                                    </div>

                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Цена за час</span>
                                        <span className="profile-info-value">{price} руб.</span>
                                    </div>
                                </div>

                                {additionalInfo && additionalInfo.trim() !== '' && (
                                    <div className="additional-info-section">
                                        <h4>Дополнительная информация</h4>
                                        <p className="additional-info-content">{additionalInfo}</p>
                                    </div>
                                )}

                                <div className="availability-section">
                                    <h4>Доступные дни</h4>
                                    <div className="available-days-display">
                                        {sortedAvailableDays(availableDays).map(day => (
                                            <span key={day} className="day-pill">{day}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="availability-section">
                                    <h4>Время занятий</h4>
                                    <div className="time-range">
                                        <span>с {availableTime.start} до {availableTime.end}</span>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button className="edit-button" onClick={() => setIsEditing(true)}>
                                        <span>Изменить анкету</span>
                                    </button>
                                    <button className="delete-button" onClick={handleDeleteProfile}>
                                        <span>Удалить анкету</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="edit-profile-form">
                                    <div className="edit-profile-header">
                                        <h3>{isProfileCreated ? 'Редактирование профиля' : 'Создание профиля преподавателя'}</h3>
                                    </div>

                                    <div className="form-group">
                                        <label>ФИО</label>
                                        <input
                                            type="text"
                                            placeholder="Иванов Иван Иванович"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Предмет</label>
                                        <input
                                            type="text"
                                            placeholder="Математика, Физика и т.д."
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Цена за час (руб.)</label>
                                        <input
                                            type="number"
                                            placeholder="Например: 1500"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Дополнительная информация</label>
                                        <textarea
                                            value={additionalInfo}
                                            onChange={(e) => setAdditionalInfo(e.target.value)}
                                            placeholder="Опыт работы, методика преподавания, образование..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Доступные дни</label>
                                        <div className="days-checkbox-grid">
                                            {daysOrder.map((day) => (
                                                <div key={day} className="day-checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`day-${day}`}
                                                        checked={availableDays.includes(day)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setAvailableDays([...availableDays, day]);
                                                            } else {
                                                                setAvailableDays(availableDays.filter((d) => d !== day));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={`day-${day}`}>{day}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Время занятий</label>
                                        <div className="time-range-container">
                                            <div className="time-input-group">
                                                <label htmlFor="start-time">С</label>
                                                <input
                                                    id="start-time"
                                                    type="time"
                                                    value={availableTime.start}
                                                    onChange={(e) => setAvailableTime({
                                                        ...availableTime,
                                                        start: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className="time-input-group">
                                                <label htmlFor="end-time">До</label>
                                                <input
                                                    id="end-time"
                                                    type="time"
                                                    value={availableTime.end}
                                                    onChange={(e) => setAvailableTime({
                                                        ...availableTime,
                                                        end: e.target.value
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="close-form-button"
                                            onClick={() => setIsEditing(false)}
                                            type="button"
                                        >
                                            Закрыть
                                        </button>
                                        <button
                                            className="submit-button"
                                            onClick={handleProfileSubmit}
                                        >
                                            {isProfileCreated ? 'Сохранить изменения' : 'Создать анкету'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="teacher-calendar">
                        <div className="calendar-header">
                            <h3>Запланированные занятия</h3>
                            <div className="calendar-header-right">
                                <div className="calendar-legend">
                                    <div className="legend-item">
                                        <div className="legend-marker booked"></div>
                                        <span>Занято</span>
                                    </div>
                                </div>
                                <button
                                    className="refresh-button"
                                    onClick={refreshBookings}
                                    disabled={isRefreshingBookings}
                                    title="Обновить список занятий"
                                >
                                    <svg
                                        className={`refresh-icon ${isRefreshingBookings ? 'spinning' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#548B74"
                                    >
                                        <path
                                            d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="calendar-container">
                            <div className="calendar-wrapper">
                                <Calendar
                                    minDate={new Date()}
                                    onChange={setCalendarDate}
                                    value={calendarDate}
                                    className="custom-calendar"
                                    tileContent={({date, view}) =>
                                        view === 'month' && isDayBooked(date) && (
                                            <div className="booking-marker"/>
                                        )
                                    }
                                    formatShortWeekday={formatShortWeekday}
                                    formatDay={formatDay}
                                    locale="ru-RU"
                                    calendarType="gregory"
                                />
                            </div>

                            <div className="bookings-list-container">
                                <div className="bookings-list">
                                    {bookings.length > 0 ? (
                                        bookings
                                            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                                            .map(booking => (
                                                <div key={booking.id} className="booking-item">
                                                    <div className="booking-details">
                                                        <p className="booking-student">
                                                            <strong>Студент:</strong> {booking.username}
                                                        </p>
                                                        <p className="booking-time">
                                                            <strong>Дата и
                                                                время:</strong> {new Date(booking.datetime).toLocaleString('ru-RU', {
                                                            day: 'numeric',
                                                            month: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        </p>
                                                    </div>
                                                    <button
                                                        className="cancel-booking-button"
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                    >
                                                        Отменить
                                                    </button>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="no-bookings">Нет запланированных занятий</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutoringPage;