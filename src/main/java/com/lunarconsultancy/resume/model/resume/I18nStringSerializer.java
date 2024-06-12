package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import java.io.IOException;
import java.util.Map;

public class I18nStringSerializer extends StdSerializer<I18nString> {

  protected I18nStringSerializer() {
    this(null);
  }

  protected I18nStringSerializer(final Class<I18nString> t) {
    super(t);
  }

  @Override
  public void serialize(final I18nString i18nString, final JsonGenerator jsonGenerator,
      final SerializerProvider serializerProvider) throws IOException {
    jsonGenerator.writeStartObject();
    for (final Map.Entry<String, String> entry : i18nString.getStrings().entrySet()) {
      jsonGenerator.writeStringField(entry.getKey(), entry.getValue());
    }
    jsonGenerator.writeEndObject();
  }
}
