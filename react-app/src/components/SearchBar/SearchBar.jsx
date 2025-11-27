/*
================================================================================
  SEARCH BAR COMPONENT
================================================================================
  Search input with button to search for songs.
================================================================================
*/

import { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  
  // Handle form submit
  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }
  
  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for tracks or artists..."
        autoComplete="off"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search songs'}
      </button>
    </form>
  );
}

export default SearchBar;
