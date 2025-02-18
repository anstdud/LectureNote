import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import Logo from '../img/logo.svg';

const Header = ({ isAuthenticated, setIsAuthenticated, onSearch }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || '');
    }, [isAuthenticated]);

    const handleToggleMenu = () => {
        setIsDropdownOpen(prev => !prev);
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

    const handleSearchClick = () => {
        setIsSearchOpen(prev => !prev);
        if (!isSearchOpen) {
            setTimeout(() => searchRef.current.focus(), 0);
        } else {
            setSearchQuery('');
            onSearch('');
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        onSearch(e.target.value);
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
                    <a href="/" className="navbar-logo__a">LectureNote</a>
                </div>
                {isAuthenticated && (
                    <div className="navbar-buttons">
                        <div className="search-container">
                            <button
                                className={`search-button ${isSearchOpen ? 'open' : ''}`}
                                onClick={handleSearchClick}
                            >
                                {isSearchOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                )}
                            </button>
                            <input
                                ref={searchRef}
                                type="text"
                                className={`search-input ${isSearchOpen ? 'open' : ''}`}
                                placeholder="Поиск лекций..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="navbar-menu">
                            <button
                                className="navbar-menu-toggle"
                                ref={buttonRef}
                                onClick={handleToggleMenu}
                            >
                                {isDropdownOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                )}
                            </button>
                            <ul ref={dropdownRef} className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
                                <li><button disabled>{username}</button></li>
                                <li><button onClick={handleLogout}>Выйти</button></li>
                            </ul>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;