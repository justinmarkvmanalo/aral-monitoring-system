const MANILA_TIME_ZONE = 'Asia/Manila';

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
