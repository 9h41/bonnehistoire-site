module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addCollection("sitemapPages", (api) =>
    api.getAll().filter((p) => p.url && !p.data.noindex && p.url !== "/404.html" && !p.url.endsWith(".xml") && !p.url.endsWith(".txt"))
  );
  return { dir: { input: "src", includes: "_includes", output: "_site" }, markdownTemplateEngine: "njk", htmlTemplateEngine: "njk" };
};
