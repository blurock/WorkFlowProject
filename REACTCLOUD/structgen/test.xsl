<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:foo="http://www.xml-cml.org/schema/cml2/core">
<xsl:output method="text" />
<xsl:template match="/">
<xsl:apply-templates/>
</xsl:template>
<!-- 
   **********************************************************
-->
<xsl:template match="foo:cml">
	<xsl:for-each select="foo:list">
		<xsl:for-each select="foo:scalar"> 
			<xsl:value-of select="."/>
			<xsl:text>   </xsl:text>
		</xsl:for-each>
	<xsl:text>
</xsl:text>
	</xsl:for-each>
</xsl:template>

</xsl:stylesheet>
