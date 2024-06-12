package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Singular;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@JsonDeserialize(using = I18nStringDeserializer.class)
@JsonSerialize(using = I18nStringSerializer.class)
public class I18nString {

  @Singular("strings")
  private Map<String, String> strings;
}
