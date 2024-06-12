package com.lunarconsultancy.resume;

import static com.lunarconsultancy.resume.configuration.WebMvcConfiguration.LOCALES;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.lunarconsultancy.resume.model.TimelineSavedEvent;
import com.lunarconsultancy.resume.model.resume.Metadata;
import com.lunarconsultancy.resume.model.resume.Resume;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.sax.SAXResult;
import javax.xml.transform.stream.StreamSource;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.fop.apps.FOUserAgent;
import org.apache.fop.apps.Fop;
import org.apache.fop.apps.FopFactory;
import org.apache.fop.apps.MimeConstants;
import org.apache.fop.apps.io.InternalResourceResolver;
import org.apache.fop.fonts.EmbedFontInfo;
import org.apache.fop.fonts.Font;
import org.apache.fop.fonts.FontInfo;
import org.apache.fop.fonts.FontTriplet;
import org.apache.fop.fonts.FontUris;
import org.apache.fop.fonts.LazyFont;
import org.apache.fop.fonts.substitute.FontSubstitutions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class PdfComponent {

  private final MessageSource messageSource;
  private final ResourceLoader resourceLoader;
  private final ResumeRepository resumeRepository;
  private final ResumeService resumeService;
  private final XmlMapper xmlMapper;

  @Value("classpath:stylesheet.xsl")
  private Resource stylesheet;
  @Value("classpath:static/fonts/Phosphor-Icons/bold/Phosphor-Bold.ttf")
  private Resource phosphorBold;
  @Value("classpath:static/fonts/Phosphor-Icons/fill/Phosphor-Fill.ttf")
  private Resource phosphorFill;

  @EventListener
  public void onApplicationEvent(final TimelineSavedEvent timelineSavedEvent) throws Exception {
    log.info("onApplicationEvent {}", timelineSavedEvent);

    resumeRepository.clearResume();

    final Resume resume = resumeService.getResume();
    for (final Locale locale : LOCALES) {
      createPdf(locale, resume);
    }
  }

  void createPdf(final Locale locale, final Resume resume) throws Exception {

    final byte[] bytes = xmlMapper.writeValueAsBytes(resume);
    final ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);

    final FopFactory fopFactory = FopFactory.newInstance(new File(".").toURI());
    final InternalResourceResolver resourceResolver = fopFactory.getFontManager().getResourceResolver();
    fopFactory.getFontManager().setFontSubstitutions(new FontSubstitutions() {

      @Override
      public void adjustFontInfo(final FontInfo fontInfo) {
        super.adjustFontInfo(fontInfo);

        int num = fontInfo.getFonts().size() + 1;
        String internalName;
        try {
          for (final EmbedFontInfo embedFontInfo : customFont(resume.getMetadata().getTheme().getFont())) {
            internalName = "F" + num;
            num++;

            final LazyFont font = new LazyFont(embedFontInfo, resourceResolver, false);
            fontInfo.addMetrics(internalName, font);

            final List<FontTriplet> triplets = embedFontInfo.getFontTriplets();
            for (final FontTriplet triplet : triplets) {
              fontInfo.addFontProperties(internalName, triplet);
            }
          }
        } catch (final IOException e) {
          throw new RuntimeException(e);
        }
      }
    });

    final FOUserAgent foUserAgent = fopFactory.newFOUserAgent();
    foUserAgent.setCreator(resume.getCompany().getName());
    foUserAgent.setAuthor(resume.getBasics().getName());
    foUserAgent.setCreationDate(new Date());
    foUserAgent.setTitle(messageSource.getMessage("resume", null, locale));

    final ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
    final Fop fop = fopFactory.newFop(MimeConstants.MIME_PDF, foUserAgent, byteArrayOutputStream);

    final TransformerFactory factory = TransformerFactory.newInstance();
    final Transformer transformer = factory.newTransformer(new StreamSource(stylesheet.getInputStream()));
    transformer.setParameter("language", locale.getLanguage());

    final Resource profileImageResource = resourceLoader.getResource(resume.getBasics().getProfileImageLocation());
    transformer.setParameter("profileImage",
        new String(Base64.getEncoder().encode(profileImageResource.getContentAsByteArray()), StandardCharsets.UTF_8));
    transformer.setParameter("timeline",
        new String(Base64.getEncoder().encode(resumeRepository.getTimeline(locale)), StandardCharsets.UTF_8));

    final Source src = new StreamSource(byteArrayInputStream);
    final Result res = new SAXResult(fop.getDefaultHandler());

    transformer.transform(src, res);

    resumeRepository.addResume(locale, byteArrayOutputStream.toByteArray());
  }

  private List<EmbedFontInfo> customFont(final Metadata.Font font) throws IOException {
    final List<EmbedFontInfo> fontList = new ArrayList<>();

    fontList.add(addFont(phosphorBold.getURI(), "Phosphor", "normal", "bold"));
    fontList.add(addFont(phosphorFill.getURI(), "Phosphor-Fill", "normal", "normal"));
    if (font.getFiles() != null) {
      for (final Metadata.FontFile fontFile : font.getFiles()) {
        final Resource profileImageResource = resourceLoader.getResource(fontFile.getFile());
        fontList.add(
            addFont(profileImageResource.getURI(), font.getFamily(), fontFile.getStyle(), fontFile.getWeight()));
      }
    }
    return fontList;
  }

  private EmbedFontInfo addFont(final URI uri, final String name, final String fontStyle, final String fontWeight) {

    final int weight = switch (fontWeight) {
      case "bold" -> Font.WEIGHT_BOLD;
      case "light" -> Font.WEIGHT_LIGHT;
      default -> Font.WEIGHT_NORMAL;
    };

    final FontUris fontUris = new FontUris(uri, null);
    final List<FontTriplet> fontTriplets = new ArrayList<>();
    fontTriplets.add(new FontTriplet(name, fontStyle, weight));
    return new EmbedFontInfo(fontUris, false, false, fontTriplets, name);
  }

  @Builder
  static class ResumeFont {

    Resource resource;
    String name;
    int fontWeight;
  }
}
