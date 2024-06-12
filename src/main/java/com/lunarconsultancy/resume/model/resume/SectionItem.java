package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
public abstract class SectionItem {

  private boolean visible = true;

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Award extends SectionItem {

    private LocalDate date;
    private String title;
    private String awarder;
    private I18nString summary;
    private String url;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Certification extends SectionItem {

    private String date;
    private I18nString name;
    private String issuer;
    private I18nString summary;
    private String url;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Education extends SectionItem {

    private I18nString area;
    private I18nString institution;
    private String year;
    @JsonProperty("date-start")
    private LocalDate dateStart;
    @JsonProperty("date-end")
    private LocalDate dateEnd;
    private String score;
    private I18nString summary;
    @JsonProperty("study-type")
    private I18nString studyType;
    private String url;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Interest extends SectionItem {

    private I18nString name;
    private List<I18nString> keywords;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Language extends SectionItem {

    private I18nString name;
    private I18nString description;
    private Integer level;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Position extends SectionItem {

    @JsonProperty("date-start")
    private LocalDate dateStart;
    @JsonProperty("date-end")
    private LocalDate dateEnd;
    private I18nString organisation;
    private I18nString position;
    private I18nString summary;
    private PositionActivities activities;
    private I18nString location;
    private String url;
    private List<String> keywords;
  }

  @Data
  public static class PositionActivities {

    private I18nString text;
    private List<I18nString> activities;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Profile extends SectionItem {

    private String network;
    private String username;
    private String icon;
    private String url;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Publication extends SectionItem {

    private LocalDate date;
    private I18nString name;
    private String publisher;
    private I18nString summary;
    private String url;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Reference extends SectionItem {

    private I18nString name;
    private I18nString summary;
    private I18nString description;
    private String url;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  public static class Skill extends SectionItem {

    private I18nString name;
    private I18nString description;
    private List<I18nString> keywords;
  }
}
