package com.lunarconsultancy.resume.model;

import org.springframework.context.ApplicationEvent;

public class ResumeSavedEvent extends ApplicationEvent {

  public ResumeSavedEvent(final Object source) {
    super(source);
  }
}
