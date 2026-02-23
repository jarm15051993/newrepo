// min/max subscriber digits (after the country code)
export const PHONE_LENGTHS: Record<string, { min: number; max: number }> = {
  '+1':   { min: 10, max: 10 }, // US / Canada
  '+52':  { min: 10, max: 10 }, // Mexico
  '+54':  { min: 10, max: 10 }, // Argentina
  '+55':  { min: 10, max: 11 }, // Brazil (10 landline, 11 mobile)
  '+56':  { min: 9,  max: 9  }, // Chile
  '+57':  { min: 10, max: 10 }, // Colombia
  '+51':  { min: 9,  max: 9  }, // Peru
  '+58':  { min: 10, max: 10 }, // Venezuela
  '+593': { min: 8,  max: 9  }, // Ecuador
  '+595': { min: 9,  max: 9  }, // Paraguay
  '+598': { min: 8,  max: 9  }, // Uruguay
  '+507': { min: 7,  max: 8  }, // Panama
  '+506': { min: 8,  max: 8  }, // Costa Rica
  '+503': { min: 8,  max: 8  }, // El Salvador
  '+502': { min: 8,  max: 8  }, // Guatemala
  '+504': { min: 8,  max: 8  }, // Honduras
  '+505': { min: 8,  max: 8  }, // Nicaragua
  '+53':  { min: 8,  max: 8  }, // Cuba
  '+44':  { min: 10, max: 10 }, // UK
  '+34':  { min: 9,  max: 9  }, // Spain
  '+33':  { min: 9,  max: 9  }, // France
  '+49':  { min: 10, max: 12 }, // Germany (variable)
  '+39':  { min: 9,  max: 10 }, // Italy
  '+61':  { min: 9,  max: 9  }, // Australia
  '+91':  { min: 10, max: 10 }, // India
  '+81':  { min: 10, max: 11 }, // Japan
  '+82':  { min: 9,  max: 10 }, // South Korea
  '+86':  { min: 11, max: 11 }, // China
}

export const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', label: '+1 (US/Canada)' },
  { code: '+52',  flag: '🇲🇽', label: '+52 (Mexico)' },
  { code: '+54',  flag: '🇦🇷', label: '+54 (Argentina)' },
  { code: '+55',  flag: '🇧🇷', label: '+55 (Brazil)' },
  { code: '+56',  flag: '🇨🇱', label: '+56 (Chile)' },
  { code: '+57',  flag: '🇨🇴', label: '+57 (Colombia)' },
  { code: '+51',  flag: '🇵🇪', label: '+51 (Peru)' },
  { code: '+58',  flag: '🇻🇪', label: '+58 (Venezuela)' },
  { code: '+593', flag: '🇪🇨', label: '+593 (Ecuador)' },
  { code: '+595', flag: '🇵🇾', label: '+595 (Paraguay)' },
  { code: '+598', flag: '🇺🇾', label: '+598 (Uruguay)' },
  { code: '+507', flag: '🇵🇦', label: '+507 (Panama)' },
  { code: '+506', flag: '🇨🇷', label: '+506 (Costa Rica)' },
  { code: '+503', flag: '🇸🇻', label: '+503 (El Salvador)' },
  { code: '+502', flag: '🇬🇹', label: '+502 (Guatemala)' },
  { code: '+504', flag: '🇭🇳', label: '+504 (Honduras)' },
  { code: '+505', flag: '🇳🇮', label: '+505 (Nicaragua)' },
  { code: '+53',  flag: '🇨🇺', label: '+53 (Cuba)' },
  { code: '+44',  flag: '🇬🇧', label: '+44 (UK)' },
  { code: '+34',  flag: '🇪🇸', label: '+34 (Spain)' },
  { code: '+33',  flag: '🇫🇷', label: '+33 (France)' },
  { code: '+49',  flag: '🇩🇪', label: '+49 (Germany)' },
  { code: '+39',  flag: '🇮🇹', label: '+39 (Italy)' },
  { code: '+61',  flag: '🇦🇺', label: '+61 (Australia)' },
  { code: '+91',  flag: '🇮🇳', label: '+91 (India)' },
  { code: '+81',  flag: '🇯🇵', label: '+81 (Japan)' },
  { code: '+82',  flag: '🇰🇷', label: '+82 (South Korea)' },
  { code: '+86',  flag: '🇨🇳', label: '+86 (China)' },
]
