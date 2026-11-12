
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import './DigitalTicket.css';

function DigitalTicket({ booking }) {
    const [downloading, setDownloading] = useState(false);

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

            // BACKGROUND
            pdf.setFillColor(240, 245, 255);
            pdf.rect(0, 0, 210, 297, 'F');

            // HEADER
            pdf.setFillColor(30, 64, 175);
            pdf.rect(0, 0, 210, 45, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(25);
            pdf.text('EventEase', 105, 20, {
                align: 'center'
            });

            pdf.setFontSize(12);
            pdf.text('OFFICIAL EVENT ENTRY PASS', 105, 32, {
                align: 'center'
            });

            // EVENT TITLE
            pdf.setTextColor(30, 30, 30);
            pdf.setFontSize(19);

            const titleLines = pdf.splitTextToSize(
                String(booking.event.title || 'Event'),
                170
            );

            pdf.text(titleLines, 20, 65);

            let y = 65 + titleLines.length * 9 + 8;

            // EVENT INFORMATION
            pdf.setFontSize(11);

            const details = [
                `Date: ${booking.event.date || 'N/A'}`,
                `Location: ${booking.event.location || booking.event.venue || 'N/A'}`,
                `Tickets: ${booking.quantity || 1}`,
                `Total: Rs. ${Number(booking.totalAmount || 0).toLocaleString()}`
            ];

            details.forEach(detail => {
                const lines = pdf.splitTextToSize(detail, 170);
                pdf.text(lines, 20, y);
                y += lines.length * 7 + 3;
            });

            // BOOKING REFERENCE
            y += 5;
            pdf.setFont(undefined, 'bold');
            pdf.text('Booking Reference:', 20, y);

            y += 8;
            pdf.setFont(undefined, 'normal');

            const referenceLines = pdf.splitTextToSize(
                booking.bookingReference,
                170
            );

            pdf.text(referenceLines, 20, y);

            // QR CODE
            pdf.addImage(qrCodeImage, 'PNG', 65, 175, 80, 80);

            pdf.setFontSize(11);
            pdf.text('Scan to verify your ticket', 105, 265, {
                align: 'center'
            });

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
                <h3>{booking.event.title}</h3>

                <p>
                    <strong>Date:</strong>{' '}
                    {booking.event.date
                        ? new Date(booking.event.date).toLocaleString('en-GB')
                        : 'N/A'}
                </p>

                <p>
                    <strong>Location:</strong>{' '}
                    {booking.event.location ||
                        booking.event.venue ||
                        'N/A'}
                </p>

                <p>
                    <strong>Tickets:</strong> {booking.quantity}
                </p>

                <p>
                    <strong>Total:</strong>{' '}
                    Rs. {Number(booking.totalAmount || 0).toLocaleString()}
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
