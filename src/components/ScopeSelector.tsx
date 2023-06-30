import React, { useState, ChangeEvent } from 'react';

interface ScopeSelectorProps {
  onScopeChange: (selectedScope: string) => void;
}

const ScopeSelector: React.FC<ScopeSelectorProps> = ({ onScopeChange }) => {
  const [selectedScope, setSelectedScope] = useState<string>('Book');

  const handleScopeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newScope = event.target.value;
    setSelectedScope(newScope);
    onScopeChange(newScope);
  };

  return (
    <div>
      <label htmlFor="scope-select" className="mr-2">Scope:</label>
      <select id="scope-select" value={selectedScope} onChange={handleScopeChange} className="border bg-white">
        <option value="Group">Group</option>
        <option value="Book">Book</option>
        <option value="Chapter">Chapter</option>
        <option value="Verse">Verse</option>
      </select>
    </div>
  );
};

export default ScopeSelector;
