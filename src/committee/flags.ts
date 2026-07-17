// Maps a country/delegate name to a flag emoji. Flags are derived from ISO-3166
// alpha-2 codes (two regional-indicator symbols), so the table only needs the
// code, not the emoji itself. Unknown names return '' so callers can omit them.

const NAME_TO_ISO: Record<string, string> = {
  AFGHANISTAN: 'AF', ALBANIA: 'AL', ALGERIA: 'DZ', ANGOLA: 'AO',
  ARGENTINA: 'AR', ARMENIA: 'AM', AUSTRALIA: 'AU', AUSTRIA: 'AT',
  AZERBAIJAN: 'AZ', BAHRAIN: 'BH', BANGLADESH: 'BD', BELARUS: 'BY',
  BELGIUM: 'BE', BOLIVIA: 'BO', BRAZIL: 'BR', BULGARIA: 'BG',
  CAMBODIA: 'KH', CAMEROON: 'CM', CANADA: 'CA', CHILE: 'CL',
  CHINA: 'CN', COLOMBIA: 'CO', CROATIA: 'HR', CUBA: 'CU',
  CYPRUS: 'CY', CZECHIA: 'CZ', 'CZECH REPUBLIC': 'CZ', DENMARK: 'DK',
  ECUADOR: 'EC', EGYPT: 'EG', ESTONIA: 'EE', ETHIOPIA: 'ET',
  FINLAND: 'FI', FRANCE: 'FR', GEORGIA: 'GE', GERMANY: 'DE',
  GHANA: 'GH', GREECE: 'GR', HUNGARY: 'HU', ICELAND: 'IS',
  INDIA: 'IN', INDONESIA: 'ID', IRAN: 'IR', IRAQ: 'IQ',
  IRELAND: 'IE', ISRAEL: 'IL', ITALY: 'IT', JAPAN: 'JP',
  JORDAN: 'JO', KAZAKHSTAN: 'KZ', KENYA: 'KE', KUWAIT: 'KW',
  LATVIA: 'LV', LEBANON: 'LB', LIBYA: 'LY', LITHUANIA: 'LT',
  LUXEMBOURG: 'LU', MALAYSIA: 'MY', MEXICO: 'MX', MOROCCO: 'MA',
  NEPAL: 'NP', NETHERLANDS: 'NL', 'NEW ZEALAND': 'NZ', NIGERIA: 'NG',
  'NORTH KOREA': 'KP', NORWAY: 'NO', OMAN: 'OM', PAKISTAN: 'PK',
  PALESTINE: 'PS', PANAMA: 'PA', PERU: 'PE', PHILIPPINES: 'PH',
  POLAND: 'PL', PORTUGAL: 'PT', QATAR: 'QA', ROMANIA: 'RO',
  RUSSIA: 'RU', 'RUSSIAN FEDERATION': 'RU', 'SAUDI ARABIA': 'SA',
  SENEGAL: 'SN', SERBIA: 'RS', SINGAPORE: 'SG', SLOVAKIA: 'SK',
  SLOVENIA: 'SI', SOMALIA: 'SO', 'SOUTH AFRICA': 'ZA', 'SOUTH KOREA': 'KR',
  'REPUBLIC OF KOREA': 'KR', SPAIN: 'ES', 'SRI LANKA': 'LK', SUDAN: 'SD',
  SWEDEN: 'SE', SWITZERLAND: 'CH', SYRIA: 'SY', TAIWAN: 'TW',
  TANZANIA: 'TZ', THAILAND: 'TH', TUNISIA: 'TN', TURKEY: 'TR',
  'TÜRKIYE': 'TR', UGANDA: 'UG', UKRAINE: 'UA', 'UNITED ARAB EMIRATES': 'AE',
  UAE: 'AE', UK: 'GB', 'UNITED KINGDOM': 'GB', 'GREAT BRITAIN': 'GB',
  USA: 'US', 'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US',
  URUGUAY: 'UY', UZBEKISTAN: 'UZ', VENEZUELA: 'VE', VIETNAM: 'VN',
  YEMEN: 'YE', ZAMBIA: 'ZM', ZIMBABWE: 'ZW',
};

function isoToFlag(cc: string): string {
  // 'A' (65) → regional indicator 'A' (0x1F1E6 / 127462); offset 127397.
  return cc
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

/** Flag emoji for a delegate/country name, or '' if not recognised. */
export function countryFlag(name: string): string {
  const cc = NAME_TO_ISO[name.trim().toUpperCase()];
  return cc ? isoToFlag(cc) : '';
}
