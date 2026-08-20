import React, { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Escribe o selecciona...",
  className = "",
  allowFreeText = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const filteredOptions = (options || []).filter(option =>
    (option || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const handleSelect = (option) => {
    setSearchTerm(option);
    onChange(option);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Sincronizar término de búsqueda con el valor seleccionado (por si cambia desde fuera)
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Cerrar al hacer clic fuera o desenfocar
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen && filteredOptions.length > 0 && searchTerm) {
          const matched = (focusedIndex >= 0 && focusedIndex < filteredOptions.length)
            ? filteredOptions[focusedIndex]
            : (filteredOptions.find(o => o.toLowerCase() === searchTerm.toLowerCase()) || filteredOptions[0]);
          handleSelect(matched);
        } else {
          setIsOpen(false);
          setFocusedIndex(-1);
          if (allowFreeText) {
            onChange(searchTerm);
          } else {
            setSearchTerm(value || '');
          }
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, isOpen, filteredOptions, searchTerm, focusedIndex, allowFreeText]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setFocusedIndex(-1);
    if (allowFreeText) {
      onChange(e.target.value);
    } else if (e.target.value === '') {
      onChange('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (isOpen) {
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex]);
        } else if (searchTerm && filteredOptions.length > 0) {
          handleSelect(filteredOptions[0]);
        } else if (allowFreeText && searchTerm) {
          onChange(searchTerm);
          setIsOpen(false);
        } else {
          setSearchTerm(value || '');
          setIsOpen(false);
        }
      }
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (allowFreeText && searchTerm) {
        onChange(searchTerm);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    if (isOpen && listRef.current && focusedIndex >= 0) {
      const selectedEl = listRef.current.children[focusedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-background text-on-surface outline-none focus:border-primary transition-colors ${className.includes('border') ? '' : 'border-2 border-outline-variant/30'} ${className.match(/\bp-|\bpy-|\bpl-|\bpx-/) ? '' : 'py-4 pl-4'} ${className} !pr-10`}
        />
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-outline cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CaretDown size={16} weight="bold" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-surface-container-high border border-outline-variant/30 shadow-xl max-h-60 overflow-y-auto rounded-b-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleSelect(option)}
                className={`p-3 text-sm cursor-pointer transition-colors ${
                  value === option || focusedIndex === index
                    ? 'bg-primary/20 text-primary font-bold' 
                    : 'text-on-surface hover:bg-surface-variant/50'
                }`}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-outline text-center">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
