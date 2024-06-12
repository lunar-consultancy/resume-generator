package com.lunarconsultancy.resume;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Repository;

@Repository
public class ResumeRepository {

  private Map<Locale, byte[]> timelines;
  private Map<Locale, byte[]> resumes;

  @PostConstruct
  public void init() {
    timelines = new HashMap<>();
    resumes = new HashMap<>();
  }

  void clearTimelines() {
    timelines.clear();
  }

  void addTimeline(final Locale locale, final byte[] timeline) {
    timelines.put(locale, timeline);
  }

  byte[] getTimeline(final Locale locale) {
    return timelines.get(locale);
  }

  void clearResume() {
    resumes.clear();
  }

  void addResume(final Locale locale, final byte[] timeline) {
    resumes.put(locale, timeline);
  }

  byte[] getResume(final Locale locale) {
    return resumes.get(locale);
  }
}
