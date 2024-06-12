package com.lunarconsultancy.resume.model.graph;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class Entry {

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM")
  private LocalDate date;
  private String text;
}
