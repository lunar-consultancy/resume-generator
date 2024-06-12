package com.lunarconsultancy.resume.fop;

import java.util.Locale;
import org.apache.fop.render.awt.viewer.Translator;

public class I18nTranslator extends Translator {

  private static Locale locale;

  public I18nTranslator(final Locale locale) {
    super(locale);
    I18nTranslator.locale = locale;
  }

  public static String getKey(final String key) {
    return key + '/' + locale.getLanguage();
  }
}
