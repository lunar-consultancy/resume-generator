package com.lunarconsultancy.resume.model;

import org.springframework.context.ApplicationEvent;

public class TimelineSavedEvent extends ApplicationEvent {

  public TimelineSavedEvent(final Object source) {
    super(source);
  }
}
