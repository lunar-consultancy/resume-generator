package com.lunarconsultancy.resume;

import static java.time.LocalDate.parse;
import static java.time.format.DateTimeFormatter.ofLocalizedDate;
import static java.time.format.DateTimeFormatter.ofPattern;
import static java.time.format.FormatStyle.LONG;
import static java.util.Locale.of;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class DateFormatter {

  private static final DateTimeFormatter SOURCE_DATE_TIME_FORMATTER = ofPattern("yyyy-MM-dd");

  public static String convertDate(final String date, final String language) {
    final LocalDate localDate = parse(date, SOURCE_DATE_TIME_FORMATTER);

    final Locale locale = of(language);
    final DateTimeFormatter dateTimeFormatter = ofLocalizedDate(LONG).withLocale(locale);
    return localDate.format(dateTimeFormatter);
  }

  public static String convertMonthYear(final String date, final String language) {
    final LocalDate localDate = parse(date, SOURCE_DATE_TIME_FORMATTER);

    final Locale locale = of(language);
    final DateTimeFormatter dateTimeFormatter = ofPattern("MMMM yyyy", locale);
    return localDate.format(dateTimeFormatter);
  }
}
