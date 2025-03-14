import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TutoringPage.css';

const TutoringPage = ({ userRole }) => {
    const [tutors, setTutors] = useState([]);
    const [bookings, setBookings] = useState([]);
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

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                if (userRole === 'student') {
                    const response = await fetch('http://localhost:5001/api/tutors', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (!response.ok) throw new Error('Ошибка при загрузке анкет преподавателей');

                    const data = await response.json();
                    setTutors(data);
                } else {
                    const [bookingsResponse, tutorProfile] = await Promise.all([
                        fetch('http://localhost:5001/api/bookings', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch('http://localhost:5001/api/tutor', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);

                    if (bookingsResponse.ok) {
                        const bookingsData = await bookingsResponse.json();
                        setBookings(bookingsData);
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
            }
        };
        fetchData();
    }, [userRole]);

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

            const method = isProfileCreated ? 'PUT' : 'POST';
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
            if (!selectedDateTime) throw new Error('Время не выбрано');

            const selectedDate = calendarDate.toLocaleDateString('en-CA'); // Формат: YYYY-MM-DD
            const datetime = `${selectedDate}T${selectedDateTime}:00`; // Формат: YYYY-MM-DDTHH:MM:SS

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
            navigate('/tutoring');
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert(error.message || 'Ошибка при планировании занятия', true);
        }
    };

    const isTimeSlotAvailable = (time) => {
        try {
            if (!time) return false;
            if (!isDayAvailable(calendarDate)) return false;

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
        if (!window.confirm('Вы уверены, что хотите отменить это занятие?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Ошибка при отмене занятия');
            const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
            setBookings(updatedBookings);
            showCustomAlert('Занятие успешно отменено!');
        } catch (error) {
            console.error('Ошибка:', error);
            showCustomAlert('Ошибка при отмене занятия', true);
        }
    };

    const isDayAvailable = (date) => {
        if (!selectedTutor) return false;
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        const availableDaysEnglish = selectedTutor.availableDays.map(translateDayToEnglish);
        return availableDaysEnglish.includes(dayOfWeek);
    };

    const translateDayToEnglish = (day) => {
        const daysMap = {
            'Пн': 'Mon',
            'Вт': 'Tue',
            'Ср': 'Wed',
            'Чт': 'Thu',
            'Пт': 'Fri',
            'Сб': 'Sat',
            'Вс': 'Sun'
        };
        return daysMap[day] || day;
    };

    return (
        <div className="tutoring-container">
            <h2>Репетиторство</h2>

            {userRole === 'student' ? (
                <div className="tutors-list">
                    {tutors.map(tutor => (
                        <div key={tutor.id} className="tutor-card">
                            <h3>{tutor.fullName}</h3>
                            <p>Предмет: {tutor.subject}</p>
                            <p>Цена: {tutor.price} руб./час</p>
                            <button
                                className="schedule-button"
                                onClick={() => setSelectedTutor(tutor)}
                            >
                                Запланировать занятие
                            </button>
                        </div>
                    ))}

                    {selectedTutor && (
                        <div className="booking-modal">
                            <h3>Выбрать время с {selectedTutor.fullName}</h3>
                            <p>Доступные дни: {selectedTutor.availableDays.join(', ')}</p>
                            <Calendar
                                minDate={new Date()}
                                onChange={setCalendarDate}
                                value={calendarDate}
                                className="custom-calendar"
                                tileDisabled={({ date }) => !isDayAvailable(date)}
                            />
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
                            <div className="modal-buttons">
                                <button className="confirm-button" onClick={() => handleBooking(selectedTutor.id)}>
                                    Подтвердить
                                </button>
                                <button className="cancel-button" onClick={() => setSelectedTutor(null)}>
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="teacher-view">
                    <div className="teacher-profile">
                        <h3>Мой профиль преподавателя</h3>

                        {isProfileCreated && !isEditing ? (
                            <div>
                                <p>ФИО: {fullName}</p>
                                <p>Предмет: {subject}</p>
                                <p>Цена: {price} руб./час</p>
                                <p>Доступные дни: {availableDays.join(', ')}</p>
                                <p>Время занятий: с {availableTime.start} до {availableTime.end}</p>
                                <div className="profile-actions">
                                    <button className="edit-button" onClick={() => setIsEditing(true)}>
                                        Изменить анкету
                                    </button>
                                    <button className="delete-button" onClick={handleDeleteProfile}>
                                        Удалить анкету
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
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
                        <h3>Запланированные занятия</h3>
                        <div className="calendar-container">
                            <Calendar
                                minDate={new Date()}
                                onChange={setCalendarDate}
                                value={calendarDate}
                                className="custom-calendar"
                                tileContent={({ date }) =>
                                    isDayBooked(date) && <div className="booking-marker" />
                                }
                            />
                            <div className="bookings-list">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="booking-item">
                                        <p>Студент: {booking.username}</p>
                                        <p>Дата: {new Date(booking.datetime).toLocaleDateString()}</p>
                                        <p>Время: {new Date(booking.datetime).toLocaleTimeString()}</p>
                                        <button
                                            className="cancel-booking-button"
                                            onClick={() => handleCancelBooking(booking.id)}
                                        >
                                            Отменить занятие
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutoringPage;