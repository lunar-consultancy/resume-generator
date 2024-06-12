package com.lunarconsultancy.resume;

import static java.lang.String.format;
import static java.nio.file.Path.of;
import static javax.swing.filechooser.FileSystemView.getFileSystemView;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.io.Resource;

@SpringBootApplication
@Slf4j
@RequiredArgsConstructor
class ResumeApplicationTest implements CommandLineRunner {

  private final ConfigurableApplicationContext configurableApplicationContext;
  private final PdfComponent pdfComponent;
  private final ResumeRepository resumeRepository;
  private final ResumeService resumeService;

  @Value("classpath:timeline.png")
  private Resource timelineImage;

  public static void main(final String... args) {
    SpringApplication.run(ResumeApplication.class, args);
  }

  @Override
  public void run(final String... args) throws Exception {

    final String language = "nl";

    final Path pdf = of(getFileSystemView().getHomeDirectory().getAbsolutePath(), "resume",
        format("resume %s.pdf", language));
    if (pdf.toFile().exists()) {
      pdf.toFile().delete();
    }

    final Locale locale = Locale.of(language);

    resumeRepository.addTimeline(locale, timelineImage.getContentAsByteArray());

    pdfComponent.createPdf(locale, resumeService.getResume());
    Files.write(pdf, resumeRepository.getResume(locale));

    configurableApplicationContext.close();
    final String[] cmd = {"open", pdf.toFile().getAbsolutePath()};
    Runtime.getRuntime().exec(cmd);
  }
}
