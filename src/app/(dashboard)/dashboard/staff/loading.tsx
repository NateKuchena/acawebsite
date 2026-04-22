import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function StaffLoading() {
  return <TableSkeleton columns={7} rows={10} />;
}
