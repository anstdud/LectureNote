import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import Logo from '../img/logo.svg';
import PropTypes from 'prop-types';

const Header = ({ isAuthenticated, setIsAuthenticated, onSearch, onAddByCode, isProfilePage }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    const [isCodeInputOpen, setIsCodeInputOpen] = useState(false);
    const [shareCode, setShareCode] = useState('');
    const codeRef = useRef(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || '');
    }, [isAuthenticated]);

    const handleToggleMenu = (e) => {
        e.stopPropagation();
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
        navigate('/');
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

    const handleCodeClick = () => {
        setIsCodeInputOpen(prev => !prev);
        if (!isCodeInputOpen) {
            setTimeout(() => codeRef.current.focus(), 0);
        } else {
            setShareCode('');
        }
    };

    const handleCodeSubmit = async () => {
        if (shareCode.trim()) {
            await onAddByCode(shareCode.trim());
            setShareCode('');
            setIsCodeInputOpen(false);
        }
    };

    const handleCodeKeyPress = (e) => {
        if (e.key === 'Enter') handleCodeSubmit();
    };

    const handleCloseProfile = () => {
        navigate('/');
    };

    if (isProfilePage) {
        return (
            <header className="header">
                <nav className="navbar" aria-label="Main">
                    <div className="navbar-logo">
                        <img className="navbar-logo__img" src={Logo} alt="Логотип" />
                        <Link to="/" className="navbar-logo__a">LectureNote</Link>
                    </div>
                    <button
                        className="close-profile-button"
                        onClick={handleCloseProfile}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                             strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </nav>
            </header>
        );
    }

    return (
        <header className="header">
            <nav className="navbar" aria-label="Main">
                <div className="navbar-logo">
                    <img className="navbar-logo__img" src={Logo} alt="Логотип" />
                    <Link to="/" className="navbar-logo__a">LectureNote</Link>
                </div>
                {isAuthenticated && (
                    <div className="navbar-buttons">
                        <div className="search-container">
                            <button
                                className={`search-button ${isSearchOpen ? 'open' : ''}`}
                                onClick={handleSearchClick}
                            >
                                {isSearchOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                )}
                            </button>
                            <input
                                ref={searchRef}
                                type="text"
                                className={`search-input ${isSearchOpen ? 'open' : ''}`}
                                placeholder="Поиск лекций"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="code-container">
                            <button
                                className={`code-button ${isCodeInputOpen ? 'open' : ''}`}
                                onClick={handleCodeClick}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                            </button>
                            <input
                                ref={codeRef}
                                type="text"
                                className={`code-input ${isCodeInputOpen ? 'open' : ''}`}
                                placeholder="Введите код"
                                value={shareCode}
                                onChange={(e) => setShareCode(e.target.value)}
                                onKeyPress={handleCodeKeyPress}
                            />
                            {isCodeInputOpen && (
                                <button
                                    className="code-submit-button"
                                    onClick={handleCodeSubmit}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="navbar-menu">
                            <button
                                className="navbar-menu-toggle"
                                ref={buttonRef}
                                onClick={handleToggleMenu}
                            >
                                {isDropdownOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                )}
                            </button>
                            <ul ref={dropdownRef} className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
                                <li>
                                    <Link to="/profile" className="profile-link">{username}</Link>
                                </li>
                                <li>
                                    <button onClick={handleLogout}>Выйти</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

Header.propTypes = {
    isAuthenticated: PropTypes.bool.isRequired,
    setIsAuthenticated: PropTypes.func.isRequired,
    onSearch: PropTypes.func, // Делаем пропс необязательным
    onAddByCode: PropTypes.func, // Делаем пропс необязательным
    isProfilePage: PropTypes.bool,
};

export default Header;