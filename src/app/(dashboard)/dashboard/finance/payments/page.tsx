"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Loader2,
  Receipt,
  Search,
  Printer,
  DollarSign,
  History,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
}

// School info for receipts
const SCHOOL_INFO = {
  name: "Amazon Christian Academy",
  address: "Amazon B Village, Filabusi, Insiza District",
  phone: "+263 XXX XXX XXX",
};

interface FeeCategory {
  id: string;
  name: string;
  default_amount: number | null;
}

interface Payment {
  id: string;
  receipt_number: string;
  student_id: string;
  amount: number;
  payment_method: string | null;
  received_by_name: string | null;
  created_at: string;
  students: { name: string; surname: string; student_number: string; form: string } | null;
  fee_categories: { name: string } | null;
}

interface PaymentItem {
  categoryId: string;
  categoryName: string;
  amount: string;
}

interface GroupedReceipt {
  receipt_number: string;
  student: { name: string; surname: string; student_number: string; form?: string } | null;
  student_id?: string;
  payment_method: string | null;
  received_by_name: string | null;
  created_at: string;
  items: { category: string; amount: number }[];
  total: number;
}

interface TermStatement {
  academic_year: string;
  term: number;
  balances: {
    categoryName: string;
    amount_due: number;
    amount_paid: number;
    balance: number;
  }[];
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  payments: {
    receipt_number: string;
    date: string;
    categoryName: string;
    amount: number;
    payment_method: string | null;
  }[];
}

export default function FeePaymentsPage() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<GroupedReceipt | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("Staff");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [studentBalances, setStudentBalances] = useState<{ categoryId: string; categoryName: string; expected: number; paid: number; owed: number; academicYear?: string; term?: number }[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Academic year and term state
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState(`${currentYear}`);
  const [term, setTerm] = useState("1");

  // Add item state
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  // Statement view state
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  const [statementSearchQuery, setStatementSearchQuery] = useState("");
  const [statementSearchResults, setStatementSearchResults] = useState<Student[]>([]);
  const [statementSearching, setStatementSearching] = useState(false);
  const [statementStudent, setStatementStudent] = useState<Student | null>(null);
  const [termStatements, setTermStatements] = useState<TermStatement[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get user's name from metadata or email
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Staff";
        setCurrentUser(name);
      }
    };
    fetchUser();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: catError } = await supabase
        .from("fee_categories")
        .select("id, name, default_amount")
        .order("name");

      if (catError) {
        console.error("Categories fetch error:", catError);
      }
      console.log("Categories fetched:", categoriesData?.length || 0);
      setCategories((categoriesData as FeeCategory[]) || []);

      // Fetch recent payments
      const { data: paymentsData, error: payError } = await supabase
        .from("fee_payments")
        .select("*, students!student_id(name, surname, student_number, form), fee_categories!category_id(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (payError) {
        console.error("Payments fetch error:", payError);
      }
      console.log("Payments fetched:", paymentsData?.length || 0, paymentsData);
      setPayments((paymentsData as Payment[]) || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group payments by base receipt number for display
  // Receipt numbers like RCP-20251228-0001, RCP-20251228-0001-B, RCP-20251228-0001-C are grouped together
  const groupedReceipts = useMemo(() => {
    const groups: Record<string, GroupedReceipt> = {};

    payments.forEach((payment) => {
      // Extract base receipt number (remove -A, -B, -C suffix if present)
      const baseReceiptNumber = payment.receipt_number.replace(/-[A-Z]$/, "");

      if (!groups[baseReceiptNumber]) {
        groups[baseReceiptNumber] = {
          receipt_number: baseReceiptNumber,
          student: payment.students,
          student_id: payment.student_id,
          payment_method: payment.payment_method,
          received_by_name: payment.received_by_name,
          created_at: payment.created_at,
          items: [],
          total: 0,
        };
      }
      groups[baseReceiptNumber].items.push({
        category: payment.fee_categories?.name || "Unknown",
        amount: payment.amount,
      });
      groups[baseReceiptNumber].total += payment.amount;
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [payments]);

  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .eq("status", "enrolled")
        .or(`name.ilike.%${query}%,surname.ilike.%${query}%,student_number.ilike.%${query}%`)
        .limit(10);

      setSearchResults((data as Student[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, searchStudents]);

  // Fetch student balances when a student is selected (for selected term/year)
  const fetchStudentBalances = useCallback(async (studentId: string, year: string, termNum: string) => {
    setLoadingBalances(true);
    try {
      // Get all fee categories
      const { data: feeCategories } = await supabase
        .from("fee_categories")
        .select("id, name, default_amount")
        .order("name");

      const cats = (feeCategories as { id: string; name: string; default_amount: number | null }[]) || [];

      // Get existing balances for this student for the selected term/year
      const { data: existingBalances } = await supabase
        .from("student_balances")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_year", year)
        .eq("term", parseInt(termNum));

      const balanceMap = new Map<string, { amount_due: number; amount_paid: number }>();
      for (const bal of (existingBalances || []) as Array<{ category_id: string; amount_due: number; amount_paid: number }>) {
        balanceMap.set(bal.category_id, { amount_due: bal.amount_due, amount_paid: bal.amount_paid });
      }

      // Also get payments for this term/year that may not have created balance records yet
      const { data: termPayments } = await supabase
        .from("fee_payments")
        .select("category_id, amount")
        .eq("student_id", studentId)
        .eq("academic_year", year)
        .eq("term", parseInt(termNum));

      const paymentMap = new Map<string, number>();
      for (const payment of (termPayments || []) as Array<{ category_id: string; amount: number }>) {
        const current = paymentMap.get(payment.category_id) || 0;
        paymentMap.set(payment.category_id, current + payment.amount);
      }

      // Calculate balances per category
      const balances = cats.map((cat) => {
        const existingBal = balanceMap.get(cat.id);
        const expected = existingBal?.amount_due ?? cat.default_amount ?? 0;
        const paid = existingBal?.amount_paid ?? paymentMap.get(cat.id) ?? 0;
        const owed = expected - paid;
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          expected,
          paid,
          owed,
          academicYear: year,
          term: parseInt(termNum),
        };
      });

      setStudentBalances(balances);
    } catch (error) {
      console.error("Error fetching student balances:", error);
    } finally {
      setLoadingBalances(false);
    }
  }, [supabase]);

  // Search students for statement view
  const searchStudentsForStatement = useCallback(async (query: string) => {
    if (query.length < 2) {
      setStatementSearchResults([]);
      return;
    }

    setStatementSearching(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .or(`name.ilike.%${query}%,surname.ilike.%${query}%,student_number.ilike.%${query}%`)
        .eq("status", "enrolled")
        .limit(10);

      if (error) throw error;
      setStatementSearchResults((data as Student[]) || []);
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setStatementSearching(false);
    }
  }, [supabase]);

  // Debounce statement search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (statementSearchQuery) {
        searchStudentsForStatement(statementSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [statementSearchQuery, searchStudentsForStatement]);

  // Fetch student statement (term-by-term with balance brought forward)
  const fetchStudentStatement = useCallback(async (studentId: string) => {
    setLoadingStatement(true);
    try {
      // Fetch all fee categories
      const { data: catData } = await supabase
        .from("fee_categories")
        .select("id, name")
        .order("name");
      const categoryMap = new Map((catData || []).map((c: { id: string; name: string }) => [c.id, c.name]));

      // Fetch all balances for this student
      const { data: balanceData } = await supabase
        .from("student_balances")
        .select("*")
        .eq("student_id", studentId)
        .order("academic_year", { ascending: true })
        .order("term", { ascending: true });

      // Fetch all payments for this student
      const { data: paymentData } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });

      // Group balances and payments by term
      const termMap = new Map<string, TermStatement>();

      // Process balances
      for (const bal of (balanceData || []) as Array<{
        academic_year: string;
        term: number;
        category_id: string;
        amount_due: number;
        amount_paid: number;
      }>) {
        const key = `${bal.academic_year}-${bal.term}`;
        if (!termMap.has(key)) {
          termMap.set(key, {
            academic_year: bal.academic_year,
            term: bal.term,
            balances: [],
            totalDue: 0,
            totalPaid: 0,
            totalBalance: 0,
            payments: [],
          });
        }
        const termData = termMap.get(key)!;
        const balance = bal.amount_due - bal.amount_paid;
        termData.balances.push({
          categoryName: categoryMap.get(bal.category_id) || "Unknown",
          amount_due: bal.amount_due,
          amount_paid: bal.amount_paid,
          balance,
        });
        termData.totalDue += bal.amount_due;
        termData.totalPaid += bal.amount_paid;
        termData.totalBalance += balance;
      }

      // Process payments
      for (const pay of (paymentData || []) as Array<{
        receipt_number: string;
        created_at: string;
        category_id: string;
        amount: number;
        payment_method: string | null;
        academic_year: string | null;
        term: number | null;
      }>) {
        if (pay.academic_year && pay.term) {
          const key = `${pay.academic_year}-${pay.term}`;
          if (termMap.has(key)) {
            termMap.get(key)!.payments.push({
              receipt_number: pay.receipt_number,
              date: pay.created_at,
              categoryName: categoryMap.get(pay.category_id) || "Unknown",
              amount: pay.amount,
              payment_method: pay.payment_method,
            });
          }
        }
      }

      // Sort and convert to array (newest first for display)
      const statements = Array.from(termMap.values()).sort((a, b) => {
        if (a.academic_year !== b.academic_year) {
          return b.academic_year.localeCompare(a.academic_year);
        }
        return b.term - a.term;
      });

      setTermStatements(statements);
    } catch (error) {
      console.error("Error fetching statement:", error);
      toast.error("Failed to load statement");
    } finally {
      setLoadingStatement(false);
    }
  }, [supabase]);

  // Select student for statement
  const selectStudentForStatement = (student: Student) => {
    setStatementStudent(student);
    setStatementSearchQuery("");
    setStatementSearchResults([]);
    fetchStudentStatement(student.id);
  };

  // Print statement
  const printStatement = () => {
    if (!statementStudent) return;

    // Calculate running balance (balance brought forward from previous terms)
    let runningBalance = 0;
    const statementsOldestFirst = [...termStatements].reverse();

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Fee Statement - ${statementStudent.surname}, ${statementStudent.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; }
    .header { text-align: center; border-bottom: 2px solid #800000; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #800000; font-size: 20px; }
    .header h2 { margin: 8px 0; color: #333; font-size: 16px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .info-item label { font-weight: bold; color: #666; font-size: 10px; display: block; }
    .info-item span { font-size: 12px; }
    .term-section { margin-bottom: 25px; page-break-inside: avoid; }
    .term-header { background: #f0f0f0; padding: 10px; border-radius: 5px 5px 0 0; display: flex; justify-content: space-between; align-items: center; }
    .term-header.owing { background: #fef2f2; }
    .term-header.paid { background: #f0fdf4; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
    th { background: #800000; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .text-right { text-align: right; }
    .balance-row { font-weight: bold; background: #f5f5f5 !important; }
    .owing { color: #dc2626; }
    .paid { color: #16a34a; }
    .bf { color: #9333ea; font-style: italic; }
    .summary { background: #1a365d; color: white; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .summary h3 { margin: 0 0 10px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${SCHOOL_INFO.name.toUpperCase()}</h1>
    <p>${SCHOOL_INFO.address}</p>
    <h2>FEE STATEMENT</h2>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="student-info">
    <div class="info-item">
      <label>Student Name</label>
      <span>${statementStudent.surname}, ${statementStudent.name}</span>
    </div>
    <div class="info-item">
      <label>Student Number</label>
      <span>${statementStudent.student_number}</span>
    </div>
    <div class="info-item">
      <label>Form/Class</label>
      <span>${statementStudent.form}</span>
    </div>
    <div class="info-item">
      <label>Statement Date</label>
      <span>${new Date().toLocaleDateString()}</span>
    </div>
  </div>

  ${statementsOldestFirst.map((term) => {
    const balanceBF = runningBalance;
    const termOwing = term.totalBalance;
    runningBalance = balanceBF + termOwing;

    return `
    <div class="term-section">
      <div class="term-header ${termOwing > 0 ? 'owing' : 'paid'}">
        <strong>${term.academic_year} Term ${term.term}</strong>
        <span class="${termOwing > 0 ? 'owing' : 'paid'}">${termOwing > 0 ? 'Owing: $' + termOwing.toFixed(2) : termOwing < 0 ? 'Credit: $' + Math.abs(termOwing).toFixed(2) : 'Fully Paid'}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Debit</th>
            <th class="text-right">Credit</th>
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${balanceBF !== 0 ? `
          <tr class="balance-row">
            <td class="bf">Balance Brought Forward</td>
            <td class="text-right">${balanceBF > 0 ? '$' + balanceBF.toFixed(2) : ''}</td>
            <td class="text-right">${balanceBF < 0 ? '$' + Math.abs(balanceBF).toFixed(2) : ''}</td>
            <td class="text-right bf">$${balanceBF.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${term.balances.map((b) => `
          <tr>
            <td>${b.categoryName} (Fee)</td>
            <td class="text-right">$${b.amount_due.toFixed(2)}</td>
            <td class="text-right"></td>
            <td class="text-right"></td>
          </tr>
          `).join('')}
          ${term.payments.map((p) => `
          <tr>
            <td>${p.categoryName} - Payment (${p.receipt_number})</td>
            <td class="text-right"></td>
            <td class="text-right">$${p.amount.toFixed(2)}</td>
            <td class="text-right"></td>
          </tr>
          `).join('')}
          <tr class="balance-row">
            <td><strong>Term Balance</strong></td>
            <td class="text-right"><strong>$${(term.totalDue + (balanceBF > 0 ? balanceBF : 0)).toFixed(2)}</strong></td>
            <td class="text-right"><strong>$${(term.totalPaid + (balanceBF < 0 ? Math.abs(balanceBF) : 0)).toFixed(2)}</strong></td>
            <td class="text-right ${runningBalance > 0 ? 'owing' : 'paid'}"><strong>$${runningBalance.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
    `;
  }).join('')}

  <div class="summary">
    <h3>Account Summary</h3>
    <div class="summary-row">
      <span>Total Fees Charged:</span>
      <span>$${termStatements.reduce((s, t) => s + t.totalDue, 0).toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Total Payments Made:</span>
      <span>$${termStatements.reduce((s, t) => s + t.totalPaid, 0).toFixed(2)}</span>
    </div>
    <div class="summary-row" style="font-size: 16px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px; margin-top: 5px;">
      <span><strong>Current Balance:</strong></span>
      <span><strong>$${runningBalance.toFixed(2)}</strong></span>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated statement. For queries, please contact the school office.</p>
    <p>${SCHOOL_INFO.name} | ${SCHOOL_INFO.phone}</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    const category = categories.find((c) => c.id === catId);
    if (category?.default_amount) {
      setItemAmount(category.default_amount.toString());
    } else {
      setItemAmount("");
    }
  };

  const addPaymentItem = () => {
    if (!selectedCategoryId || !itemAmount || parseFloat(itemAmount) <= 0) {
      toast.error("Please select a category and enter a valid amount");
      return;
    }

    // Check if category already added
    if (paymentItems.some((item) => item.categoryId === selectedCategoryId)) {
      toast.error("This category is already added");
      return;
    }

    const category = categories.find((c) => c.id === selectedCategoryId);
    if (!category) return;

    setPaymentItems([
      ...paymentItems,
      {
        categoryId: selectedCategoryId,
        categoryName: category.name,
        amount: itemAmount,
      },
    ]);

    // Reset add item form
    setSelectedCategoryId("");
    setItemAmount("");
  };

  const removePaymentItem = (categoryId: string) => {
    setPaymentItems(paymentItems.filter((item) => item.categoryId !== categoryId));
  };

  const totalAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  }, [paymentItems]);

  const generateReceiptNumber = (index?: number) => {
    const prefix = "RCP";
    const date = format(new Date(), "yyyyMMdd");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const base = `${prefix}-${date}-${random}`;
    // If index provided, append letter suffix for unique constraint compatibility
    if (index !== undefined && index > 0) {
      return `${base}-${String.fromCharCode(65 + index)}`; // A, B, C, etc.
    }
    return base;
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setPaymentItems([]);
    setSelectedCategoryId("");
    setItemAmount("");
    setPaymentMethod("cash");
    setSearchQuery("");
    setSearchResults([]);
    setStudentBalances([]);
  };

  const handleRecordPayment = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (paymentItems.length === 0) {
      toast.error("Please add at least one payment item");
      return;
    }

    setSaving(true);
    try {
      const baseReceiptNumber = generateReceiptNumber();

      // Insert payment items with unique receipt numbers (base + suffix for uniqueness)
      const paymentsToInsert = paymentItems.map((item, index) => ({
        receipt_number: index === 0 ? baseReceiptNumber : `${baseReceiptNumber}-${String.fromCharCode(65 + index)}`,
        student_id: selectedStudent.id,
        category_id: item.categoryId,
        amount: parseFloat(item.amount),
        payment_method: paymentMethod,
        received_by_name: currentUser,
        academic_year: academicYear,
        term: parseInt(term),
      }));

      const { error } = await supabase
        .from("fee_payments")
        .insert(paymentsToInsert as never[]);

      if (error) {
        console.error("Supabase error:", error);
        toast.error(`Database error: ${error.message}`);
        return;
      }

      // Create receipt for display (use base receipt number)
      const receipt: GroupedReceipt = {
        receipt_number: baseReceiptNumber,
        student: {
          name: selectedStudent.name,
          surname: selectedStudent.surname,
          student_number: selectedStudent.student_number,
          form: selectedStudent.form,
        },
        student_id: selectedStudent.id,
        payment_method: paymentMethod,
        received_by_name: currentUser,
        created_at: new Date().toISOString(),
        items: paymentItems.map((item) => ({
          category: item.categoryName,
          amount: parseFloat(item.amount),
        })),
        total: totalAmount,
      };

      toast.success("Payment recorded successfully");
      setLastReceipt(receipt);
      setDialogOpen(false);
      setReceiptDialogOpen(true);
      resetForm();
      await fetchData();
    } catch (error) {
      toast.error("Failed to record payment");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = async (receipt: GroupedReceipt) => {
    // Calculate outstanding balance for this student
    let outstandingBalance = 0;

    if (receipt.student_id) {
      try {
        // Get all fee categories
        const { data: feeCategories } = await supabase
          .from("fee_categories")
          .select("id, default_amount");

        const totalExpected = (feeCategories as { id: string; default_amount: number | null }[] || [])
          .reduce((sum, c) => sum + (c.default_amount || 0), 0);

        // Get all payments for this student
        const { data: studentPayments } = await supabase
          .from("fee_payments")
          .select("amount")
          .eq("student_id", receipt.student_id);

        const totalPaid = (studentPayments as { amount: number }[] || [])
          .reduce((sum, p) => sum + p.amount, 0);

        // Can be positive (owes money) or negative (credit/overpaid)
        outstandingBalance = totalExpected - totalPaid;
      } catch (error) {
        console.error("Error calculating balance:", error);
      }
    }

    const itemsHtml = receipt.items
      .map(
        (item) => `
          <div class="row">
            <span>${item.category}</span>
            <span>$${item.amount.toFixed(2)}</span>
          </div>
        `
      )
      .join("");

    const receiptContent = `
      <html>
        <head>
          <title>Receipt ${receipt.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 15px; }
            .school-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .school-address { font-size: 10px; margin-bottom: 2px; }
            .receipt-title { font-size: 14px; font-weight: bold; margin-top: 8px; border: 2px solid #000; padding: 3px 8px; display: inline-block; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .double-line { border-top: 3px double #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .label { font-size: 11px; }
            .value { font-weight: 600; }
            .amount-box { border: 2px solid #000; padding: 10px; text-align: center; margin: 10px 0; }
            .amount-label { font-size: 11px; font-weight: bold; }
            .amount-value { font-size: 22px; font-weight: bold; }
            .balance-box { border: 1px solid #000; padding: 8px; text-align: center; margin: 8px 0; }
            .balance-label { font-size: 10px; font-weight: bold; }
            .balance-value { font-size: 16px; font-weight: bold; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .items { margin: 8px 0; }
            .item-header { font-weight: bold; margin-bottom: 5px; font-size: 11px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${SCHOOL_INFO.name}</div>
            <div class="school-address">${SCHOOL_INFO.address}</div>
            <div class="school-address">${SCHOOL_INFO.phone}</div>
            <div class="receipt-title">FEE RECEIPT</div>
          </div>
          <div class="line"></div>
          <div class="row">
            <span class="label">Receipt No:</span>
            <span class="value">${receipt.receipt_number}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${format(new Date(receipt.created_at), "dd/MM/yyyy HH:mm")}</span>
          </div>
          <div class="line"></div>
          <div class="row">
            <span class="label">Student:</span>
            <span class="value">${receipt.student?.surname}, ${receipt.student?.name}</span>
          </div>
          <div class="row">
            <span class="label">Student No:</span>
            <span class="value">${receipt.student?.student_number}</span>
          </div>
          <div class="row">
            <span class="label">Form/Class:</span>
            <span class="value">${receipt.student?.form || "N/A"}</span>
          </div>
          <div class="line"></div>
          <div class="items">
            <div class="item-header">Payment Details:</div>
            ${itemsHtml}
          </div>
          <div class="double-line"></div>
          <div class="amount-box">
            <div class="amount-label">AMOUNT PAID</div>
            <div class="amount-value">$${receipt.total.toFixed(2)}</div>
          </div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value" style="text-transform: capitalize;">${receipt.payment_method || "Cash"}</span>
          </div>
          <div class="row">
            <span class="label">Received by:</span>
            <span class="value">${receipt.received_by_name || "Staff"}</span>
          </div>
          ${outstandingBalance > 0 ? `
          <div class="balance-box">
            <div class="balance-label">OUTSTANDING BALANCE</div>
            <div class="balance-value">$${outstandingBalance.toFixed(2)}</div>
          </div>
          ` : outstandingBalance < 0 ? `
          <div class="balance-box">
            <div class="balance-label">CREDIT BALANCE (CARRY FORWARD)</div>
            <div class="balance-value">$${Math.abs(outstandingBalance).toFixed(2)} CR</div>
          </div>
          ` : `
          <div class="balance-box">
            <div class="balance-label">ACCOUNT STATUS</div>
            <div class="balance-value">FULLY PAID</div>
          </div>
          `}
          <div class="line"></div>
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>Keep this receipt for your records</p>
            <p style="margin-top: 10px; font-style: italic;">This is a computer-generated receipt</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=350,height=700");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Calculate today's stats from payments (not grouped receipts, to get category breakdown)
  const todayStats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayPayments = payments.filter(
      (p) => format(new Date(p.created_at), "yyyy-MM-dd") === today
    );

    // Group by category
    const byCategory: Record<string, number> = {};
    todayPayments.forEach((p) => {
      const catName = p.fee_categories?.name || "Unknown";
      byCategory[catName] = (byCategory[catName] || 0) + p.amount;
    });

    // Get today's receipts count from grouped receipts
    const todayReceipts = groupedReceipts.filter(
      (r) => format(new Date(r.created_at), "yyyy-MM-dd") === today
    );

    return {
      total: todayPayments.reduce((sum, p) => sum + p.amount, 0),
      count: todayReceipts.length,
      byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    };
  }, [payments, groupedReceipts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Payments</h1>
          <p className="text-muted-foreground">
            Record fee payments and print receipts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStatementDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            View Statement
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Today&apos;s Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-3xl font-bold text-green-600">${todayStats.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">from {todayStats.count} receipt(s)</p>
            </div>
            {todayStats.byCategory.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">By Category:</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {todayStats.byCategory.map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="font-mono text-sm font-bold">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No collections today</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Receipts</p>
                <p className="text-2xl font-bold">{todayStats.count}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Receipts</p>
                <p className="text-2xl font-bold">{groupedReceipts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Payments
          </CardTitle>
          <CardDescription>Recent fee payments grouped by receipt</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedReceipts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedReceipts.map((receipt) => (
                  <TableRow key={receipt.receipt_number}>
                    <TableCell className="font-mono text-sm">
                      {receipt.receipt_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {receipt.student?.surname}, {receipt.student?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {receipt.student?.student_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {receipt.items.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item.category}: ${item.amount.toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium text-green-600">
                      ${receipt.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {receipt.payment_method || "Cash"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(receipt.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => printReceipt(receipt)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Statement Dialog */}
      <Dialog open={statementDialogOpen} onOpenChange={(open) => {
        setStatementDialogOpen(open);
        if (!open) {
          setStatementStudent(null);
          setStatementSearchQuery("");
          setStatementSearchResults([]);
          setTermStatements([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Student Fee Statement
            </DialogTitle>
            <DialogDescription>
              Search for a student to view their complete fee history with balance brought forward
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search for student */}
            {!statementStudent ? (
              <div className="space-y-2">
                <Label>Search Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or student number..."
                    value={statementSearchQuery}
                    onChange={(e) => setStatementSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {statementSearching && (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                )}
                {statementSearchResults.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-auto">
                    {statementSearchResults.map((student) => (
                      <button
                        key={student.id}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between items-center"
                        onClick={() => selectStudentForStatement(student)}
                      >
                        <div>
                          <p className="font-medium">{student.surname}, {student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.student_number}</p>
                        </div>
                        <Badge variant="outline">{student.form}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected student header */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{statementStudent.surname}, {statementStudent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {statementStudent.student_number} • {statementStudent.form}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatementStudent(null);
                        setTermStatements([]);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                    <Button
                      size="sm"
                      onClick={printStatement}
                      disabled={termStatements.length === 0}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print Statement
                    </Button>
                  </div>
                </div>

                {/* Loading state */}
                {loadingStatement ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : termStatements.length > 0 ? (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">Total Charged</p>
                          <p className="text-xl font-bold">
                            ${termStatements.reduce((s, t) => s + t.totalDue, 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">Total Paid</p>
                          <p className="text-xl font-bold text-green-600">
                            ${termStatements.reduce((s, t) => s + t.totalPaid, 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">Current Balance</p>
                          <p className={`text-xl font-bold ${termStatements.reduce((s, t) => s + t.totalBalance, 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            ${termStatements.reduce((s, t) => s + t.totalBalance, 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Term-by-term breakdown */}
                    <div className="space-y-4">
                      {(() => {
                        let runningBalance = 0;
                        const statementsOldestFirst = [...termStatements].reverse();

                        return statementsOldestFirst.map((term, idx) => {
                          const balanceBF = runningBalance;
                          runningBalance = balanceBF + term.totalBalance;

                          return (
                            <div key={`${term.academic_year}-${term.term}`} className="border rounded-lg overflow-hidden">
                              <div className={`px-4 py-2 flex justify-between items-center ${term.totalBalance > 0 ? "bg-red-50" : "bg-green-50"}`}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{term.academic_year} Term {term.term}</Badge>
                                  {balanceBF !== 0 && (
                                    <span className="text-sm text-purple-600 italic">
                                      B/F: ${balanceBF.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <span className={`font-mono font-bold ${runningBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                                  Balance: ${runningBalance.toFixed(2)}
                                </span>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Amount Due</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {term.balances.map((bal, bidx) => (
                                    <TableRow key={bidx}>
                                      <TableCell>{bal.categoryName}</TableCell>
                                      <TableCell className="text-right font-mono">${bal.amount_due.toFixed(2)}</TableCell>
                                      <TableCell className="text-right font-mono text-green-600">${bal.amount_paid.toFixed(2)}</TableCell>
                                      <TableCell className={`text-right font-mono font-bold ${bal.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                        ${bal.balance.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {term.payments.length > 0 && (
                                <div className="px-4 py-2 bg-muted/50 border-t">
                                  <p className="text-sm font-medium mb-2">Payments Made:</p>
                                  <div className="space-y-1">
                                    {term.payments.map((pay, pidx) => (
                                      <div key={pidx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                          {format(new Date(pay.date), "dd/MM/yyyy")} - {pay.categoryName} ({pay.receipt_number})
                                        </span>
                                        <span className="font-mono text-green-600">${pay.amount.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }).reverse();
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No fee records found for this student</p>
                    <p className="text-sm">Set up term fees first using Finance &gt; Term Fee Setup</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
            <DialogDescription>
              Add multiple fee categories to a single receipt
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Academic Year and Term */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Select
                  value={academicYear}
                  onValueChange={(value) => {
                    setAcademicYear(value);
                    if (selectedStudent) {
                      fetchStudentBalances(selectedStudent.id, value, term);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term *</Label>
                <Select
                  value={term}
                  onValueChange={(value) => {
                    setTerm(value);
                    if (selectedStudent) {
                      fetchStudentBalances(selectedStudent.id, academicYear, value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Search */}
            <div className="space-y-2">
              <Label>Search Student *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searching && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}
              {searchResults.length > 0 && !selectedStudent && (
                <div className="border rounded-lg max-h-40 overflow-auto">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between items-center"
                      onClick={() => {
                        setSelectedStudent(student);
                        setSearchQuery("");
                        setSearchResults([]);
                        fetchStudentBalances(student.id, academicYear, term);
                      }}
                    >
                      <div>
                        <p className="font-medium">{student.surname}, {student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.student_number}</p>
                      </div>
                      <Badge variant="outline">{student.form}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudent && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedStudent.surname}, {selectedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.student_number} • {selectedStudent.form}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentBalances([]);
                      }}
                    >
                      Change
                    </Button>
                  </div>

                  {/* Student Balances */}
                  {loadingBalances ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading balances...
                    </div>
                  ) : studentBalances.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-3 py-2 text-sm font-medium">
                        Fee Balances
                      </div>
                      <div className="divide-y max-h-40 overflow-auto">
                        {studentBalances.filter(b => b.owed !== 0).length > 0 ? (
                          studentBalances.filter(b => b.owed !== 0).map((balance) => (
                            <div key={balance.categoryId} className="flex justify-between items-center px-3 py-2 text-sm">
                              <span>{balance.categoryName}</span>
                              <div className="text-right">
                                <span className={`font-mono font-medium ${balance.owed > 0 ? "text-red-600" : "text-green-600"}`}>
                                  {balance.owed > 0
                                    ? `$${balance.owed.toFixed(2)}`
                                    : `-$${Math.abs(balance.owed).toFixed(2)} CR`
                                  }
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  (paid ${balance.paid.toFixed(2)} of ${balance.expected.toFixed(2)})
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-center text-muted-foreground">
                            All fees paid - no outstanding balance
                          </div>
                        )}
                      </div>
                      {(() => {
                        const totalBalance = studentBalances.reduce((sum, b) => sum + b.owed, 0);
                        if (totalBalance === 0) return null;
                        return (
                          <div className="bg-muted px-3 py-2 flex justify-between text-sm font-bold border-t">
                            <span>{totalBalance > 0 ? "Total Owing" : "Total Credit"}</span>
                            <span className={`font-mono ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                              {totalBalance > 0
                                ? `$${totalBalance.toFixed(2)}`
                                : `$${Math.abs(totalBalance).toFixed(2)} CR`
                              }
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add Payment Item */}
            <div className="space-y-2">
              <Label>Add Payment Item</Label>
              <div className="flex gap-2">
                <Select value={selectedCategoryId} onValueChange={handleCategorySelect}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => !paymentItems.some((item) => item.categoryId === cat.id))
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                          {cat.default_amount && ` ($${cat.default_amount.toFixed(2)})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-32"
                />
                <Button type="button" onClick={addPaymentItem} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payment Items List */}
            {paymentItems.length > 0 && (
              <div className="space-y-2">
                <Label>Payment Items</Label>
                <div className="border rounded-lg divide-y">
                  {paymentItems.map((item) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="font-medium">{item.categoryName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">${parseFloat(item.amount).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removePaymentItem(item.categoryId)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted font-bold">
                    <span>Total</span>
                    <span className="font-mono text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={saving || paymentItems.length === 0}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Record Payment (${totalAmount.toFixed(2)})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={(open) => {
        setReceiptDialogOpen(open);
        if (!open) {
          // Refresh data when closing receipt dialog
          fetchData();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Recorded</DialogTitle>
            <DialogDescription>
              Receipt #{lastReceipt?.receipt_number}
            </DialogDescription>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-4 py-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  ${lastReceipt.total.toFixed(2)}
                </p>
                <p className="text-sm text-green-700 mt-1">Payment Successful</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">
                    {lastReceipt.student?.surname}, {lastReceipt.student?.name}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-muted-foreground mb-2">Items:</p>
                  {lastReceipt.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.category}</span>
                      <span className="font-mono">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="capitalize">{lastReceipt.payment_method}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => lastReceipt && printReceipt(lastReceipt)}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
