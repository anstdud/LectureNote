import React from 'react';
import './LectureList.css';
import Book from '../img/book.svg';
import * as mammoth from 'mammoth';
import PropTypes from 'prop-types';

const LectureList = ({
                         lectures,
                         openModal,
                         deleteLecture,
                         fetchLectures,
                         isSearching,
                         generateShareCode
                     }) => {
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith('.txt') && !file.name.endsWith('.docx')) {
                alert('Пожалуйста, загрузите файл в формате .txt или .docx');
                return;
            }

            const isDocx = file.name.endsWith('.docx');

            if (isDocx) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target.result;
                    try {
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        const content = result.value;
                        const title = file.name.replace(/\.[^/.]+$/, "");
                        const text = content;

                        const token = localStorage.getItem('token');
                        if (!token) {
                            alert('Необходимо войти в систему');
                            return;
                        }

                        const response = await fetch('http://localhost:5001/api/lectures', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ title, text }),
                        });

                        if (!response.ok) throw new Error('Ошибка при сохранении лекции');
                        fetchLectures();
                    } catch (err) {
                        console.error('Ошибка при чтении DOCX:', err);
                        alert('Не удалось прочитать файл DOCX');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const content = e.target.result;
                    const title = file.name.replace(/\.[^/.]+$/, "");
                    const text = content;

                    const token = localStorage.getItem('token');
                    if (!token) {
                        alert('Необходимо войти в систему');
                        return;
                    }

                    const response = await fetch('http://localhost:5001/api/lectures', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ title, text }),
                    });

                    if (!response.ok) throw new Error('Ошибка при сохранении лекции');
                    fetchLectures();
                };
                reader.readAsText(file);
            }
        }
    };

    return (
        <div className="lectures-list">
            {!isSearching && (
                <>
                    <button
                        className="lecture-item lectures-btn-import"
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <span className="circle-icon">↑</span> Импорт из файла
                    </button>
                    <button
                        className="lecture-item lectures-btn-create"
                        onClick={() => openModal(null)}
                    >
                        <span className="circle-icon">+</span> Создать новую запись
                    </button>
                </>
            )}
            <input
                id="fileInput"
                type="file"
                style={{display: 'none'}}
                onChange={handleFileUpload}
                accept=".txt,.docx"
            />

            {lectures.map((lecture, index) => (
                <div key={index} className="lecture-item">
                    <button
                        onClick={() => openModal(lecture)}
                        className="lecture-item-btn lecture-item">
                        <span className="circle-icon">
                            <img src={Book} alt="Значок книжки"/>
                        </span>
                        {lecture.title}
                    </button>
                    <div className="lecture-actions">
                        <button
                            className="lecture-item-share"
                            onClick={() => generateShareCode(lecture.id)}
                        >
                            Поделиться
                        </button>
                        <button
                            className="lecture-item-delete"
                            onClick={() => deleteLecture(lecture.id)}
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

LectureList.propTypes = {
    lectures: PropTypes.array.isRequired,
    openModal: PropTypes.func.isRequired,
    deleteLecture: PropTypes.func.isRequired,
    fetchLectures: PropTypes.func.isRequired,
    isSearching: PropTypes.bool.isRequired,
    generateShareCode: PropTypes.func.isRequired,
};

export default LectureList;