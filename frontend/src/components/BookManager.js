import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookStats from './BookStats';
import './BookManager.css'; // Importiere das neue CSS

const API_URL = 'http://localhost:5000/api';

const BookManager = ({ books, setBooks }) => {
  const [search, setSearch] = useState({ title: '', author: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearch({ ...search, [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError('');
    setSearchResults([]);
    try {
      // Google Books API mit Sprachfilter Deutsch
      const q = `${search.title}${search.author ? '+inauthor:' + search.author : ''}`;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&langRestrict=de&maxResults=10`;
      const res = await axios.get(url);
      setSearchResults(res.data.items || []);
    } catch (err) {
      setError('Fehler bei der Suche.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddBook = async (item) => {
    // Doppelte Bücher verhindern (Titel + Autor)
    const volume = item.volumeInfo || {};
    const newTitle = (volume.title || '').toLowerCase().trim();
    const newAuthor = (volume.authors ? volume.authors.join(', ') : '').toLowerCase().trim();
    if (books.some(b => b.title.toLowerCase().trim() === newTitle && b.author.toLowerCase().trim() === newAuthor)) {
      alert('Dieses Buch ist bereits in deiner Sammlung!');
      return;
    }
    try {
      const volume = item.volumeInfo || {};
      const imageUrl = volume.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
      const publishYear = volume.publishedDate ? volume.publishedDate.substring(0, 4) : '';
      const pageCount = volume.pageCount || '';
      let isbn = '';
      if (volume.industryIdentifiers) {
        const isbn13 = volume.industryIdentifiers.find(id => id.type === 'ISBN_13');
        const isbn10 = volume.industryIdentifiers.find(id => id.type === 'ISBN_10');
        isbn = isbn13?.identifier || isbn10?.identifier || '';
      }
      const gbooksUrl = item.volumeInfo.infoLink || '';
      const addedDate = new Date().toISOString();
      const bookData = {
        title: volume.title || '',
        author: (volume.authors && volume.authors.join(', ')) || '',
        rating: 3,
        notes: '',
        image_url: imageUrl,
        publish_year: publishYear,
        page_count: pageCount,
        isbn,
        ol_url: gbooksUrl,
        added_date: addedDate
      };
      const response = await axios.post(`${API_URL}/books`, bookData);
      setBooks(prevBooks => [response.data, ...prevBooks]);
    } catch (err) {
      let msg = '';
      if (err.response?.data?.errors) {
        msg = err.response.data.errors.map(e => e.msg).join(', ');
      } else if (typeof err.response?.data === 'string') {
        msg = err.response.data;
      } else if (err.response?.data?.error) {
        msg = err.response.data.error + (err.response.data.details ? ': ' + err.response.data.details : '');
      } else {
        msg = err.message;
      }
      setError('Fehler beim Hinzufügen des Buchs: ' + msg);
    }
  };


  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`${API_URL}/books/${id}`);
        setBooks(prevBooks => prevBooks.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };



  return (
    <div className="book-manager-container">
      <h2>Book Collection</h2>
      <BookStats books={books} />
      <h3 className="section-title">Buch aus Open Library suchen</h3>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          name="title"
          placeholder="Titel"
          value={search.title}
          onChange={handleSearchInputChange}
          required
        />
        <input
          type="text"
          name="author"
          placeholder="Autor (optional)"
          value={search.author}
          onChange={handleSearchInputChange}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Suche...' : 'Suchen'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {searchResults.length > 0 && (
        <div className="search-results-container">
          <h4 className="results-title">Suchergebnisse</h4>
          {searchResults.map((item, idx) => {
            const volume = item.volumeInfo || {};
            const imageUrl = volume.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
            return (
              <div key={item.id || idx} className="search-result-item">
                {imageUrl && <img src={imageUrl} alt={volume.title} className="book-cover-thumbnail" />}
                <div className="book-info">
                  <b>{volume.title}</b> {volume.authors && <>von {volume.authors.join(', ')}</>}
                  {volume.publishedDate && <span> ({volume.publishedDate.substring(0,4)})</span>}
                  <br />
                  {volume.pageCount && <span>{volume.pageCount} Seiten</span>}
                  {volume.industryIdentifiers && volume.industryIdentifiers.length > 0 && <span> | ISBN: {volume.industryIdentifiers[0].identifier}</span>}
                  {volume.infoLink && <span> | <a href={volume.infoLink} target="_blank" rel="noopener noreferrer">Google Books</a></span>}
                </div>
                <button onClick={() => handleAddBook(item)} className="add-book-button">Hinzufügen</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="book-list-container">
        {books.slice(page * 10, (page + 1) * 10).map((book) => (
          <div key={book.id} className="book-item">
            {book.image_url && <img src={book.image_url} alt={book.title} className="book-cover-large" />}
            <div className="book-details">
              <h3>{book.title}</h3>
              <p>by {book.author}</p>
              {book.publish_year && <p>Erscheinungsjahr: {book.publish_year}</p>}
              {book.page_count && <p>Seiten: {book.page_count}</p>}
              {book.isbn && <p>ISBN: {book.isbn}</p>}
              {book.ol_url && <p><a href={book.ol_url} target="_blank" rel="noopener noreferrer">Open Library</a></p>}
              <p>Rating: {book.rating}/5</p>
              <p>Notes: {book.notes}</p>
              <button onClick={() => handleDelete(book.id)} className="delete-book-button">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination-controls">
        <button onClick={() => setPage(page - 1)} disabled={page === 0}>Vorherige Ergebnisse</button>
        <span>Seite {page + 1} / {Math.ceil(books.length / 10) || 1}</span>
        <button onClick={() => setPage(page + 1)} disabled={(page + 1) * 10 >= books.length}>Weitere Ergebnisse</button>
      </div>
    </div>
  );
};

export default BookManager;
