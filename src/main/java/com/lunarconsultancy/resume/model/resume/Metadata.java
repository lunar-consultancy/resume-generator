package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
public class Metadata {

  private Theme theme;
  private List<Column> layout;
  @JsonProperty("timeline-width")
  private String TimelineWidth;

  @Data
  public static class Theme {

    private String text;
    @JsonProperty("headings-text")
    private String headingsText;
    @JsonProperty("header-text")
    private String headerText;
    @JsonProperty("header-background")
    private String headerBackground;
    private Font font;
  }

  @Data
  public static class Font {

    private String family;
    private String size;
    private List<FontFile> files;
  }

  @Data
  public static class FontFile {

    private String file;
    private String style;
    private String weight;
  }
}
