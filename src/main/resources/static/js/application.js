Date.prototype.yyyymm = function () {
  let mm = this.getMonth() + 1; // getMonth() is zero-based
  return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
  ].join('-');
};

const localeEn = {
  dateTime: '%x, %X',
  date: '%-m/%-d/%Y',
  time: '%-I:%M:%S %p',
  periods: ['AM', 'PM'],
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  shortDays: ['Su', 'Ma', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  shortMonths: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
};
const localeNl = {
  dateTime: '%x, %X',
  date: '%-m/%-d/%Y',
  time: '%-I:%M:%S %p',
  periods: ['AM', 'PM'],
  days: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
  shortDays: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'],
  months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  shortMonths: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
};

const update = (language, data) => {
  if (data && data.length > 0) {
    const locale = language === 'nl' ? localeNl : localeEn;
    const timeline = milestones('#timeline')
      .timeFormatDefaultLocale(locale)
      .mapping({
        'category': 'category',
        'entries': 'entries',
        'timestamp': 'date',
        'text': 'text',
      })
      .optimize(true)
      .orientation('horizontal')
      .distribution('top-bottom')
      .parseTime('%Y-%m')
      .aggregateBy('month')
      .labelFormat('%b %Y');

    timeline.render(data);
  }
};
