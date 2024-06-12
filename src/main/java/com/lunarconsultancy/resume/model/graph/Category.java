package com.lunarconsultancy.resume.model.graph;

import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

@Builder
@Getter
public class Category {

  private String category;
  @Singular("entries")
  private List<Entry> entries;
}
