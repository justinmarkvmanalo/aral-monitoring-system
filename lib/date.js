const MANILA_TIME_ZONE = 'Asia/Manila';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getDatePartsInTimeZone(date = new Date(), timeZone = MANILA_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const lookup = {};

  for (const part of parts) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      lookup[part.type] = part.value;
    }
  }

  return {
    year: Number(lookup.year),
    month: lookup.month,
    day: lookup.day
  };
}

export function getCurrentDateValue(date = new Date(), timeZone = MANILA_TIME_ZONE) {
  const parts = getDatePartsInTimeZone(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getCurrentYearInTimeZone(date = new Date(), timeZone = MANILA_TIME_ZONE) {
  return getDatePartsInTimeZone(date, timeZone).year;
}

export function getDefaultSchoolYear(date = new Date(), timeZone = MANILA_TIME_ZONE) {
  const currentYear = getCurrentYearInTimeZone(date, timeZone);

  return {
    label: `${currentYear}-${currentYear + 1}`,
    startDate: `${currentYear}-06-02`,
    endDate: `${currentYear + 1}-04-03`
  };
}

function toDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatInTimeZone(value, locale, options, timeZone = MANILA_TIME_ZONE) {
  if (!value) return '-';

  const date = toDateValue(value);
  if (!date) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone
  }).format(date);
}

export function formatDateOnly(value, timeZone = MANILA_TIME_ZONE) {
  return formatInTimeZone(
    value,
    'en-PH',
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    },
    timeZone
  );
}

export function formatDateTime(value, timeZone = MANILA_TIME_ZONE) {
  return formatInTimeZone(
    value,
    'en-PH',
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    },
    timeZone
  );
}

export function formatMonthDay(value, timeZone = MANILA_TIME_ZONE) {
  return formatInTimeZone(
    value,
    'en-PH',
    {
      month: 'short',
      day: 'numeric'
    },
    timeZone
  );
}
