import { useTranslation } from "react-i18next";
import {
  Info,
  Languages,
  Monitor,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { GithubIcon } from "../icons/GithubIcon";
import { ButtonLink } from "../../ui/button-link/ButtonLink";
import { Button } from "../../ui/button/Button";
import { Dropdown, DropdownItem } from "../../ui/dropdown/Dropdown";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";
import { SUPPORTED_LANGUAGES } from "../../i18n/i18n";
import { GITHUB_URL } from "../../githubUrl";
import type { ThemePreference } from "../../theme/theme";

/** The theme options in display order, and the glyph for each. */
const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];
const THEME_ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

/**
 * Bottom zone of the sidebar: About, GitHub, Theme picker, Language picker.
 */
export function LayersSidebarFooter() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  const { language, setLanguage } = useLanguage();
  const ActiveThemeIcon = THEME_ICONS[preference];

  return (
    <div className="flex shrink-0 items-center justify-center gap-1 border-t border-base-300 p-1">
      <ButtonLink
        to="/about"
        variant="ghost"
        size="sm"
        aria-label={t("sidebar.about")}
        title={t("sidebar.about")}
      >
        <Info className="size-4" aria-hidden />
      </ButtonLink>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("sidebar.openGithub")}
        title={t("sidebar.github")}
        onClick={() => window.open(GITHUB_URL, "_blank", "noopener,noreferrer")}
      >
        <GithubIcon className="size-4" aria-hidden />
      </Button>
      <Dropdown
        trigger={<ActiveThemeIcon className="size-4" aria-hidden />}
        triggerLabel={t("sidebar.switchTheme")}
      >
        {THEME_PREFERENCES.map((option) => {
          const Icon = THEME_ICONS[option];
          return (
            <DropdownItem
              key={option}
              active={option === preference}
              onClick={() => setPreference(option)}
            >
              <Icon className="size-4" aria-hidden />
              {t(`theme.${option}`)}
            </DropdownItem>
          );
        })}
      </Dropdown>
      <Dropdown
        trigger={<Languages className="size-4" aria-hidden />}
        triggerLabel={t("sidebar.switchLanguage")}
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <DropdownItem
            key={code}
            active={code === language}
            onClick={() => setLanguage(code)}
          >
            {t(`language.${code}`)}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}
