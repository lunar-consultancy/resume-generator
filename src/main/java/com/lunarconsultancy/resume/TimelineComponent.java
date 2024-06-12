package com.lunarconsultancy.resume;

import static com.lunarconsultancy.resume.configuration.WebMvcConfiguration.LOCALES;
import static java.lang.String.format;
import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.awaitility.Awaitility.await;

import com.lunarconsultancy.resume.model.ResumeSavedEvent;
import com.lunarconsultancy.resume.model.TimelineSavedEvent;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.boot.web.servlet.context.ServletWebServerInitializedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TimelineComponent {

  private final ApplicationEventPublisher applicationEventPublisher;
  private final ResumeRepository resumeRepository;
  private int port;

  @EventListener
  public void onApplicationEvent(final ServletWebServerInitializedEvent event) {
    port = event.getWebServer().getPort();
  }

  @EventListener
  @Async
  public void onApplicationEvent(final ResumeSavedEvent resumeSavedEvent) {
    log.info("onApplicationEvent {}", resumeSavedEvent);
    resumeRepository.clearTimelines();

    final ChromeOptions chromeOptions = new ChromeOptions();
    chromeOptions.addArguments("--headless=new");
    final WebDriver driver = new ChromeDriver(chromeOptions);

    try {
      for (final Locale locale : LOCALES) {
        driver.get(format("http://127.0.0.1:%d/timeline?lang=%s", port, locale.getLanguage()));
        await()
            .atLeast(100, MILLISECONDS)
            .atMost(15, SECONDS)
            .pollInterval(100, MILLISECONDS)
            .until(() -> resumeRepository.getTimeline(locale) != null);
      }
    } catch (final Exception exception) {
      log.error(exception.getMessage(), exception);
    } finally {
      driver.quit();
    }

    applicationEventPublisher.publishEvent(new TimelineSavedEvent(this));
  }
}
