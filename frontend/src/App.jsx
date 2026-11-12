import { API_BASE_URL } from './api';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import Auth from './Auth';
import OrganizerDashboard from './OrganizerDashboard';
import DigitalTicket from './DigitalTicket';
import AdminDashboard from './AdminDashboard';
import CustomerInsights from './CustomerInsights';

// SUPPORTED PAKISTANI CITIES
const PAKISTAN_CITIES = [
  'All Cities',
  'Karachi',
  'Hyderabad',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Gujranwala'
];

// SUPPORTED EVENT CATEGORIES
const EVENT_CATEGORIES = [
  'All Categories',
  'Music',
  'Technology',
  'Business',
  'Education',
  'Arts',
  'Food',
  'Sports',
  'Community',
  'Other'
];

// CHECK WHETHER AN EVENT IS EXTERNAL
function isExternalEvent(event) {
  return event?.eventSource === 'External';
}

// NORMALIZE CITY TEXT FOR MATCHING
function normalizeCity(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(pakistan|sindh|punjab|province)\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// NORMALIZE CATEGORY TEXT FOR MATCHING
function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// CHECK WHETHER AN EVENT BELONGS TO THE SELECTED CITY
function eventMatchesCity(event, selectedCity) {
  if (!selectedCity || selectedCity === 'All Cities') {
    return true;
  }

  const target = normalizeCity(selectedCity);

  const eventLocations = [
    event.city,
    event.location,
    event.venue
  ].filter(Boolean);

  return eventLocations.some(value => {
    const normalized = normalizeCity(value);

    return (
      normalized === target ||
      normalized.startsWith(target + ' ') ||
      normalized.endsWith(' ' + target) ||
      normalized.includes(' ' + target + ' ')
    );
  });
}

// GENERATE GOOGLE MAPS SEARCH URL
function getMapUrl(event) {
  const destination =
    event.coordinates?.latitude != null &&
      event.coordinates?.longitude != null
      ? `${event.coordinates.latitude},${event.coordinates.longitude}`
      : [
        event.venue,
        event.location,
        event.city,
        'Pakistan'
      ].filter(Boolean).join(', ');

  if (!destination.trim()) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

// CALCULATE DISTANCE BETWEEN TWO COORDINATES
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = value => value * Math.PI / 180;

  const earthRadius = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

// GET EVENT COORDINATES
function getEventCoordinates(event) {
  const latitude =
    event.coordinates?.latitude ??
    event.latitude;

  const longitude =
    event.coordinates?.longitude ??
    event.longitude;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return null;
  }

  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

// FORMAT EVENT PRICE
function getEventPrice(event) {
  if (event.priceKnown === false) {
    return event.priceLabel || 'Price not confirmed';
  }

  if (event.priceLabel) {
    return event.priceLabel;
  }

  if (Number(event.price) === 0) {
    return 'Free';
  }

  return `PKR ${Number(event.price || 0).toLocaleString()}`;
}

// REUSABLE EVENT IMAGE COMPONENT
function EventImage({ event, large = false }) {
  const fallbackIcon =
    event.icon || (event.type === 'Online' ? '💻' : '🎉');

  return (
    <div className={`event-image ${large ? 'event-image-large' : ''}`}>
      <div className="event-image-fallback">
        <span>{fallbackIcon}</span>
      </div>

      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title || 'Event'}
          loading="lazy"
          onError={e => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {event.category && (
        <span className="event-image-category">
          {event.category}
        </span>
      )}
    </div>
  );
}

function App() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // SCROLL REFERENCES
  const eventDetailsRef = useRef(null);
  const eventsSectionRef = useRef(null);
  const ticketRef = useRef(null);

  // AUTHENTICATION
  const [showAuth, setShowAuth] = useState(false);

  // BOOKING
  const [idempotencyKey, setIdempotencyKey] = useState(null);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // CUSTOMER BOOKINGS
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // BACKEND AND EVENTS
  const [backendMessage, setBackendMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  // DASHBOARDS
  const [showOrganizerDashboard, setShowOrganizerDashboard] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // LOCATION DISCOVERY
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [nearbyMode, setNearbyMode] = useState(false);

  // RESTORE USER SESSION
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('eventeaseUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });

  // PROFILE
  const [profile, setProfile] = useState(null);
  const [profileMessage, setProfileMessage] = useState('');
  // SMART EVENT RECOMMENDATIONS
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [recommendationsRefresh, setRecommendationsRefresh] = useState(0);

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem('eventeaseUser');

    setCurrentUser(null);
    setProfile(null);
    setProfileMessage('');

    setShowOrganizerDashboard(false);
    setSelectedEvent(null);
    setShowAdminDashboard(false);
    setShowMyBookings(false);
  }

  // FETCH PROFILE
  async function fetchProfile() {
    if (!currentUser?.token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/profile`
        , {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(data.message);
        return;
      }

      setProfile(data.user);
      setProfileMessage(data.message);

    } catch (error) {
      setProfileMessage('Unable to connect to the server.');
    }
  }

  // CHECK BACKEND CONNECTION
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/test`)
      .then(response => response.json())
      .then(data => {
        setBackendMessage(data.message);
      })
      .catch(error => {
        console.error('Backend connection error:', error);
      });
  }, []);

  // FETCH EVENTS FROM MONGODB
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/events`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch events.');
        }

        setEvents(data.events || []);

      } catch (error) {
        setEventsError(error.message);

      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // FETCH PERSONALIZED RECOMMENDATIONS
  useEffect(() => {
    const token = currentUser?.token;
    const role = currentUser?.user?.role;

    // Recommendations are only for customers.
    if (!token || role !== 'customer') {
      setRecommendations([]);
      setRecommendationsError('');
      setRecommendationsLoading(false);
      return;
    }

    let isActive = true;

    async function fetchRecommendations() {
      setRecommendationsLoading(true);
      setRecommendationsError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/recommendations`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            'Failed to load recommendations.'
          );
        }

        if (isActive) {
          setRecommendations(
            data.recommendations || []
          );
        }

      } catch (error) {
        if (isActive) {
          setRecommendationsError(error.message);
          setRecommendations([]);
        }

      } finally {
        if (isActive) {
          setRecommendationsLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      isActive = false;
    };

  }, [currentUser, recommendationsRefresh]);

  // LOCATION-BASED DISCOVERY
  function findNearbyEvents() {
    if (!navigator.geolocation) {
      setLocationMessage(
        'Your browser does not support location discovery.'
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      position => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        const eventsWithCoordinates = events.filter(
          event => getEventCoordinates(event)
        );

        setUserCoordinates(coordinates);
        setNearbyMode(true);
        setSelectedCity('All Cities');

        if (eventsWithCoordinates.length === 0) {
          setLocationMessage(
            'Your location was found, but no events have venue coordinates yet. City-based discovery is still available.'
          );
        } else {
          setLocationMessage(
            `${eventsWithCoordinates.length} event(s) have location coordinates and can be sorted by distance.`
          );
        }

        setLocationLoading(false);

        setTimeout(() => {
          eventsSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      },
      error => {
        let message = 'Unable to access your location.';

        if (error.code === 1) {
          message = 'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === 2) {
          message = 'Your location is currently unavailable.';
        } else if (error.code === 3) {
          message = 'Location request timed out. Please try again.';
        }

        setLocationMessage(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  // SEARCH, CITY, CATEGORY AND TYPE FILTERS
  const filteredEvents = events
    .filter(event => {
      const matchesType =
        filter === 'All' || event.type === filter;

      const matchesCity = eventMatchesCity(event, selectedCity);

      const matchesCategory =
        selectedCategory === 'All Categories' ||
        normalizeCategory(event.category) ===
        normalizeCategory(selectedCategory);

      const searchText = search.toLowerCase();

      const matchesSearch = [
        event.title,
        event.description,
        event.city,
        event.location,
        event.venue,
        event.category,
        event.providerName
      ].some(value =>
        String(value || '').toLowerCase().includes(searchText)
      );

      return (
        matchesType &&
        matchesCity &&
        matchesCategory &&
        matchesSearch
      );
    })
    .map(event => {
      if (!nearbyMode || !userCoordinates) {
        return event;
      }

      const coordinates = getEventCoordinates(event);

      if (!coordinates) {
        return { ...event, distanceFromUser: null };
      }

      return {
        ...event,
        distanceFromUser: calculateDistance(
          userCoordinates.latitude,
          userCoordinates.longitude,
          coordinates.latitude,
          coordinates.longitude
        )
      };
    })
    .sort((a, b) => {
      if (!nearbyMode) return 0;

      if (a.distanceFromUser == null) return 1;
      if (b.distanceFromUser == null) return -1;

      return a.distanceFromUser - b.distanceFromUser;
    });

  // HANDLE CUSTOMER BOOKING
  async function handleBookTickets() {
    if (isExternalEvent(selectedEvent)) {
      setBookingMessage(
        'This event is managed by its external organizer. Please use the official registration link.'
      );
      return;
    }

    if (!currentUser || currentUser.user.role !== 'customer') {
      setBookingMessage(
        'Please log in with a customer account to book tickets.'
      );
      return;
    }

    if (
      bookingQuantity < 1 ||
      bookingQuantity > selectedEvent.availableSeats
    ) {
      setBookingMessage('Please select a valid ticket quantity.');
      return;
    }

    const requestKey = idempotencyKey || crypto.randomUUID();

    if (!idempotencyKey) {
      setIdempotencyKey(requestKey);
    }

    setBookingLoading(true);
    setBookingMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`,
            'Idempotency-Key': requestKey
          },
          body: JSON.stringify({
            eventId: selectedEvent._id,
            quantity: Number(bookingQuantity)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed.');
      }

      const updatedSeats =
        selectedEvent.availableSeats - Number(bookingQuantity);

      setSelectedEvent({
        ...selectedEvent,
        availableSeats: updatedSeats
      });

      setEvents(previousEvents =>
        previousEvents.map(event =>
          event._id === selectedEvent._id
            ? { ...event, availableSeats: updatedSeats }
            : event
        )
      );

      setBookingMessage(
        `Booking confirmed! Reference: ${data.booking.bookingReference}`
      );

      setRecommendationsRefresh(previous => previous + 1);

      setIdempotencyKey(null);
      setBookingQuantity(1);

    } catch (error) {
      setBookingMessage(error.message);

    } finally {
      setBookingLoading(false);
    }
  }

  // FETCH CUSTOMER BOOKINGS
  async function fetchMyBookings() {
    if (!currentUser || currentUser.user.role !== 'customer') {
      return;
    }

    setBookingsLoading(true);
    setBookingsError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch bookings.');
      }

      setMyBookings(data.bookings || []);

    } catch (error) {
      setBookingsError(error.message);

    } finally {
      setBookingsLoading(false);
    }
  }

  // CANCEL CUSTOMER BOOKING
  async function handleCancelBooking(bookingId) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    );

    if (!confirmed) return;

    setCancellingBookingId(bookingId);
    setCancellationMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cancellation failed.');
      }

      setCancellationMessage(data.message);
      await fetchMyBookings();

      setRecommendationsRefresh(previous => previous + 1);

    } catch (error) {
      setCancellationMessage(error.message);

    } finally {
      setCancellingBookingId(null);
    }
  }

  return (
    <>
      {showMyBookings ? (
        <div className="my-bookings">
          <h2>My Bookings</h2>

          <button onClick={() => setShowMyBookings(false)}>
            Back to Events
          </button>

          <CustomerInsights token={currentUser?.token} />

          {bookingsLoading && <p>Loading your bookings...</p>}

          {bookingsError && <p>{bookingsError}</p>}

          {cancellationMessage && (
            <p>{cancellationMessage}</p>
          )}

          {!bookingsLoading &&
            !bookingsError &&
            myBookings.length === 0 && (
              <p>You haven't booked any tickets yet.</p>
            )}

          {!bookingsLoading && myBookings.map(booking => (
            <div className="booking-card" key={booking._id}>
              <h3>{booking.event?.title || 'Event unavailable'}</h3>

              <p>
                Date: {booking.event?.date
                  ? new Date(booking.event.date).toLocaleDateString()
                  : 'N/A'}
              </p>

              <p>Tickets: {booking.quantity}</p>
              <p>Total Amount: Rs. {booking.totalAmount}</p>
              <p>Booking Reference: {booking.bookingReference}</p>
              <p>Status: {booking.status}</p>

              {booking.status === 'Confirmed' && (
                <button
                  onClick={() => {
                    setSelectedBooking(booking);

                    setTimeout(() => {
                      ticketRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 100);
                  }}
                >
                  View Ticket
                </button>
              )}

              {booking.status === 'Confirmed' && (
                <button
                  onClick={() => handleCancelBooking(booking._id)}
                  disabled={cancellingBookingId === booking._id}
                >
                  {cancellingBookingId === booking._id
                    ? 'Cancelling...'
                    : 'Cancel Booking'}
                </button>
              )}
            </div>
          ))}

          {selectedBooking && (
            <div className="ticket-view" ref={ticketRef}>
              <button onClick={() => setSelectedBooking(null)}>
                Close Ticket
              </button>

              <DigitalTicket booking={selectedBooking} />
            </div>
          )}
        </div>
      ) : (
        <div className="app">

          {/* RESPONSIVE NAVIGATION */}
          <nav className="navbar">
            <h2 className="logo">
              Event<span>Ease</span>
            </h2>

            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(previous => !previous)}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>

            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#explore-events" onClick={() => setMobileMenuOpen(false)}>Explore Events</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            </div>

            <div className={`nav-actions ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              {currentUser ? (
                <>
                  <span className="login-btn">
                    Welcome, {currentUser.user.name}!
                  </span>

                  {currentUser.user.role === 'customer' && (
                    <button
                      className="login-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowMyBookings(true);
                        setShowOrganizerDashboard(false);
                        setShowAdminDashboard(false);
                        setSelectedEvent(null);
                        setProfile(null);
                        fetchMyBookings();
                      }}
                    >
                      My Bookings
                    </button>
                  )}

                  {currentUser.user.role === 'organizer' && (
                    <button
                      className="login-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowOrganizerDashboard(true);
                        setShowAdminDashboard(false);
                        setShowMyBookings(false);
                        setSelectedEvent(null);
                        setProfile(null);
                      }}
                    >
                      Organizer Dashboard
                    </button>
                  )}

                  {currentUser.user.role === 'admin' && (
                    <button
                      className="login-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowAdminDashboard(true);
                        setShowOrganizerDashboard(false);
                        setShowMyBookings(false);
                        setSelectedEvent(null);
                        setProfile(null);
                      }}
                    >
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    className="login-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      fetchProfile();
                    }}
                  >
                    My Profile
                  </button>

                  <button
                    className="login-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="login-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuth(true);
                  }}
                >
                  Login
                </button>
              )}
            </div>
          </nav>

          {/* ORGANIZER DASHBOARD */}
          {showOrganizerDashboard &&
            currentUser?.user?.role === 'organizer' && (
              <OrganizerDashboard
                onBack={() => {
                  setShowOrganizerDashboard(false);
                  setSelectedEvent(null);
                }}
              />
            )}

          {/* ADMIN DASHBOARD */}
          {showAdminDashboard &&
            currentUser?.user?.role === 'admin' && (
              <AdminDashboard
                onBack={() => {
                  setShowAdminDashboard(false);
                  setSelectedEvent(null);
                }}
              />
            )}

          {/* USER PROFILE */}
          {profile && (
            <div className="profile-section">
              <h2>My Profile</h2>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
              <p>{profileMessage}</p>
            </div>
          )}

          {/* HERO */}
          {!showOrganizerDashboard && !showAdminDashboard && (
            <section className="hero" id="home">
              <p className="tagline">YOUR EVENTS, YOUR MOMENTS</p>

              <h1>
                Discover Events.<br />
                Create <span>Memories.</span>
              </h1>

              <p className="description">
                Find amazing events across Pakistan, book your tickets,
                and experience unforgettable moments.
              </p>

              <button
                className="explore-btn"
                onClick={() => {
                  document.getElementById('explore-events')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
              >
                Explore Events →
              </button>

              <button
                className="explore-btn"
                onClick={findNearbyEvents}
                disabled={locationLoading}
              >
                {locationLoading
                  ? 'Finding your location...'
                  : '📍 Find Events Near Me'}
              </button>
            </section>
          )}

          {backendMessage && (
            <p className="backend-status">
              {backendMessage}
            </p>
          )}

          {/* STEP 51 - SMART EVENT RECOMMENDATIONS */}
          {!showOrganizerDashboard &&
            !showAdminDashboard &&
            currentUser?.user?.role === 'customer' && (
              <section className="recommendations-section">

                <div className="recommendations-heading">
                  <div>
                    <p className="recommendations-eyebrow">
                      PERSONALIZED FOR YOU
                    </p>

                    <h2>Recommended Events</h2>

                    <p>
                      Events selected using your interests
                      and booking history.
                    </p>
                  </div>

                  <button
                    className="recommendations-refresh"
                    onClick={() =>
                      setRecommendationsRefresh(
                        previous => previous + 1
                      )
                    }
                    disabled={recommendationsLoading}
                  >
                    {recommendationsLoading
                      ? 'Loading...'
                      : '↻ Refresh'}
                  </button>
                </div>

                {recommendationsLoading && (
                  <p className="recommendations-message">
                    Finding events you might enjoy...
                  </p>
                )}

                {recommendationsError && (
                  <p className="recommendations-error">
                    {recommendationsError}
                  </p>
                )}

                {!recommendationsLoading &&
                  !recommendationsError &&
                  recommendations.length === 0 && (
                    <div className="recommendations-empty">
                      <h3>No recommendations available yet</h3>
                      <p>
                        Add more upcoming events and check again.
                      </p>
                    </div>
                  )}

                {!recommendationsLoading &&
                  recommendations.length > 0 && (
                    <div className="recommendations-grid">

                      {recommendations.map(event => {
                        const external =
                          isExternalEvent(event);

                        const mapUrl = getMapUrl(event);

                        return (
                          <article
                            className="recommendation-card"
                            key={event._id}
                          >
                            <EventImage event={event} />

                            <div className="recommendation-content">

                              <div className="recommendation-tags">
                                <span className="recommendation-category">
                                  {event.category || 'Other'}
                                </span>

                                {external && (
                                  <span className="recommendation-external">
                                    External Event
                                  </span>
                                )}
                              </div>

                              <h3>{event.title}</h3>

                              <p className="recommendation-reason">
                                {event.recommendationReason}
                              </p>

                              <p>
                                📅{' '}
                                {new Date(
                                  event.date
                                ).toLocaleDateString('en-GB')}
                              </p>

                              <p>
                                📍{' '}
                                {event.venue ||
                                  event.location ||
                                  event.city ||
                                  'Location not specified'}
                              </p>

                              <p>
                                💰 {getEventPrice(event)}
                              </p>

                              <button
                                className="recommendation-view-button"
                                onClick={() => {
                                  setIdempotencyKey(null);
                                  setBookingQuantity(1);
                                  setBookingMessage('');
                                  setSelectedEvent(event);

                                  setTimeout(() => {
                                    eventDetailsRef.current?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start'
                                    });
                                  }, 100);
                                }}
                              >
                                View Event Details
                              </button>

                              {external &&
                                event.bookingUrl && (
                                  <a
                                    className="external-booking-link"
                                    href={event.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Register with Organizer ↗
                                  </a>
                                )}

                              {mapUrl && (
                                <a
                                  className="map-link"
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View on Google Maps ↗
                                </a>
                              )}

                            </div>
                          </article>
                        );
                      })}

                    </div>
                  )}
              </section>
            )}

          {/* EVENT DISCOVERY */}
          {!showOrganizerDashboard && !showAdminDashboard && (
            <section
              className="events"
              id="explore-events"
              ref={eventsSectionRef}
            >
              <h2>Discover Events Across Pakistan</h2>

              <p>
                Explore local events, exhibitions, technology gatherings,
                festivals and more.
              </p>

              <input
                type="text"
                className="search-input"
                placeholder="Search events, cities, venues or categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              {/* CITY FILTER */}
              <div className="discovery-filters">
                <label htmlFor="city-filter">Discover by city</label>

                <select
                  id="city-filter"
                  value={selectedCity}
                  onChange={e => {
                    setSelectedCity(e.target.value);
                    setNearbyMode(false);
                  }}
                >
                  {PAKISTAN_CITIES.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                {/* CATEGORY FILTER */}
                <label htmlFor="category-filter">Discover by category</label>

                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  {EVENT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* EVENT TYPE FILTER */}
              <div className="filter-buttons">
                {['All', 'In-person', 'Online'].map(type => (
                  <button
                    key={type}
                    className={
                      filter === type
                        ? 'filter-btn active'
                        : 'filter-btn'
                    }
                    onClick={() => setFilter(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {nearbyMode && (
                <p className="location-message">
                  📍 Showing events sorted by distance where coordinates
                  are available.
                  <button
                    onClick={() => {
                      setNearbyMode(false);
                      setUserCoordinates(null);
                      setLocationMessage('');
                    }}
                  >
                    Clear nearby mode
                  </button>
                </p>
              )}

              {locationMessage && (
                <p className="location-message">
                  {locationMessage}
                </p>
              )}

              <div className="event-grid">
                {eventsLoading ? (
                  <p>Loading events from database...</p>

                ) : eventsError ? (
                  <p className="error-message">
                    Error: {eventsError}
                  </p>

                ) : filteredEvents.length > 0 ? (
                  filteredEvents.map(event => {
                    const external = isExternalEvent(event);
                    const mapUrl = getMapUrl(event);

                    return (
                      <div className="event-card" key={event._id}>

                        <EventImage event={event} />

                        <div className="event-card-content">

                          {external && (
                            <span className="external-event-badge">
                              External Event
                            </span>
                          )}

                          <span
                            className={`event-type ${event.type === 'Online'
                              ? 'online'
                              : 'in-person'
                              }`}
                          >
                            {event.type}
                          </span>

                          <h3>{event.title}</h3>

                          <p className="event-description">
                            {event.description}
                          </p>

                          <div className="event-details">
                            <p>
                              📅 {new Date(event.date).toLocaleDateString('en-GB')}
                            </p>

                            <p>
                              📍 {event.venue || event.location}
                            </p>

                            {event.city && (
                              <p>🏙️ {event.city}</p>
                            )}

                            {event.category && (
                              <p>Category: {event.category}</p>
                            )}

                            {external && event.providerName && (
                              <p>
                                Organizer: {event.providerName}
                              </p>
                            )}

                            {nearbyMode &&
                              event.distanceFromUser != null && (
                                <p>
                                  📍 {event.distanceFromUser.toFixed(1)} km away
                                </p>
                              )}

                            <h4>
                              {getEventPrice(event)}
                            </h4>
                          </div>

                          {external && (
                            <span className="external-event-note">
                              Registration managed by the event organizer.
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setIdempotencyKey(null);
                              setBookingQuantity(1);
                              setBookingMessage('');
                              setSelectedEvent(event);

                              setTimeout(() => {
                                eventDetailsRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start'
                                });
                              }, 100);
                            }}
                          >
                            View Event
                          </button>

                          {external && event.bookingUrl && (
                            <a
                              className="external-booking-link"
                              href={event.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Register with Organizer ↗
                            </a>
                          )}

                          {mapUrl && (
                            <a
                              className="map-link"
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View on Google Maps ↗
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })

                ) : (
                  <p>No events found. Try another city, category or search.</p>
                )}
              </div>
            </section>
          )}

          {/* EVENT DETAILS PAGE */}
          {!showOrganizerDashboard &&
            !showAdminDashboard &&
            selectedEvent && (
              <section
                className="event-details-page"
                ref={eventDetailsRef}
              >
                <button
                  className="filter-btn"
                  onClick={() => {
                    setSelectedEvent(null);
                    setIdempotencyKey(null);
                    setBookingQuantity(1);
                    setBookingMessage('');

                    setTimeout(() => {
                      eventsSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 100);
                  }}
                >
                  ← Back to Events
                </button>

                <div className="details-card">

                  <EventImage event={selectedEvent} large />

                  {isExternalEvent(selectedEvent) && (
                    <span className="external-event-badge">
                      External Event
                    </span>
                  )}

                  <span
                    className={`event-type ${selectedEvent.type === 'Online'
                      ? 'online'
                      : 'in-person'
                      }`}
                  >
                    {selectedEvent.type}
                  </span>

                  <h1>{selectedEvent.title}</h1>

                  <p>{selectedEvent.description}</p>

                  <hr />

                  <h3>Event Information</h3>

                  <p>
                    📅 {new Date(selectedEvent.date).toLocaleString('en-GB')}
                  </p>

                  <p>
                    📍 {selectedEvent.venue || selectedEvent.location}
                  </p>

                  {selectedEvent.city && (
                    <p>🏙️ {selectedEvent.city}, Pakistan</p>
                  )}

                  {selectedEvent.category && (
                    <p>Category: {selectedEvent.category}</p>
                  )}

                  {isExternalEvent(selectedEvent) &&
                    selectedEvent.providerName && (
                      <p>
                        Organizer / Provider: {selectedEvent.providerName}
                      </p>
                    )}

                  <h3>
                    Ticket Price: {getEventPrice(selectedEvent)}
                  </h3>

                  {/* GOOGLE MAPS */}
                  {getMapUrl(selectedEvent) && (
                    <div className="event-map-section">
                      <h3>Event Location</h3>

                      <p>
                        Find the venue and get directions using Google Maps.
                      </p>

                      <a
                        className="map-link"
                        href={getMapUrl(selectedEvent)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📍 Open Venue in Google Maps
                      </a>
                    </div>
                  )}

                  {/* EXTERNAL EVENT REGISTRATION */}
                  {isExternalEvent(selectedEvent) ? (
                    <div className="external-booking-section">
                      <h3>Register Through the Official Organizer</h3>

                      <p>
                        This event is listed on EventEase for discovery.
                        Tickets, registration, payment and availability
                        are managed by the external organizer.
                      </p>

                      {selectedEvent.priceKnown === false && (
                        <p>
                          Ticket price has not yet been confirmed.
                          Check the organizer's website for current pricing.
                        </p>
                      )}

                      {selectedEvent.bookingUrl ? (
                        <a
                          className="external-booking-link"
                          href={selectedEvent.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Register / Get Tickets ↗
                        </a>
                      ) : (
                        <p>
                          No official registration link is currently available.
                        </p>
                      )}

                      {selectedEvent.sourceUrl && (
                        <p>
                          <a
                            href={selectedEvent.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Original Event Source ↗
                          </a>
                        </p>
                      )}

                      <p>
                        EventEase does not process payments or issue tickets
                        for this external event.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* EVENTEASE INTERNAL EVENT SEATS */}
                      <p>
                        Available Tickets: {selectedEvent.availableSeats}
                      </p>

                      {/* CUSTOMER BOOKING SECTION */}
                      {!currentUser && (
                        <button onClick={() => setShowAuth(true)}>
                          Login to Book Tickets
                        </button>
                      )}

                      {currentUser?.user?.role === 'customer' && (
                        <div className="booking-section">
                          <h3>Book Your Tickets</h3>

                          {selectedEvent.availableSeats > 0 ? (
                            <>
                              <label>Select Quantity:</label>

                              <select
                                value={bookingQuantity}
                                onChange={e => {
                                  setBookingQuantity(Number(e.target.value));
                                  setIdempotencyKey(null);
                                }}
                              >
                                {Array.from(
                                  {
                                    length: Math.min(
                                      10,
                                      selectedEvent.availableSeats
                                    )
                                  },
                                  (_, i) => i + 1
                                ).map(quantity => (
                                  <option key={quantity} value={quantity}>
                                    {quantity}{' '}
                                    {quantity === 1 ? 'Ticket' : 'Tickets'}
                                  </option>
                                ))}
                              </select>

                              <p>
                                Total Amount: Rs.{' '}
                                {(
                                  selectedEvent.price * bookingQuantity
                                ).toLocaleString()}
                              </p>

                              <button
                                onClick={handleBookTickets}
                                disabled={bookingLoading}
                              >
                                {bookingLoading
                                  ? 'Processing...'
                                  : 'Book Tickets'}
                              </button>
                            </>
                          ) : (
                            <p>Sorry, all tickets are sold out.</p>
                          )}

                          {bookingMessage && (
                            <p>{bookingMessage}</p>
                          )}
                        </div>
                      )}

                      {currentUser &&
                        currentUser.user.role !== 'customer' && (
                          <p>
                            Only customer accounts can book tickets.
                          </p>
                        )}
                    </>
                  )}
                </div>
              </section>
            )}

          {/* FOOTER */}
          <footer id="about">
            <h3>About EventEase</h3>
            <p>
              EventEase makes discovering events and booking tickets
              simple, convenient, and enjoyable.
            </p>
            <p>
              Discover Pakistani events and register through trusted
              event organizers.
            </p>
            <p>© 2026 EventEase. All rights reserved.</p>
          </footer>

          {/* AUTHENTICATION */}
          {showAuth && (
            <Auth
              onClose={() => setShowAuth(false)}
              onLogin={(token, user) => {
                const userData = { token, user };

                localStorage.setItem(
                  'eventeaseUser',
                  JSON.stringify(userData)
                );

                setCurrentUser(userData);
                setShowAuth(false);
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

export default App;