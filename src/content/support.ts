// What /support shows. Kept here so the numbers can change without touching components.
// Philippine numbers, confirmed with the owner on 2026-10-28. Call each one again before launch: a wrong number
// here does real harm. Never invent a number.

export interface Helpline {
  name: string;
  // One line on who answers.
  about: string;
  // Shown as written and dialled as tel: links.
  phones: string[];
  // For example "24 hours" or "Mon to Fri, 9:00 to 17:00".
  hours: string;
}

// Shown first, on its own.
export const EMERGENCY: Helpline = {
  name: "Emergency",
  about: "If you or someone else is in danger right now.",
  phones: ["911"],
  hours: "24 hours, free",
};

export const HELPLINES: Helpline[] = [
  {
    name: "NCMH Crisis Hotline",
    about: "The National Center for Mental Health. Free, private support for anyone in distress.",
    phones: ["1553", "0917 899 8727"],
    hours: "24 hours. 1553 is toll-free from landlines.",
  },
  {
    name: "Hopeline PH",
    about: "Emotional support and suicide prevention, from trained listeners.",
    phones: ["(02) 8804 4673", "0917 558 4673"],
    hours: "24 hours",
  },
];

// When reaching out is worth it. Never a diagnosis: the last line always points to a doctor.
export const WHEN_TO_REACH_OUT: string[] = [
  "You feel hopeless, unsafe, or have thoughts of hurting yourself.",
  "Low mood or anxiety lasts most days for two weeks or more.",
  "Mood changes before your period make work or relationships hard every cycle.",
  "Stress keeps you from sleeping, eating or getting through the day.",
];
export const WHEN_TO_REACH_OUT_END = "You do not need a reason to call. Consider talking to a doctor.";
