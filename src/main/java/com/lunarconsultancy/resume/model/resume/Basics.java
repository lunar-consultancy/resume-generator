package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import lombok.Data;

@Data
public class Basics {

  private String name;
  private String email;
  private String phone;
  private String url;
  private I18nString headline;
  private String location;
  @JsonProperty("date-of-birth")
  private LocalDate dateOfBirth;
  @JsonProperty("profile-image-location")
  private String profileImageLocation;
}
