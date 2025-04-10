import React, { useState, useRef, useEffect, useCallback } from 'react';
import './LectureList.css';
import Book from '../img/book.svg';
import * as mammoth from 'mammoth';
import PropTypes from 'prop-types';

const LectureList = ({ lectures, openModal, deleteLecture, fetchLectures, isSearching, generateShareCode }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRefs = useRef({});

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.txt') && !file.name.endsWith('.docx')) {
            alert('Допустимы только .txt и .docx файлы');
            return;
        }

        try {
            const content = await (file.name.endsWith('.docx')
                ? mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }).then(r => r.value)
                : file.text());

            const token = localStorage.getItem('token');
            if (!token) {
                alert('Требуется авторизация');
                return;
            }

            await fetch('http://localhost:5001/api/lectures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: file.name.replace(/\.[^.]+$/, ''),
                    text: content
                }),
            });

            await fetchLectures();
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка загрузки файла');
        }
    };

    const handleMenuToggle = (lectureId, e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(prev => prev === lectureId ? null : lectureId);
    };

    const handleClickOutside = useCallback((e) => {
        if (openMenuId !== null && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(e.target)) {
            setOpenMenuId(null);
        }
    }, [openMenuId]);

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [handleClickOutside]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteLecture(id);
            setOpenMenuId(null);
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    return (
        <div className="lectures-list">
            {!isSearching && (
                <div className="list-controls">
                    <button
                        className="lectures-btn-import"
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <span className="circle-icon">↑</span> Импорт из файла
                    </button>
                    <button
                        className="lectures-btn-create"
                        onClick={() => openModal(null)}
                    >
                        <span className="circle-icon">+</span> Создать запись
                    </button>
                </div>
            )}
            <input
                id="fileInput"
                type="file"
                hidden
                onChange={handleFileUpload}
                accept=".txt,.docx"
            />

            {lectures.map(lecture => (
                <div
                    key={lecture.id}
                    className="lecture-item"
                    onClick={() => openModal(lecture)}
                >
                    <div className="lecture-item-content">
                        <span className="circle-icon">
                            <img src={Book} alt="Книга" />
                        </span>
                        {lecture.title}
                    </div>

                    <div className="lecture-actions">
                        <button
                            className="menu-toggle"
                            onClick={(e) => handleMenuToggle(lecture.id, e)}
                            aria-label="Меню"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="12" cy="5" r="1"/>
                                <circle cx="12" cy="19" r="1"/>
                            </svg>
                        </button>

                        <div
                            ref={el => menuRefs.current[lecture.id] = el}
                            className={`dropdown-menu ${openMenuId === lecture.id ? 'open' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="menu-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    generateShareCode(lecture.id);
                                    setOpenMenuId(null);
                                }}
                            >
                                Поделиться
                            </button>
                            <button
                                className="menu-item"
                                onClick={(e) => handleDelete(e, lecture.id)}
                            >
                                Удалить
                            </button>
                        </div>
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