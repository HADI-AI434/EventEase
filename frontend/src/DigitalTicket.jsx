
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import './DigitalTicket.css';

// GENERATE GOOGLE MAPS LINK
function getMapUrl(event) {
    if (!event || event.type === 'Online') {
        return null;
    }

    const latitude = event.coordinates?.latitude;
    const longitude = event.coordinates?.longitude;

    const hasCoordinates =
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180;

    const destination = hasCoordinates
        ? `${latitude},${longitude}`
        : [
            event.venue,
            event.location,
            event.city,
            event.province,
            event.country || 'Pakistan'
        ].filter(Boolean).join(', ');

    if (!destination.trim()) {
        return null;
    }

    const params = new URLSearchParams({
        api: '1',
        query: destination
    });

    return `https://www.google.com/maps/search/?${params.toString()}`;
}

function DigitalTicket({ booking }) {
    const [downloading, setDownloading] = useState(false);

    const event = booking?.event;
    const mapUrl = getMapUrl(event);
    const isInPerson = event?.type !== 'Online';

    const venueName = event?.venue || '';
    const fullAddress = event?.location || '';

    // DOWNLOAD PDF TICKET
    async function downloadTicket() {
        if (!booking?.bookingReference || !booking?.event) {
            alert('Ticket information is incomplete.');
            return;
        }

        setDownloading(true);

        try {
            const qrCodeImage = await QRCode.toDataURL(
                booking.bookingReference,
                {
                    width: 400,
                    margin: 2,
                    errorCorrectionLevel: 'H'
                }
            );

            const pdf = new jsPDF();

            // LIGHT BACKGROUND
            pdf.setFillColor(247, 248, 252);
            pdf.rect(0, 0, 210, 297, 'F');

            // INDIGO HEADER
            pdf.setFillColor(81, 70, 213);
            pdf.rect(0, 0, 210, 45, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(25);
            pdf.setFont(undefined, 'bold');

            pdf.text('EventEase', 105, 20, {
                align: 'center'
            });

            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');

            pdf.text('OFFICIAL EVENT ENTRY PASS', 105, 32, {
                align: 'center'
            });

            // EVENT TITLE
            pdf.setTextColor(32, 36, 58);
            pdf.setFontSize(19);
            pdf.setFont(undefined, 'bold');

            const titleLines = pdf.splitTextToSize(
                String(event.title || 'Event'),
                170
            );

            let y = 60;

            pdf.text(titleLines, 20, y);
            y += titleLines.length * 9 + 8;

            // EVENT INFORMATION
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');

            const addDetail = (label, value) => {
                const lines = pdf.splitTextToSize(
                    `${label}: ${String(value || 'N/A')}`,
                    165
                );

                pdf.text(lines, 20, y);
                y += lines.length * 6 + 3;
            };

            addDetail(
                'Date',
                event.date
                    ? new Date(event.date).toLocaleString('en-GB')
                    : 'N/A'
            );

            if (isInPerson) {
                if (venueName) {
                    addDetail('Venue', venueName);
                }

                if (fullAddress) {
                    addDetail('Full Address', fullAddress);
                }

                if (event.city) {
                    addDetail('City', event.city);
                }

                if (event.province) {
                    addDetail('Province', event.province);
                }

                addDetail('Country', event.country || 'Pakistan');
            } else {
                addDetail(
                    'Online Location',
                    event.location || 'Online'
                );
            }

            addDetail('Tickets', booking.quantity || 1);

            addDetail(
                'Total',
                `Rs. ${Number(booking.totalAmount || 0).toLocaleString()}`
            );

            // BOOKING REFERENCE
            y += 3;

            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(81, 70, 213);
            pdf.text('Booking Reference:', 20, y);

            y += 7;

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(32, 36, 58);

            const referenceLines = pdf.splitTextToSize(
                booking.bookingReference,
                165
            );

            pdf.text(referenceLines, 20, y);
            y += referenceLines.length * 6 + 5;

            // CLICKABLE MAP LINK
            if (mapUrl) {
                pdf.setTextColor(81, 70, 213);
                pdf.setFont(undefined, 'bold');

                pdf.textWithLink(
                    'Open Event Location in Google Maps',
                    20,
                    y,
                    { url: mapUrl }
                );

                y += 9;

                pdf.setTextColor(32, 36, 58);
                pdf.setFont(undefined, 'normal');
            }

            // QR CODE POSITION
            const qrSize = 65;
            const qrX = (210 - qrSize) / 2;

            // NEW PAGE IF REQUIRED
            if (y + qrSize + 25 > 285) {
                pdf.addPage();
                pdf.setFillColor(247, 248, 252);
                pdf.rect(0, 0, 210, 297, 'F');
                y = 35;
            }

            pdf.addImage(
                qrCodeImage,
                'PNG',
                qrX,
                y,
                qrSize,
                qrSize
            );

            pdf.setFontSize(10);
            pdf.setTextColor(115, 121, 145);

            pdf.text(
                'Scan to verify your ticket',
                105,
                y + qrSize + 8,
                { align: 'center' }
            );

            pdf.save(
                `EventEase-Ticket-${booking.bookingReference}.pdf`
            );

        } catch (error) {
            console.error('PDF download error:', error);
            alert('Unable to download ticket. Please try again.');

        } finally {
            setDownloading(false);
        }
    }

    if (!booking || !booking.event) {
        return (
            <div className="ticket-unavailable">
                <p>Ticket information is unavailable.</p>
            </div>
        );
    }

    return (
        <div className="digital-ticket">

            <div className="ticket-header">
                <h2>EventEase</h2>
                <span>OFFICIAL E-TICKET</span>
            </div>

            <div className="ticket-body">

                <h3>{event.title}</h3>

                <p>
                    <strong>Date:</strong>{' '}
                    {event.date
                        ? new Date(event.date).toLocaleString('en-GB')
                        : 'N/A'}
                </p>

                {isInPerson ? (
                    <div className="ticket-venue-information">

                        {venueName && (
                            <p>
                                <strong>Venue:</strong>{' '}
                                {venueName}
                            </p>
                        )}

                        {fullAddress && (
                            <p>
                                <strong>Full Address:</strong>{' '}
                                {fullAddress}
                            </p>
                        )}

                        {event.city && (
                            <p>
                                <strong>City:</strong>{' '}
                                {event.city}
                            </p>
                        )}

                        {event.province && (
                            <p>
                                <strong>Province:</strong>{' '}
                                {event.province}
                            </p>
                        )}

                        <p>
                            <strong>Country:</strong>{' '}
                            {event.country || 'Pakistan'}
                        </p>

                        {mapUrl && (
                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link"
                            >
                                Open Event Location in Google Maps
                            </a>
                        )}

                    </div>
                ) : (
                    <p>
                        <strong>Online Location:</strong>{' '}
                        {event.location || 'Online'}
                    </p>
                )}

                <p>
                    <strong>Tickets:</strong>{' '}
                    {booking.quantity || 1}
                </p>

                <p>
                    <strong>Total:</strong>{' '}
                    Rs. {Number(
                        booking.totalAmount || 0
                    ).toLocaleString()}
                </p>

                <p>
                    <strong>Booking Reference:</strong>
                    <br />

                    <span className="ticket-reference">
                        {booking.bookingReference}
                    </span>
                </p>

                <div className="ticket-qr">

                    <QRCodeSVG
                        value={booking.bookingReference}
                        size={180}
                        level="H"
                        marginSize={2}
                    />

                    <p>Scan to verify your ticket</p>

                </div>

                <button
                    type="button"
                    className="download-ticket-btn"
                    onClick={downloadTicket}
                    disabled={downloading}
                >
                    {downloading
                        ? 'Preparing PDF...'
                        : 'Download PDF Ticket'}
                </button>

            </div>
        </div>
    );
}

export default DigitalTicket;
