package com.lunarconsultancy.resume;

import com.lunarconsultancy.resume.model.ResumeSavedEvent;
import com.lunarconsultancy.resume.model.resume.Resume;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ResumeRestController {

  private final ApplicationEventPublisher applicationEventPublisher;
  private final ResumeService resumeService;

  @PostMapping("/resume")
  public void saveResume(final @RequestBody Resume resume) throws IOException {
    resumeService.setResume(resume);
    applicationEventPublisher.publishEvent(new ResumeSavedEvent(this));
  }
}
