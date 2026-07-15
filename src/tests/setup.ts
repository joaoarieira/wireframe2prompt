import "@testing-library/jest-dom";
import i18n from "../presentation/i18n/i18n";

// Determinism: every component spec renders against English regardless of the
// host's navigator.language, so getByText/getByLabelText queries stay stable.
void i18n.changeLanguage("en");
