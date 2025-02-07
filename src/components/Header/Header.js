import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import Logo from '../img/logo.svg';

const Header = ({ setIsAuthenticated }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || null);
    }, [setIsAuthenticated]);

    const handleToggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
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
            setIsMenuOpen(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="header">
            <nav className="navbar" aria-label="Main">
                <div className="navbar-logo">
                    <img className="navbar-logo__img" src={Logo} alt="Логотип" />
                    <a href="/" className="navbar-logo__a">LectureNote</a> {/* Используйте реальный адрес */}
                </div>
                <div className="navbar-button">
                    <button
                        className="navbar-menu-toggle"
                        ref={buttonRef}
                        onClick={handleToggleMenu}
                    >
                        {isMenuOpen ? (
                            <span className="navbar-menu-toggle__icon">×</span>
                        ) : (
                            <span className="navbar-menu-toggle__icon">≡</span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <ul ref={dropdownRef} className="dropdown-menu">
                            <li><button onClick={(e) => e.preventDefault()}>{username || "Пользователь"}</button></li>
                            <li><button onClick={handleLogout}>Выйти</button></li>
                        </ul>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
