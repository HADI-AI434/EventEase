
import { API_BASE_URL } from './api';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import PakistanVenueAutocomplete from './PakistanVenueAutocomplete';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

import DashboardAnalyticsCharts from './DashboardAnalyticsCharts';

const MAX_EVENT_IMAGES = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function OrganizerDashboard({ onBack }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // ORGANIZER ANALYTICS
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState('');

    // EVENT FORM
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    // EVENT IMAGES
    const [existingImages, setExistingImages] = useState([]);
    const [selectedImageFiles, setSelectedImageFiles] = useState([]);
    const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);
    const [imageUploading, setImageUploading] = useState(false);

    // QR VERIFICATION
    const [showScanner, setShowScanner] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [scanning, setScanning] = useState(false);

    const initialFormData = {
        title: '',
        description: '',
        type: 'In-person',
        category: 'Other',
        date: '',
        location: '',
        city: '',
        venue: '',
        province: '',
        country: 'Pakistan',
        coordinates: null,
        price: '',
        availableSeats: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    // CREATE PREVIEWS FOR SELECTED IMAGES
    useEffect(() => {
        const previews = selectedImageFiles.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));

        setSelectedImagePreviews(previews);

        return () => {
            previews.forEach(preview => {
                URL.revokeObjectURL(preview.url);
            });
        };
    }, [selectedImageFiles]);

    // FETCH ORGANIZER EVENTS
    async function fetchMyEvents() {
        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/events/my-events`,
                {
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch events.');
            }

            setEvents(data.events || []);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // FETCH ORGANIZER ANALYTICS
    async function fetchOrganizerAnalytics() {
        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/analytics/organizer`,
                {
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to fetch analytics.'
                );
            }

            setAnalytics(data.analytics);
        } catch (err) {
            setAnalyticsError(err.message);
        } finally {
            setAnalyticsLoading(false);
        }
    }

    useEffect(() => {
        fetchMyEvents();
        fetchOrganizerAnalytics();
    }, []);

    // UPLOAD-ONLY QR TICKET VERIFICATION
    async function handleImageUpload(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        setVerificationResult(null);
        setScanning(true);

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const qrScanner = new Html5Qrcode(
                'eventease-image-reader'
            );

            try {
                const decodedText = await qrScanner.scanFile(file, true);

                console.log(
                    'QR decoded text:',
                    JSON.stringify(decodedText)
                );

                const response = await fetch(
                    `${API_BASE_URL}/api/bookings/verify/${encodeURIComponent(decodedText.trim())}`,
                    {
                        headers: {
                            Authorization: `Bearer ${savedUser.token}`
                        }
                    }
                );

                const data = await response.json();

                console.log('Verification API response:', data);
                console.log('Verification HTTP status:', response.status);

                setVerificationResult({
                    ...data,
                    valid: response.ok && data.valid
                });
            } finally {
                try {
                    await qrScanner.clear();
                } catch (cleanupError) {
                    console.warn(
                        'QR scanner cleanup:',
                        cleanupError
                    );
                }
            }
        } catch (error) {
            setVerificationResult({
                valid: false,
                message: error.message?.toLowerCase().includes('qr code')
                    ? 'No readable QR code found in this image. Please try another image.'
                    : error.message || 'Unable to scan the uploaded image.'
            });
        } finally {
            setScanning(false);
            e.target.value = '';
        }
    }

    // HANDLE FORM INPUT CHANGES
    function handleChange(e) {
        const { name, value } = e.target;

        // Switching event type clears incompatible location details.
        if (name === 'type') {
            setFormData(previous => ({
                ...previous,
                type: value,
                location: '',
                city: '',
                venue: '',
                province: '',
                country: 'Pakistan',
                coordinates: null
            }));

            return;
        }

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    }

    // HANDLE SELECTED PAKISTANI VENUE
    function handleVenueSelected(venueDetails) {
        setFormData(previous => ({
            ...previous,
            venue: venueDetails.venue,
            location: venueDetails.location,
            city: venueDetails.city,
            province: venueDetails.province,
            country: 'Pakistan',
            coordinates: venueDetails.coordinates
        }));

        setMessage('');
    }

    // CLEAR SELECTED VENUE WHEN ORGANIZER CHANGES SEARCH
    function handleVenueSearchChanged() {
        setFormData(previous => ({
            ...previous,
            venue: '',
            location: '',
            city: '',
            province: '',
            country: 'Pakistan',
            coordinates: null
        }));
    }

    // HANDLE NEW EVENT IMAGE SELECTION
    function handleEventImagesChange(e) {
        const files = Array.from(e.target.files || []);

        const remainingSlots =
            MAX_EVENT_IMAGES -
            existingImages.length -
            selectedImageFiles.length;

        if (remainingSlots <= 0) {
            setMessage(
                `You can upload a maximum of ${MAX_EVENT_IMAGES} photos.`
            );
            e.target.value = '';
            return;
        }

        const validFiles = [];

        for (const file of files) {
            if (
                !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            ) {
                setMessage(
                    `${file.name} is not supported. Use JPG, PNG, or WebP.`
                );
                continue;
            }

            if (file.size > MAX_IMAGE_SIZE) {
                setMessage(
                    `${file.name} exceeds the 5 MB file size limit.`
                );
                continue;
            }

            validFiles.push(file);
        }

        const filesToAdd = validFiles.slice(0, remainingSlots);

        if (validFiles.length > remainingSlots) {
            setMessage(
                `Only ${remainingSlots} more photo(s) can be added. Maximum is 8.`
            );
        } else if (filesToAdd.length > 0) {
            setMessage('');
        }

        setSelectedImageFiles(previous => [
            ...previous,
            ...filesToAdd
        ]);

        e.target.value = '';
    }

    // REMOVE NEW IMAGE
    function removeSelectedImage(index) {
        setSelectedImageFiles(previous =>
            previous.filter((_, imageIndex) => imageIndex !== index)
        );
    }

    // REMOVE EXISTING IMAGE
    function removeExistingImage(index) {
        setExistingImages(previous =>
            previous.filter((_, imageIndex) => imageIndex !== index)
        );
    }

    // UPLOAD SELECTED IMAGES TO CLOUDINARY
    async function uploadEventImages(token) {
        if (selectedImageFiles.length === 0) {
            return [];
        }

        const uploadFormData = new FormData();

        selectedImageFiles.forEach(file => {
            uploadFormData.append('images', file);
        });

        const response = await fetch(
            `${API_BASE_URL}/api/uploads/images`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: uploadFormData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Event photo upload failed.'
            );
        }

        if (!Array.isArray(data.images)) {
            throw new Error('The image upload response was invalid.');
        }

        return data.images
            .map(image => {
                if (typeof image === 'string') {
                    return image;
                }

                return image?.url;
            })
            .filter(Boolean);
    }

    // EDIT EVENT
    function handleEditClick(event) {
        const eventDate = new Date(event.date);

        const localDate = new Date(
            eventDate.getTime() -
            eventDate.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 16);

        setFormData({
            title: event.title || '',
            description: event.description || '',
            type: event.type || 'In-person',
            category: event.category || 'Other',
            date: localDate,
            location: event.location || event.venue || '',
            city: event.city || '',
            venue: event.venue || '',
            province: event.province || '',
            country: event.country || 'Pakistan',
            coordinates: event.coordinates || null,
            price: event.price ?? '',
            availableSeats: event.availableSeats ?? ''
        });

        const eventImages = Array.isArray(event.images)
            ? event.images
                .map(image =>
                    typeof image === 'string' ? image : image?.url
                )
                .filter(Boolean)
            : [];

        if (eventImages.length === 0 && event.imageUrl) {
            eventImages.push(event.imageUrl);
        }

        setExistingImages(eventImages);
        setSelectedImageFiles([]);
        setEditingEventId(event._id);
        setShowForm(true);
        setMessage('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // RESET EVENT FORM
    function resetEventForm() {
        setFormData({ ...initialFormData });
        setExistingImages([]);
        setSelectedImageFiles([]);
        setEditingEventId(null);
        setShowForm(false);
    }

    // DELETE EVENT
    async function handleDeleteEvent(eventId) {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this event?'
        );

        if (!confirmDelete) return;

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Event deletion failed.'
                );
            }

            setMessage('Event deleted successfully!');
            await fetchMyEvents();
        } catch (err) {
            setMessage(err.message);
        }
    }

    // CREATE OR UPDATE EVENT
    async function handleCreateEvent(e) {
        e.preventDefault();

        if (submitting) return;

        setSubmitting(true);
        setMessage('');

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            if (
                existingImages.length + selectedImageFiles.length >
                MAX_EVENT_IMAGES
            ) {
                throw new Error(
                    'An event can have a maximum of 8 photos.'
                );
            }

            if (formData.type === 'In-person') {
                if (
                    !formData.venue ||
                    !formData.location ||
                    !formData.city ||
                    !formData.coordinates ||
                    typeof formData.coordinates.latitude !== 'number' ||
                    typeof formData.coordinates.longitude !== 'number'
                ) {
                    throw new Error(
                        'Please search for and select a valid venue in Pakistan.'
                    );
                }

                const { latitude, longitude } = formData.coordinates;

                if (
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180
                ) {
                    throw new Error('The selected venue coordinates are invalid.');
                }
            }

            if (
                !formData.title.trim() ||
                !formData.description.trim() ||
                !formData.date ||
                formData.price === '' ||
                formData.availableSeats === ''
            ) {
                throw new Error('Please complete all required event fields.');
            }

            if (
                !Number.isFinite(Number(formData.price)) ||
                Number(formData.price) < 0
            ) {
                throw new Error('Please enter a valid ticket price.');
            }

            if (
                !Number.isInteger(Number(formData.availableSeats)) ||
                Number(formData.availableSeats) < 1
            ) {
                throw new Error('Please enter a valid number of available seats.');
            }

            // UPLOAD SELECTED PHOTOS FIRST
            setImageUploading(true);

            const uploadedImages = await uploadEventImages(
                savedUser.token
            );

            const finalImages = [
                ...existingImages,
                ...uploadedImages
            ];

            if (finalImages.length > MAX_EVENT_IMAGES) {
                throw new Error(
                    'An event can have a maximum of 8 photos.'
                );
            }

            const url = editingEventId
                ? `${API_BASE_URL}/api/events/${editingEventId}`
                : `${API_BASE_URL}/api/events`;

            const eventPayload = {
                ...formData,

                // Store the complete address, not just the venue name.
                location: formData.location,

                venue: formData.type === 'In-person'
                    ? formData.venue
                    : '',

                city: formData.type === 'In-person'
                    ? formData.city
                    : '',

                province: formData.type === 'In-person'
                    ? formData.province
                    : '',

                country: 'Pakistan',

                coordinates: formData.type === 'In-person'
                    ? formData.coordinates
                    : null,

                images: finalImages,
                imageUrl: finalImages[0] || '',

                price: Number(formData.price),
                availableSeats: Number(formData.availableSeats)
            };

            const response = await fetch(url, {
                method: editingEventId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${savedUser.token}`
                },
                body: JSON.stringify(eventPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (editingEventId
                        ? 'Event update failed.'
                        : 'Event creation failed.')
                );
            }

            setMessage(
                editingEventId
                    ? 'Event updated successfully!'
                    : 'Event created successfully!'
            );

            resetEventForm();

            await fetchMyEvents();
        } catch (err) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
            setImageUploading(false);
        }
    }

    if (loading) {
        return <h2>Loading your events...</h2>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    // BEST-PERFORMING EVENT
    const bestPerformingEvent = analytics?.salesByEvent
        ?.filter(event => event.ticketsSold > 0)
        .sort((a, b) => {
            if (b.ticketsSold !== a.ticketsSold) {
                return b.ticketsSold - a.ticketsSold;
            }

            return b.revenue - a.revenue;
        })[0] || null;

    return (
        <div className="organizer-dashboard">
            <h1>Organizer Dashboard</h1>

            <button
                className="login-btn"
                onClick={() => {
                    setVerificationResult(null);
                    setShowScanner(!showScanner);
                }}
            >
                {showScanner ? 'Close Scanner' : 'Scan Ticket'}
            </button>

            <button
                className="login-btn"
                onClick={onBack}
            >
                ← Back to Home
            </button>

            <button
                className="login-btn"
                onClick={() => {
                    if (showForm) {
                        resetEventForm();
                    } else {
                        resetEventForm();
                        setShowForm(true);
                    }

                    setMessage('');
                }}
            >
                {showForm ? 'Cancel' : 'Create New Event'}
            </button>

            {message && <p>{message}</p>}

            {/* UPLOAD-ONLY QR TICKET SCANNER */}
            {showScanner && (
                <div className="ticket-scanner-section">
                    <h2>Scan Customer Ticket</h2>

                    <p>
                        Upload the customer's QR code image to verify their ticket.
                    </p>

                    <div className="qr-upload-section">
                        <h3>Upload QR Ticket Image</h3>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={scanning}
                        />

                        <p>
                            Choose a screenshot or photo containing the customer's QR code.
                        </p>
                    </div>

                    <div
                        id="eventease-image-reader"
                        style={{ display: 'none' }}
                    />

                    {scanning && <p>Verifying ticket...</p>}

                    {verificationResult && (
                        <div
                            className={`verification-result ${verificationResult.valid
                                    ? 'ticket-valid'
                                    : verificationResult.message?.toLowerCase().includes('already used')
                                        ? 'ticket-used'
                                        : 'ticket-invalid'
                                }`}
                        >
                            <h3>
                                {verificationResult.valid
                                    ? 'Ticket Valid! Entry Approved'
                                    : verificationResult.message?.toLowerCase().includes('already used')
                                        ? 'Ticket Already Used!'
                                        : 'Ticket Invalid!'}
                            </h3>

                            <p>{verificationResult.message}</p>

                            {verificationResult.ticket && (
                                <>
                                    <p>Event: {verificationResult.ticket.event}</p>

                                    <p>
                                        Date: {new Date(
                                            verificationResult.ticket.date
                                        ).toLocaleString()}
                                    </p>

                                    <p>
                                        Location: {verificationResult.ticket.location}
                                    </p>

                                    <p>
                                        Tickets: {verificationResult.ticket.quantity}
                                    </p>

                                    <p>
                                        Status: {verificationResult.ticket.status}
                                    </p>

                                    <p>
                                        Reference: {verificationResult.ticket.bookingReference}
                                    </p>

                                    {verificationResult.ticket.usedAt && (
                                        <p>
                                            Entry recorded: {new Date(
                                                verificationResult.ticket.usedAt
                                            ).toLocaleString()}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* CREATE / EDIT EVENT FORM */}
            {showForm && (
                <form onSubmit={handleCreateEvent}>
                    <h2>
                        {editingEventId ? 'Edit Event' : 'Create Event'}
                    </h2>

                    <input
                        type="text"
                        name="title"
                        placeholder="Event Title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Event Description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                    >
                        <option value="In-person">In-person</option>
                        <option value="Online">Online</option>
                    </select>

                    <div className="form-group">
                        <label htmlFor="event-category">
                            Event Category
                        </label>

                        <select
                            id="event-category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="Music">Music</option>
                            <option value="Technology">Technology</option>
                            <option value="Business">Business</option>
                            <option value="Education">Education</option>
                            <option value="Arts">Arts</option>
                            <option value="Food">Food</option>
                            <option value="Sports">Sports</option>
                            <option value="Community">Community</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />

                    {/* PAKISTAN VENUE AUTOCOMPLETE */}
                    {formData.type === 'In-person' && (
                        <div
                            className="form-group venue-selection-section"
                            style={{ margin: '20px 0' }}
                        >
                            <h3>Event Venue Details</h3>

                            <p>
                                Search for your real event venue in Pakistan
                                and select a result.
                            </p>

                            <PakistanVenueAutocomplete
                                key={editingEventId || 'new-event'}
                                initialValue={formData.venue}
                                onSelected={handleVenueSelected}
                                onClear={handleVenueSearchChanged}
                            />

                            {formData.venue && formData.coordinates && (
                                <div
                                    className="selected-venue-details"
                                    style={{
                                        padding: '14px',
                                        marginTop: '12px',
                                        border: '1px solid #334155',
                                        borderRadius: '9px',
                                        background: '#172033',
                                        overflowWrap: 'anywhere'
                                    }}
                                >
                                    <h4>Selected Venue</h4>

                                    <p>
                                        <strong>Venue:</strong>{' '}
                                        {formData.venue}
                                    </p>

                                    <p>
                                        <strong>Full address:</strong>{' '}
                                        {formData.location}
                                    </p>

                                    <p>
                                        <strong>City:</strong>{' '}
                                        {formData.city}
                                    </p>

                                    <p>
                                        <strong>Province:</strong>{' '}
                                        {formData.province || 'Not available'}
                                    </p>

                                    <p>
                                        <strong>Country:</strong> Pakistan
                                    </p>

                                    <p>
                                        <strong>Coordinates:</strong>{' '}
                                        {formData.coordinates.latitude},{' '}
                                        {formData.coordinates.longitude}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ONLINE EVENT LOCATION */}
                    {formData.type === 'Online' && (
                        <input
                            type="text"
                            name="location"
                            placeholder="Online Location / Meeting Platform"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    )}

                    <input
                        type="number"
                        name="price"
                        placeholder="Ticket Price (Rs.)"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="availableSeats"
                        placeholder="Available Seats"
                        min="1"
                        step="1"
                        value={formData.availableSeats}
                        onChange={handleChange}
                        required
                    />

                    {/* EVENT PHOTO UPLOAD */}
                    <div className="form-group event-image-upload">
                        <h3>Event Photos</h3>

                        <p>
                            Upload up to 8 photos. Supported formats:
                            JPG, PNG, WebP. Maximum size: 5 MB per photo.
                        </p>

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleEventImagesChange}
                            disabled={
                                existingImages.length + selectedImageFiles.length >= MAX_EVENT_IMAGES ||
                                submitting
                            }
                        />

                        <p>
                            Photos selected:{' '}
                            {existingImages.length + selectedImageFiles.length}
                            {' / '}
                            {MAX_EVENT_IMAGES}
                        </p>

                        {/* EXISTING PHOTOS */}
                        {existingImages.length > 0 && (
                            <div className="event-image-preview-grid">
                                <h4>Saved Photos</h4>

                                <div className="event-image-preview-grid">
                                    {existingImages.map((image, index) => (
                                        <div
                                            className="event-image-preview"
                                            key={`existing-${image}-${index}`}
                                        >
                                            <img
                                                src={image}
                                                alt={`Event photo ${index + 1}`}
                                                style={{
                                                    width: '150px',
                                                    height: '110px',
                                                    objectFit: 'cover'
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(index)}
                                                disabled={submitting}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NEW PHOTO PREVIEWS */}
                        {selectedImagePreviews.length > 0 && (
                            <div className="event-image-preview-grid">
                                <h4>New Photos</h4>

                                <div className="event-image-preview-grid">
                                    {selectedImagePreviews.map((preview, index) => (
                                        <div
                                            className="event-image-preview"
                                            key={`new-${index}-${preview.name}`}
                                        >
                                            <img
                                                src={preview.url}
                                                alt={preview.name}
                                                style={{
                                                    width: '150px',
                                                    height: '110px',
                                                    objectFit: 'cover'
                                                }}
                                            />

                                            <p>{preview.name}</p>

                                            <button
                                                type="button"
                                                onClick={() => removeSelectedImage(index)}
                                                disabled={submitting}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || imageUploading}
                    >
                        {imageUploading
                            ? 'Uploading photos...'
                            : submitting
                                ? 'Saving...'
                                : editingEventId
                                    ? 'Update Event'
                                    : 'Create Event'}
                    </button>

                    <button
                        type="button"
                        onClick={resetEventForm}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </form>
            )}

            {/* ORGANIZER ANALYTICS */}
            <section className="analytics-section">
                <h2>Organizer Analytics</h2>

                {analyticsLoading ? (
                    <p>Loading analytics...</p>
                ) : analyticsError ? (
                    <p>{analyticsError}</p>
                ) : analytics && (
                    <div className="analytics-grid">
                        <div className="analytics-card">
                            <h3>Booking Success Rate</h3>
                            <p>{analytics.bookingSuccessRate}%</p>
                            <small>
                                {analytics.successfulBookings} successful bookings
                            </small>
                        </div>

                        <div className="analytics-card">
                            <h3>Cancellation Rate</h3>
                            <p>{analytics.cancellationRate}%</p>
                            <small>
                                {analytics.cancelledBookings} cancelled bookings
                            </small>
                        </div>

                        <div className="analytics-card">
                            <h3>Total Events</h3>
                            <p>{analytics.totalEvents}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Total Bookings</h3>
                            <p>{analytics.totalBookings}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Tickets Sold</h3>
                            <p>{analytics.ticketsSold}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Total Revenue</h3>
                            <p>Rs. {analytics.totalRevenue}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Cancelled Bookings</h3>
                            <p>{analytics.cancelledBookings}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Available Seats</h3>
                            <p>{analytics.totalAvailableSeats}</p>
                        </div>
                    </div>
                )}
            </section>

            {/* DASHBOARD ANALYTICS CHARTS */}
            <DashboardAnalyticsCharts dashboardType="organizer" />

            {/* EVENT-WISE SALES */}
            <section className="sales-chart-section">
                <h2>Event Sales Performance</h2>

                {analytics?.salesByEvent?.length > 0 ? (
                    <div className="sales-chart">
                        {analytics.salesByEvent.map((event, index) => {
                            const maxTickets = Math.max(
                                ...analytics.salesByEvent.map(
                                    item => item.ticketsSold
                                ),
                                1
                            );

                            const barWidth =
                                (event.ticketsSold / maxTickets) * 100;

                            return (
                                <div
                                    className="sales-chart-item"
                                    key={index}
                                >
                                    <h3>{event.eventTitle}</h3>

                                    <div className="sales-bar-background">
                                        <div
                                            className="sales-bar"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>

                                    <p>Tickets Sold: {event.ticketsSold}</p>
                                    <p>Revenue: Rs. {event.revenue}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No sales data available yet.</p>
                )}
            </section>

            {/* MONTHLY ANALYTICS */}
            <section className="monthly-analytics-section">
                <h2>Sales Analytics</h2>

                <div className="organizer-charts-grid">
                    {/* MONTHLY REVENUE */}
                    <div className="monthly-chart-card">
                        <h3>Monthly Revenue</h3>

                        <p className="chart-description">
                            Revenue generated from successful bookings.
                        </p>

                        {analytics?.monthlyTrends?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.monthlyTrends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#334155"
                                    />

                                    <XAxis
                                        dataKey="month"
                                        stroke="#aab6c7"
                                    />

                                    <YAxis
                                        stroke="#aab6c7"
                                        tickFormatter={value =>
                                            `${(value / 1000).toFixed(0)}k`
                                        }
                                    />

                                    <Tooltip
                                        formatter={value =>
                                            `Rs. ${Number(value).toLocaleString()}`
                                        }
                                        contentStyle={{
                                            background: '#172235',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No monthly revenue data available yet.</p>
                        )}
                    </div>

                    {/* MONTHLY TICKET SALES */}
                    <div className="monthly-chart-card">
                        <h3>Monthly Ticket Sales</h3>

                        <p className="chart-description">
                            Number of tickets sold each month.
                        </p>

                        {analytics?.monthlyTrends?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.monthlyTrends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#334155"
                                    />

                                    <XAxis
                                        dataKey="month"
                                        stroke="#aab6c7"
                                    />

                                    <YAxis stroke="#aab6c7" />

                                    <Tooltip
                                        contentStyle={{
                                            background: '#172235',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />

                                    <Bar
                                        dataKey="ticketsSold"
                                        name="Tickets Sold"
                                        fill="#3b82f6"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No monthly ticket sales data available yet.</p>
                        )}
                    </div>

                    {/* EVENT PERFORMANCE */}
                    <div className="monthly-chart-card event-performance-chart">
                        <h3>Event Performance Comparison</h3>

                        <p className="chart-description">
                            Compare ticket sales across your events.
                        </p>

                        {analytics?.salesByEvent?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={analytics.salesByEvent}
                                    layout="vertical"
                                    margin={{ left: 15, right: 25 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#334155"
                                    />

                                    <XAxis
                                        type="number"
                                        stroke="#aab6c7"
                                    />

                                    <YAxis
                                        type="category"
                                        dataKey="eventTitle"
                                        stroke="#aab6c7"
                                        width={120}
                                        tick={{ fontSize: 11 }}
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            background: '#172235',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />

                                    <Legend />

                                    <Bar
                                        dataKey="ticketsSold"
                                        name="Tickets Sold"
                                        fill="#10b981"
                                        radius={[0, 5, 5, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No event performance data available yet.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* BEST-PERFORMING EVENT */}
            <section className="best-event-section">
                <h2>Best-Performing Event</h2>

                {bestPerformingEvent ? (
                    <div className="best-event-card">
                        <div className="best-event-icon">🏆</div>

                        <div className="best-event-details">
                            <h3>{bestPerformingEvent.eventTitle}</h3>

                            <p className="best-event-description">
                                Your top-performing event based on ticket sales.
                            </p>

                            <div className="best-event-stats">
                                <div>
                                    <span>Tickets Sold</span>
                                    <strong>
                                        {bestPerformingEvent.ticketsSold}
                                    </strong>
                                </div>

                                <div>
                                    <span>Revenue Earned</span>
                                    <strong>
                                        Rs. {bestPerformingEvent.revenue}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>
                        No successful ticket sales yet. Your best-performing
                        event will appear here.
                    </p>
                )}
            </section>

            {/* MY EVENTS */}
            <h2>My Events</h2>

            {events.length === 0 ? (
                <p>You haven't created any events yet.</p>
            ) : (
                <div className="event-grid">
                    {events.map(event => {
                        const eventImages = Array.isArray(event.images)
                            ? event.images
                                .map(image =>
                                    typeof image === 'string'
                                        ? image
                                        : image?.url
                                )
                                .filter(Boolean)
                            : [];

                        const coverImage =
                            eventImages[0] || event.imageUrl;

                        return (
                            <div
                                className="event-card"
                                key={event._id}
                            >
                                {coverImage && (
                                    <img
                                        src={coverImage}
                                        alt={event.title}
                                        style={{
                                            width: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                )}

                                <h3>{event.title}</h3>

                                <p>Type: {event.type}</p>

                                <p>
                                    Date: {new Date(
                                        event.date
                                    ).toLocaleString()}
                                </p>

                                <p>
                                    Location: {event.location || event.venue || 'Not specified'}
                                </p>

                                {event.city && (
                                    <p>City: {event.city}</p>
                                )}

                                {event.venue && (
                                    <p>Venue: {event.venue}</p>
                                )}

                                <p>Price: Rs. {event.price}</p>

                                <p>Available Seats: {event.availableSeats}</p>

                                <p>Photos: {eventImages.length}</p>

                                <button
                                    className="login-btn"
                                    onClick={() => handleEditClick(event)}
                                >
                                    Edit Event
                                </button>

                                <button
                                    className="login-btn"
                                    onClick={() => handleDeleteEvent(event._id)}
                                >
                                    Delete Event
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default OrganizerDashboard;
