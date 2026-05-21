import { useEffect, useId, useRef, useState } from 'react';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

async function searchPlaces(query) {
  const q = query?.trim();
  if (!q || q.length < 3) return [];
  const url = `${NOMINATIM_SEARCH}?format=json&addressdetails=0&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item?.lat != null && item?.lon != null)
    .map((item) => ({
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onPlaceSelected,
  placeholder,
  disabled,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const debounceRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = value?.trim();
    if (!q || q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(q);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const pick = (place) => {
    onChangeText?.(place.address);
    onPlaceSelected?.(place);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        placeholder={placeholder || 'Search address (OpenStreetMap)'}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
      />
      {searching ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          …
        </span>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}-${i}`}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left hover:bg-primary/10"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s.address}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-muted">
        Or click the map below to set coordinates (no Google API required).
      </p>
    </div>
  );
}
