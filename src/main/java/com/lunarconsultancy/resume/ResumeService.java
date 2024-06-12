package com.lunarconsultancy.resume;

import static org.springframework.context.i18n.LocaleContextHolder.getLocale;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lunarconsultancy.resume.model.resume.Resume;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.swing.filechooser.FileSystemView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResumeService {

  private final ObjectMapper objectMapper;
  private final ResumeRepository resumeRepository;

  private File resumeFile;

  @Value("classpath:resume-schema.json")
  private Resource resumeSchema;

  @PostConstruct
  public void init() throws IOException {
    log.info("Init");
    final FileSystemView view = FileSystemView.getFileSystemView();
    final File file = view.getHomeDirectory();
    final Path path = Path.of(file.getAbsolutePath(), "resume");
    if (!path.toFile().exists()) {
      log.info("Creating resume folder");
      Files.createDirectory(path);
    }
    resumeFile = path.resolve("resume.json").toFile();
    if (!resumeFile.exists()) {
      log.info("Creating resume file");
      setResume(new Resume());
    }
  }

  public Resume getResume() throws IOException {
    return objectMapper.readValue(resumeFile, Resume.class);
  }

  public String getResumeSchema() throws IOException {
    return resumeSchema.getContentAsString(StandardCharsets.UTF_8);
  }

  public void saveTimeline(final Resource timeline) throws IOException {
    log.info("Save timeline");
    resumeRepository.addTimeline(getLocale(), timeline.getContentAsByteArray());
  }

  public byte[] getPdf() {
    return resumeRepository.getResume(getLocale());
  }

  public byte[] getPng() {
    return resumeRepository.getTimeline(getLocale());
  }

  public void setResume(final Resume resume) throws IOException {
    log.info("Set resume");
    objectMapper.writerWithDefaultPrettyPrinter().writeValue(resumeFile, resume);
  }
}
