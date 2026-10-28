// Loaded only when "Create PDF" is pressed, together with @react-pdf/renderer.
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { PHASES } from "@/lib/cycle";
import { REPORT_FOOTER, type LengthStats, type ReportData } from "@/lib/report";

// Colors come from the design tokens at the moment the PDF is made (light theme).
export interface ReportPalette {
  ink: string;
  inkMuted: string;
  line: string;
}

const FONT_FAMILY = "Plus Jakarta Sans";
let fontsRegistered = false;

// The font files live in public/fonts, so nothing is fetched from a third party.
export function registerReportFonts(origin: string) {
  if (fontsRegistered) return;
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: `${origin}/fonts/PlusJakartaSans-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/PlusJakartaSans-Bold.ttf`, fontWeight: 700 },
    ],
  });
  // Keep words whole instead of hyphenating them.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const day = (date: string) => format(parseISO(date), "MMM d, yyyy");
const PHASE_HEADINGS = ["Menstrual", "Follicular", "Ovulatory", "Luteal"];

function lengthLine(label: string, stats: LengthStats | null): string {
  if (!stats) return `${label}: not enough data`;
  return `${label}: ${stats.average} days (range ${stats.min} to ${stats.max})`;
}

function createStyles(palette: ReportPalette) {
  return StyleSheet.create({
    page: {
      fontFamily: FONT_FAMILY,
      // Ligatures such as "fl" lose their letters when text is copied or read aloud from the PDF.
      fontFeatureSettings: { liga: false, clig: false },
      fontSize: 10,
      color: palette.ink,
      paddingTop: 40,
      paddingBottom: 64,
      paddingHorizontal: 40,
    },
    title: { fontSize: 20, fontWeight: 700, color: palette.ink },
    muted: { color: palette.inkMuted },
    section: { marginTop: 18 },
    heading: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
    line: { marginBottom: 3 },
    row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: palette.line, paddingVertical: 4 },
    headerRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: palette.inkMuted, paddingBottom: 4 },
    cell: { flex: 1 },
    wideCell: { flex: 2 },
    bold: { fontWeight: 700 },
    footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: palette.inkMuted },
  });
}

export function CycleReportDocument({ report, palette }: { report: ReportData; palette: ReportPalette }) {
  const styles = createStyles(palette);
  return (
    <Document title="Cycle summary" author="Iszacycle" creator="Iszacycle">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Cycle summary</Text>
        <Text style={[styles.muted, { marginTop: 4 }]}>
          {day(report.range.from)} to {day(report.range.to)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.line}>Contraception: {report.contraception}</Text>
          <Text style={styles.line}>{lengthLine("Average cycle", report.cycleLength)}</Text>
          <Text style={styles.line}>{lengthLine("Average period", report.periodLength)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Cycles</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.bold]}>Start date</Text>
            <Text style={[styles.cell, styles.bold]}>Cycle length</Text>
            <Text style={[styles.cell, styles.bold]}>Period length</Text>
          </View>
          {report.cycles.map((cycle) => (
            <View key={cycle.startDate} style={styles.row} wrap={false}>
              <Text style={styles.cell}>{day(cycle.startDate)}</Text>
              <Text style={styles.cell}>{cycle.length} days</Text>
              <Text style={styles.cell}>{cycle.periodLength === null ? "Not logged" : `${cycle.periodLength} days`}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Symptoms by phase (days logged)</Text>
          {report.symptoms.length === 0 ? (
            <Text style={styles.muted}>No symptoms logged.</Text>
          ) : (
            <>
              {!report.showPhases && (
                <Text style={[styles.muted, styles.line]}>Phases are not shown with hormonal contraception or irregular cycles.</Text>
              )}
              <View style={styles.headerRow}>
                <Text style={[styles.wideCell, styles.bold]}>Symptom</Text>
                {report.showPhases ? (
                  PHASE_HEADINGS.map((heading) => (
                    <Text key={heading} style={[styles.cell, styles.bold]}>
                      {heading}
                    </Text>
                  ))
                ) : (
                  <Text style={[styles.cell, styles.bold]}>Days</Text>
                )}
              </View>
              {report.symptoms.map((row) => (
                <View key={row.symptom} style={styles.row} wrap={false}>
                  <Text style={styles.wideCell}>{row.symptom}</Text>
                  {report.showPhases ? (
                    PHASES.map((phase) => (
                      <Text key={phase} style={styles.cell}>
                        {row.byPhase[phase]}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.cell}>{row.all}</Text>
                  )}
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Health flags</Text>
          {report.flags.length === 0 ? (
            <Text style={styles.muted}>No health flags.</Text>
          ) : (
            report.flags.map((flag) => (
              <View key={flag.title} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={styles.bold}>{flag.title}</Text>
                <Text>{flag.body}</Text>
              </View>
            ))
          )}
        </View>

        {report.notes && (
          <View style={styles.section}>
            <Text style={styles.heading}>Notes</Text>
            {report.notes.length === 0 ? (
              <Text style={styles.muted}>No notes in this period.</Text>
            ) : (
              report.notes.map((note) => (
                <Text key={note.date} style={styles.line}>
                  <Text style={styles.bold}>{day(note.date)}: </Text>
                  {note.text}
                </Text>
              ))
            )}
          </View>
        )}

        <Text style={styles.footer} fixed>
          {REPORT_FOOTER}
        </Text>
      </Page>
    </Document>
  );
}
