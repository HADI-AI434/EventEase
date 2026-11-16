
import { useEffect, useRef, useState } from 'react';

const PHOTON_API = 'https://photon.komoot.io/api/';

function getAddress(properties) {
    return [
        properties.housenumber,
        properties.street,
        properties.district,
        properties.city,
        properties.county,
        properties.state,
        properties.postcode,
        properties.country
    ].filter(Boolean).filter((value, index, array) =>
        array.indexOf(value) === index
    ).join(', ');
}

function getCity(properties) {
    return (
        properties.city ||
        properties.town ||
        properties.village ||
        properties.municipality ||
        properties.district ||
        properties.county ||
        ''
    );
}

export default function PakistanVenueAutocomplete({
    onSelected,
    onClear,
    initialValue = ''
}) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(false);

    const requestRef = useRef(null);
    const selectionRef = useRef(false);

    useEffect(() => {
        setQuery(initialValue || '');
        setSelected(Boolean(initialValue));
        selectionRef.current = Boolean(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (selectionRef.current || query.trim().length < 3) {
            setResults([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        requestRef.current = controller;

        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                setError('');

                const params = new URLSearchParams({
                    q: query.trim(),
                    limit: '6',
                    lang: 'en',
                    countrycode: 'PK'
                });

                const response = await fetch(
                    `${PHOTON_API}?${params.toString()}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error('Venue search is temporarily unavailable.');
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setResults(data.features || []);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError('Unable to search venues right now. You can try again.');
                    setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 400);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [query]);

    function handleChange(event) {
        const value = event.target.value;

        selectionRef.current = false;
        setSelected(false);
        setQuery(value);
        setResults([]);
        setError('');

        if (onClear) {
            onClear();
        }
    }

    function handleSelect(feature) {
        const properties = feature.properties || {};
        const coordinates = feature.geometry?.coordinates;

        if (
            !Array.isArray(coordinates) ||
            coordinates.length < 2 ||
            typeof coordinates[0] !== 'number' ||
            typeof coordinates[1] !== 'number'
        ) {
            setError('This result does not have valid map coordinates. Select another venue.');
            return;
        }

        const venue = properties.name || '';
        const address = getAddress(properties);

        if (!venue || !properties.country ||
            properties.country.toLowerCase() !== 'pakistan') {
            setError('Please select a venue located in Pakistan.');
            return;
        }

        const venueDetails = {
            venue,
            location: address || venue,
            city: getCity(properties),
            province: properties.state || '',
            country: 'Pakistan',
            coordinates: {
                latitude: coordinates[1],
                longitude: coordinates[0]
            },
            osmId: properties.osm_id
                ? String(properties.osm_id)
                : '',
            osmType: properties.osm_type || ''
        };

        selectionRef.current = true;
        setSelected(true);
        setQuery(venue);
        setResults([]);
        setError('');

        onSelected(venueDetails);
    }

    return (
        <div className="pakistan-venue-autocomplete">
            <label htmlFor="venue-search">
                Search for a venue in Pakistan
            </label>

            <input
                id="venue-search"
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Example: Expo Centre Lahore"
                autoComplete="off"
            />

            {loading && (
                <p className="venue-search-status">
                    Searching Pakistani venues...
                </p>
            )}

            {error && (
                <p className="venue-search-error">{error}</p>
            )}

            {results.length > 0 && (
                <div className="venue-search-results">
                    {results.map((feature, index) => {
                        const properties = feature.properties || {};
                        const resultName = properties.name || 'Unnamed place';
                        const resultAddress = getAddress(properties);

                        return (
                            <button
                                type="button"
                                key={`${properties.osm_type || 'place'}-${properties.osm_id || index}`}
                                className="venue-search-result"
                                onClick={() => handleSelect(feature)}
                            >
                                <strong>{resultName}</strong>
                                <span>
                                    {resultAddress || 'Pakistan'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {selected && (
                <p className="venue-search-success">
                    Venue selected successfully.
                </p>
            )}

            <small>
                Search results are provided by OpenStreetMap data through
                Photon. Some venues may not be listed.
            </small>
        </div>
    );
}
