import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import Logo from '../img/logo.svg';
import Profile from '../img/profile.svg';

const Header = ({ setIsAuthenticated }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState(null);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Получаем имя пользователя из localStorage при загрузке компонента
    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || null);
    }, [setIsAuthenticated]); // Теперь username обновится при изменении isAuthenticated


    const handleToggleMenu = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleClickOutside = (event) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target) &&
            buttonRef.current &&
            !buttonRef.current.contains(event.target)
        ) {
            setIsDropdownOpen(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
    };

    // Закрываем меню, если клик вне его
    // useEffect(() => {
    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);

    return (
        <header className="header">
            <nav className="navbar" aria-label="Main">
                <div className="navbar-logo">
                    <img className="navbar-logo__img" src={Logo} alt="Логотип" />
                    <a href="#" className="navbar-logo__a">LectureNote</a>
                </div>
                <div className="navbar-button">
                    <button className="navbar-profile" ref={buttonRef} onClick={handleToggleMenu}>
                        <img src={Profile} className="navbar-profile__img" alt="Фото профиля" />
                    </button>
                    {isDropdownOpen && (
                        <ul ref={dropdownRef} className="dropdown-menu">
                            <li><a href="#">{username || "Пользователь"}</a></li>
                            <li><a href="#" onClick={handleLogout}>Выйти</a></li>
                        </ul>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
