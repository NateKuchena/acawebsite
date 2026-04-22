export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StudentStatus = "enrolled" | "transferred" | "graduated";
export type StaffStatus = "employed" | "terminated" | "retired";
export type AssetStatus = "functional" | "missing" | "disposed";
export type RequisitionStatus = "pending" | "approved" | "rejected" | "awaiting_payment" | "paid";

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          student_number: string;
          name: string;
          surname: string;
          date_of_birth: string;
          form: string;
          guardian_name: string;
          guardian_contact: string;
          religious_denomination: string | null;
          health_conditions: string | null;
          status: StudentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_number: string;
          name: string;
          surname: string;
          date_of_birth: string;
          form: string;
          guardian_name: string;
          guardian_contact: string;
          religious_denomination?: string | null;
          health_conditions?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_number?: string;
          name?: string;
          surname?: string;
          date_of_birth?: string;
          form?: string;
          guardian_name?: string;
          guardian_contact?: string;
          religious_denomination?: string | null;
          health_conditions?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_marks: {
        Row: {
          id: string;
          student_id: string;
          academic_year: string;
          term: number;
          subject: string;
          mark: number | null;
          grade: string | null;
          teacher_comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          academic_year: string;
          term: number;
          subject: string;
          mark?: number | null;
          grade?: string | null;
          teacher_comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          academic_year?: string;
          term?: number;
          subject?: string;
          mark?: number | null;
          grade?: string | null;
          teacher_comment?: string | null;
          created_at?: string;
        };
      };
      disciplinary_records: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          offense: string;
          action_taken: string;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          offense: string;
          action_taken: string;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          date?: string;
          offense?: string;
          action_taken?: string;
          recorded_by?: string | null;
          created_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          employee_number: string;
          grade: string;
          name: string;
          surname: string;
          date_of_birth: string;
          next_of_kin_name: string | null;
          next_of_kin_contact: string | null;
          religious_denomination: string | null;
          health_conditions: string | null;
          children_names: string[] | null;
          status: StaffStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_number: string;
          grade: string;
          name: string;
          surname: string;
          date_of_birth: string;
          next_of_kin_name?: string | null;
          next_of_kin_contact?: string | null;
          religious_denomination?: string | null;
          health_conditions?: string | null;
          children_names?: string[] | null;
          status?: StaffStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_number?: string;
          grade?: string;
          name?: string;
          surname?: string;
          date_of_birth?: string;
          next_of_kin_name?: string | null;
          next_of_kin_contact?: string | null;
          religious_denomination?: string | null;
          health_conditions?: string | null;
          children_names?: string[] | null;
          status?: StaffStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_benefits: {
        Row: {
          id: string;
          staff_id: string;
          benefit_type: string;
          provider: string | null;
          policy_number: string | null;
          monthly_amount: number | null;
          employer_contribution: number | null;
          employee_contribution: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          benefit_type: string;
          provider?: string | null;
          policy_number?: string | null;
          monthly_amount?: number | null;
          employer_contribution?: number | null;
          employee_contribution?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          benefit_type?: string;
          provider?: string | null;
          policy_number?: string | null;
          monthly_amount?: number | null;
          employer_contribution?: number | null;
          employee_contribution?: number | null;
          created_at?: string;
        };
      };
      performance_appraisals: {
        Row: {
          id: string;
          staff_id: string;
          appraisal_date: string;
          period_start: string;
          period_end: string;
          rating: number | null;
          strengths: string | null;
          areas_for_improvement: string | null;
          goals: string | null;
          appraiser_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          appraisal_date: string;
          period_start: string;
          period_end: string;
          rating?: number | null;
          strengths?: string | null;
          areas_for_improvement?: string | null;
          goals?: string | null;
          appraiser_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          appraisal_date?: string;
          period_start?: string;
          period_end?: string;
          rating?: number | null;
          strengths?: string | null;
          areas_for_improvement?: string | null;
          goals?: string | null;
          appraiser_id?: string | null;
          created_at?: string;
        };
      };
      staff_disciplinary_records: {
        Row: {
          id: string;
          staff_id: string;
          date: string;
          offense: string;
          action_taken: string;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          date: string;
          offense: string;
          action_taken: string;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          date?: string;
          offense?: string;
          action_taken?: string;
          recorded_by?: string | null;
          created_at?: string;
        };
      };
      fee_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          default_amount: number | null;
          academic_year: string | null;
          term: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          default_amount?: number | null;
          academic_year?: string | null;
          term?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          default_amount?: number | null;
          academic_year?: string | null;
          term?: number | null;
          created_at?: string;
        };
      };
      fee_payments: {
        Row: {
          id: string;
          receipt_number: string;
          student_id: string;
          category_id: string;
          amount: number;
          payment_method: string | null;
          received_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          student_id: string;
          category_id: string;
          amount: number;
          payment_method?: string | null;
          received_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_number?: string;
          student_id?: string;
          category_id?: string;
          amount?: number;
          payment_method?: string | null;
          received_by?: string | null;
          created_at?: string;
        };
      };
      uniforms: {
        Row: {
          id: string;
          name: string;
          sizes: string[];
          price: number;
          stock_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sizes: string[];
          price: number;
          stock_quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sizes?: string[];
          price?: number;
          stock_quantity?: number;
          created_at?: string;
        };
      };
      uniform_sales: {
        Row: {
          id: string;
          receipt_number: string;
          student_id: string;
          uniform_id: string;
          size: string;
          quantity: number;
          unit_price: number;
          total_amount: number;
          received_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          student_id: string;
          uniform_id: string;
          size: string;
          quantity?: number;
          unit_price: number;
          total_amount: number;
          received_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_number?: string;
          student_id?: string;
          uniform_id?: string;
          size?: string;
          quantity?: number;
          unit_price?: number;
          total_amount?: number;
          received_by?: string | null;
          created_at?: string;
        };
      };
      student_balances: {
        Row: {
          id: string;
          student_id: string;
          category_id: string;
          academic_year: string;
          term: number;
          amount_due: number;
          amount_paid: number;
          balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          category_id: string;
          academic_year: string;
          term: number;
          amount_due: number;
          amount_paid?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          category_id?: string;
          academic_year?: string;
          term?: number;
          amount_due?: number;
          amount_paid?: number;
          updated_at?: string;
        };
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      requisitions: {
        Row: {
          id: string;
          requisition_number: string;
          requested_by: string;
          department: string | null;
          items: Json;
          total_estimated: number | null;
          justification: string | null;
          status: RequisitionStatus;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          requisition_number: string;
          requested_by: string;
          department?: string | null;
          items: Json;
          total_estimated?: number | null;
          justification?: string | null;
          status?: RequisitionStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          requisition_number?: string;
          requested_by?: string;
          department?: string | null;
          items?: Json;
          total_estimated?: number | null;
          justification?: string | null;
          status?: RequisitionStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      payment_vouchers: {
        Row: {
          id: string;
          voucher_number: string;
          requisition_id: string | null;
          payee_name: string;
          purpose: string;
          amount: number;
          expense_category_id: string | null;
          paid_by: string | null;
          payment_method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          voucher_number: string;
          requisition_id?: string | null;
          payee_name: string;
          purpose: string;
          amount: number;
          expense_category_id?: string | null;
          paid_by?: string | null;
          payment_method?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          voucher_number?: string;
          requisition_id?: string | null;
          payee_name?: string;
          purpose?: string;
          amount?: number;
          expense_category_id?: string | null;
          paid_by?: string | null;
          payment_method?: string | null;
          created_at?: string;
        };
      };
      other_income: {
        Row: {
          id: string;
          receipt_number: string;
          source: string;
          description: string | null;
          amount: number;
          received_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          source: string;
          description?: string | null;
          amount: number;
          received_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_number?: string;
          source?: string;
          description?: string | null;
          amount?: number;
          received_by?: string | null;
          created_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          asset_number: string;
          barcode: string | null;
          name: string;
          category: string | null;
          location: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          current_value: number | null;
          status: AssetStatus;
          is_movable: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_number: string;
          barcode?: string | null;
          name: string;
          category?: string | null;
          location?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          current_value?: number | null;
          status?: AssetStatus;
          is_movable?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_number?: string;
          barcode?: string | null;
          name?: string;
          category?: string | null;
          location?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          current_value?: number | null;
          status?: AssetStatus;
          is_movable?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      school_info: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          cash_at_hand: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          cash_at_hand?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          cash_at_hand?: number;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          branch: string | null;
          balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          branch?: string | null;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bank_name?: string;
          account_name?: string;
          account_number?: string;
          branch?: string | null;
          balance?: number;
          updated_at?: string;
        };
      };
      payroll: {
        Row: {
          id: string;
          staff_id: string;
          pay_period_start: string;
          pay_period_end: string;
          basic_salary: number;
          allowances: Json | null;
          deductions: Json | null;
          gross_pay: number;
          net_pay: number;
          generated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          pay_period_start: string;
          pay_period_end: string;
          basic_salary: number;
          allowances?: Json | null;
          deductions?: Json | null;
          gross_pay: number;
          net_pay: number;
          generated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          pay_period_start?: string;
          pay_period_end?: string;
          basic_salary?: number;
          allowances?: Json | null;
          deductions?: Json | null;
          gross_pay?: number;
          net_pay?: number;
          generated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      parent_student_links: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          student_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      student_status: StudentStatus;
      staff_status: StaffStatus;
      asset_status: AssetStatus;
      requisition_status: RequisitionStatus;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
