<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:fo="http://www.w3.org/1999/XSL/Format"
                xmlns:dateFormatter="xalan://com.lunarconsultancy.resume.DateFormatter"
                extension-element-prefixes="dateFormatter"
                exclude-result-prefixes="dateFormatter"
>

  <xsl:param name="language"/>
  <xsl:param name="profileImage"/>
  <xsl:param name="timeline"/>

  <xsl:variable name="textColor" select="/resume/metadata/theme/text"/>
  <xsl:variable name="headingsTextColor" select="/resume/metadata/theme/headings-text"/>
  <xsl:variable name="headerTextColor" select="/resume/metadata/theme/header-text"/>
  <xsl:variable name="headerBackgroundColor" select="/resume/metadata/theme/header-background"/>
  <xsl:variable name="fontSize" select="/resume/metadata/theme/font/size"/>
  <xsl:variable name="fontFamily">
    <xsl:choose>
      <xsl:when test="/resume/metadata/theme/font/family !=''">
        <xsl:value-of select="/resume/metadata/theme/font/family"/>
      </xsl:when>
      <xsl:otherwise>Roboto</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>


  <xsl:template match="resume">
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format" font-family="{$fontFamily}" font-size="{$fontSize}" color="{$textColor}">

      <fo:layout-master-set>
        <fo:simple-page-master master-name="A4" page-height="29.7cm" page-width="21cm">
          <fo:region-body margin="10pt"/>
        </fo:simple-page-master>
      </fo:layout-master-set>

      <fo:page-sequence master-reference="A4">
        <fo:flow flow-name="xsl-region-body">
          <fo:block-container height="25mm" width="100%" position="absolute" background-color="{$headerBackgroundColor}">
            <fo:block>
              <xsl:text/>
            </fo:block>
          </fo:block-container>
          <fo:block>
            <fo:table>
              <fo:table-column column-width="70mm"/>
              <fo:table-column/>
              <fo:table-body>
                <fo:table-row>
                  <fo:table-cell display-align="after">
                    <fo:block-container height="25mm">
                      <fo:block text-align="center" margin-top="15pt">
                        <fo:external-graphic content-height="35mm" content-width="35mm">
                          <xsl:attribute name="src">
                            <xsl:text>url('data:image/jpeg;base64,</xsl:text>
                            <xsl:value-of select="$profileImage"/>
                            <xsl:text>')</xsl:text>
                          </xsl:attribute>
                        </fo:external-graphic>
                      </fo:block>
                    </fo:block-container>
                  </fo:table-cell>
                  <fo:table-cell>
                    <fo:block-container height="25mm">
                      <fo:block font-size="20pt" margin-left="5pt" margin-top="15pt">
                        <fo:inline color="{$headerTextColor}">
                          <xsl:value-of select="basics/name"/>
                        </fo:inline>
                      </fo:block>
                      <fo:block font-size="10pt" margin-left="5pt">
                        <fo:inline color="{$headerTextColor}">
                          <xsl:value-of select="basics/headline//*[name() = $language]"/>
                        </fo:inline>
                      </fo:block>
                    </fo:block-container>
                  </fo:table-cell>
                </fo:table-row>
                <fo:table-row>
                  <fo:table-cell>
                    <fo:block>
                      <xsl:text/>
                    </fo:block>
                  </fo:table-cell>
                  <fo:table-cell display-align="center">
                    <fo:block-container height="15mm">
                      <fo:block font-size="8pt" margin-left="5pt">
                        <fo:inline keep-together="always" padding-right="5pt">
                          <fo:inline font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}" padding-right="3pt">
                            <xsl:text>&#xE316;</xsl:text>
                          </fo:inline>
                          <xsl:value-of select="basics/location"/>
                        </fo:inline>
                        <xsl:if test="basics/phone">
                          <xsl:text> </xsl:text>
                          <fo:inline keep-together="always" padding-right="5pt">
                            <fo:inline font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}" padding-right="3pt">
                              <xsl:text>&#xE3B8;</xsl:text>
                            </fo:inline>
                            <xsl:value-of select="basics/phone"/>
                          </fo:inline>
                        </xsl:if>
                        <xsl:if test="basics/email">
                          <xsl:text> </xsl:text>
                          <fo:inline keep-together="always" padding-right="5pt">
                            <fo:inline font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}" padding-right="3pt">
                              <xsl:text>&#xE0AC;</xsl:text>
                            </fo:inline>
                            <xsl:value-of select="basics/email"/>
                          </fo:inline>
                        </xsl:if>
                        <xsl:if test="basics/date-of-birth">
                          <xsl:text> </xsl:text>
                          <fo:inline keep-together="always" padding-right="5pt">
                            <fo:inline font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}" padding-right="3pt">
                              <xsl:text>&#xE108;</xsl:text>
                            </fo:inline>
                            <xsl:value-of select="dateFormatter:convertDate(basics/date-of-birth, $language)"/>
                          </fo:inline>
                        </xsl:if>
                      </fo:block>
                    </fo:block-container>
                  </fo:table-cell>
                </fo:table-row>
                <fo:table-row>
                  <fo:table-cell padding-top="10pt" padding-right="5pt">
                    <xsl:apply-templates>
                      <xsl:with-param name="index">2</xsl:with-param>
                      <xsl:with-param name="main">false</xsl:with-param>
                    </xsl:apply-templates>
                  </fo:table-cell>
                  <fo:table-cell padding-top="10pt" padding-left="5pt">
                    <xsl:apply-templates>
                      <xsl:with-param name="index">1</xsl:with-param>
                      <xsl:with-param name="main">true</xsl:with-param>
                    </xsl:apply-templates>
                  </fo:table-cell>
                </fo:table-row>
              </fo:table-body>
            </fo:table>
          </fo:block>
        </fo:flow>
      </fo:page-sequence>
    </fo:root>
  </xsl:template>

  <xsl:template match="metadata/layout/*">
    <xsl:param name="index"/>
    <xsl:param name="main"/>
    <xsl:if test="position() = $index">
      <xsl:for-each select="sections/*">
        <xsl:variable name="sectionId" select="."/>
        <xsl:apply-templates select="/resume/sections/*">
          <xsl:with-param name="sectionId">
            <xsl:value-of select="$sectionId"/>
          </xsl:with-param>
          <xsl:with-param name="main">
            <xsl:value-of select="$main"/>
          </xsl:with-param>
        </xsl:apply-templates>
      </xsl:for-each>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/awards">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block>
        <xsl:call-template name="title"/>
        <xsl:for-each select="items/*">
          <xsl:if test="visible = 'true'">
            <fo:block keep-together.within-page="always">
              <fo:block font-weight="bold" margin-top="5pt">
                <xsl:value-of select="title"/>
              </fo:block>
              <fo:block>
                <xsl:value-of select="awarder"/>
              </fo:block>
              <xsl:call-template name="date">
                <xsl:with-param name="bold">true</xsl:with-param>
              </xsl:call-template>
              <fo:block>
                <xsl:call-template name="url"/>
              </fo:block>
              <fo:block>
                <xsl:value-of select="summary//*[name() = $language]"/>
              </fo:block>
            </fo:block>
          </xsl:if>
        </xsl:for-each>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/certifications">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block>
        <xsl:call-template name="title"/>
        <xsl:for-each select="items/*">
          <xsl:if test="visible = 'true'">
            <fo:block keep-together.within-page="always">
              <fo:block font-weight="bold" margin-top="5pt">
                <xsl:value-of select="name//*[name() = $language]"/>
              </fo:block>
              <fo:block>
                <xsl:value-of select="issuer"/>
              </fo:block>
              <xsl:call-template name="date">
                <xsl:with-param name="bold">true</xsl:with-param>
              </xsl:call-template>
              <fo:block>
                <xsl:call-template name="url"/>
              </fo:block>
              <fo:block>
                <xsl:value-of select="summary//*[name() = $language]"/>
              </fo:block>
            </fo:block>
          </xsl:if>
        </xsl:for-each>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/educations">
    <xsl:param name="sectionId"/>
    <xsl:param name="main"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block>
        <xsl:call-template name="title"/>
        <xsl:for-each select="items/*">
          <fo:block keep-together.within-page="always">
            <fo:block>
              <xsl:apply-templates select=".">
                <xsl:with-param name="main">
                  <xsl:value-of select="$main"/>
                </xsl:with-param>
                <xsl:with-param name="big">true</xsl:with-param>
              </xsl:apply-templates>
              <fo:block font-weight="bold">
                <xsl:if test="$main = 'true'">
                  <xsl:attribute name="text-align-last">justify</xsl:attribute>
                </xsl:if>
                <fo:inline>
                  <xsl:value-of select="institution//*[name() = $language]"/>
                </fo:inline>
                <xsl:choose>
                  <xsl:when test="$main = 'true'">
                    <fo:leader leader-pattern="space"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <fo:block>
                      <xsl:text/>
                    </fo:block>
                  </xsl:otherwise>
                </xsl:choose>
                <xsl:choose>
                  <xsl:when test="date-start != ''">
                    <fo:inline>
                      <xsl:value-of select="dateFormatter:convertMonthYear(date-start, $language)"/>
                    </fo:inline>
                  </xsl:when>
                  <xsl:otherwise>
                    <fo:inline>
                      <xsl:value-of select="year"/>
                    </fo:inline>
                  </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="date-start != '' and date-end != ''">
                  <fo:inline>
                    <xsl:choose>
                      <xsl:when test="$language = 'en'">
                        <xsl:text> to </xsl:text>
                      </xsl:when>
                      <xsl:when test="$language = 'nl'">
                        <xsl:text> t/m </xsl:text>
                      </xsl:when>
                    </xsl:choose>
                    <xsl:choose>
                      <xsl:when test="date-end != ''">
                        <xsl:value-of select="dateFormatter:convertMonthYear(date-end, $language)"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:choose>
                          <xsl:when test="$language = 'en'">
                            <xsl:text>present day</xsl:text>
                          </xsl:when>
                          <xsl:when test="$language = 'nl'">
                            <xsl:text>heden</xsl:text>
                          </xsl:when>
                        </xsl:choose>
                      </xsl:otherwise>
                    </xsl:choose>
                  </fo:inline>
                </xsl:if>
              </fo:block>
              <xsl:if test="area != '' or study-type//*[name() = $language] != ''">
                <fo:block>
                  <xsl:if test="$main = 'true'">
                    <xsl:attribute name="text-align-last">justify</xsl:attribute>
                  </xsl:if>
                  <fo:inline>
                    <xsl:value-of select="area//*[name() = $language]"/>
                  </fo:inline>
                  <xsl:choose>
                    <xsl:when test="$main = 'true'">
                      <fo:leader leader-pattern="space"/>
                    </xsl:when>
                    <xsl:otherwise>
                      <fo:block>
                        <xsl:text/>
                      </fo:block>
                    </xsl:otherwise>
                  </xsl:choose>
                  <fo:inline>
                    <xsl:value-of select="study-type//*[name() = $language]"/>
                  </fo:inline>
                </fo:block>
              </xsl:if>
              <xsl:if test="url != '' or score != ''">
                <fo:block>
                  <xsl:if test="$main = 'true'">
                    <xsl:attribute name="text-align-last">justify</xsl:attribute>
                  </xsl:if>
                  <fo:inline>
                    <xsl:call-template name="url"/>
                  </fo:inline>
                  <xsl:choose>
                    <xsl:when test="$main = 'true'">
                      <fo:leader leader-pattern="space"/>
                    </xsl:when>
                    <xsl:otherwise>
                      <fo:block>
                        <xsl:text/>
                      </fo:block>
                    </xsl:otherwise>
                  </xsl:choose>
                  <fo:inline>
                    <xsl:value-of select="score"/>
                  </fo:inline>
                </fo:block>
              </xsl:if>
            </fo:block>
            <xsl:if test="summary//*[name() = $language] != ''">
              <fo:block>
                <xsl:apply-templates select=".">
                  <xsl:with-param name="main">
                    <xsl:value-of select="$main"/>
                  </xsl:with-param>
                </xsl:apply-templates>
                <fo:block>
                  <xsl:value-of select="summary//*[name() = $language]"/>
                </fo:block>
              </fo:block>
            </xsl:if>
          </fo:block>
        </xsl:for-each>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/employers | /resume/sections/experiences | /resume/sections/projects | /resume/sections/volunteer">
    <xsl:param name="sectionId"/>
    <xsl:param name="main"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block>
        <xsl:call-template name="position">
          <xsl:with-param name="main">
            <xsl:value-of select="$main"/>
          </xsl:with-param>
        </xsl:call-template>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/interests">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <xsl:call-template name="title"/>
      <xsl:for-each select="items/*">
        <xsl:sort select="name//*[name() = $language]"/>
        <xsl:if test="visible = 'true'">
          <fo:block keep-together.within-page="always">
            <fo:block font-weight="bold" margin-top="5pt">
              <xsl:value-of select="name//*[name() = $language]"/>
            </fo:block>
            <xsl:call-template name="keywords">
              <xsl:with-param name="i18n">true</xsl:with-param>
            </xsl:call-template>
          </fo:block>
        </xsl:if>
      </xsl:for-each>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/languages">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block keep-together.within-page="always">
        <xsl:call-template name="title"/>
        <xsl:for-each select="items/*">
          <xsl:sort select="level" order="descending"/>
          <xsl:sort select="name//*[name() = $language]"/>
          <xsl:if test="visible = 'true'">
            <fo:block font-weight="bold" margin-top="5pt">
              <xsl:value-of select="name//*[name() = $language]"/>
            </fo:block>
            <fo:block>
              <xsl:value-of select="description//*[name() = $language]"/>
            </fo:block>
            <xsl:call-template name="rating">
              <xsl:with-param name="rating" select="level"/>
            </xsl:call-template>
          </xsl:if>
        </xsl:for-each>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/motivation | /resume/sections/summary">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block>
        <xsl:call-template name="title"/>
        <xsl:if test="count(content/*) = 1">
          <fo:block linefeed-treatment="preserve" margin-top="5pt">
            <xsl:value-of select="content//*[name() = $language]"/>
          </fo:block>
        </xsl:if>
        <xsl:if test="count(content/*) > 1">
          <fo:list-block margin-top="5pt">
            <xsl:for-each select="content/*">
              <fo:list-item>
                <fo:list-item-label>
                  <fo:block font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}">
                    <xsl:text>&#xECDE;</xsl:text>
                  </fo:block>
                </fo:list-item-label>
                <fo:list-item-body margin-left="10pt">
                  <fo:block linefeed-treatment="preserve">
                    <xsl:value-of select=".//*[name() = $language]"/>
                  </fo:block>
                </fo:list-item-body>
              </fo:list-item>
            </xsl:for-each>
          </fo:list-block>
        </xsl:if>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/profiles">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block keep-together.within-page="always">
        <xsl:call-template name="title"/>
        <xsl:for-each select="items/*">
          <xsl:if test="visible = 'true'">
            <fo:block font-weight="bold" margin-top="5pt">
              <fo:inline>
                <fo:inline font-family="Phosphor-Fill" font-weight="bold" color="{$headingsTextColor}" padding-right="3pt">
                  <xsl:value-of select="icon"/>
                </fo:inline>
                <fo:basic-link>
                  <xsl:attribute name="external-destination">
                    <xsl:value-of select="url"/>
                  </xsl:attribute>
                  <xsl:value-of select="username"/>
                </fo:basic-link>
              </fo:inline>
            </fo:block>
          </xsl:if>
        </xsl:for-each>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/publications">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block>
        <xsl:call-template name="title"/>
        <xsl:for-each select="items/*">
          <xsl:if test="visible = 'true'">
            <fo:block keep-together.within-page="always">
              <fo:block font-weight="bold" margin-top="5pt">
                <xsl:value-of select="name//*[name() = $language]"/>
              </fo:block>
              <fo:block>
                <xsl:value-of select="publisher"/>
              </fo:block>
              <xsl:call-template name="date">
                <xsl:with-param name="bold">true</xsl:with-param>
              </xsl:call-template>
              <fo:block>
                <xsl:call-template name="url"/>
              </fo:block>
              <fo:block>
                <xsl:value-of select="summary//*[name() = $language]"/>
              </fo:block>
            </fo:block>
          </xsl:if>
        </xsl:for-each>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/references">
    <xsl:param name="sectionId"/>
    <xsl:param name="main"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <xsl:call-template name="title"/>
      <xsl:for-each select="items/*">
        <xsl:if test="visible = 'true'">
          <fo:block keep-together.within-page="always">
            <fo:block>
              <xsl:apply-templates select=".">
                <xsl:with-param name="main">
                  <xsl:value-of select="$main"/>
                </xsl:with-param>
                <xsl:with-param name="big">true</xsl:with-param>
              </xsl:apply-templates>
              <fo:block font-weight="bold">
                <xsl:value-of select="name//*[name() = $language]"/>
              </fo:block>
              <xsl:value-of select="description//*[name() = $language]"/>
              <fo:block>
                <xsl:call-template name="url"/>
              </fo:block>
            </fo:block>
            <xsl:if test="summary !=''">
              <fo:block>
                <xsl:apply-templates select=".">
                  <xsl:with-param name="main">
                    <xsl:value-of select="$main"/>
                  </xsl:with-param>
                </xsl:apply-templates>
                <xsl:value-of select="summary//*[name() = $language]"/>
              </fo:block>
            </xsl:if>
          </fo:block>
        </xsl:if>
      </xsl:for-each>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/skills">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <xsl:call-template name="title"/>
      <xsl:for-each select="items/*">
        <xsl:if test="visible = 'true'">
          <fo:block keep-together.within-page="always">
            <fo:block font-weight="bold" margin-top="5pt">
              <xsl:value-of select="name//*[name() = $language]"/>
            </fo:block>
            <fo:block>
              <xsl:value-of select="description//*[name() = $language]"/>
            </fo:block>
            <xsl:call-template name="keywords">
              <xsl:with-param name="i18n">true</xsl:with-param>
            </xsl:call-template>
          </fo:block>
        </xsl:if>
      </xsl:for-each>
    </xsl:if>
  </xsl:template>

  <xsl:template match="/resume/sections/timeline">
    <xsl:param name="sectionId"/>
    <xsl:if test="id = $sectionId and visible = 'true'">
      <fo:block keep-together.within-page="always">
        <xsl:call-template name="title"/>
        <fo:block margin-top="5pt">
          <fo:external-graphic content-width="130mm">
            <xsl:attribute name="src">
              <xsl:text>url('data:image/png;base64,</xsl:text>
              <xsl:value-of select="$timeline"/>
              <xsl:text>')</xsl:text>
            </xsl:attribute>
          </fo:external-graphic>
        </fo:block>
      </fo:block>
    </xsl:if>
  </xsl:template>

  <xsl:template match='items'>
    <xsl:param name="main"/>
    <xsl:param name="big"/>
    <xsl:attribute name="padding-top">5pt</xsl:attribute>
    <xsl:if test="$main = 'true'">
      <xsl:attribute name="border-left-color">
        <xsl:value-of select="$headingsTextColor"/>
      </xsl:attribute>
      <xsl:attribute name="border-left-style">solid</xsl:attribute>
      <xsl:attribute name="padding-left">5pt</xsl:attribute>
      <xsl:attribute name="padding-bottom">5pt</xsl:attribute>
      <xsl:choose>
        <xsl:when test="$big = 'true'">
          <xsl:attribute name="border-left-width">3pt</xsl:attribute>
          <xsl:attribute name="margin-left">0pt</xsl:attribute>
          <xsl:attribute name="margin-top">5pt</xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="border-left-width">1pt</xsl:attribute>
          <xsl:attribute name="margin-left">1pt</xsl:attribute>
          <xsl:attribute name="margin-left">1pt</xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="date">
    <xsl:param name="bold"/>
    <xsl:if test="date != ''">
      <xsl:choose>
        <xsl:when test="$bold = 'true'">
          <fo:block font-weight="bold">
            <xsl:value-of select="dateFormatter:convertMonthYear(date, $language)"/>
          </fo:block>
        </xsl:when>
        <xsl:otherwise>
          <fo:block>
            <xsl:value-of select="dateFormatter:convertMonthYear(date, $language)"/>
          </fo:block>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="keywords">
    <xsl:param name="i18n"/>
    <fo:block margin-top="5pt">
      <xsl:choose>
        <xsl:when test="$i18n = 'true'">
          <xsl:for-each select="keywords/*">
            <xsl:sort select=".//*[name() = $language]"/>
            <fo:inline>
              <xsl:value-of select=".//*[name() = $language]"/>
              <xsl:if test="position() != last()">
                <xsl:text>, </xsl:text>
              </xsl:if>
            </fo:inline>
          </xsl:for-each>
        </xsl:when>
        <xsl:otherwise>
          <xsl:for-each select="keywords/*">
            <xsl:sort select="."/>
            <fo:inline>
              <xsl:value-of select="."/>
              <xsl:if test="position() != last()">
                <xsl:text>, </xsl:text>
              </xsl:if>
            </fo:inline>
          </xsl:for-each>
        </xsl:otherwise>
      </xsl:choose>
    </fo:block>
  </xsl:template>

  <xsl:template name="position">
    <xsl:param name="main"/>
    <xsl:call-template name="title"/>
    <xsl:for-each select="items/*">
      <xsl:if test=" visible = 'true'">
        <fo:block>
          <fo:block>
            <xsl:apply-templates select=".">
              <xsl:with-param name="main">
                <xsl:value-of select="$main"/>
              </xsl:with-param>
              <xsl:with-param name="big">true</xsl:with-param>
            </xsl:apply-templates>
            <fo:block font-weight="bold">
              <xsl:if test="$main = 'true'">
                <xsl:attribute name="text-align-last">justify</xsl:attribute>
              </xsl:if>
              <fo:inline>
                <xsl:value-of select="organisation//*[name() = $language]"/>
              </fo:inline>
              <xsl:choose>
                <xsl:when test="$main = 'true'">
                  <fo:leader leader-pattern="space"/>
                </xsl:when>
                <xsl:otherwise>
                  <fo:block>
                    <xsl:text/>
                  </fo:block>
                </xsl:otherwise>
              </xsl:choose>
              <fo:inline>
                <xsl:value-of select="dateFormatter:convertMonthYear(date-start, $language)"/>
              </fo:inline>
              <xsl:choose>
                <xsl:when test="$language = 'en'">
                  <xsl:text> to </xsl:text>
                </xsl:when>
                <xsl:when test="$language = 'nl'">
                  <xsl:text> t/m </xsl:text>
                </xsl:when>
              </xsl:choose>
              <xsl:choose>
                <xsl:when test="date-end != ''">
                  <xsl:value-of select="dateFormatter:convertMonthYear(date-end, $language)"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:choose>
                    <xsl:when test="$language = 'en'">
                      <xsl:text>present day</xsl:text>
                    </xsl:when>
                    <xsl:when test="$language = 'nl'">
                      <xsl:text>heden</xsl:text>
                    </xsl:when>
                  </xsl:choose>
                </xsl:otherwise>
              </xsl:choose>
            </fo:block>
            <xsl:if test="position//*[name() = $language] != '' or location//*[name() = $language] != ''">
              <fo:block>
                <xsl:if test="$main = 'true'">
                  <xsl:attribute name="text-align-last">justify</xsl:attribute>
                </xsl:if>
                <fo:inline>
                  <xsl:value-of select="position//*[name() = $language]"/>
                </fo:inline>
                <xsl:choose>
                  <xsl:when test="$main = 'true'">
                    <fo:leader leader-pattern="space"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <fo:block>
                      <xsl:text/>
                    </fo:block>
                  </xsl:otherwise>
                </xsl:choose>
                <fo:inline>
                  <xsl:value-of select="location//*[name() = $language]"/>
                </fo:inline>
              </fo:block>
            </xsl:if>
            <fo:block>
              <xsl:call-template name="url"/>
            </fo:block>
          </fo:block>
          <xsl:if test="summary//*[name() = $language] != '' or activities//text/*[name() = $language] != '' or (keywords != 'null' and keywords[1] != '')">
            <fo:block>
              <xsl:apply-templates select=".">
                <xsl:with-param name="main">
                  <xsl:value-of select="$main"/>
                </xsl:with-param>
              </xsl:apply-templates>
              <xsl:if test="summary//*[name() = $language] != ''">
                <fo:block linefeed-treatment="preserve">
                  <xsl:value-of select="summary[1]//*[name() = $language]"/>
                </fo:block>
              </xsl:if>
              <xsl:if test="activities//text/*[name() = $language] != ''">
                <fo:block margin-top="5pt">
                  <xsl:value-of select="activities/text//*[name() = $language]"/>
                </fo:block>
                <xsl:if test="activities//activities[1]/*[name() = $language] != ''">
                  <fo:list-block>
                    <xsl:for-each select="activities/activities/*">
                      <fo:list-item>
                        <fo:list-item-label>
                          <fo:block font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}">
                            <xsl:text>&#xECDE;</xsl:text>
                          </fo:block>
                        </fo:list-item-label>
                        <fo:list-item-body margin-left="10pt">
                          <fo:block linefeed-treatment="preserve">
                            <xsl:value-of select=".//*[name() = $language]"/>
                          </fo:block>
                        </fo:list-item-body>
                      </fo:list-item>
                    </xsl:for-each>
                  </fo:list-block>
                </xsl:if>
              </xsl:if>
              <xsl:if test="keywords != 'null' and keywords[1] != ''">
                <fo:block font-size="8pt">
                  <xsl:call-template name="keywords">
                    <xsl:with-param name="i18n">false</xsl:with-param>
                  </xsl:call-template>
                </fo:block>
              </xsl:if>
            </fo:block>
          </xsl:if>
        </fo:block>
      </xsl:if>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="rating">
    <xsl:param name="rating"/>
    <fo:block>
      <xsl:for-each select="(//node())[5 >= position()]">
        <xsl:variable name="fill">
          <xsl:choose>
            <xsl:when test="$rating >= position()">
              <xsl:value-of select="$headingsTextColor"/>
            </xsl:when>
            <xsl:otherwise>#ffffff</xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <fo:inline padding-right="3pt">
          <fo:instream-foreign-object>
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="4">
              <g style="fill:{$fill}; stroke:{$headingsTextColor}">
                <rect x="0" y="0" width="8" height="4"/>
              </g>
            </svg>
          </fo:instream-foreign-object>
        </fo:inline>
      </xsl:for-each>
    </fo:block>
  </xsl:template>

  <xsl:template name="title">
    <fo:block font-weight="bold" color="{$headingsTextColor}" margin-top="10pt">
      <xsl:value-of select="name//*[name() = $language]"/>
    </fo:block>
  </xsl:template>

  <xsl:template name="url">
    <xsl:if test="url != ''">
      <fo:inline font-family="Phosphor" font-weight="bold" color="{$headingsTextColor}" padding-right="3pt">
        <xsl:text>&#xE2E2;</xsl:text>
      </fo:inline>
      <fo:inline>
        <fo:basic-link>
          <xsl:attribute name="external-destination">
            <xsl:value-of select="url"/>
          </xsl:attribute>
          <xsl:value-of select="url"/>
        </fo:basic-link>
      </fo:inline>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>
