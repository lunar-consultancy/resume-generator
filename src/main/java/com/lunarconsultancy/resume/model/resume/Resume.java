package com.lunarconsultancy.resume.model.resume;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import java.util.Map;
import lombok.Data;
import lombok.ToString;

@Data
@ToString
@JacksonXmlRootElement(localName = "resume")
public class Resume {

  private Basics basics;
  private Company company;
  private Metadata metadata;
  private Map<String, Section> sections;
}
