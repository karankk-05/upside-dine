import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, History, Upload, LogOut, User } from 'lucide-react';
import { useVerifyQR } from '../hooks/useVerifyQR';
import VerificationResult from '../components/VerificationResult';
import { FIELD_LIMITS, sanitizeUnstructuredText } from '../../../lib/formValidation';
import '../mess.css';

const QRScannerPage = () => {
  const navigate = useNavigate();
  const [bookingIdInput, setBookingIdInput] = useState('');
  const verifyMutation = useVerifyQR();
  const [lastResult, setLastResult] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const startScanning = async () => {
    setCameraError('');
    setLastResult(null);
    setLastError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        await scannerRef.current.clear().catch(() => {});
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          handleScannedData(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setCameraError(
        err.toString().includes('NotAllowedError')
          ? 'Camera permission denied. Please allow camera access.'
          : err.toString().includes('NotFoundError')
          ? 'No camera found on this device. Try uploading a QR image instead.'
          : `Camera error: ${err.message || err}`
      );
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLastResult(null);
    setLastError(null);

    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = imageUrl;

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Dynamically import jsqr
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScannedData(code.data);
        } else {
          setLastError({ response: { data: { detail: 'Could not read QR code from image. Please try a clearer photo.' } } });
        }
      } catch (err) {
        setLastError({ response: { data: { detail: 'An error occurred while analyzing the image.' } } });
      } finally {
        URL.revokeObjectURL(imageUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    img.onerror = () => {
      setLastError({ response: { data: { detail: 'Invalid image file provided. Could not load.' } } });
      URL.revokeObjectURL(imageUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  const handleScannedData = async (data) => {
    setLastResult(null);
    setLastError(null);

    let payload = {};
    const trimmed = String(data).trim();
    
    // Check if it's a pure number first
    if (/^\d+$/.test(trimmed)) {
      payload.booking_id = parseInt(trimmed, 10);
    } else {
      // Must be a QR string or JSON string
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.qr_code) payload.qr_code = parsed.qr_code;
          else if (parsed.booking_id) payload.booking_id = parsed.booking_id;
          else payload.qr_code = trimmed;
        } else {
          payload.qr_code = trimmed;
        }
      } catch {
        payload.qr_code = trimmed;
      }
    }

    try {
      const result = await verifyMutation.mutateAsync(payload);
      setLastResult(result);
    } catch (err) {
      if (err?.response?.status === 403 && err?.response?.data) {
        const dataCopy = { ...err.response.data };
        const msg = dataCopy.detail || 'Permission denied';
        if (typeof msg === 'string') {
          if (msg.includes('assignment')) {
            dataCopy.detail = 'Your worker account is not assigned to any mess. Contact admin.';
          } else if (msg.includes('permission')) {
            dataCopy.detail = 'You are not logged in as a Mess Worker. Please log out and log back in.';
          }
        }
        setLastError({ ...err, response: { ...err.response, data: dataCopy } });
      } else {
        setLastError(err);
      }
    }
  };

  const handleManualVerify = async () => {
    const trimmed = bookingIdInput.trim();
    if (!trimmed) return;
    setBookingIdInput('');
    await handleScannedData(trimmed);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    window.location.href = '/auth';
  };

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button
          type="button"
          className="mess-back-btn"
          onClick={() => navigate('/profile')}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">QR Scanner</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <div
            style={{
              cursor: 'pointer', width: 36, height: 36,
              background: 'var(--st-light-gray)', border: '2px solid var(--st-accent)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => navigate('/worker/history')}
            title="Scan History"
          >
            <History size={16} color="var(--st-accent)" />
          </div>
          <div
            style={{
              cursor: 'pointer', width: 36, height: 36,
              background: 'var(--st-light-gray)', border: '2px solid var(--st-text-dim)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => navigate('/profile')}
            title="Profile"
          >
            <User size={16} color="var(--st-text-dim)" />
          </div>
        </div>
      </div>

      <div className="mess-content">
        {/* Verification Result */}
        {(lastResult || lastError) && (
          <VerificationResult
            result={lastResult}
            error={lastError}
            onDismiss={() => { setLastResult(null); setLastError(null); }}
          />
        )}

        {/* Camera Scanner */}
        <div className="mess-scanner-card">
          <div
            id="qr-reader"
            style={{
              width: '100%', maxWidth: 350, minHeight: scanning ? 300 : 0,
              margin: '0 auto 16px', borderRadius: 12,
              display: scanning ? 'block' : 'none',
            }}
          />
          {/* Hidden div for file scanning */}
          <div id="qr-file-reader" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }} />
          <style>{`
            #qr-reader video { width: 100% !important; border-radius: 12px; }
            #qr-reader img[alt="Info icon"] { display: none !important; }
            #qr-reader__dashboard { display: none !important; }
          `}</style>

          {!scanning && (
            <div className="mess-scanner-frame" style={{ cursor: 'pointer' }} onClick={startScanning}>
              <Camera size={32} color="var(--st-accent)" />
            </div>
          )}

          <h3 className="mess-scanner-title">{scanning ? 'Scanning...' : 'Scan QR Code'}</h3>
          <p className="mess-scanner-subtitle">
            {scanning
              ? 'Point the camera at a booking QR code'
              : 'Tap the camera icon or use the buttons below'}
          </p>

          {cameraError && (
            <div style={{
              background: 'rgba(255,51,51,0.1)', border: '1px solid #ff3333',
              borderRadius: 8, padding: 12, marginTop: 12, color: '#ff3333', fontSize: 13,
              textAlign: 'center',
            }}>
              {cameraError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              className={scanning ? 'mess-btn-secondary' : 'mess-btn-primary'}
              onClick={scanning ? stopScanning : startScanning}
              style={{ flex: 1 }}
            >
              {scanning ? 'Stop Camera' : '📷 Open Camera'}
            </button>

            <button
              className="mess-btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1 }}
            >
              <Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Upload QR Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Manual Entry */}
        <div className="mess-divider-text">OR</div>

        <div className="mess-input-group">
          <label className="mess-input-label">Booking ID / QR Code (Manual Entry)</label>
          <input
            className="mess-input-field"
            type="text"
            value={bookingIdInput}
            onChange={(e) => setBookingIdInput(sanitizeUnstructuredText(e.target.value, FIELD_LIMITS.qrInput))}
            placeholder="Enter booking ID (e.g. 1) or QR code string"
            maxLength={FIELD_LIMITS.qrInput}
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
          />
        </div>

        <button
          className="mess-btn-primary"
          onClick={handleManualVerify}
          disabled={!bookingIdInput.trim() || verifyMutation.isPending}
        >
          {verifyMutation.isPending ? 'Verifying...' : 'Verify Booking'}
        </button>
      </div>
    </div>
  );
};

export default QRScannerPage;
