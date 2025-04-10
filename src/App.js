import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header/Header.js';
import Modal from './components/Modal/Modal.js';
import LectureList from './components/LectureList/LectureList.js';
import AuthModal from './components/AuthModal/AuthModal.js';
import CodeModal from './components/CodeModal/CodeModal.js';
import SuccessModal from './components/SuccessModal/SuccessModal.js';
import ProfilePage from './components/ProfilePage/ProfilePage.js';
import TutoringPage from './components/TutoringPage/TutoringPage.js';
import './App.css';

const ProtectedRoute = ({ children, isAuthenticated }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  const [lectures, setLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');

      if (token) {
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));

          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setIsAuthenticated(false);
            return;
          }

          setUserRole(decoded.role);
          setIsAuthenticated(true);

          if (decoded.role !== storedRole) {
            localStorage.setItem('role', decoded.role);
          }

          if (decoded.username) {
            localStorage.setItem('username', decoded.username);
          }

        } catch (error) {
          console.error('Ошибка декодирования токена:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setIsAuthenticated(false);
        }
      } else {
        localStorage.removeItem('role');
        setIsAuthenticated(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));

        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          return;
        }

        setUserRole(decoded.role);
        setIsAuthenticated(true);

        if (decoded.role !== storedRole) {
          localStorage.setItem('role', decoded.role);
        }

        if (decoded.username) {
          localStorage.setItem('username', decoded.username);
        }

      } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      }
    } else {
      localStorage.removeItem('role');
    }
  }, []);

  const fetchLectures = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/lectures?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setIsAuthenticated(false);
        return;
      }

      const data = await response.json();
      setLectures(data);
      setFilteredLectures(data);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setUserRole('');
        setIsAuthChecked(true);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isTokenValid = payload.exp * 1000 > Date.now();

        if (!isTokenValid) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUserRole('');
          setIsAuthChecked(true);
          return;
        }

        setIsAuthenticated(true);
        setUserRole(payload.role || '');
        setIsAuthChecked(true);

      } catch (error) {
        console.error('Ошибка:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserRole('');
        setIsAuthChecked(true);
      }
    };

    checkAuth();

    const interval = setInterval(checkAuth, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchLectures();
  }, [isAuthenticated, fetchLectures]);

  const openModal = (lecture = null) => {
    setCurrentLecture(lecture);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLecture(null);
  };

  const saveLecture = async (lectureData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const url = currentLecture
          ? `http://localhost:5001/api/lectures/${currentLecture.id}`
          : 'http://localhost:5001/api/lectures';

      const response = await fetch(url, {
        method: currentLecture ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(lectureData),
      });

      if (!response.ok) throw new Error('Ошибка при сохранении лекции');

      await fetchLectures();
      closeModal();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении лекции');
    }
  };

  const deleteLecture = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/lectures/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка при удалении лекции');

      setLectures(prev => prev.filter(l => l.id !== id));
      setFilteredLectures(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при удалении лекции');
    }
  };

  const handleSearch = (query) => {
    setIsSearching(!!query);
    setFilteredLectures(lectures.filter(l =>
        l.title.toLowerCase().includes(query.toLowerCase())
    ));
  };

  const generateShareCode = async (lectureId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/lectures/${lectureId}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка генерации кода');

      const { code } = await response.json();
      setGeneratedCode(code);
      setShowCodeModal(true);
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message);
    }
  };

  const handleAddByCode = async (code) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5001/api/lectures/add-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('Ошибка добавления лекции');

      await fetchLectures();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message);
    }
  };

  return (
      <Router>
        <div>
          <Routes>
            <Route path="/" element={
              <>
                <Header
                    isAuthenticated={isAuthenticated}
                    setIsAuthenticated={setIsAuthenticated}
                    onSearch={handleSearch}
                    onAddByCode={handleAddByCode}
                />
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <div className="main-content-container">
                    <LectureList
                        lectures={filteredLectures}
                        openModal={openModal}
                        deleteLecture={deleteLecture}
                        fetchLectures={fetchLectures}
                        isSearching={isSearching}
                        generateShareCode={generateShareCode}
                    />
                    <div className="editor-container">
                      <Modal
                          lecture={currentLecture}
                          saveLecture={saveLecture}
                          closeModal={closeModal}
                      />
                    </div>
                    {showCodeModal && (
                        <CodeModal
                            code={generatedCode}
                            onClose={() => setShowCodeModal(false)}
                        />
                    )}
                    {showSuccessModal && (
                        <SuccessModal onClose={() => setShowSuccessModal(false)} />
                    )}
                  </div>
                </ProtectedRoute>
              </>
            } />

            <Route path="/tutoring" element={
              <>
                <Header
                    isAuthenticated={isAuthenticated}
                    setIsAuthenticated={setIsAuthenticated}
                    onSearch={handleSearch}
                    onAddByCode={handleAddByCode}
                    isProfilePage={true}
                />
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <TutoringPage userRole={userRole} />
                </ProtectedRoute>
              </>
            } />

            <Route path="/profile" element={
              <>
                <Header
                    isAuthenticated={isAuthenticated}
                    setIsAuthenticated={setIsAuthenticated}
                    isProfilePage={true}
                    onSearch={() => {}}
                    onAddByCode={() => {}}
                />
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <ProfilePage />
                </ProtectedRoute>
              </>
            } />

            <Route path="/login" element={
              !isAuthenticated ? (
                  <AuthModal
                      setIsAuthenticated={setIsAuthenticated}
                      setUserRole={setUserRole}
                  />
              ) : (
                  <Navigate to="/" replace />
              )}
            />
          </Routes>
        </div>
      </Router>
  );
};

export default App;