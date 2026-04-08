export const FIELD_LIMITS = {
  email: 254,
  password: 128,
  phone: 10,
  otp: 6,
  personName: 100,
  rollNumber: 30,
  roomNumber: 20,
  hallName: 120,
  entityName: 120,
  location: 200,
  search: 80,
  url: 500,
  upiId: 120,
  price: 12,
  quantityDigits: 5,
  description: 250,
  notes: 250,
  address: 250,
  qrInput: 500,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_NAME_REGEX = /^[A-Za-z]+(?:[A-Za-z .'-]*[A-Za-z])?$/;
const ROOM_NUMBER_REGEX = /^[A-Za-z0-9][A-Za-z0-9 /-]{0,19}$/;
const UPI_ID_REGEX = /^[a-z0-9._-]+@[a-z]{2,}$/i;

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const clampLength = (value, maxLength) => String(value ?? '').slice(0, maxLength);

const trimLeadingWhitespace = (value) => String(value ?? '').replace(/^\s+/, '');

const collapseWhitespace = (value) => String(value ?? '').replace(/\s{2,}/g, ' ');

const sanitizeSingleLine = (value, maxLength) =>
  clampLength(
    collapseWhitespace(trimLeadingWhitespace(String(value ?? '').replace(CONTROL_CHARS_REGEX, ''))),
    maxLength
  );

export const sanitizeEmail = (value) =>
  clampLength(String(value ?? '').replace(/\s+/g, '').toLowerCase(), FIELD_LIMITS.email);

export const sanitizePassword = (value) => clampLength(String(value ?? ''), FIELD_LIMITS.password);

export const sanitizePhone = (value) =>
  clampLength(String(value ?? '').replace(/\D/g, ''), FIELD_LIMITS.phone);

export const sanitizeOtp = (value, maxLength = FIELD_LIMITS.otp) =>
  clampLength(String(value ?? '').replace(/\D/g, ''), maxLength);

export const sanitizePersonName = (value) =>
  clampLength(
    collapseWhitespace(trimLeadingWhitespace(String(value ?? '').replace(/[^A-Za-z.' -]/g, ''))),
    FIELD_LIMITS.personName
  );

export const sanitizeRollNumber = (value) =>
  clampLength(String(value ?? '').replace(/\D/g, ''), FIELD_LIMITS.rollNumber);

export const sanitizeRoomNumber = (value) =>
  clampLength(
    sanitizeSingleLine(value, FIELD_LIMITS.roomNumber).replace(/[^A-Za-z0-9 /-]/g, ''),
    FIELD_LIMITS.roomNumber
  );

export const sanitizeEntityName = (value, maxLength = FIELD_LIMITS.entityName) =>
  clampLength(
    sanitizeSingleLine(value, maxLength).replace(/[^A-Za-z0-9 &().,'/-]/g, ''),
    maxLength
  );

export const sanitizeLocationText = (value, maxLength = FIELD_LIMITS.location) =>
  clampLength(
    sanitizeSingleLine(value, maxLength).replace(/[^A-Za-z0-9 #&().,'/:-]/g, ''),
    maxLength
  );

export const sanitizeUrl = (value) =>
  clampLength(String(value ?? '').replace(/\s+/g, ''), FIELD_LIMITS.url);

export const sanitizeUpiId = (value) =>
  clampLength(
    String(value ?? '')
      .replace(/\s+/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._@-]/g, ''),
    FIELD_LIMITS.upiId
  );

export const sanitizeSearchText = (value) =>
  clampLength(
    sanitizeSingleLine(value, FIELD_LIMITS.search).replace(/[^A-Za-z0-9 &().,'/-]/g, ''),
    FIELD_LIMITS.search
  );

export const sanitizeDecimalInput = (
  value,
  { maxIntegerDigits = 8, decimalPlaces = 2 } = {}
) => {
  const rawValue = String(value ?? '').replace(/[^\d.]/g, '');
  if (!rawValue) {
    return '';
  }

  const [integerPartRaw = '', ...decimalRest] = rawValue.split('.');
  const integerPart = integerPartRaw.slice(0, maxIntegerDigits);
  const decimalPart = decimalRest.join('').slice(0, decimalPlaces);

  if (!integerPart && !decimalPart) {
    return '';
  }

  return decimalRest.length ? `${integerPart || '0'}.${decimalPart}` : integerPart;
};

export const sanitizeIntegerInput = (value, maxDigits = FIELD_LIMITS.quantityDigits) =>
  clampLength(String(value ?? '').replace(/\D/g, ''), maxDigits);

export const sanitizeMultilineText = (value, maxLength = FIELD_LIMITS.notes) =>
  clampLength(
    trimLeadingWhitespace(String(value ?? '').replace(CONTROL_CHARS_REGEX, '')),
    maxLength
  );

export const sanitizeUnstructuredText = (value, maxLength = FIELD_LIMITS.qrInput) =>
  clampLength(trimLeadingWhitespace(String(value ?? '').replace(CONTROL_CHARS_REGEX, '')), maxLength);

export const getInlineValidationMessage = (
  fieldType,
  value,
  { required = false } = {}
) => {
  const normalizedValue = String(value ?? '');
  const trimmedValue = normalizedValue.trim();

  if (!trimmedValue) {
    return required ? 'This field is required.' : '';
  }

  switch (fieldType) {
    case 'email':
      return EMAIL_REGEX.test(trimmedValue) ? '' : 'Enter a valid email address.';
    case 'password':
      return trimmedValue.length >= 8 ? '' : 'Use at least 8 characters.';
    case 'phone':
      return trimmedValue.length === FIELD_LIMITS.phone ? '' : 'Enter a 10-digit phone number.';
    case 'otp':
      return trimmedValue.length === FIELD_LIMITS.otp ? '' : 'Enter the 6-digit OTP.';
    case 'personName':
      return PERSON_NAME_REGEX.test(trimmedValue)
        ? ''
        : 'Use letters, spaces, apostrophes, periods, or hyphens only.';
    case 'rollNumber':
      return /^\d+$/.test(trimmedValue) ? '' : 'Use digits only.';
    case 'roomNumber':
      return ROOM_NUMBER_REGEX.test(trimmedValue)
        ? ''
        : 'Use letters, numbers, spaces, slash, or hyphen only.';
    case 'upiId':
      return UPI_ID_REGEX.test(trimmedValue) ? '' : 'Enter a valid UPI ID.';
    case 'url': {
      if (/^rtsp:\/\//i.test(trimmedValue)) {
        return '';
      }

      try {
        const parsed = new URL(trimmedValue);
        return /^https?:$/i.test(parsed.protocol) ? '' : 'Enter a valid URL.';
      } catch {
        return 'Enter a valid URL.';
      }
    }
    default:
      return '';
  }
};

export const STANDARD_INPUT_PROPS = {
  email: {
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    maxLength: FIELD_LIMITS.email,
  },
  password: {
    minLength: 8,
    maxLength: FIELD_LIMITS.password,
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
  },
  phone: {
    type: 'tel',
    inputMode: 'numeric',
    autoComplete: 'tel',
    maxLength: FIELD_LIMITS.phone,
  },
  otp: {
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'one-time-code',
    maxLength: FIELD_LIMITS.otp,
  },
  personName: {
    type: 'text',
    inputMode: 'text',
    autoComplete: 'name',
    autoCapitalize: 'words',
    maxLength: FIELD_LIMITS.personName,
  },
  rollNumber: {
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'off',
    autoCorrect: 'off',
    spellCheck: false,
    maxLength: FIELD_LIMITS.rollNumber,
  },
  roomNumber: {
    type: 'text',
    inputMode: 'text',
    autoCapitalize: 'characters',
    maxLength: FIELD_LIMITS.roomNumber,
  },
  search: {
    type: 'text',
    inputMode: 'search',
    autoCorrect: 'off',
    spellCheck: false,
    maxLength: FIELD_LIMITS.search,
  },
  url: {
    type: 'url',
    inputMode: 'url',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    maxLength: FIELD_LIMITS.url,
  },
  upiId: {
    type: 'text',
    inputMode: 'email',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    maxLength: FIELD_LIMITS.upiId,
  },
  quantity: {
    inputMode: 'numeric',
    min: '0',
  },
  price: {
    inputMode: 'decimal',
    min: '0',
    step: '0.01',
  },
};
