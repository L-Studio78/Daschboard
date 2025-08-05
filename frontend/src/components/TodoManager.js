import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TodoManager.css';

// TypeScript-ähnliche Interfaces für bessere Code-Dokumentation
/**
 * @typedef {Object} Todo
 * @property {number} id - Unique identifier
 * @property {string} title - Todo title
 * @property {string} description - Todo description
 * @property {boolean} completed - Completion status
 * @property {'low' | 'medium' | 'high'} priority - Priority level
 * @property {string} due_date - Due date (ISO string)
 * @property {string} created_at - Creation timestamp
 * @property {string} completed_at - Completion timestamp
 */

/**
 * @typedef {Object} Goal
 * @property {number} id - Unique identifier
 * @property {string} title - Goal title
 * @property {string} description - Goal description
 * @property {string} target_date - Target date (ISO string)
 * @property {number} progress - Progress percentage (0-100)
 * @property {'active' | 'completed' | 'paused'} status - Goal status
 * @property {string} created_at - Creation timestamp
 * @property {string} completed_at - Completion timestamp
 */

/**
 * @typedef {Object} FormData
 * @property {string} title - Item title
 * @property {string} description - Item description
 * @property {'low' | 'medium' | 'high'} priority - Priority level
 * @property {string} due_date - Due date
 * @property {string} target_date - Target date
 * @property {number} progress - Progress percentage
 */

const API_BASE_URL = 'http://localhost:5000/api';

const TodoManager = () => {
  // State management
  const [todos, setTodos] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('todos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    target_date: '',
    progress: 0
  });

  // Priority options for better maintainability
  const priorityOptions = [
    { value: 'low', label: 'Niedrig', color: '#2ed573' },
    { value: 'medium', label: 'Mittel', color: '#ffa502' },
    { value: 'high', label: 'Hoch', color: '#ff4757' }
  ];

  // Status options for goals
  const statusOptions = [
    { value: 'active', label: 'Aktiv', color: '#2ed573' },
    { value: 'paused', label: 'Pausiert', color: '#ffa502' },
    { value: 'completed', label: 'Abgeschlossen', color: '#3742fa' }
  ];

  // Data fetching functions
  const fetchTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden der Todos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/goals`);
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden der Ziele';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchTodos();
    fetchGoals();
  }, [fetchTodos, fetchGoals]);

  // Form handling
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      target_date: '',
      progress: 0
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      if (activeTab === 'todos') {
        await axios.post(`${API_BASE_URL}/todos`, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          due_date: formData.due_date || null
        });
        await fetchTodos();
      } else {
        await axios.post(`${API_BASE_URL}/goals`, {
          title: formData.title,
          description: formData.description,
          target_date: formData.target_date || null,
          progress: formData.progress
        });
        await fetchGoals();
      }
      
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Hinzufügen des Elements';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Todo actions
  const toggleTodo = async (id, completed) => {
    try {
      setError(null);
      await axios.put(`${API_BASE_URL}/todos/${id}`, { completed: !completed });
      await fetchTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren des Todos';
      setError(errorMessage);
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm('Möchtest du dieses Todo wirklich löschen?')) return;
    
    try {
      setError(null);
      await axios.delete(`${API_BASE_URL}/todos/${id}`);
      await fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Löschen des Todos';
      setError(errorMessage);
    }
  };

  // Goal actions
  const deleteGoal = async (id) => {
    if (!window.confirm('Möchtest du dieses Ziel wirklich löschen?')) return;
    
    try {
      setError(null);
      await axios.delete(`${API_BASE_URL}/goals/${id}`);
      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Löschen des Ziels';
      setError(errorMessage);
    }
  };

  const updateGoalProgress = async (id, progress) => {
    try {
      setError(null);
      const goal = goals.find(g => g.id === id);
      await axios.put(`${API_BASE_URL}/goals/${id}`, {
        ...goal,
        progress: progress
      });
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren des Ziels';
      setError(errorMessage);
    }
  };

  // Utility functions
  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.color : '#747d8c';
  };

  const getPriorityLabel = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.label : priority;
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : '#747d8c';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Render functions
  const renderTodoItem = (todo) => (
    <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-content">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id, todo.completed)}
          className="todo-checkbox"
        />
        <div className="todo-details">
          <h4 className="todo-title">{todo.title}</h4>
          {todo.description && (
            <p className="todo-description">{todo.description}</p>
          )}
          <div className="todo-meta">
            <span 
              className="priority-badge"
              style={{backgroundColor: getPriorityColor(todo.priority)}}
            >
              {getPriorityLabel(todo.priority)}
            </span>
            {todo.due_date && (
              <span className={`due-date ${isOverdue(todo.due_date) ? 'overdue' : ''}`}>
                Fällig: {formatDate(todo.due_date)}
                {isOverdue(todo.due_date) && !todo.completed && (
                  <span className="overdue-indicator"> ⚠️ Überfällig</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      <button 
        className="delete-button"
        onClick={() => deleteTodo(todo.id)}
        title="Todo löschen"
      >
        Löschen
      </button>
    </div>
  );

  const renderGoalItem = (goal) => (
    <div key={goal.id} className="goal-item">
      <div className="goal-content">
        <h4 className="goal-title">{goal.title}</h4>
        {goal.description && (
          <p className="goal-description">{goal.description}</p>
        )}
        <div className="goal-meta">
          {goal.target_date && (
            <span className="target-date">
              Ziel: {formatDate(goal.target_date)}
            </span>
          )}
          <span 
            className="status-badge"
            style={{backgroundColor: getStatusColor(goal.status)}}
          >
            {getStatusLabel(goal.status)}
          </span>
        </div>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{width: `${goal.progress}%`}}
            ></div>
          </div>
          <span className="progress-text">{goal.progress}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={goal.progress}
            onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
            className="progress-slider"
            title="Fortschritt anpassen"
          />
        </div>
      </div>
      <button 
        className="delete-button"
        onClick={() => deleteGoal(goal.id)}
        title="Ziel löschen"
      >
        Löschen
      </button>
    </div>
  );

  const renderAddForm = () => (
    <div className="add-form-overlay">
      <div className="add-form">
        <div className="form-header">
          <h3>{activeTab === 'todos' ? 'Neues Todo' : 'Neues Ziel'} hinzufügen</h3>
          <button 
            className="close-button"
            onClick={() => {
              setShowAddForm(false);
              resetForm();
            }}
            title="Schließen"
          >
            ×
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Titel *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
              placeholder="Titel eingeben..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Beschreibung</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Beschreibung eingeben..."
              rows="3"
            />
          </div>

          {activeTab === 'todos' ? (
            <>
              <div className="form-group">
                <label htmlFor="priority">Priorität</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="due_date">Fälligkeitsdatum</label>
                <input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleFormChange('due_date', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="target_date">Zieldatum</label>
                <input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => handleFormChange('target_date', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="progress">Anfangsfortschritt (%)</label>
                <input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleFormChange('progress', parseInt(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="cancel-button"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="todo-manager">
      <div className="todo-header">
        <div className="header-content">
          <h2>Todo & Ziele Manager</h2>
          <p className="header-subtitle">
            Organisiere deine Aufgaben und verfolge deine langfristigen Ziele
          </p>
        </div>
        
        <div className="header-actions">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              📝 Todos ({todos.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveTab('goals')}
            >
              🎯 Langfristige Ziele ({goals.length})
            </button>
          </div>
          
          <button 
            className="add-button"
            onClick={() => setShowAddForm(true)}
            title={`${activeTab === 'todos' ? 'Todo' : 'Ziel'} hinzufügen`}
          >
            + {activeTab === 'todos' ? 'Todo' : 'Ziel'} hinzufügen
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="content-area">
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Lade Daten...</p>
          </div>
        ) : activeTab === 'todos' ? (
          <div className="todos-list">
            {todos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>Keine Todos vorhanden</h3>
                <p>Füge dein erstes Todo hinzu, um produktiv zu werden!</p>
                <button 
                  className="empty-action-button"
                  onClick={() => setShowAddForm(true)}
                >
                  Erstes Todo hinzufügen
                </button>
              </div>
            ) : (
              todos.map(renderTodoItem)
            )}
          </div>
        ) : (
          <div className="goals-list">
            {goals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>Keine Ziele vorhanden</h3>
                <p>Definiere deine langfristigen Ziele und verfolge deinen Fortschritt!</p>
                <button 
                  className="empty-action-button"
                  onClick={() => setShowAddForm(true)}
                >
                  Erstes Ziel hinzufügen
                </button>
              </div>
            ) : (
              goals.map(renderGoalItem)
            )}
          </div>
        )}
      </div>

      {showAddForm && renderAddForm()}
    </div>
  );
};

export default TodoManager; 