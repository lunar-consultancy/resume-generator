package com.lunarconsultancy.resume.model.resume;

import java.time.LocalDate;
import lombok.Data;

@Data
public class Training {

  private I18nString name;
  private LocalDate yearStart;
  private LocalDate yearEnd;
  private String venue;
  private I18nString country;
}
