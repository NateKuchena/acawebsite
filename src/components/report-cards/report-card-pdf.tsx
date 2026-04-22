"use client";

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { calculateGrade, getFormLevel } from "@/lib/utils/grading";

// Types
export interface StudentData {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  date_of_birth: string | null;
}

export interface MarkData {
  subject: string;
  mark: number | null;
  grade: string | null;
  max_score: number | null;
  teacher_comment: string | null;
  mark_status: string | null;
}

export interface SchoolInfoData {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

export interface ReportCardData {
  student: StudentData;
  marks: MarkData[];
  averagePercentage: number | null;
  conductRemarks: string | null;
  principalComment: string | null;
  academicYear: string;
  term: number;
}

interface ReportCardDocumentProps {
  students: ReportCardData[];
  schoolInfo: SchoolInfoData;
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottom: "2px solid #1a365d",
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  schoolInfo: {
    textAlign: "center",
    flex: 1,
  },
  schoolName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  schoolMotto: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#4a5568",
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 10,
    color: "#4a5568",
    marginBottom: 3,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 12,
    color: "#2d3748",
  },
  termInfo: {
    fontSize: 10,
    marginTop: 6,
    color: "#4a5568",
  },
  // Student Info
  studentInfoSection: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f7fafc",
    borderRadius: 4,
  },
  studentInfoColumn: {
    flex: 1,
  },
  studentInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  studentInfoLabel: {
    width: 80,
    fontWeight: "bold",
    color: "#4a5568",
  },
  studentInfoValue: {
    flex: 1,
    color: "#1a202c",
  },
  // Marks Table
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a365d",
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f7fafc",
  },
  colSubject: {
    width: "25%",
  },
  colMark: {
    width: "12%",
    textAlign: "center",
  },
  colPercent: {
    width: "12%",
    textAlign: "center",
  },
  colGrade: {
    width: "10%",
    textAlign: "center",
  },
  colComment: {
    width: "41%",
  },
  // Grade colors
  gradeA: {
    color: "#276749",
    fontWeight: "bold",
  },
  gradeB: {
    color: "#2b6cb0",
    fontWeight: "bold",
  },
  gradeC: {
    color: "#b7791f",
    fontWeight: "bold",
  },
  gradeD: {
    color: "#c05621",
    fontWeight: "bold",
  },
  gradeE: {
    color: "#c53030",
    fontWeight: "bold",
  },
  gradeU: {
    color: "#718096",
    fontWeight: "bold",
  },
  // Summary Section
  summarySection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#edf2f7",
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2d3748",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a365d",
  },
  // Conduct Section
  conductSection: {
    marginBottom: 15,
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 10,
    color: "#4a5568",
    lineHeight: 1.4,
  },
  // Principal Comment Section
  principalSection: {
    marginBottom: 20,
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    minHeight: 60,
  },
  // Signature Section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTop: "1px solid #e2e8f0",
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottom: "1px solid #4a5568",
    marginBottom: 4,
    height: 20,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#718096",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#a0aec0",
  },
  // Special mark badge
  specialMark: {
    fontSize: 8,
    color: "#805ad5",
    fontStyle: "italic",
  },
});

// Helper to get grade style
function getGradeStyle(grade: string | null) {
  switch (grade) {
    case "A*":
    case "A":
      return styles.gradeA;
    case "B":
      return styles.gradeB;
    case "C":
      return styles.gradeC;
    case "D":
      return styles.gradeD;
    case "E":
      return styles.gradeE;
    case "U":
    default:
      return styles.gradeU;
  }
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Single Report Card Page
function ReportCardPage({
  data,
  schoolInfo,
}: {
  data: ReportCardData;
  schoolInfo: SchoolInfoData;
}) {
  const formLevel = getFormLevel(data.student.form);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {schoolInfo.logo_url && (
            <Image style={styles.logo} src={schoolInfo.logo_url} />
          )}
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{schoolInfo.name.toUpperCase()}</Text>
            <Text style={styles.schoolAddress}>{schoolInfo.address || ""}</Text>
            {(schoolInfo.phone || schoolInfo.email) && (
              <Text style={styles.schoolAddress}>
                {schoolInfo.phone ? `Tel: ${schoolInfo.phone}` : ""}
                {schoolInfo.phone && schoolInfo.email ? " | " : ""}
                {schoolInfo.email ? `Email: ${schoolInfo.email}` : ""}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.reportTitle}>ACADEMIC REPORT CARD</Text>
        <Text style={styles.termInfo}>
          Academic Year: {data.academicYear} | Term {data.term}
        </Text>
      </View>

      {/* Student Info */}
      <View style={styles.studentInfoSection}>
        <View style={styles.studentInfoColumn}>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentInfoLabel}>Name:</Text>
            <Text style={styles.studentInfoValue}>
              {data.student.surname}, {data.student.name}
            </Text>
          </View>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentInfoLabel}>Student No:</Text>
            <Text style={styles.studentInfoValue}>
              {data.student.student_number}
            </Text>
          </View>
        </View>
        <View style={styles.studentInfoColumn}>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentInfoLabel}>Form/Class:</Text>
            <Text style={styles.studentInfoValue}>{data.student.form}</Text>
          </View>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentInfoLabel}>Date of Birth:</Text>
            <Text style={styles.studentInfoValue}>
              {formatDate(data.student.date_of_birth)}
            </Text>
          </View>
        </View>
      </View>

      {/* Marks Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSubject]}>
            SUBJECT
          </Text>
          <Text style={[styles.tableHeaderText, styles.colMark]}>MARK</Text>
          <Text style={[styles.tableHeaderText, styles.colPercent]}>%</Text>
          <Text style={[styles.tableHeaderText, styles.colGrade]}>GRADE</Text>
          <Text style={[styles.tableHeaderText, styles.colComment]}>
            TEACHER COMMENT
          </Text>
        </View>

        {/* Table Rows */}
        {data.marks.map((mark, index) => {
          const maxScore = mark.max_score || 100;
          const percentage = mark.mark !== null ? (mark.mark / maxScore) * 100 : null;
          const displayGrade =
            mark.grade || (percentage !== null ? calculateGrade(percentage, formLevel) : null);

          return (
            <View
              key={`${mark.subject}-${index}`}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colSubject}>{mark.subject}</Text>
              <Text style={styles.colMark}>
                {mark.mark_status ? (
                  <Text style={styles.specialMark}>
                    {mark.mark_status === "A" ? "Absent" : "N/W"}
                  </Text>
                ) : mark.mark !== null ? (
                  `${mark.mark}/${maxScore}`
                ) : (
                  "-"
                )}
              </Text>
              <Text style={styles.colPercent}>
                {percentage !== null ? `${percentage.toFixed(0)}%` : "-"}
              </Text>
              <Text style={[styles.colGrade, getGradeStyle(displayGrade)]}>
                {displayGrade || "-"}
              </Text>
              <Text style={styles.colComment}>
                {mark.teacher_comment || "-"}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Overall Average */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>OVERALL AVERAGE</Text>
          <Text style={styles.summaryValue}>
            {data.averagePercentage !== null
              ? `${data.averagePercentage.toFixed(1)}%`
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* Conduct/Behavior */}
      <View style={styles.conductSection}>
        <Text style={styles.sectionTitle}>CONDUCT / BEHAVIOR</Text>
        <Text style={styles.sectionText}>
          {data.conductRemarks || "No remarks recorded."}
        </Text>
      </View>

      {/* Principal's Comment */}
      <View style={styles.principalSection}>
        <Text style={styles.sectionTitle}>PRINCIPAL&apos;S COMMENT</Text>
        <Text style={styles.sectionText}>
          {data.principalComment || ""}
        </Text>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Class Teacher Signature</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Principal Signature & Date</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Generated on {new Date().toLocaleDateString("en-GB")} | {schoolInfo.name}
      </Text>
    </Page>
  );
}

// Main Document Component
export function ReportCardDocument({
  students,
  schoolInfo,
}: ReportCardDocumentProps) {
  return (
    <Document>
      {students.map((studentData) => (
        <ReportCardPage
          key={studentData.student.id}
          data={studentData}
          schoolInfo={schoolInfo}
        />
      ))}
    </Document>
  );
}

export default ReportCardDocument;
