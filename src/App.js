import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header.js';
import Modal from './components/Modal/Modal.js';
import LectureList from './components/LectureList/LectureList.js';
import AuthModal from './components/AuthModal/AuthModal.js';

const App = () => {
  const [lectures, setLectures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLectures();
    }
  }, [isAuthenticated]);

  const openModal = (lecture = null) => {
    setCurrentLecture(lecture);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLecture(null);
  };

  const fetchLectures = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/lectures', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Ошибка при загрузке лекций');

      const data = await response.json();
      setLectures(data);
    } catch (error) {
      console.error('Ошибка запроса:', error);
      alert('Не удалось загрузить лекции');
    }
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

      const method = currentLecture ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(lectureData),
      });

      if (!response.ok) throw new Error('Ошибка при сохранении лекции');

      fetchLectures();
      closeModal();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Ошибка при удалении лекции');

      fetchLectures();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении лекции');
    }
  };

  return (
      <div>
        <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        {isAuthenticated ? (
            <div>
              <LectureList
                  lectures={lectures}
                  openModal={openModal}
                  deleteLecture={deleteLecture}
                  fetchLectures={fetchLectures}
              />
              {isModalOpen && (
                  <Modal
                      lecture={currentLecture}
                      saveLecture={saveLecture}
                      closeModal={closeModal}
                  />
              )}
            </div>
        ) : (
            <AuthModal setIsAuthenticated={setIsAuthenticated} />
        )}
      </div>
  );
};

export default App;