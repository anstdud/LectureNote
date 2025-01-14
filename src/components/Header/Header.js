// src/components/Header.js
import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import Logo from '../img/logo.svg';
import Profile from '../img/profile.svg';

// function Header() {
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//
//     const toggleDropdown = () => {
//         setIsDropdownOpen((prev) => !prev);
//     };

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

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
            console.log("Клик за пределами меню и кнопки");
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <header className="header">
            <nav className="navbar" aria-label="Main">
                <div className="navbar-logo">
                    <img className="navbar-logo__img" src={Logo} alt="Логотип"/>
                    <a href="#" className="navbar-logo__a">LectureNote</a>
                </div>
                <div className="navbar-button">
                    <button className="navbar-profile" ref={buttonRef} onClick={handleToggleMenu}>
                        <img src={Profile} className="navbar-profile__img" alt="Фото профиля"/>
                    </button>
                    {isDropdownOpen && (
                        <ul ref={dropdownRef} className="dropdown-menu">
                            <li><a href="#">Мой профиль</a></li>
                            <li><a href="#">Настройки</a></li>
                            <li><a href="#">Выйти</a></li>
                        </ul>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;