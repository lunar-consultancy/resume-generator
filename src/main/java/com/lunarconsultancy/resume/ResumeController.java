package com.lunarconsultancy.resume;

import static java.lang.String.format;
import static org.springframework.context.i18n.LocaleContextHolder.getLocale;

import com.lunarconsultancy.resume.model.I18n;
import com.lunarconsultancy.resume.model.graph.Category;
import com.lunarconsultancy.resume.model.graph.Entry;
import com.lunarconsultancy.resume.model.resume.Metadata;
import com.lunarconsultancy.resume.model.resume.Resume;
import com.lunarconsultancy.resume.model.resume.Section;
import com.lunarconsultancy.resume.model.resume.SectionItem;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ResumeController {

  private final MessageSource messageSource;
  private final ResourceLoader resourceLoader;
  private final ResumeService resumeService;

  private final List<I18n> i18ns = List.of(
      I18n.builder().id("en").name("Engels").build(),
      I18n.builder().id("nl").name("Nederlands").build()
  );

  @GetMapping("/")
  public String index(final Model model) throws IOException {
    createFonts(model);
    model.addAttribute("i18ns", i18ns);
    return "index";
  }

  @GetMapping("/edit")
  public String edit(final Model model) throws IOException {
    final Resume resume = resumeService.getResume();
    createFonts(model);
    model.addAttribute("resume", resume);
    model.addAttribute("resumeSchema", resumeService.getResumeSchema());
    model.addAttribute("i18ns", i18ns);
    return "edit";
  }

  @GetMapping("/download")
  public String download(final Model model) throws IOException {
    createFonts(model);
    model.addAttribute("i18ns", i18ns);
    return "download";
  }

  @GetMapping("/timeline")
  public String getTimeline(final Model model) throws IOException {
    createFonts(model);
    final Resume resume = resumeService.getResume();
    model.addAttribute("data", getData(resume));
    model.addAttribute("timelineWidth", resume.getMetadata().getTimelineWidth());
    return "timeline";
  }

  @PostMapping("/timeline")
  public void saveTimeline(@RequestPart("timeline") final MultipartFile timeline) throws IOException {
    resumeService.saveTimeline(timeline.getResource());
  }

  @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> pdf() throws IOException {
    final Resume resume = resumeService.getResume();
    final HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(ContentDisposition.inline()
        .filename(
            format("%s %s.pdf", messageSource.getMessage("resume", null, getLocale()), resume.getBasics().getName()))
        .build());
    return ResponseEntity.ok()
        .headers(headers)
        .body(resumeService.getPdf());
  }

  @GetMapping(value = "/png", produces = MediaType.IMAGE_PNG_VALUE)
  public ResponseEntity<byte[]> png() {
    return ResponseEntity.ok(resumeService.getPng());
  }

  private void createFonts(final Model model) throws IOException {
    final List<Font> fonts = new ArrayList<>();
    final Metadata.Font font = resumeService.getResume().getMetadata().getTheme().getFont();
    for (final Metadata.FontFile fontFile : font.getFiles()) {
      final Resource resource = resourceLoader.getResource(fontFile.getFile());
      fonts.add(Font.builder()
          .style(fontFile.getStyle())
          .weight(fontFile.getWeight())
          .data(Base64.getEncoder().encodeToString(resource.getContentAsByteArray()))
          .build());
    }
    model.addAttribute("fonts", fonts);
    model.addAttribute("fontFamily", font.getFamily());
  }

  public List<Category> getData(final Resume resume) {
    final List<Category> categories = new LinkedList<>();
    if (resume.getSections().containsKey("projects")) {
      categories.add(getProjects(resume));
    }
    if (resume.getSections().containsKey("employers")) {
      categories.add(getEmployers(resume));
    }
    return categories;
  }

  private Category getProjects(final Resume resume) {
    final Section.Projects projects = (Section.Projects) resume.getSections().get("projects");
    return getCategory("projects", projects.getItems());
  }

  private Category getEmployers(final Resume resume) {
    final Section.Employers employers = (Section.Employers) resume.getSections().get("employers");
    return getCategory("employers", employers.getItems());
  }

  private Category getCategory(final String code, final List<? extends SectionItem> positions) {
    return Category.builder()
        .category(messageSource.getMessage(code, null, getLocale()))
        .entries(getEntries(positions))
        .build();
  }

  private List<Entry> getEntries(final List<? extends SectionItem> experiences) {
    final List<Entry> entries = experiences.stream()
        .map(sectionItem -> (SectionItem.Position) sectionItem)
        .map(position -> Entry.builder()
            .date(position.getDateStart())
            .text(position.getOrganisation().getStrings().get(getLocale().getLanguage()))
            .build())
        .collect(Collectors.toCollection(ArrayList::new));
    entries.add(Entry.builder()
        .date(LocalDate.now())
        .text(messageSource.getMessage("now", null, getLocale()))
        .build());
    return entries;
  }

  @Getter
  @Builder
  private static class Font {

    private String style;
    private String weight;
    private String data;
  }
}
