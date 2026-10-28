// The Privacy and Terms pages. Plain language, short lines. Both are drafts until a lawyer has read them.

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  // Shown as a bulleted list after the paragraphs.
  list?: string[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  sections: LegalSection[];
}

// Change this whenever either page changes.
export const LEGAL_LAST_UPDATED = "2026-10-28";

export const privacyPolicy: LegalDocument = {
  title: "Privacy",
  intro: "Your data stays on this device. We never sell or share it.",
  sections: [
    {
      heading: "Where your data lives",
      paragraphs: [
        "Everything you log stays in your browser's storage on this device.",
        "That means your cycle, check-ins, symptoms, workouts, notes, water and settings.",
        "We have no account system and no copy of your data on a server.",
      ],
    },
    {
      heading: "No selling, no sharing, no tracking",
      paragraphs: [
        "We never sell or share your data with anyone.",
        "Iszacycle has no analytics, no ads, no trackers and no third-party scripts.",
        "The app only loads files from its own website.",
      ],
    },
    {
      heading: "Push notifications, if you turn them on",
      paragraphs: [
        "Notifications are off until you turn them on. When they are on, our server stores only this:",
      ],
      list: [
        "A random device ID, not linked to your name or email.",
        "Your browser's push address and its keys, so a notification can reach you.",
        "Your time zone, so reminders arrive at your local time.",
        "Whether discreet mode is on, so the text stays neutral.",
        "Your reminder schedule: the type, the time and the days of each one.",
        "If your cycle is regular enough, the date of one planner reminder, a few days before your next period.",
      ],
    },
    {
      heading: "What the server never gets",
      paragraphs: [
        "Never your name, reminder labels, notes, symptoms, moods, logs or cycle days.",
        "Notification text is fixed on the server and never mentions periods, cycles or symptoms.",
        "The title shows the app name, Iszacycle. Discreet mode changes it to a neutral Reminder.",
      ],
    },
    {
      heading: "Turning notifications off",
      paragraphs: [
        "Go to Me, then Reminders, and turn off Notifications on this device.",
        "That deletes your device ID, push address and reminder schedule from our server.",
        "Delete all data does the same before it clears this device.",
      ],
    },
    {
      heading: "Export your data",
      paragraphs: [
        "Go to Me, then Export data, and tap Download backup.",
        "You get one file with your profile, periods, check-ins, workouts, supplies, reminders and settings.",
        "Store it somewhere private.",
      ],
    },
    {
      heading: "Delete your data",
      paragraphs: [
        "Go to Me, then Delete all data, and type DELETE to confirm.",
        "This removes everything from this device and from the notification server. It cannot be undone.",
        "Clearing your browser's site data for Iszacycle also removes everything on this device.",
      ],
    },
    {
      heading: "Not a medical device",
      paragraphs: [
        "Iszacycle is not a medical device or a contraceptive.",
        "Predictions are estimates and can be wrong. Never use them to prevent pregnancy.",
      ],
    },
  ],
};

export const termsOfUse: LegalDocument = {
  title: "Terms",
  intro: "By using Iszacycle you agree to these terms. They are short on purpose.",
  sections: [
    {
      heading: "What Iszacycle is",
      paragraphs: [
        "Iszacycle helps you plan training, food, work and rest around your cycle.",
        "Its guidance is general wellness information, not medical advice.",
      ],
    },
    {
      heading: "Not a medical device or contraceptive",
      paragraphs: [
        "Iszacycle is not a medical device or a contraceptive.",
        "It does not diagnose, treat or prevent any condition.",
        "Never use its predictions to prevent or plan a pregnancy.",
        "If something feels wrong with your body, consider talking to a doctor.",
      ],
    },
    {
      heading: "Your data is your responsibility",
      paragraphs: [
        "Your data lives only on this device, so we cannot restore it if it is lost.",
        "Export a backup from Me if you want a copy. Keep it somewhere private.",
      ],
    },
    {
      heading: "Push notifications",
      paragraphs: [
        "Notifications are optional and may arrive late or not at all.",
        "Do not rely on them for medication. Keep your own backup reminder for anything important.",
      ],
    },
    {
      heading: "Using Iszacycle fairly",
      paragraphs: [
        "Use Iszacycle for yourself, and do not try to break or overload it.",
        "Iszacycle is provided as it is, without warranties of any kind.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms. The date at the top shows the latest version.",
        "See the Privacy page for exactly what stays on your device.",
      ],
    },
  ],
};
