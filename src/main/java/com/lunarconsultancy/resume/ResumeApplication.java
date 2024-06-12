package com.lunarconsultancy.resume;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@Slf4j
@RequiredArgsConstructor
public class ResumeApplication {

  public static void main(final String... args) {
    SpringApplication.run(ResumeApplication.class, args);
  }
}
