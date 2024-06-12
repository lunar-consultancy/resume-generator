package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import java.io.IOException;

public class I18nStringDeserializer extends StdDeserializer<I18nString> {

  protected I18nStringDeserializer() {
    this(null);
  }

  protected I18nStringDeserializer(final Class<?> vc) {
    super(vc);
  }

  @Override
  public I18nString deserialize(final JsonParser jp, final DeserializationContext ctxt)
      throws IOException {
    final JsonNode node = jp.getCodec().readTree(jp);
    final I18nString.I18nStringBuilder i18nStringBuilder = I18nString.builder();
    node.fieldNames().forEachRemaining(s ->
        i18nStringBuilder.strings(s, node.get(s).textValue())
    );
    return i18nStringBuilder.build();
  }
}
