import React, { useState, useEffect } from 'react';
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

    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const daysOrder = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const russianShortWeekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    const formatShortWeekday = (locale, date) => {
        return russianShortWeekdays[date.getDay()];
    };

    const formatDay = (locale, date) => {
        return date.getDate().toString();
    };

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                if (userRole === 'student') {
                    const [tutorsResponse, bookingsResponse] = await Promise.all([
                        fetch('http://localhost:5001/api/tutors', {
                            headers: { 'Authorization': `Bearer ${token}` },
                        }),
                        fetch('http://localhost:5001/api/student/bookings', {
                            headers: { 'Authorization': `Bearer ${token}` },
                        }).catch(err => {
                            console.error('Network error:', err);
                            return { ok: false, status: 500 };
                        })
                    ]);

                    if (!tutorsResponse.ok) {
                        throw new Error('Ошибка при загрузке анкет преподавателей');
                    }

                    const tutorsData = await tutorsResponse.json();
                    setTutors(tutorsData);

                    if (bookingsResponse.ok) {
                        const bookingsData = await bookingsResponse.json();
                        console.log('Полученные бронирования студента:', bookingsData);
                        setStudentBookings(bookingsData);
                    } else {
                        console.error('Ошибка загрузки бронирований:', bookingsResponse.status, bookingsResponse.statusText);
                        showCustomAlert('Ошибка при загрузке ваших занятий', true);
                        setStudentBookings([]);
                    }
                } else {
                    const [tutoringResponse, tutorProfile] = await Promise.all([
                        fetch('http://localhost:5001/api/tutoring', {  // Изменено с /api/bookings на /api/tutoring
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch('http://localhost:5001/api/tutor', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);

                    if (tutoringResponse.ok) {
                        const bookingsData = await tutoringResponse.json();
                        console.log('Полученные бронирования преподавателя:', bookingsData);
                        setBookings(bookingsData);
                    } else {
                        console.error('Ошибка загрузки бронирований преподавателя:', tutoringResponse.status);
                    }

                    if (tutorProfile.ok) {
                        const tutorData = await tutorProfile.json();
                        setIsProfileCreated(!!tutorData.subject);
                        setSubject(tutorData.subject || '');
                        setPrice(tutorData.price || '');
                        setFullName(tutorData.fullName || '');
                        setAvailableDays(tutorData.availableDays || []);
                        setAvailableTime(tutorData.availableTime || {
                            start: '09:00',
                            end: '18:00'
                        });
                    }
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showCustomAlert('Ошибка при загрузке данных', true);
                setStudentBookings([]);
            }
        };
        fetchData();
    }, [userRole, navigate])

    const isDayBooked = (date) => {
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

            const method = 'POST';
            const url = 'http://localhost:5001/api/tutor';

            const bodyData = {
                fullName,
                subject,
                price: Number(price),
                availableDays,
                availableTime
            };

            const response = await fetch(url, {
                method,
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

            setIsProfileCreated(true);
            setIsEditing(false);
            showCustomAlert(`Анкета успешно ${isProfileCreated ? 'обновлена' : 'создана'}!`);
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
            setAvailableDays([]);
            setAvailableTime({ start: '09:00', end: '18:00' });
            showCustomAlert('Анкета успешно удалена!');
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

            try {
                const bookingsResponse = await fetch('http://localhost:5001/api/student/bookings', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (bookingsResponse.ok) {
                    const bookingsData = await bookingsResponse.json();
                    setStudentBookings(bookingsData);
                } else {
                    console.error('Ошибка обновления списка бронирований:', bookingsResponse.status);
                }
            } catch (error) {
                console.error('Ошибка при обновлении списка бронирований:', error);
            }

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

    const handleCancelBooking = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Ошибка при отмене занятия');

            if (userRole === 'student') {
                const updatedBookings = studentBookings.filter(booking => booking.id !== bookingId);
                setStudentBookings(updatedBookings);
            } else {
                const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
                setBookings(updatedBookings);
            }

            showCustomAlert('Занятие успешно отменено!');
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
                                            <strong>Доступные дни:</strong> {sortedAvailableDays(tutor.availableDays).join(', ')}
                                        </p>
                                        <p className="tutor-time">
                                            <strong>Время:</strong> {tutor.availableTime.start} - {tutor.availableTime.end}
                                        </p>
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
                                    <button
                                        className="close-modal"
                                        onClick={() => setSelectedTutor(null)}
                                    >
                                        &times;
                                    </button>

                                    <div className="calendar-section">
                                        <Calendar
                                            minDate={new Date()}
                                            onChange={setCalendarDate}
                                            value={calendarDate}
                                            className="custom-calendar"
                                            tileDisabled={({ date }) => !isDayAvailable(date)}
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
                            <div className="bookings-count">
                                {studentBookings.length} запланировано
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
                                <h3>Мой профиль преподавателя</h3>
                                <input
                                    type="text"
                                    placeholder="ФИО"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Предмет"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Цена за час"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                                <div className="available-days-container">
                                    <label>Доступные дни:</label>
                                    {daysOrder.map(day => (
                                        <label key={day}>
                                            <input
                                                type="checkbox"
                                                checked={availableDays.includes(day)}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setAvailableDays([...availableDays, day]);
                                                    } else {
                                                        setAvailableDays(availableDays.filter(d => d !== day));
                                                    }
                                                }}
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                                <div>
                                    <label>Время занятий:</label>
                                    <input
                                        type="time"
                                        value={availableTime.start}
                                        onChange={e => setAvailableTime({...availableTime, start: e.target.value})}
                                    />
                                    <input
                                        type="time"
                                        value={availableTime.end}
                                        onChange={e => setAvailableTime({...availableTime, end: e.target.value})}
                                    />
                                </div>
                                <button className="submit-button" onClick={handleProfileSubmit}>
                                    {isProfileCreated ? 'Обновить данные' : 'Создать анкету'}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="teacher-calendar">
                        <div className="calendar-header">
                            <h3>Запланированные занятия</h3>
                            <div className="calendar-legend">
                                <div className="legend-item">
                                    <div className="legend-marker booked"></div>
                                    <span>Занято</span>
                                </div>
                            </div>
                        </div>

                        <div className="calendar-container">
                            <div className="calendar-wrapper">
                                <Calendar
                                    minDate={new Date()}
                                    onChange={setCalendarDate}
                                    value={calendarDate}
                                    className="custom-calendar"
                                    tileContent={({ date, view }) =>
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
                                                            <strong>Дата и время:</strong> {new Date(booking.datetime).toLocaleString('ru-RU', {
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