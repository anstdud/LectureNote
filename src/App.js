import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header/Header.js';
import Modal from './components/Modal/Modal.js';
import LectureList from './components/LectureList/LectureList.js';
import AuthModal from './components/AuthModal/AuthModal.js';
import CodeModal from './components/CodeModal/CodeModal.js';
import SuccessModal from './components/SuccessModal/SuccessModal.js';

const App = () => {
  const [lectures, setLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const fetchLectures = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/lectures?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Ошибка при загрузке лекций');

      const data = await response.json();
      setLectures(data);
      setFilteredLectures(data);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось загрузить лекции');
    }
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
      <div>
        <Header
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
            onSearch={handleSearch}
            onAddByCode={handleAddByCode}
        />
        {isAuthenticated ? (
            <div>
              <LectureList
                  lectures={filteredLectures}
                  openModal={openModal}
                  deleteLecture={deleteLecture}
                  fetchLectures={fetchLectures}
                  isSearching={isSearching}
                  generateShareCode={generateShareCode}
              />
              {isModalOpen && (
                  <Modal
                      lecture={currentLecture}
                      saveLecture={saveLecture}
                      closeModal={closeModal}
                  />
              )}
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
        ) : (
            <AuthModal setIsAuthenticated={setIsAuthenticated} />
        )}
      </div>
  );
};

export default App;