import { saveFile } from "@/components/ui/saveFile";
import { reportFileName, type ReportData } from "@/lib/report";
import type { ReportPalette } from "./CycleReportDocument";

// Reads the light-theme token values, so the PDF looks the same in light and dark mode
// and no colors are hard-coded outside globals.css.
function readPalette(): ReportPalette {
  const probe = document.createElement("div");
  probe.dataset.theme = "light";
  document.body.append(probe);
  const styles = getComputedStyle(probe);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const palette = { ink: token("--ink"), inkMuted: token("--ink-muted"), line: token("--line") };
  probe.remove();
  return palette;
}

// Builds the PDF on this device and downloads it. The PDF library loads only here.
export async function downloadReport(report: ReportData): Promise<void> {
  const [{ pdf }, { CycleReportDocument, registerReportFonts }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./CycleReportDocument"),
  ]);
  registerReportFonts(window.location.origin);
  const blob = await pdf(<CycleReportDocument report={report} palette={readPalette()} />).toBlob();
  saveFile(blob, reportFileName(report.createdOn));
}
