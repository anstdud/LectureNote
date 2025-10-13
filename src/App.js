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
  import AdminPanel from "./components/AdminPanel/AdminPanel.js";
  // import 'normalize.css';

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
    const [userRole, setUserRole] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false); // Добавляем отдельное состояние для модалки

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
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const username = payload.username;
          const role = payload.role;
          const exp = payload.exp;

          if (exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            setIsAuthenticated(false);
            return;
          }

          localStorage.setItem('username', username);
          localStorage.setItem('role', role);
          setUserRole(role);
        } catch (error) {
          console.error('Ошибка декодирования токена:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
    }, [isAuthenticated, setUserRole, setIsAuthenticated]);

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
      const role = localStorage.getItem('role');

      if (!token || role === 'admin') {
        setLectures([]);
        setFilteredLectures([]);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5001/api/lectures?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 403) {
          return;
        }

        if (!response.ok) {
          throw new Error('Ошибка при загрузке лекций');
        }

        const data = await response.json();
        const lecturesData = Array.isArray(data) ? data : [];
        setLectures(lecturesData);
        setFilteredLectures(lecturesData);
      } catch (error) {
        console.error('Ошибка:', error);
        setLectures([]);
        setFilteredLectures([]);
      }
    }, []);

    useEffect(() => {
      const role = localStorage.getItem('role');
      if (isAuthenticated && role !== 'admin') {
        fetchLectures();
      }
    }, [isAuthenticated, fetchLectures]);

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem('token');

        if (!token) {
          setUserRole('');
          return;
        }

        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isTokenValid = payload.exp * 1000 > Date.now();

          if (!isTokenValid) {
            localStorage.removeItem('token');
            setUserRole('');
            return;
          }

          setUserRole(payload.role || '');

        } catch (error) {
          console.error('Ошибка:', error);
          localStorage.removeItem('token');
          setUserRole('');
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
      setCurrentLecture(null);
      setIsModalOpen(false);
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

        if (currentLecture?.id === id) {
          setCurrentLecture(null);
          closeModal();
        }
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

    const ProtectedRoute = ({ children, isAuthenticated, allowedRoles }) => {
      const location = useLocation();
      const userRole = localStorage.getItem('role');

      if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
      }

      if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
      }

      return children;
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
                      username={localStorage.getItem('username') || ''}
                  />
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    {userRole === 'admin' ? (
                        <AdminPanel />
                    ) : (
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
                                isOpen={isModalOpen}
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
                    )}
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
                      username={localStorage.getItem('username') || ''}
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
                      username={localStorage.getItem('username') || ''}
                  />
                  <ProtectedRoute isAuthenticated={isAuthenticated} allowedRoles={['student', 'teacher', 'admin']}>
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