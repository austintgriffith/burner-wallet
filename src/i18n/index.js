import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { fr, en } from "./locales";

const i18n = i18next;
const options = {
  interpolation: {
    escapeValue: false // not needed for react!!
  },

  debug: true,

  resources: {
    pt: {
      common: fr.fr
    },
    en: {
      common: en.en
    }
  },

  fallbackLng: "en",

  ns: ["common"],

  defaultNS: "common",

  react: {
    wait: false,
    bindI18n: "languageChanged loaded",
    bindStore: "added removed",
    nsMode: "default"
  }
};

i18next.use(LanguageDetector).init(options);
i18next.changeLanguage("en", (err, t) => {
  if (err) return console.log("Something went wrong during loading");
});

export default i18n;
