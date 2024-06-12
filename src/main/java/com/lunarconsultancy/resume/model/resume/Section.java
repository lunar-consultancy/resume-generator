package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "id", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Section.Awards.class, name = "awards"),
    @JsonSubTypes.Type(value = Section.Certifications.class, name = "certifications"),
    @JsonSubTypes.Type(value = Section.Educations.class, name = "educations"),
    @JsonSubTypes.Type(value = Section.Employers.class, name = "employers"),
    @JsonSubTypes.Type(value = Section.Experiences.class, name = "experiences"),
    @JsonSubTypes.Type(value = Section.Interests.class, name = "interests"),
    @JsonSubTypes.Type(value = Section.Languages.class, name = "languages"),
    @JsonSubTypes.Type(value = Section.Motivation.class, name = "motivation"),
    @JsonSubTypes.Type(value = Section.Profiles.class, name = "profiles"),
    @JsonSubTypes.Type(value = Section.Projects.class, name = "projects"),
    @JsonSubTypes.Type(value = Section.Publications.class, name = "publications"),
    @JsonSubTypes.Type(value = Section.References.class, name = "references"),
    @JsonSubTypes.Type(value = Section.Skills.class, name = "skills"),
    @JsonSubTypes.Type(value = Section.Summary.class, name = "summary"),
    @JsonSubTypes.Type(value = Section.Timeline.class, name = "timeline"),
    @JsonSubTypes.Type(value = Section.Volunteer.class, name = "volunteer")
})
@Data
public abstract class Section {

  private String id;
  private I18nString name;
  private boolean visible = true;

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Awards extends Section {

    private List<? extends SectionItem.Award> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Certifications extends Section {

    private List<? extends SectionItem.Certification> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Educations extends Section {

    private List<? extends SectionItem.Education> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Employers extends Section {

    private List<? extends SectionItem.Position> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Experiences extends Section {

    private List<? extends SectionItem.Position> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Interests extends Section {

    private List<? extends SectionItem.Interest> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Languages extends Section {

    private List<? extends SectionItem.Language> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Motivation extends Section {

    private List<I18nString> content;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Profiles extends Section {

    private List<? extends SectionItem.Profile> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Projects extends Section {

    private List<? extends SectionItem.Position> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Publications extends Section {

    private List<? extends SectionItem.Publication> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class References extends Section {

    private List<? extends SectionItem.Reference> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Skills extends Section {

    private List<? extends SectionItem.Skill> items;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Summary extends Section {

    private List<I18nString> content;
  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Timeline extends Section {

  }

  @Data
  @EqualsAndHashCode(callSuper = true)
  public static class Volunteer extends Section {

    private List<? extends SectionItem.Position> items;
  }
}
