"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  date_of_birth: string | null;
}

interface MarkData {
  subject: string;
  mark: number | null;
  grade: string | null;
  max_score: number | null;
  teacher_comment: string | null;
  mark_status: string | null;
}

interface SchoolInfoData {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface ReportCardData {
  student: StudentData;
  marks: MarkData[];
  averagePercentage: number | null;
  conductRemarks: string | null;
  principalComment: string | null;
  academicYear: string;
  term: number;
}

interface PDFDownloadButtonProps {
  reportCardData: ReportCardData[];
  schoolInfo: SchoolInfoData;
  fileName: string;
}

export function PDFDownloadButton({
  reportCardData,
  schoolInfo,
  fileName,
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Dynamically import the PDF libraries
      const [{ pdf }, { ReportCardDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/report-cards/report-card-pdf"),
      ]);

      // Filter to only include students with marks
      const studentsWithMarks = reportCardData.filter((r) => r.marks.length > 0);

      if (studentsWithMarks.length === 0) {
        toast.error("No students with marks to generate report cards");
        return;
      }

      // Generate the PDF blob
      const blob = await pdf(
        <ReportCardDocument students={studentsWithMarks} schoolInfo={schoolInfo} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Report cards downloaded: ${fileName}`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      disabled={loading}
      onClick={handleDownload}
      className="bg-green-600 hover:bg-green-700"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
