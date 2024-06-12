package com.lunarconsultancy.resume.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
public class MapperConfiguration {

  @Bean
  @Primary
  ObjectMapper objectMapper(final Jackson2ObjectMapperBuilder builder) {
    return builder.createXmlMapper(false).build();
  }

  @Bean
  public XmlMapper xmlMapper(final Jackson2ObjectMapperBuilder builder) {
    return builder.createXmlMapper(true).build();
  }
}
