const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");

const createHtmlForTemplate = (templateName, templateParameters) => {
  const html = fs.readFileSync(
    path.join(process.env.SRC_PATH, `./templates/${templateName}`),
    "utf8"
  );
  const template = handlebars.compile(html);
  return template(templateParameters);
};

module.exports = createHtmlForTemplate;
